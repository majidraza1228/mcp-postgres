import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as tar from 'tar';
import { MCPServer, RunningServer, ServerConfig } from './types';
import { RegistryClient } from './registryClient';

export class ServerManager {
    private runningServers: Map<string, RunningServer> = new Map();
    private context: vscode.ExtensionContext;
    private registryClient: RegistryClient;
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext, registryClient: RegistryClient) {
        this.context = context;
        this.registryClient = registryClient;
        this.outputChannel = vscode.window.createOutputChannel('MCP Server Manager');
    }

    private getInstallDir(): string {
        const config = vscode.workspace.getConfiguration('mcpManager');
        const installDirConfig = config.get<string>('installDirectory') || '~/.mcp-servers';
        return installDirConfig.replace('~', os.homedir());
    }

    async detectRunningServers(): Promise<void> {
        const installed = this.getInstalledServers();

        for (const serverName of installed) {
            const pidFile = path.join(this.getInstallDir(), serverName, '.mcp.pid');

            if (fs.existsSync(pidFile)) {
                try {
                    const pid = parseInt(fs.readFileSync(pidFile, 'utf8'));

                    // Check if process is actually running
                    global.process.kill(pid, 0); // Signal 0 checks if process exists

                    this.outputChannel.appendLine(`✓ Detected running server: ${serverName} (PID: ${pid})`);

                    // Add to runningServers map (without actual process object since we didn't start it)
                    this.runningServers.set(serverName, {
                        name: serverName,
                        process: null as any, // Can't capture existing process
                        port: 3000,
                        logs: [],
                        config: await this.getServerConfig(serverName)
                    });
                } catch {
                    // Process not running, clean up PID file
                    fs.unlinkSync(pidFile);
                    this.outputChannel.appendLine(`Cleaned up stale PID file for ${serverName}`);
                }
            }
        }
    }

    async installServer(server: MCPServer): Promise<void> {
        const config = vscode.workspace.getConfiguration('mcpManager');
        const installDirConfig = config.get<string>('installDirectory') || '~/.mcp-servers';
        const installDir = installDirConfig.replace('~', os.homedir());

        const serverDir = path.join(installDir, server.name);

        // Create directory
        if (!fs.existsSync(serverDir)) {
            fs.mkdirSync(serverDir, { recursive: true });
        }

        // Download package
        const packageData = await this.registryClient.downloadServer(server.name, server.version);

        // Save tar.gz
        const tarPath = path.join(serverDir, 'package.tar.gz');
        fs.writeFileSync(tarPath, packageData);

        // Extract
        await tar.x({
            file: tarPath,
            cwd: serverDir
        });

        // Clean up tar file
        fs.unlinkSync(tarPath);

        // Install dependencies
        await this.installDependencies(serverDir);

        this.outputChannel.appendLine(`✓ Installed ${server.name}@${server.version} to ${serverDir}`);
    }

    private async installDependencies(serverDir: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('mcpManager');

        // Check for Python project
        if (fs.existsSync(path.join(serverDir, 'requirements.txt'))) {
            const pythonPath = config.get<string>('pythonPath') || 'python3';

            this.outputChannel.appendLine('Installing Python dependencies...');

            // Create venv
            await this.execCommand(`${pythonPath} -m venv venv`, serverDir);

            // Install requirements
            const venvPython = path.join(serverDir, 'venv', 'bin', 'python');
            if (fs.existsSync(venvPython)) {
                await this.execCommand(`${venvPython} -m pip install -r requirements.txt`, serverDir);
            }

            this.outputChannel.appendLine('✓ Python dependencies installed');
        }

        // Check for Node.js project
        if (fs.existsSync(path.join(serverDir, 'package.json'))) {
            const nodePath = config.get<string>('nodePath') || 'node';

            this.outputChannel.appendLine('Installing Node.js dependencies...');
            await this.execCommand('npm install', serverDir);
            this.outputChannel.appendLine('✓ Node.js dependencies installed');
        }
    }

    private execCommand(command: string, cwd: string): Promise<void> {
        return new Promise((resolve, reject) => {
            cp.exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    this.outputChannel.appendLine(`Error: ${stderr}`);
                    reject(error);
                } else {
                    if (stdout) this.outputChannel.appendLine(stdout);
                    resolve();
                }
            });
        });
    }

    async startServer(serverName: string): Promise<void> {
        if (this.runningServers.has(serverName)) {
            throw new Error('Server is already running');
        }

        const config = vscode.workspace.getConfiguration('mcpManager');
        const installDirConfig = config.get<string>('installDirectory') || '~/.mcp-servers';
        const installDir = installDirConfig.replace('~', os.homedir());
        const serverDir = path.join(installDir, serverName);

        if (!fs.existsSync(serverDir)) {
            throw new Error(`Server ${serverName} is not installed`);
        }

        // Get server config from secrets
        const configJson = await this.context.secrets.get(`mcp.${serverName}.config`);
        const serverConfig: ServerConfig = configJson ? JSON.parse(configJson) : {};

        let serverProcess: cp.ChildProcess;
        const logs: string[] = [];

        // Determine server type and start
        if (fs.existsSync(path.join(serverDir, 'server.py'))) {
            // Python server
            const venvPython = path.join(serverDir, 'venv', 'bin', 'python');
            const pythonPath = fs.existsSync(venvPython) ? venvPython : (config.get<string>('pythonPath') || 'python3');
            const serverPath = path.join(serverDir, 'server.py');

            serverProcess = cp.spawn(pythonPath, [serverPath], {
                cwd: serverDir,
                env: { ...global.process.env, ...serverConfig }
            });
        } else if (fs.existsSync(path.join(serverDir, 'index.js'))) {
            // Node.js server
            const nodePath = config.get<string>('nodePath') || 'node';
            const serverPath = path.join(serverDir, 'index.js');

            serverProcess = cp.spawn(nodePath, [serverPath], {
                cwd: serverDir,
                env: { ...global.process.env, ...serverConfig }
            });
        } else {
            throw new Error('Server entry point not found (server.py or index.js)');
        }

        // Capture output
        serverProcess.stdout?.on('data', (data) => {
            const output = data.toString();
            logs.push(output);
            this.outputChannel.appendLine(`[${serverName}] ${output}`);
        });

        serverProcess.stderr?.on('data', (data) => {
            const output = data.toString();
            logs.push(output);
            this.outputChannel.appendLine(`[${serverName}] ERROR: ${output}`);
        });

        serverProcess.on('exit', (code) => {
            this.outputChannel.appendLine(`[${serverName}] Exited with code ${code}`);
            this.runningServers.delete(serverName);

            // Clean up PID file on exit
            const pidFile = path.join(serverDir, '.mcp.pid');
            if (fs.existsSync(pidFile)) {
                fs.unlinkSync(pidFile);
            }
        });

        // Save PID to file
        const pidFile = path.join(serverDir, '.mcp.pid');
        if (serverProcess.pid) {
            fs.writeFileSync(pidFile, serverProcess.pid.toString());
        }

        this.runningServers.set(serverName, {
            name: serverName,
            process: serverProcess,
            port: 3000, // Default, could be parsed from config
            logs,
            config: serverConfig
        });

        this.outputChannel.appendLine(`✓ Started ${serverName} (PID: ${serverProcess.pid})`);
        this.outputChannel.show();
    }

    async stopServer(serverName: string): Promise<void> {
        const running = this.runningServers.get(serverName);
        if (!running) {
            throw new Error('Server is not running');
        }

        if (running.process) {
            running.process.kill('SIGTERM');

            // Force kill after 5 seconds
            setTimeout(() => {
                if (this.runningServers.has(serverName) && running.process) {
                    running.process.kill('SIGKILL');
                }
            }, 5000);
        }

        this.runningServers.delete(serverName);

        // Remove PID file
        const pidFile = path.join(this.getInstallDir(), serverName, '.mcp.pid');
        if (fs.existsSync(pidFile)) {
            fs.unlinkSync(pidFile);
        }

        this.outputChannel.appendLine(`✓ Stopped ${serverName}`);
    }

    async restartServer(serverName: string): Promise<void> {
        await this.stopServer(serverName);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.startServer(serverName);
    }

    async uninstallServer(serverName: string): Promise<void> {
        // Stop if running
        if (this.runningServers.has(serverName)) {
            await this.stopServer(serverName);
        }

        const config = vscode.workspace.getConfiguration('mcpManager');
        const installDirConfig = config.get<string>('installDirectory') || '~/.mcp-servers';
        const installDir = installDirConfig.replace('~', os.homedir());
        const serverDir = path.join(installDir, serverName);

        if (fs.existsSync(serverDir)) {
            fs.rmSync(serverDir, { recursive: true, force: true });
            this.outputChannel.appendLine(`✓ Uninstalled ${serverName}`);
        }

        // Remove config
        await this.context.secrets.delete(`mcp.${serverName}.config`);
    }

    isServerRunning(serverName: string): boolean {
        // Check in-memory first
        if (this.runningServers.has(serverName)) {
            return true;
        }

        // Check PID file
        const pidFile = path.join(this.getInstallDir(), serverName, '.mcp.pid');

        if (fs.existsSync(pidFile)) {
            try {
                const pid = parseInt(fs.readFileSync(pidFile, 'utf8'));

                // Check if process is actually running
                global.process.kill(pid, 0); // Signal 0 checks if process exists
                return true;
            } catch {
                // Process not running, clean up PID file
                fs.unlinkSync(pidFile);
                return false;
            }
        }

        return false;
    }

    getServerLogs(serverName: string): string {
        const running = this.runningServers.get(serverName);
        if (running) {
            return running.logs.join('');
        }
        return 'Server is not running';
    }

    getInstalledServers(): string[] {
        const config = vscode.workspace.getConfiguration('mcpManager');
        const installDirConfig = config.get<string>('installDirectory') || '~/.mcp-servers';
        const installDir = installDirConfig.replace('~', os.homedir());

        if (!fs.existsSync(installDir)) {
            return [];
        }

        return fs.readdirSync(installDir).filter(item => {
            const itemPath = path.join(installDir, item);
            return fs.statSync(itemPath).isDirectory();
        });
    }

    async saveServerConfig(serverName: string, config: ServerConfig): Promise<void> {
        await this.context.secrets.store(`mcp.${serverName}.config`, JSON.stringify(config));
    }

    async getServerConfig(serverName: string): Promise<ServerConfig> {
        const configJson = await this.context.secrets.get(`mcp.${serverName}.config`);
        return configJson ? JSON.parse(configJson) : {};
    }

    async startAllServers(): Promise<void> {
        const installed = this.getInstalledServers();
        for (const serverName of installed) {
            try {
                if (!this.isServerRunning(serverName)) {
                    await this.startServer(serverName);
                }
            } catch (error: any) {
                this.outputChannel.appendLine(`Failed to start ${serverName}: ${error.message}`);
            }
        }
    }

    async stopAllServers(): Promise<void> {
        const running = Array.from(this.runningServers.keys());
        for (const serverName of running) {
            try {
                await this.stopServer(serverName);
            } catch (error: any) {
                this.outputChannel.appendLine(`Failed to stop ${serverName}: ${error.message}`);
            }
        }
    }
}
