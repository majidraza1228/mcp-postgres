import * as vscode from 'vscode';
import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

let mcpServerProcess: ChildProcess | null = null;
let outputChannel: vscode.OutputChannel;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('PostgreSQL MCP extension is now active');

    // Create output channel
    outputChannel = vscode.window.createOutputChannel('PostgreSQL MCP');
    context.subscriptions.push(outputChannel);

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'postgres-mcp.showStatus';
    context.subscriptions.push(statusBarItem);
    updateStatusBar('stopped');

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('postgres-mcp.startServer', () => startMcpServer(context)),
        vscode.commands.registerCommand('postgres-mcp.stopServer', stopMcpServer),
        vscode.commands.registerCommand('postgres-mcp.restartServer', () => restartMcpServer(context)),
        vscode.commands.registerCommand('postgres-mcp.configure', configureDatabase),
        vscode.commands.registerCommand('postgres-mcp.showStatus', showServerStatus)
    );

    // Register chat participant
    const participant = vscode.chat.createChatParticipant('postgres-mcp.chatParticipant', handleChatRequest);
    participant.iconPath = vscode.Uri.file(path.join(context.extensionPath, 'resources', 'postgres-icon.png'));
    context.subscriptions.push(participant);

    // Auto-start server if configured
    const config = vscode.workspace.getConfiguration('postgresMcp');
    if (config.get('server.autoStart')) {
        startMcpServer(context);
    }
}

async function startMcpServer(context: vscode.ExtensionContext) {
    if (mcpServerProcess) {
        vscode.window.showWarningMessage('PostgreSQL MCP server is already running');
        return;
    }

    const config = vscode.workspace.getConfiguration('postgresMcp');

    // Find the MCP server directory
    const serverPath = findMcpServerPath(context);
    if (!serverPath) {
        vscode.window.showErrorMessage('MCP server not found. Please install the server first.');
        return;
    }

    const pythonPath = config.get('pythonPath', 'python3');
    const serverPort = config.get('server.port', 3000);

    outputChannel.appendLine('Starting PostgreSQL MCP server...');
    outputChannel.appendLine(`Server path: ${serverPath}`);
    outputChannel.appendLine(`Python path: ${pythonPath}`);
    outputChannel.show();

    // Set environment variables for the server
    const env = {
        ...process.env,
        DB_HOST: config.get('database.host', 'localhost'),
        DB_PORT: String(config.get('database.port', 5431)),
        DB_NAME: config.get('database.name', 'AdventureWorks'),
        DB_USER: config.get('database.user', 'postgres'),
        DB_PASSWORD: config.get('database.password', ''),
        SERVER_PORT: String(serverPort)
    };

    try {
        // Start the FastAPI server
        mcpServerProcess = spawn(pythonPath, ['-m', 'uvicorn', 'server:app', '--host', '127.0.0.1', '--port', String(serverPort)], {
            cwd: serverPath,
            env: env
        });

        mcpServerProcess.stdout?.on('data', (data) => {
            outputChannel.appendLine(`[SERVER] ${data.toString()}`);
        });

        mcpServerProcess.stderr?.on('data', (data) => {
            outputChannel.appendLine(`[ERROR] ${data.toString()}`);
        });

        mcpServerProcess.on('exit', (code) => {
            outputChannel.appendLine(`Server exited with code ${code}`);
            mcpServerProcess = null;
            updateStatusBar('stopped');
            vscode.window.showWarningMessage('PostgreSQL MCP server stopped');
        });

        // Wait a bit and check if server is running
        setTimeout(async () => {
            const isRunning = await checkServerHealth(serverPort);
            if (isRunning) {
                updateStatusBar('running');
                vscode.window.showInformationMessage('PostgreSQL MCP server started successfully');
            } else {
                updateStatusBar('error');
                vscode.window.showErrorMessage('Failed to start MCP server. Check output for details.');
            }
        }, 3000);

    } catch (error) {
        outputChannel.appendLine(`Error starting server: ${error}`);
        vscode.window.showErrorMessage(`Failed to start MCP server: ${error}`);
        updateStatusBar('error');
    }
}

