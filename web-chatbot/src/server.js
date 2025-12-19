const express = require('express');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 8080;

// Configuration
const COPILOT_PROXY_URL = 'http://localhost:9000';
const MCP_SERVER_URL = 'http://localhost:3000';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session management
app.use(session({
    secret: 'postgres-mcp-chatbot-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Simple authentication middleware (optional)
const ENABLE_AUTH = process.env.ENABLE_AUTH === 'true';
const USERS = {
    'admin': 'admin123',  // Change these credentials!
    'developer': 'dev123'
};

function authMiddleware(req, res, next) {
    if (!ENABLE_AUTH) {
        return next();
    }

    if (req.session.authenticated) {
        return next();
    }

    if (req.path === '/login' || req.path === '/health') {
        return next();
    }

    res.status(401).json({ error: 'Authentication required' });
}

// Routes

// Health check
app.get('/health', async (req, res) => {
    try {
        const copilotHealth = await axios.get(`${COPILOT_PROXY_URL}/health`, { timeout: 2000 });
        const mcpHealth = await axios.get(`${MCP_SERVER_URL}/health`, { timeout: 2000 });

        res.json({
            status: 'running',
            services: {
                copilot: copilotHealth.data,
                mcp: {
                    ...mcpHealth.data,
                    server_url: MCP_SERVER_URL
                }
            }
        });
    } catch (error) {
        // Return partial status if one service is down
        let partialStatus = {
            status: 'degraded',
            error: error.message,
            services: {}
        };

        try {
            const copilotHealth = await axios.get(`${COPILOT_PROXY_URL}/health`, { timeout: 2000 });
            partialStatus.services.copilot = copilotHealth.data;
        } catch (e) {
            partialStatus.services.copilot = { status: 'unavailable', error: e.message };
        }

        try {
            const mcpHealth = await axios.get(`${MCP_SERVER_URL}/health`, { timeout: 2000 });
            partialStatus.services.mcp = {
                ...mcpHealth.data,
                server_url: MCP_SERVER_URL
            };
        } catch (e) {
            partialStatus.services.mcp = { status: 'unavailable', error: e.message };
        }

        res.status(503).json(partialStatus);
    }
});

// Login (optional)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (USERS[username] && USERS[username] === password) {
        req.session.authenticated = true;
        req.session.username = username;
        res.json({ success: true, username });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Get database schema
app.get('/api/schema', authMiddleware, async (req, res) => {
    try {
        // Get list of tables
        const tablesResponse = await axios.post(`${MCP_SERVER_URL}/mcp/v1/tools/call`, {
            name: 'list_tables',
            arguments: { schema: 'public' }
        });

        const tables = tablesResponse.data.result.tables.map(t => t.table_name);

        // Get schema for each table
        const schemas = [];
        for (const table of tables) {
            try {
                const schemaResponse = await axios.post(`${MCP_SERVER_URL}/mcp/v1/tools/call`, {
                    name: 'describe_table',
                    arguments: { table_name: table }
                });

                const columns = schemaResponse.data.result.columns
                    .map(c => `${c.column_name} ${c.data_type}`)
                    .join(', ');

                schemas.push(`${table} (${columns})`);
            } catch (err) {
                schemas.push(`${table}`);
            }
        }

        res.json({ schema: schemas.join('\\n') });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Chat endpoint - generate SQL and execute
app.post('/api/chat', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Step 1: Get database schema
        const tablesResponse = await axios.post(`${MCP_SERVER_URL}/mcp/v1/tools/call`, {
            name: 'list_tables',
            arguments: { schema: 'public' }
        });

        const tables = tablesResponse.data.result.tables.map(t => t.table_name);
        const schemas = [];

        for (const table of tables) {
            try {
                const schemaResponse = await axios.post(`${MCP_SERVER_URL}/mcp/v1/tools/call`, {
                    name: 'describe_table',
                    arguments: { table_name: table }
                });

                const columns = schemaResponse.data.result.columns
                    .map(c => `${c.column_name} ${c.data_type}`)
                    .join(', ');

                schemas.push(`${table} (${columns})`);
            } catch (err) {
                schemas.push(`${table}`);
            }
        }

        const schemaText = schemas.join('\\n');

        // Step 2: Generate SQL using GitHub Copilot (via VS Code extension proxy)
        const copilotResponse = await axios.post(`${COPILOT_PROXY_URL}/copilot/generate`, {
            query: message,
            schema: schemaText
        });

        const sqlQuery = copilotResponse.data.sql;

        // Step 3: Execute SQL on MCP server
        const sqlLower = sqlQuery.toLowerCase().trim();
        let executionResult;

        if (sqlLower.startsWith('select') || sqlLower.startsWith('with') || sqlLower.startsWith('explain')) {
            // Query
            const queryResponse = await axios.post(`${MCP_SERVER_URL}/mcp/v1/tools/call`, {
                name: 'query_database',
                arguments: { query: sqlQuery }
            });
            executionResult = queryResponse.data.result;
        } else {
            // Modification (INSERT, UPDATE, DELETE, CREATE, etc.)
            const modResponse = await axios.post(`${MCP_SERVER_URL}/mcp/v1/tools/call`, {
                name: 'execute_sql',
                arguments: { sql: sqlQuery }
            });
            executionResult = modResponse.data.result;
        }

        // Return response
        res.json({
            message: message,
            sql: sqlQuery,
            result: executionResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chat error:', error.message);
        res.status(500).json({
            error: error.message,
            details: error.response?.data || 'Unknown error'
        });
    }
});

// Execute direct SQL
app.post('/api/execute', authMiddleware, async (req, res) => {
    try {
        const { sql } = req.body;

        if (!sql) {
            return res.status(400).json({ error: 'SQL is required' });
        }

        const sqlLower = sql.toLowerCase().trim();
        let executionResult;

        if (sqlLower.startsWith('select') || sqlLower.startsWith('with') || sqlLower.startsWith('explain')) {
            const queryResponse = await axios.post(`${MCP_SERVER_URL}/mcp/v1/tools/call`, {
                name: 'query_database',
                arguments: { query: sql }
            });
            executionResult = queryResponse.data.result;
        } else {
            const modResponse = await axios.post(`${MCP_SERVER_URL}/mcp/v1/tools/call`, {
                name: 'execute_sql',
                arguments: { sql: sql }
            });
            executionResult = modResponse.data.result;
        }

        res.json({
            sql: sql,
            result: executionResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Execute error:', error.message);
        res.status(500).json({
            error: error.message,
            details: error.response?.data || 'Unknown error'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`PostgreSQL MCP Web Chatbot running on http://localhost:${PORT}`);
    console.log(`Authentication: ${ENABLE_AUTH ? 'ENABLED' : 'DISABLED'}`);
    console.log(`Copilot Proxy: ${COPILOT_PROXY_URL}`);
    console.log(`MCP Server: ${MCP_SERVER_URL}`);
});
