import * as vscode from 'vscode';
import * as http from 'http';

let server: http.Server | null = null;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('Copilot Web Bridge');
    outputChannel.appendLine('Copilot Web Bridge extension activated');

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('copilotWebBridge.start', startServer)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('copilotWebBridge.stop', stopServer)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('copilotWebBridge.status', showStatus)
    );

    // Auto-start if enabled
    const config = vscode.workspace.getConfiguration('copilotWebBridge');
    if (config.get('autoStart')) {
        startServer();
    }
}

export function deactivate() {
    stopServer();
}

async function startServer() {
    if (server) {
        vscode.window.showWarningMessage('Copilot Web Bridge server is already running');
        return;
    }

    const config = vscode.workspace.getConfiguration('copilotWebBridge');
    const port = config.get<number>('port') || 9000;
    const mcpServerUrl = config.get<string>('mcpServerUrl') || 'http://localhost:3000';

    server = http.createServer(async (req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Health check
        if (req.url === '/health' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', copilotEnabled: true }));
            return;
        }

        // Chat endpoint
        if (req.url === '/chat' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                try {
                    const { message } = JSON.parse(body);
                    outputChannel.appendLine(`[Chat Request] ${message}`);

                    // Use GitHub Copilot Chat API
                    const response = await queryCopilot(message, mcpServerUrl);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(response));
                } catch (error) {
                    outputChannel.appendLine(`[Error] ${error}`);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }));
                }
            });
            return;
        }

        // Not found
        res.writeHead(404);
        res.end('Not found');
    });

    server.listen(port, () => {
        const message = `Copilot Web Bridge started on http://localhost:${port}`;
        outputChannel.appendLine(message);
        vscode.window.showInformationMessage(message);
    });
}

async function queryCopilot(userMessage: string, mcpServerUrl: string): Promise<any> {
    try {
        // Get GitHub Copilot Chat API
        const copilot = await vscode.lm.selectChatModels({ family: 'gpt-4' });

        if (!copilot || copilot.length === 0) {
            throw new Error('GitHub Copilot not available. Please ensure you are signed in to GitHub Copilot.');
        }

        const model = copilot[0];

        // Check if it's a database query
        const lowerMessage = userMessage.toLowerCase();
        const isDatabaseQuery =
            lowerMessage.includes('table') ||
            lowerMessage.includes('select') ||
            lowerMessage.includes('show') ||
            lowerMessage.includes('list') ||
            lowerMessage.includes('find') ||
            lowerMessage.includes('get') ||
            lowerMessage.includes('employee') ||
            lowerMessage.includes('database');

        if (isDatabaseQuery) {
            // Get database schema
            const schema = await getDatabaseSchema(mcpServerUrl);

            // Generate SQL using Copilot
            const sqlPrompt = `You are a PostgreSQL expert. Generate a single SQL query for: "${userMessage}"

Database Schema:
${schema}

Rules:
1. Return ONLY ONE SQL query, no explanations
2. Use proper PostgreSQL syntax
3. Include LIMIT clauses for safety
4. NEVER generate multiple SQL statements separated by semicolons
5. If user asks to see tables, use: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;

            const sqlMessages = [
                vscode.LanguageModelChatMessage.User(sqlPrompt)
            ];

            const sqlResponse = await model.sendRequest(sqlMessages, {}, new vscode.CancellationTokenSource().token);

            let sql = '';
            for await (const fragment of sqlResponse.text) {
                sql += fragment;
            }

            sql = sql.trim();

            // Clean up markdown
            if (sql.startsWith('```sql')) {
                sql = sql.replace(/```sql\n/, '').replace(/```$/, '').trim();
            } else if (sql.startsWith('```')) {
                sql = sql.replace(/```\n/, '').replace(/```$/, '').trim();
            }

            // Safety: take only first statement
            if (sql.includes(';')) {
                const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
                if (statements.length > 1) {
                    outputChannel.appendLine(`[SQL Safety] Multiple statements detected, using only first`);
                    sql = statements[0];
                } else {
                    sql = statements[0];
                }
            }

            outputChannel.appendLine(`[Generated SQL] ${sql}`);

            // Execute query via MCP server
            const result = await callMCPTool(mcpServerUrl, 'query_database', { query: sql });

            if (result.result && result.result.rows) {
                // Use Copilot to explain results
                const explainPrompt = `User asked: "${userMessage}"

SQL Query executed:
${sql}

Results (${result.result.row_count} rows):
${JSON.stringify(result.result.rows.slice(0, 5), null, 2)}

Explain these results in a clear, concise way.`;

                const explainMessages = [
                    vscode.LanguageModelChatMessage.User(explainPrompt)
                ];

                const explainResponse = await model.sendRequest(explainMessages, {}, new vscode.CancellationTokenSource().token);

                let explanation = '';
                for await (const fragment of explainResponse.text) {
                    explanation += fragment;
                }

                return {
                    response: explanation.trim(),
                    sql: sql,
                    data: result.result.rows,
                    rowCount: result.result.row_count,
                    hasResults: true,
                    timestamp: new Date().toISOString()
                };
            }

            throw new Error('No results from database query');
        } else {
            // General chat response
            const messages = [
                vscode.LanguageModelChatMessage.User(userMessage)
            ];

            const chatResponse = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);

            let response = '';
            for await (const fragment of chatResponse.text) {
                response += fragment;
            }

            return {
                response: response.trim(),
                hasResults: false,
                timestamp: new Date().toISOString()
            };
        }
    } catch (error) {
        throw new Error(`Copilot error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function getDatabaseSchema(mcpServerUrl: string): Promise<string> {
    try {
        // Get list of tables
        const tablesResult = await callMCPTool(mcpServerUrl, 'list_tables', {});
        const tables = tablesResult.result?.tables || [];

        if (tables.length === 0) {
            return 'No tables found in database.';
        }

        // Get schema for each table
        const schemaDetails: string[] = [];
        for (const table of tables) {
            try {
                const descResult = await callMCPTool(mcpServerUrl, 'describe_table', {
                    table_name: table.table_name
                });

                if (descResult.result?.columns) {
                    const columns = descResult.result.columns
                        .map((col: any) => `  - ${col.column_name} (${col.data_type})`)
                        .join('\n');

                    schemaDetails.push(`Table: ${table.table_name}\n${columns}`);
                }
            } catch (err) {
                // Skip tables we can't describe
            }
        }

        return schemaDetails.join('\n\n');
    } catch (error) {
        return 'Unable to fetch database schema';
    }
}

async function callMCPTool(mcpServerUrl: string, toolName: string, args: any): Promise<any> {
    const response = await fetch(`${mcpServerUrl}/mcp/v1/tools/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: toolName,
            arguments: args
        })
    });

    if (!response.ok) {
        throw new Error(`MCP Server error: ${response.statusText}`);
    }

    return response.json();
}

function stopServer() {
    if (server) {
        server.close();
        server = null;
        const message = 'Copilot Web Bridge stopped';
        outputChannel.appendLine(message);
        vscode.window.showInformationMessage(message);
    } else {
        vscode.window.showWarningMessage('Copilot Web Bridge is not running');
    }
}

function showStatus() {
    if (server) {
        const config = vscode.workspace.getConfiguration('copilotWebBridge');
        const port = config.get<number>('port') || 9000;
        vscode.window.showInformationMessage(`Copilot Web Bridge is running on port ${port}`);
    } else {
        vscode.window.showInformationMessage('Copilot Web Bridge is not running');
    }
}