function stopMcpServer() {
    if (!mcpServerProcess) {
        vscode.window.showWarningMessage('PostgreSQL MCP server is not running');
        return;
    }

    outputChannel.appendLine('Stopping PostgreSQL MCP server...');
    mcpServerProcess.kill();
    mcpServerProcess = null;
    updateStatusBar('stopped');
    vscode.window.showInformationMessage('PostgreSQL MCP server stopped');
}

async function restartMcpServer(context: vscode.ExtensionContext) {
    stopMcpServer();
    setTimeout(() => startMcpServer(context), 1000);
}

async function configureDatabase() {
    const config = vscode.workspace.getConfiguration('postgresMcp');

    const host = await vscode.window.showInputBox({
        prompt: 'Database Host',
        value: config.get('database.host', 'localhost')
    });

    if (!host) return;

    const port = await vscode.window.showInputBox({
        prompt: 'Database Port',
        value: String(config.get('database.port', 5431))
    });

    if (!port) return;

    const dbName = await vscode.window.showInputBox({
        prompt: 'Database Name',
        value: config.get('database.name', 'AdventureWorks')
    });

    if (!dbName) return;

    const user = await vscode.window.showInputBox({
        prompt: 'Database User',
        value: config.get('database.user', 'postgres')
    });

    if (!user) return;

    const password = await vscode.window.showInputBox({
        prompt: 'Database Password',
        password: true,
        value: config.get('database.password', '')
    });

    // Save configuration
    await config.update('database.host', host, vscode.ConfigurationTarget.Global);
    await config.update('database.port', parseInt(port), vscode.ConfigurationTarget.Global);
    await config.update('database.name', dbName, vscode.ConfigurationTarget.Global);
    await config.update('database.user', user, vscode.ConfigurationTarget.Global);
    await config.update('database.password', password, vscode.ConfigurationTarget.Global);

    vscode.window.showInformationMessage('Database configuration updated. Restart the server for changes to take effect.');
}

async function showServerStatus() {
    const config = vscode.workspace.getConfiguration('postgresMcp');
    const serverPort = config.get('server.port', 3000);

    try {
        const response = await axios.get(`http://127.0.0.1:${serverPort}/health`, { timeout: 2000 });
        const status = response.data;

        vscode.window.showInformationMessage(
            `MCP Server Status: ${status.status}\n` +
            `Database: ${status.database}\n` +
            `Connected to: ${status.config.database} on ${status.config.host}:${status.config.port}`
        );
    } catch (error) {
        vscode.window.showErrorMessage('MCP server is not responding');
    }
}

