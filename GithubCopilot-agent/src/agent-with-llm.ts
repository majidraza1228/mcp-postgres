import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createLLMClient, LLMClient } from './llm-client.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Agent Server with LLM - Connects to HTTP-based PostgreSQL MCP Server
 *
 * Architecture:
 * Web Chatbot → Agent (LLM) → PostgreSQL MCP Server (HTTP) → Database
 */
export class AgentWithLLM {
  private app: Express;
  private httpServer;
  private wss: WebSocketServer;
  private llmClient: LLMClient | null;
  private port: number;
  private mcpServerUrl: string;

  constructor(port: number = 8080, mcpServerUrl: string = 'http://localhost:3000') {
    this.port = port;
    this.mcpServerUrl = mcpServerUrl;
    this.app = express();
    this.httpServer = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.httpServer });

    // Create LLM client
    this.llmClient = createLLMClient();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json());

    // CORS for web chatbot
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Call PostgreSQL MCP Server tool
   */
  private async callMCPTool(toolName: string, args: any): Promise<any> {
    const response = await fetch(`${this.mcpServerUrl}/mcp/v1/tools/call`, {
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

  /**
   * Get available tools from MCP server
   */
  private async getMCPTools(): Promise<any[]> {
    const response = await fetch(`${this.mcpServerUrl}/mcp/v1/tools`);
    if (!response.ok) {
      throw new Error(`Failed to get MCP tools: ${response.statusText}`);
    }
    const data = await response.json();
    return data.tools || [];
  }

  /**
   * Setup HTTP REST API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', async (req: Request, res: Response) => {
      try {
        const mcpResponse = await fetch(`${this.mcpServerUrl}/health`);
        const mcpHealth = await mcpResponse.json();

        res.json({
          status: 'healthy',
          llmEnabled: this.llmClient !== null,
          mcpServer: mcpHealth,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: 'MCP server not reachable',
        });
      }
    });

    // Get agent info
    this.app.get('/agent/info', async (req: Request, res: Response) => {
      try {
        const tools = await this.getMCPTools();

        res.json({
          name: 'GitHub Copilot Agent with LLM',
          version: '2.0.0',
          llmEnabled: this.llmClient !== null,
          mcpServerUrl: this.mcpServerUrl,
          availableTools: tools.map((t: any) => t.name),
          status: 'ready',
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Chat endpoint with LLM
    this.app.post('/chat', async (req: Request, res: Response) => {
      try {
        const { message } = req.body;

        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        console.log('[Chat Request]', message.substring(0, 100));

        if (!this.llmClient) {
          return res.status(503).json({ error: 'LLM not configured. Please set LLM_PROVIDER in .env' });
        }

        // Use LLM to generate SQL or answer questions
        const result = await this.handleChatWithLLM(message);

        res.json({
          ...result,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[Chat Error]', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // List available MCP tools
    this.app.get('/tools', async (req: Request, res: Response) => {
      try {
        const tools = await this.getMCPTools();

        res.json({
          tools,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[Tools List Error]', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Call MCP tool directly
    this.app.post('/tool/:toolName', async (req: Request, res: Response) => {
      try {
        const { toolName } = req.params;
        const args = req.body;

        const result = await this.callMCPTool(toolName, args);

        res.json({
          result,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[Tool Call Error]', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  /**
   * Get database schema information
   */
  private async getDatabaseSchema(): Promise<string> {
    try {
      // Get list of tables
      const tablesResult = await this.callMCPTool('list_tables', {});
      const tables = tablesResult.result?.tables || [];

      if (tables.length === 0) {
        return 'No tables found in database.';
      }

      // Get schema for each table
      const schemaDetails: string[] = [];
      for (const table of tables) {
        try {
          const descResult = await this.callMCPTool('describe_table', {
            table_name: table.table_name
          });

          if (descResult.result?.columns) {
            const columns = descResult.result.columns.map((col: any) =>
              `  - ${col.column_name} (${col.data_type})`
            ).join('\n');

            schemaDetails.push(`Table: ${table.table_name}\n${columns}`);
          }
        } catch (err) {
          // Skip tables we can't describe
          console.error(`[Schema Error] Failed to describe ${table.table_name}:`, err);
        }
      }

      return schemaDetails.join('\n\n');
    } catch (error) {
      console.error('[Schema Error]', error);
      return 'Unable to fetch database schema';
    }
  }

  /**
   * Handle chat with LLM and database
   */
  private async handleChatWithLLM(userMessage: string): Promise<any> {
    if (!this.llmClient) {
      throw new Error('LLM not available');
    }

    const lowerMessage = userMessage.toLowerCase();

    // Check if it's a database query
    if (
      lowerMessage.includes('table') ||
      lowerMessage.includes('select') ||
      lowerMessage.includes('show') ||
      lowerMessage.includes('list') ||
      lowerMessage.includes('find') ||
      lowerMessage.includes('get') ||
      lowerMessage.includes('employee') ||
      lowerMessage.includes('salary') ||
      lowerMessage.includes('result')
    ) {
      // Get actual database schema for context
      const schemaInfo = await this.getDatabaseSchema();

      // Generate SQL using LLM
      const sql = await this.llmClient.generateSQL(userMessage, schemaInfo);

      console.log('[Generated SQL]', sql);

      // Execute query via MCP server
      const result = await this.callMCPTool('query_database', { query: sql });

      if (result.result && result.result.rows) {
        // Use LLM to explain results
        const explanation = await this.llmClient.explainResults(
          sql,
          result.result.rows,
          userMessage
        );

        return {
          response: explanation,
          sql: sql,
          data: result.result.rows,
          rowCount: result.result.row_count,
          hasResults: true
        };
      }

      return {
        response: JSON.stringify(result, null, 2),
        hasResults: false
      };
    }

    // General database chat
    const tools = await this.getMCPTools();
    const context = `Available database tools:\n${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}`;

    const response = await this.llmClient.chatAboutDatabase(userMessage, context);

    return {
      response,
      hasResults: false
    };
  }

  /**
   * Setup WebSocket
   */
  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] Client connected');

      ws.on('message', async (data: Buffer) => {
        try {
          const request = JSON.parse(data.toString());
          console.log('[WebSocket Request]', request.type);

          if (request.type === 'chat') {
            if (!this.llmClient) {
              ws.send(JSON.stringify({
                type: 'error',
                error: 'LLM not configured'
              }));
              return;
            }

            const result = await this.handleChatWithLLM(request.message);

            ws.send(JSON.stringify({
              type: 'chat_response',
              ...result,
              timestamp: new Date().toISOString(),
            }));
          }
        } catch (error) {
          console.error('[WebSocket Error]', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          }));
        }
      });

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
      });

      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to GitHub Copilot Agent with LLM',
        llmEnabled: this.llmClient !== null,
        timestamp: new Date().toISOString(),
      }));
    });
  }

  /**
   * Start the server
   */
  public start(): void {
    this.httpServer.listen(this.port, () => {
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║    GitHub Copilot Agent with LLM Started              ║');
      console.log('╠════════════════════════════════════════════════════════╣');
      console.log(`║  HTTP Server:      http://localhost:${this.port}              ║`);
      console.log(`║  WebSocket:        ws://localhost:${this.port}                ║`);
      console.log(`║  LLM Enabled:      ${this.llmClient ? '✓ Yes' : '✗ No'}                            ║`);
      console.log(`║  MCP Server:       ${this.mcpServerUrl.padEnd(27)} ║`);
      console.log('║  Status:           Ready                               ║');
      console.log('╠════════════════════════════════════════════════════════╣');
      console.log('║  Available Endpoints:                                  ║');
      console.log('║  - POST /chat (with LLM)                               ║');
      console.log('║  - GET  /tools                                         ║');
      console.log('║  - POST /tool/:toolName                                ║');
      console.log('║  - GET  /health                                        ║');
      console.log('║  - GET  /agent/info                                    ║');
      console.log('╚════════════════════════════════════════════════════════╝');
    });
  }

  /**
   * Stop the server
   */
  public stop(): void {
    this.wss.close();
    this.httpServer.close();
    console.log('Server stopped');
  }
}
