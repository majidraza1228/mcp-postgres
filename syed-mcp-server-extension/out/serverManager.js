"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerManager = void 0;
const vscode = __importStar(require("vscode"));
const cp = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const tar = __importStar(require("tar"));
class ServerManager {
    constructor(context, registryClient) {
        this.runningServers = new Map();
        this.context = context;
        this.registryClient = registryClient;
        this.outputChannel = vscode.window.createOutputChannel('MCP Server Manager');
    }
    getInstallDir() {
        const config = vscode.workspace.getConfiguration('mcpManager');
        const installDirConfig = config.get('installDirectory') || '~/.mcp-servers';
        return installDirConfig.replace('~', os.homedir());
    }
    async detectRunningServers() {
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
                        process: null, // Can't capture existing process
                        port: 3000,
                        logs: [],
                        config: await this.getServerConfig(serverName)
                    });
                }
                catch {
                    // Process not running, clean up PID file
                    fs.unlinkSync(pidFile);
                    this.outputChannel.appendLine(`Cleaned up stale PID file for ${serverName}`);
                }
            }
        }
    }
    async installServer(server) {
        const config = vscode.workspace.getConfiguration('mcpManager');
        const installDirConfig = config.get('installDirectory') || '~/.mcp-servers';
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
    async installDependencies(serverDir) {
        const config = vscode.workspace.getConfiguration('mcpManager');
        // Check for Python project
        if (fs.existsSync(path.join(serverDir, 'requirements.txt'))) {
            const pythonPath = config.get('pythonPath') || 'python3';
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
            const nodePath = config.get('nodePath') || 'node';
            this.outputChannel.appendLine('Installing Node.js dependencies...');
            await this.execCommand('npm install', serverDir);
            this.outputChannel.appendLine('✓ Node.js dependencies installed');
        }
    }
    execCommand(command, cwd) {
        return new Promise((resolve, reject) => {
            cp.exec(command, { cwd }, (error, stdout, stderr) => {
                if (error) {
                    this.outputChannel.appendLine(`Error: ${stderr}`);
                    reject(error);
                }
                else {
                    if (stdout)
                        this.outputChannel.appendLine(stdout);
                    resolve();
                }
            });
        });
    }
    async startServer(serverName) {
        if (this.runningServers.has(serverName)) {
            throw new Error('Server is already running');
        }
        const config = vscode.workspace.getConfiguration('mcpManager');
        const installDirConfig = config.get('installDirectory') || '~/.mcp-servers';
        const installDir = installDirConfig.replace('~', os.homedir());
        const serverDir = path.join(installDir, serverName);
        if (!fs.existsSync(serverDir)) {
            throw new Error(`Server ${serverName} is not installed`);
        }
        // Get server config from secrets
        const configJson = await this.context.secrets.get(`mcp.${serverName}.config`);
        const serverConfig = configJson ? JSON.parse(configJson) : {};
        let serverProcess;
        const logs = [];
        // Determine server type and start
        if (fs.existsSync(path.join(serverDir, 'server.py'))) {
            // Python server
            const venvPython = path.join(serverDir, 'venv', 'bin', 'python');
            const pythonPath = fs.existsSync(venvPython) ? venvPython : (config.get('pythonPath') || 'python3');
            const serverPath = path.join(serverDir, 'server.py');
            serverProcess = cp.spawn(pythonPath, [serverPath], {
                cwd: serverDir,
                env: { ...global.process.env, ...serverConfig }
            });
        }
        else if (fs.existsSync(path.join(serverDir, 'index.js'))) {
            // Node.js server
            const nodePath = config.get('nodePath') || 'node';
            const serverPath = path.join(serverDir, 'index.js');
            serverProcess = cp.spawn(nodePath, [serverPath], {
                cwd: serverDir,
                env: { ...global.process.env, ...serverConfig }
            });
        }
        else {
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
    async stopServer(serverName) {
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
    async restartServer(serverName) {
        await this.stopServer(serverName);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.startServer(serverName);
    }
    async uninstallServer(serverName) {
        // Stop if running
        if (this.runningServers.has(serverName)) {
            await this.stopServer(serverName);
        }
        const config = vscode.workspace.getConfiguration('mcpManager');
        const installDirConfig = config.get('installDirectory') || '~/.mcp-servers';
        const installDir = installDirConfig.replace('~', os.homedir());
        const serverDir = path.join(installDir, serverName);
        if (fs.existsSync(serverDir)) {
            fs.rmSync(serverDir, { recursive: true, force: true });
            this.outputChannel.appendLine(`✓ Uninstalled ${serverName}`);
        }
        // Remove config
        await this.context.secrets.delete(`mcp.${serverName}.config`);
    }
    isServerRunning(serverName) {
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
            }
            catch {
                // Process not running, clean up PID file
                fs.unlinkSync(pidFile);
                return false;
            }
        }
        return false;
    }
    getServerLogs(serverName) {
        const running = this.runningServers.get(serverName);
        if (running) {
            return running.logs.join('');
        }
        return 'Server is not running';
    }
    getInstalledServers() {
        const config = vscode.workspace.getConfiguration('mcpManager');
        const installDirConfig = config.get('installDirectory') || '~/.mcp-servers';
        const installDir = installDirConfig.replace('~', os.homedir());
        if (!fs.existsSync(installDir)) {
            return [];
        }
        return fs.readdirSync(installDir).filter(item => {
            const itemPath = path.join(installDir, item);
            return fs.statSync(itemPath).isDirectory();
        });
    }
    async saveServerConfig(serverName, config) {
        await this.context.secrets.store(`mcp.${serverName}.config`, JSON.stringify(config));
    }
    async getServerConfig(serverName) {
        const configJson = await this.context.secrets.get(`mcp.${serverName}.config`);
        return configJson ? JSON.parse(configJson) : {};
    }
    async startAllServers() {
        const installed = this.getInstalledServers();
        for (const serverName of installed) {
            try {
                if (!this.isServerRunning(serverName)) {
                    await this.startServer(serverName);
                }
            }
            catch (error) {
                this.outputChannel.appendLine(`Failed to start ${serverName}: ${error.message}`);
            }
        }
    }
    async stopAllServers() {
        const running = Array.from(this.runningServers.keys());
        for (const serverName of running) {
            try {
                await this.stopServer(serverName);
            }
            catch (error) {
                this.outputChannel.appendLine(`Failed to stop ${serverName}: ${error.message}`);
            }
        }
    }
}
exports.ServerManager = ServerManager;
//# sourceMappingURL=serverManager.js.map