async function handleChatRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
): Promise<void> {
    const config = vscode.workspace.getConfiguration('postgresMcp');
    const serverPort = config.get('server.port', 3000);
    const baseUrl = `http://127.0.0.1:${serverPort}`;

    // Check if server is running
    const isRunning = await checkServerHealth(serverPort);
    if (!isRunning) {
        stream.markdown('⚠️ PostgreSQL MCP server is not running. Please start it with the command `PostgreSQL MCP: Start Server`');
        return;
    }

    try {
        const userPrompt = request.prompt;
        const lowerPrompt = userPrompt.toLowerCase().trim();

        // Handle slash commands explicitly
        if (request.command === 'query') {
            await handleQueryRequest(userPrompt, baseUrl, stream);
        } else if (request.command === 'tables') {
            await handleListTablesRequest(baseUrl, stream);
        } else if (request.command === 'describe') {
            await handleDescribeTableRequest(userPrompt, baseUrl, stream);
        } else if (request.command === 'create') {
            await handleCreateRequest(userPrompt, baseUrl, stream);
        } else {
            // For non-command requests, determine if it's direct SQL or natural language
            // Direct SQL patterns - must be at the START of the prompt
            // Covers: SELECT, INSERT, UPDATE, DELETE, CREATE (table/index/view/procedure/function/schema/sequence/trigger),
            //         ALTER, DROP, TRUNCATE, GRANT, REVOKE, BEGIN, COMMIT, ROLLBACK, EXPLAIN, WITH (CTEs)
            const isDirectSQL = /^(select|insert|update|delete|create\s+(table|index|view|procedure|function|schema|sequence|trigger|type|extension|database)|alter|drop|truncate|grant|revoke|begin|commit|rollback|savepoint|explain|analyze|vacuum|with\s+\w+\s+as)\s+/i.test(lowerPrompt);

            if (isDirectSQL) {
                // Execute as direct SQL
                const sqlLower = lowerPrompt;
                if (sqlLower.startsWith('select') || sqlLower.startsWith('with') || sqlLower.startsWith('explain')) {
                    await handleQueryRequest(userPrompt, baseUrl, stream);
                } else {
                    await handleModificationRequest(userPrompt, baseUrl, stream);
                }
            } else {
                // Use LLM for natural language queries
                await handleGeneralRequest(userPrompt, baseUrl, stream);
            }
        }

    } catch (error: any) {
        stream.markdown(`❌ Error: ${error.message}`);
        outputChannel.appendLine(`Chat error: ${error}`);
    }
}

async function handleQueryRequest(prompt: string, baseUrl: string, stream: vscode.ChatResponseStream) {
    // Extract SQL query from prompt or use the prompt as-is
    const query = extractSqlQuery(prompt);

    stream.markdown(`Executing query:\n\`\`\`sql\n${query}\n\`\`\``);

    try {
        const response = await axios.post(`${baseUrl}/mcp/v1/tools/call`, {
            name: 'query_database',
            arguments: { query }
        });

        const result = response.data.result;
        stream.markdown(`\n**Results:** ${result.row_count} rows\n`);

        if (result.rows.length > 0) {
            // Format as table
            stream.markdown('```\n');
            stream.markdown(formatAsTable(result.rows));
            stream.markdown('\n```');
        }
    } catch (error: any) {
        stream.markdown(`\n❌ Query failed: ${error.response?.data?.detail || error.message}`);
    }
}

async function handleListTablesRequest(baseUrl: string, stream: vscode.ChatResponseStream) {
    stream.markdown('Fetching list of tables...\n');

    try {
        const response = await axios.post(`${baseUrl}/mcp/v1/tools/call`, {
            name: 'list_tables',
            arguments: { schema: 'public' }
        });

        const result = response.data.result;
        stream.markdown(`\n**Found ${result.count} tables:**\n\n`);

        for (const table of result.tables) {
            stream.markdown(`- ${table.table_name} (${table.table_type})\n`);
        }
    } catch (error: any) {
        stream.markdown(`\n❌ Failed to list tables: ${error.response?.data?.detail || error.message}`);
    }
}

async function handleDescribeTableRequest(prompt: string, baseUrl: string, stream: vscode.ChatResponseStream) {
    // Extract table name from prompt
    const tableName = extractTableName(prompt);

    if (!tableName) {
        stream.markdown('Please specify a table name to describe.');
        return;
    }

    stream.markdown(`Describing table: **${tableName}**\n`);

    try {
        const response = await axios.post(`${baseUrl}/mcp/v1/tools/call`, {
            name: 'describe_table',
            arguments: { table_name: tableName }
        });

        const result = response.data.result;
        stream.markdown(`\n**Columns (${result.column_count}):**\n\n`);

        for (const col of result.columns) {
            const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
            const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
            stream.markdown(`- **${col.column_name}**: ${col.data_type} ${nullable}${defaultVal}\n`);
        }
    } catch (error: any) {
        stream.markdown(`\n❌ Failed to describe table: ${error.response?.data?.detail || error.message}`);
    }
}

