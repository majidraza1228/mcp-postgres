import * as vscode from 'vscode';
import { RegistryClient } from './registryClient';
import { ServerManager } from './serverManager';
import { RegistryTreeProvider } from './providers/registryTreeProvider';
import { InstalledTreeProvider } from './providers/installedTreeProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('MCP Server Manager extension is now active!');

    // Get configuration
    const config = vscode.workspace.getConfiguration('mcpManager');
    const registryUrl = config.get<string>('registryUrl') || 'http://localhost:8000';

    // Initialize services
    const registryClient = new RegistryClient(registryUrl);
    const serverManager = new ServerManager(context, registryClient);

    // Initialize tree providers
    const registryTreeProvider = new RegistryTreeProvider(registryClient);
    const installedTreeProvider = new InstalledTreeProvider(serverManager);

    // Register tree views
    vscode.window.registerTreeDataProvider('mcpManager.registryServers', registryTreeProvider);
    vscode.window.registerTreeDataProvider('mcpManager.installedServers', installedTreeProvider);

    // Detect already-running servers on startup
    serverManager.detectRunningServers().then(() => {
        installedTreeProvider.refresh();
    }).catch(err => {
        console.error('Failed to detect running servers:', err);
    });

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('mcpManager.refreshRegistry', () => {
            registryTreeProvider.refresh();
            installedTreeProvider.refresh();
            vscode.window.showInformationMessage('Registry refreshed');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mcpManager.installServer', async (item) => {
            // If called from command palette without item, show picker
            if (!item) {
                try {
                    const servers = await registryClient.listServers();
                    if (servers.length === 0) {
                        vscode.window.showInformationMessage('No servers available in registry');
                        return;
                    }

                    const selected = await vscode.window.showQuickPick(
                        servers.map(s => ({
                            label: `${s.name} v${s.version}`,
                            description: s.description,
                            server: s
                        })),
                        { placeHolder: 'Select server to install' }
                    );

                    if (!selected) {
                        return;
                    }

                    item = { server: selected.server };
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Failed to fetch servers: ${error.message}`);
                    return;
                }
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Installing ${item.server.name}...`,
                cancellable: false
            }, async (progress) => {
                try {
                    progress.report({ increment: 20, message: 'Downloading...' });
                    await serverManager.installServer(item.server);

                    progress.report({ increment: 80, message: 'Done!' });
                    vscode.window.showInformationMessage(`✓ Installed ${item.server.name}@${item.server.version}`);

                    installedTreeProvider.refresh();
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Failed to install: ${error.message}`);
                }
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mcpManager.startServer', async (item) => {
            try {
                await serverManager.startServer(item.serverName);
                vscode.window.showInformationMessage(`✓ Started ${item.serverName}`);
                installedTreeProvider.refresh();
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to start: ${error.message}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mcpManager.stopServer', async (item) => {
            try {
                await serverManager.stopServer(item.serverName);
                vscode.window.showInformationMessage(`✓ Stopped ${item.serverName}`);
                installedTreeProvider.refresh();
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to stop: ${error.message}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mcpManager.restartServer', async (item) => {
            try {
                await serverManager.restartServer(item.serverName);
                vscode.window.showInformationMessage(`✓ Restarted ${item.serverName}`);
                installedTreeProvider.refresh();
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to restart: ${error.message}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mcpManager.uninstallServer', async (item) => {
            const answer = await vscode.window.showWarningMessage(
                `Are you sure you want to uninstall ${item.serverName}?`,
                'Yes',
                'No'
            );

            if (answer === 'Yes') {
                try {
                    await serverManager.uninstallServer(item.serverName);
                    vscode.window.showInformationMessage(`✓ Uninstalled ${item.serverName}`);
                    installedTreeProvider.refresh();
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Failed to uninstall: ${error.message}`);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mcpManager.viewLogs', (item) => {
            const logs = serverManager.getServerLogs(item.serverName);
            const panel = vscode.window.createWebviewPanel(
                'mcpLogs',
                `${item.serverName} Logs`,
                vscode.ViewColumn.One,
                {}
            );

            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: monospace;
                            padding: 10px;
                            color: var(--vscode-editor-foreground);
                            background-color: var(--vscode-editor-background);
                        }
                        pre {
                            white-space: pre-wrap;
                            word-wrap: break-word;
                        }
                    </style>
                </head>
                <body>
                    <h2>${item.serverName} Logs</h2>
                    <pre>${logs}</pre>
                </body>
                </html>
            `;
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mcpManager.configureServer', async (item) => {
            const serverName = item.serverName;

            // Get current config
            const currentConfig = await serverManager.getServerConfig(serverName);

            // Common environment variables
            const envVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'API_KEY', 'SERVER_PORT'];

            const config: any = { ...currentConfig };

            for (const envVar of envVars) {
                const value = await vscode.window.showInputBox({
                    prompt: `Enter ${envVar} (leave empty to skip)`,
                    value: config[envVar] || '',
                    password: envVar.includes('PASSWORD') || envVar.includes('KEY'),
                    placeHolder: envVar
                });

                if (value !== undefined && value !== '') {
                    config[envVar] = value;
                } else if (value === '' && config[envVar]) {
                    delete config[envVar];
                }
            }

            await serverManager.saveServerConfig(serverName, config);
            vscode.window.showInformationMessage(`✓ Configuration saved for ${serverName}`);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mcpManager.setRegistryUrl', async () => {
            const url = await vscode.window.showInputBox({
                prompt: 'Enter MCP Registry URL',
                value: registryUrl,
                placeHolder: 'http://localhost:8000'
            });

            if (url) {
                await config.update('registryUrl', url, vscode.ConfigurationTarget.Global);
                registryClient.setUrl(url);
                registryTreeProvider.refresh();
                vscode.window.showInformationMessage(`✓ Registry URL updated to ${url}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mcpManager.searchRegistry', async () => {
            const query = await vscode.window.showInputBox({
                prompt: 'Search MCP Servers',
                placeHolder: 'Enter search term...'
            });

            if (query) {
                try {
                    const results = await registryClient.searchServers(query);
                    if (results.length === 0) {
                        vscode.window.showInformationMessage('No servers found');
                    } else {
                        registryTreeProvider.setSearchResults(results);
                        vscode.window.showInformationMessage(`Found ${results.length} servers`);
                    }
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Search failed: ${error.message}`);
                }
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mcpManager.showServerDetails', async (item) => {
            const server = item.server;
            const panel = vscode.window.createWebviewPanel(
                'mcpServerDetails',
                `${server.name} Details`,
                vscode.ViewColumn.One,
                {}
            );

            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: var(--vscode-font-family);
                            padding: 20px;
                            color: var(--vscode-foreground);
                            background-color: var(--vscode-editor-background);
                        }
                        h1 { color: var(--vscode-editor-foreground); }
                        .info-row {
                            margin: 10px 0;
                            display: flex;
                            gap: 10px;
                        }
                        .info-label {
                            font-weight: bold;
                            min-width: 120px;
                        }
                        .tag {
                            display: inline-block;
                            background-color: var(--vscode-badge-background);
                            color: var(--vscode-badge-foreground);
                            padding: 2px 8px;
                            border-radius: 3px;
                            margin-right: 5px;
                            font-size: 0.9em;
                        }
                    </style>
                </head>
                <body>
                    <h1>${server.name}</h1>
                    <div class="info-row">
                        <span class="info-label">Version:</span>
                        <span>${server.version}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Description:</span>
                        <span>${server.description}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Author:</span>
                        <span>${server.author}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Repository:</span>
                        <span><a href="${server.repository}">${server.repository}</a></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Downloads:</span>
                        <span>${server.downloads}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Tags:</span>
                        <span>${server.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join('')}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Created:</span>
                        <span>${new Date(server.created_at).toLocaleString()}</span>
                    </div>
                </body>
                </html>
            `;
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mcpManager.startAllServers', async () => {
            try {
                await serverManager.startAllServers();
                vscode.window.showInformationMessage('✓ Started all servers');
                installedTreeProvider.refresh();
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to start all: ${error.message}`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mcpManager.stopAllServers', async () => {
            try {
                await serverManager.stopAllServers();
                vscode.window.showInformationMessage('✓ Stopped all servers');
                installedTreeProvider.refresh();
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to stop all: ${error.message}`);
            }
        })
    );

    // Auto-start servers if configured
    if (config.get<boolean>('autoStartServers')) {
        serverManager.startAllServers().catch(err => {
            console.error('Failed to auto-start servers:', err);
        });
    }

    vscode.window.showInformationMessage('✓ MCP Server Manager is ready! Click the MCP Servers icon in the sidebar.');
}

export function deactivate() {
    console.log('MCP Server Manager extension is deactivated');
}