async function handleCreateRequest(prompt: string, baseUrl: string, stream: vscode.ChatResponseStream) {
    stream.markdown('Creating database object...\n');

    // For now, use execute_sql for CREATE statements
    try {
        const response = await axios.post(`${baseUrl}/mcp/v1/tools/call`, {
            name: 'execute_sql',
            arguments: { sql: prompt }
        });

        const result = response.data.result;
        if (result.status === 'success') {
            stream.markdown(`✅ ${result.message}`);
        } else {
            stream.markdown(`❌ ${result.message}`);
        }
    } catch (error: any) {
        stream.markdown(`\n❌ Failed: ${error.response?.data?.detail || error.message}`);
    }
}

async function generateSQLWithLLM(naturalLanguageQuery: string, baseUrl: string): Promise<string> {
    try {
        // Get available tables and their schemas from MCP server
        const tablesResponse = await axios.post(`${baseUrl}/mcp/v1/tools/call`, {
            name: 'list_tables',
            arguments: { schema: 'public' }
        });

        const tables = tablesResponse.data.result.tables.map((t: any) => t.table_name);

        // Get schema for each table
        const schemas: string[] = [];
        for (const table of tables) {
            try {
                const schemaResponse = await axios.post(`${baseUrl}/mcp/v1/tools/call`, {
                    name: 'describe_table',
                    arguments: { table_name: table }
                });

                const columns = schemaResponse.data.result.columns
                    .map((c: any) => `${c.column_name} ${c.data_type}`)
                    .join(', ');

                schemas.push(`${table} (${columns})`);
            } catch (err) {
                // Skip tables that fail to describe
                schemas.push(`${table}`);
            }
        }

        // Get available language models
        const models = await vscode.lm.selectChatModels({
            vendor: 'copilot',
            family: 'gpt-4'
        });

        if (models.length === 0) {
            throw new Error('GitHub Copilot is not available. Please ensure Copilot is activated.');
        }

        const model = models[0];

        // Create prompt for SQL generation
        const systemPrompt = `You are a PostgreSQL expert assistant. Convert natural language queries into valid PostgreSQL SQL statements.

**Available Database Schema:**
${schemas.join('\n')}

**Instructions:**
- Return ONLY the SQL statement, no explanations or markdown
- Use proper PostgreSQL syntax
- For queries returning data, use SELECT
- For data modification, use INSERT, UPDATE, DELETE
- For schema changes, use CREATE, ALTER, DROP
- Add appropriate JOINs if multiple tables are needed
- Add LIMIT clauses for safety when selecting large datasets
- Use aggregate functions (COUNT, AVG, MIN, MAX, SUM) when appropriate
- For CREATE TABLE statements, include appropriate data types and constraints
- For stored procedures/functions, use proper PL/pgSQL syntax with $$ delimiters

**User Request:** ${naturalLanguageQuery}

**SQL:**`;

        const messages = [
            vscode.LanguageModelChatMessage.User(systemPrompt)
        ];

        const chatResponse = await model.sendRequest(messages, {});

        let sqlQuery = '';
        for await (const fragment of chatResponse.text) {
            sqlQuery += fragment;
        }

        // Clean up the response
        sqlQuery = sqlQuery
            .trim()
            .replace(/^```sql\s*/i, '')  // Remove SQL code block start
            .replace(/^```\s*/i, '')     // Remove generic code block start
            .replace(/\s*```$/i, '')     // Remove code block end
            .replace(/;+$/g, ';')        // Normalize semicolons
            .trim();

        // Remove trailing semicolon for consistency
        if (sqlQuery.endsWith(';')) {
            sqlQuery = sqlQuery.slice(0, -1);
        }

        if (!sqlQuery) {
            throw new Error('Failed to generate SQL from your request');
        }

        return sqlQuery;

    } catch (error: any) {
        if (error.message.includes('Copilot')) {
            throw new Error('GitHub Copilot is required for natural language queries. Please ensure Copilot is activated, or provide a direct SQL query.');
        }
        throw new Error(`Failed to generate SQL: ${error.message}`);
    }
}

async function handleGeneralRequest(prompt: string, baseUrl: string, stream: vscode.ChatResponseStream) {
    try {
        // Use LLM to generate SQL from natural language
        stream.markdown('🤖 Analyzing your request and generating SQL...\n\n');

        const sqlQuery = await generateSQLWithLLM(prompt, baseUrl);

        stream.markdown(`**Generated SQL:**\n\`\`\`sql\n${sqlQuery}\n\`\`\`\n\n`);
        outputChannel.appendLine(`[LLM Generated SQL]: ${sqlQuery}`);

        // Determine if it's a query or modification
        const sqlLower = sqlQuery.toLowerCase().trim();

        if (sqlLower.startsWith('select')) {
            // Execute as query
            const response = await axios.post(`${baseUrl}/mcp/v1/tools/call`, {
                name: 'query_database',
                arguments: { query: sqlQuery }
            });

            const result = response.data.result;
            stream.markdown(`**Results:** ${result.row_count} rows\n\n`);

            if (result.rows.length > 0) {
                stream.markdown('```\n');
                stream.markdown(formatAsTable(result.rows));
                stream.markdown('\n```');
            } else {
                stream.markdown('_No results found._\n');
            }
        } else {
            // Execute as modification (CREATE, INSERT, UPDATE, DELETE, etc.)
            const response = await axios.post(`${baseUrl}/mcp/v1/tools/call`, {
                name: 'execute_sql',
                arguments: { sql: sqlQuery }
            });

            const result = response.data.result;
            if (result.status === 'success') {
                stream.markdown(`✅ ${result.message}`);
            } else {
                stream.markdown(`❌ ${result.message}`);
            }
        }

    } catch (error: any) {
        stream.markdown(`\n❌ Error: ${error.message}\n\n`);
        outputChannel.appendLine(`[LLM Error]: ${error.message}`);
        stream.markdown(`💡 **Tip:** Try rephrasing your question or provide a direct SQL query.\n\n`);
        stream.markdown(`**Examples:**\n`);
        stream.markdown(`- "How many employees earn more than 70000?"\n`);
        stream.markdown(`- "Show me the top 5 highest paid employees"\n`);
        stream.markdown(`- "Create a table for storing orders"\n`);
        stream.markdown(`- Or write SQL directly: \`SELECT * FROM employees\`\n`);
    }
}

async function handleCountRequest(prompt: string, baseUrl: string, stream: vscode.ChatResponseStream) {
    // Try to extract table name and conditions from natural language
    const tableName = extractTableNameFromNL(prompt);
    const condition = extractConditionFromNL(prompt);

    let query = `SELECT COUNT(*) as count FROM ${tableName}`;
    if (condition) {
        query += ` WHERE ${condition}`;
    }

    stream.markdown(`Executing query:\n\`\`\`sql\n${query}\n\`\`\``);

    try {
        const response = await axios.post(`${baseUrl}/mcp/v1/tools/call`, {
            name: 'query_database',
            arguments: { query }
        });

        const result = response.data.result;
        if (result.rows.length > 0) {
            stream.markdown(`\n**Result:** ${result.rows[0].count} rows match your criteria\n`);
        }
    } catch (error: any) {
        stream.markdown(`\n❌ Query failed: ${error.response?.data?.detail || error.message}`);
        stream.markdown(`\nTry rephrasing or write the SQL query directly using SELECT.`);
    }
}

async function handleInferredQuery(prompt: string, baseUrl: string, stream: vscode.ChatResponseStream) {
    const tableName = extractTableNameFromNL(prompt);
    const condition = extractConditionFromNL(prompt);

    let query = `SELECT * FROM ${tableName}`;
    if (condition) {
        query += ` WHERE ${condition}`;
    }
    query += ' LIMIT 50';

    stream.markdown(`Executing query:\n\`\`\`sql\n${query}\n\`\`\``);

    try {
        const response = await axios.post(`${baseUrl}/mcp/v1/tools/call`, {
            name: 'query_database',
            arguments: { query }
        });

        const result = response.data.result;
        stream.markdown(`\n**Results:** ${result.row_count} rows\n`);

        if (result.rows.length > 0) {
            stream.markdown('```\n');
            stream.markdown(formatAsTable(result.rows));
            stream.markdown('\n```');
        }
    } catch (error: any) {
        stream.markdown(`\n❌ Query failed: ${error.response?.data?.detail || error.message}`);
        stream.markdown(`\nTry rephrasing or write the SQL query directly.`);
    }
}

async function handleAggregateRequest(prompt: string, baseUrl: string, stream: vscode.ChatResponseStream) {
    const tableName = extractTableNameFromNL(prompt);
    const lowerPrompt = prompt.toLowerCase();

    let aggFunction = 'AVG';
    if (lowerPrompt.includes('sum')) aggFunction = 'SUM';
    else if (lowerPrompt.includes('max')) aggFunction = 'MAX';
    else if (lowerPrompt.includes('min')) aggFunction = 'MIN';

    // Extract column name (simple heuristic)
    const words = prompt.split(/\s+/);
    const ofIndex = words.findIndex(w => w.toLowerCase() === 'of');
    const column = ofIndex > 0 ? words[ofIndex + 1].replace(/[^a-zA-Z0-9_]/g, '') : 'salary';

    const query = `SELECT ${aggFunction}(${column}) as result FROM ${tableName}`;

    stream.markdown(`Executing query:\n\`\`\`sql\n${query}\n\`\`\``);

    try {
        const response = await axios.post(`${baseUrl}/mcp/v1/tools/call`, {
            name: 'query_database',
            arguments: { query }
        });

        const result = response.data.result;
        if (result.rows.length > 0) {
            stream.markdown(`\n**Result:** ${result.rows[0].result}\n`);
        }
    } catch (error: any) {
        stream.markdown(`\n❌ Query failed: ${error.response?.data?.detail || error.message}`);
    }
}

async function handleModificationRequest(prompt: string, baseUrl: string, stream: vscode.ChatResponseStream) {
    stream.markdown('Executing SQL statement...\n');

    try {
        const response = await axios.post(`${baseUrl}/mcp/v1/tools/call`, {
            name: 'execute_sql',
            arguments: { sql: prompt }
        });

        const result = response.data.result;
        if (result.status === 'success') {
            stream.markdown(`✅ ${result.message}`);
        } else {
            stream.markdown(`❌ ${result.message}`);
        }
    } catch (error: any) {
        stream.markdown(`\n❌ Failed: ${error.response?.data?.detail || error.message}`);
    }
}

function extractTableNameFromNL(prompt: string): string {
    // Common table name patterns
    const patterns = [
        /from\s+(\w+)/i,
        /in\s+(?:the\s+)?(\w+)\s+table/i,
        /(\w+)\s+table/i,
        /table\s+(\w+)/i
    ];

    for (const pattern of patterns) {
        const match = prompt.match(pattern);
        if (match) {
            return match[1];
        }
    }

    // Try common table names
    const commonTables = ['employees', 'users', 'customers', 'orders', 'products', 'suppliers'];
    const lowerPrompt = prompt.toLowerCase();
    for (const table of commonTables) {
        if (lowerPrompt.includes(table)) {
            return table;
        }
    }

    return 'employees'; // default fallback
}

function extractConditionFromNL(prompt: string): string | null {
    const lowerPrompt = prompt.toLowerCase();

    // Greater than patterns
    let match = lowerPrompt.match(/(\w+)\s+(?:greater than|>|more than)\s+(\d+)/);
    if (match) {
        return `${match[1]} > ${match[2]}`;
    }

    // Less than patterns
    match = lowerPrompt.match(/(\w+)\s+(?:less than|<)\s+(\d+)/);
    if (match) {
        return `${match[1]} < ${match[2]}`;
    }

    // Equals patterns
    match = lowerPrompt.match(/(\w+)\s+(?:is|=|equals)\s+['"]?(\w+)['"]?/);
    if (match) {
        return `${match[1]} = '${match[2]}'`;
    }

    // WHERE clause already present
    match = prompt.match(/where\s+(.*?)(?:\s+limit|\s+order|$)/i);
    if (match) {
        return match[1].trim();
    }

    return null;
}

// Helper functions

function findMcpServerPath(context: vscode.ExtensionContext): string | null {
    // Check multiple possible locations
    const possiblePaths = [
        path.join(context.extensionPath, 'mcp-server'),
        path.join(context.extensionPath, '..', '..', 'mcp-server'),
        path.join(process.env.HOME || '', '.postgres-mcp', 'mcp-server')
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(path.join(p, 'server.py'))) {
            return p;
        }
    }

    return null;
}

async function checkServerHealth(port: number): Promise<boolean> {
    try {
        const response = await axios.get(`http://127.0.0.1:${port}/health`, { timeout: 2000 });
        return response.status === 200;
    } catch {
        return false;
    }
}

function updateStatusBar(status: 'running' | 'stopped' | 'error') {
    if (status === 'running') {
        statusBarItem.text = '$(database) PostgreSQL MCP: Running';
        statusBarItem.backgroundColor = undefined;
    } else if (status === 'stopped') {
        statusBarItem.text = '$(database) PostgreSQL MCP: Stopped';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
        statusBarItem.text = '$(database) PostgreSQL MCP: Error';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }
    statusBarItem.show();
}

function extractSqlQuery(prompt: string): string {
    // If the prompt contains SQL code block, extract it
    const codeBlockMatch = prompt.match(/```sql\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
        return codeBlockMatch[1].trim();
    }

    // If it starts with SELECT, return as-is
    if (prompt.trim().toUpperCase().startsWith('SELECT')) {
        return prompt.trim();
    }

    // Otherwise, return the prompt (let the user write SQL)
    return prompt;
}

function extractTableName(prompt: string): string | null {
    // Try to extract table name from various patterns
    const patterns = [
        /describe\s+(\w+)/i,
        /table\s+(\w+)/i,
        /(\w+)\s+table/i
    ];

    for (const pattern of patterns) {
        const match = prompt.match(pattern);
        if (match) {
            return match[1];
        }
    }

    // If nothing matches, return the last word
    const words = prompt.trim().split(/\s+/);
    return words[words.length - 1];
}

function formatAsTable(rows: any[]): string {
    if (rows.length === 0) return '';

    const columns = Object.keys(rows[0]);
    const columnWidths = columns.map(col => {
        const maxDataWidth = Math.max(...rows.map(row => String(row[col] || '').length));
        return Math.max(col.length, maxDataWidth);
    });

    let table = '';

    // Header
    table += columns.map((col, i) => col.padEnd(columnWidths[i])).join(' | ') + '\n';
    table += columnWidths.map(w => '-'.repeat(w)).join('-+-') + '\n';

    // Rows
    for (const row of rows.slice(0, 50)) { // Limit to 50 rows
        table += columns.map((col, i) => String(row[col] || '').padEnd(columnWidths[i])).join(' | ') + '\n';
    }

    if (rows.length > 50) {
        table += `\n... and ${rows.length - 50} more rows\n`;
    }

    return table;
}

export function deactivate() {
    if (mcpServerProcess) {
        mcpServerProcess.kill();
    }
}
