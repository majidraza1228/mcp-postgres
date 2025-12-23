import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { MCPClient } from './mcp-client.js';

/**
 * Agent Server - Bridge between web chatbot and MCP server
 *
 * Architecture:
 * Web Chatbot → Agent Server (HTTP/WS) → MCP Server → LLM
 */
export class AgentServer {
  private app: Express;
  private httpServer;
  private wss: WebSocketServer;
  private mcpClient: MCPClient;
  private port: number;

  constructor(
    port: number = 3000,
    mcpServerCommand: string,
    mcpServerArgs: string[] = []
  ) {
    this.port = port;
    this.app = express();
    this.httpServer = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.httpServer });

    // Create MCP client
    this.mcpClient = new MCPClient(mcpServerCommand, mcpServerArgs);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  /**
   * Initialize and connect to MCP server
   */
  async initialize(): Promise<void> {
    try {
      await this.mcpClient.connect();
      console.log('✓ Agent server initialized');
    } catch (error) {
      console.error('Failed to initialize agent server:', error);
      throw error;
    }
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
   * Setup HTTP REST API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        mcpConnected: this.mcpClient.isServerConnected(),
      });
    });

    // Get agent info
    this.app.get('/agent/info', async (req: Request, res: Response) => {
      try {
        const tools = await this.mcpClient.listTools();

        res.json({
          name: 'GitHub Copilot Agent',
          version: '2.0.0',
          mcpConnected: this.mcpClient.isServerConnected(),
          availableTools: tools.map((t) => t.name),
          status: 'ready',
        });
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Chat endpoint - Main interface for web chatbot
    this.app.post('/chat', async (req: Request, res: Response) => {
      try {
        const { message } = req.body;

        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        console.log('[Chat Request]', message.substring(0, 100));

        const response = await this.mcpClient.chat(message);

        res.json({
          response,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[Chat Error]', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Code generation endpoint
    this.app.post('/generate-code', async (req: Request, res: Response) => {
      try {
        const { prompt, language, context } = req.body;

        if (!prompt || !language) {
          return res.status(400).json({ error: 'Prompt and language are required' });
        }

        const code = await this.mcpClient.generateCode(prompt, language, context);

        res.json({
          code,
          language,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[Code Generation Error]', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Code explanation endpoint
    this.app.post('/explain-code', async (req: Request, res: Response) => {
      try {
        const { code, language } = req.body;

        if (!code) {
          return res.status(400).json({ error: 'Code is required' });
        }

        const explanation = await this.mcpClient.explainCode(code, language);

        res.json({
          explanation,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[Code Explanation Error]', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Code review endpoint
    this.app.post('/review-code', async (req: Request, res: Response) => {
      try {
        const { code, language } = req.body;

        if (!code) {
          return res.status(400).json({ error: 'Code is required' });
        }

        const review = await this.mcpClient.reviewCode(code, language);

        res.json({
          review,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[Code Review Error]', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // Bug fixing endpoint
    this.app.post('/fix-code', async (req: Request, res: Response) => {
      try {
        const { code, error: errorMsg, language } = req.body;

        if (!code || !errorMsg) {
          return res.status(400).json({ error: 'Code and error message are required' });
        }

        const fix = await this.mcpClient.fixCode(code, errorMsg, language);

        res.json({
          fix,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[Code Fix Error]', error);
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // List available MCP tools
    this.app.get('/tools', async (req: Request, res: Response) => {
      try {
        const tools = await this.mcpClient.listTools();

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

    // Call any MCP tool directly
    this.app.post('/tool/:toolName', async (req: Request, res: Response) => {
      try {
        const { toolName } = req.params;
        const args = req.body;

        const result = await this.mcpClient.callTool(toolName, args);

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
   * Setup WebSocket for real-time communication
   */
  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WebSocket] Client connected');

      ws.on('message', async (data: Buffer) => {
        try {
          const request = JSON.parse(data.toString());
          console.log('[WebSocket Request]', request.type);

          switch (request.type) {
            case 'chat':
              await this.handleWebSocketChat(ws, request);
              break;

            case 'generate_code':
              await this.handleWebSocketGenerateCode(ws, request);
              break;

            case 'explain_code':
              await this.handleWebSocketExplainCode(ws, request);
              break;

            case 'review_code':
              await this.handleWebSocketReviewCode(ws, request);
              break;

            case 'fix_code':
              await this.handleWebSocketFixCode(ws, request);
              break;

            case 'list_tools':
              await this.handleWebSocketListTools(ws);
              break;

            case 'call_tool':
              await this.handleWebSocketCallTool(ws, request);
              break;

            case 'ping':
              ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
              break;

            default:
              ws.send(JSON.stringify({ type: 'error', error: `Unknown request type: ${request.type}` }));
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

      ws.on('error', (error) => {
        console.error('[WebSocket Error]', error);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to GitHub Copilot Agent',
        mcpConnected: this.mcpClient.isServerConnected(),
        timestamp: new Date().toISOString(),
      }));
    });
  }

  /**
   * WebSocket handlers
   */
  private async handleWebSocketChat(ws: WebSocket, request: any): Promise<void> {
    const response = await this.mcpClient.chat(request.message);

    ws.send(JSON.stringify({
      type: 'chat_response',
      response,
      timestamp: new Date().toISOString(),
    }));
  }

  private async handleWebSocketGenerateCode(ws: WebSocket, request: any): Promise<void> {
    const code = await this.mcpClient.generateCode(
      request.prompt,
      request.language,
      request.context
    );

    ws.send(JSON.stringify({
      type: 'code_generated',
      code,
      language: request.language,
      timestamp: new Date().toISOString(),
    }));
  }

  private async handleWebSocketExplainCode(ws: WebSocket, request: any): Promise<void> {
    const explanation = await this.mcpClient.explainCode(
      request.code,
      request.language
    );

    ws.send(JSON.stringify({
      type: 'code_explained',
      explanation,
      timestamp: new Date().toISOString(),
    }));
  }

  private async handleWebSocketReviewCode(ws: WebSocket, request: any): Promise<void> {
    const review = await this.mcpClient.reviewCode(
      request.code,
      request.language
    );

    ws.send(JSON.stringify({
      type: 'code_reviewed',
      review,
      timestamp: new Date().toISOString(),
    }));
  }

  private async handleWebSocketFixCode(ws: WebSocket, request: any): Promise<void> {
    const fix = await this.mcpClient.fixCode(
      request.code,
      request.error,
      request.language
    );

    ws.send(JSON.stringify({
      type: 'code_fixed',
      fix,
      timestamp: new Date().toISOString(),
    }));
  }

  private async handleWebSocketListTools(ws: WebSocket): Promise<void> {
    const tools = await this.mcpClient.listTools();

    ws.send(JSON.stringify({
      type: 'tools_list',
      tools,
      timestamp: new Date().toISOString(),
    }));
  }

  private async handleWebSocketCallTool(ws: WebSocket, request: any): Promise<void> {
    const result = await this.mcpClient.callTool(request.tool, request.args || {});

    ws.send(JSON.stringify({
      type: 'tool_result',
      tool: request.tool,
      result,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Start the server
   */
  public start(): void {
    this.httpServer.listen(this.port, () => {
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║       GitHub Copilot Agent Server Started             ║');
      console.log('╠════════════════════════════════════════════════════════╣');
      console.log(`║  HTTP Server:      http://localhost:${this.port}              ║`);
      console.log(`║  WebSocket:        ws://localhost:${this.port}                ║`);
      console.log(`║  MCP Connected:    ${this.mcpClient.isServerConnected() ? '✓ Yes' : '✗ No'}                            ║`);
      console.log('║  Status:           Ready                               ║');
      console.log('╠════════════════════════════════════════════════════════╣');
      console.log('║  Available Endpoints:                                  ║');
      console.log('║  - POST /chat                                          ║');
      console.log('║  - POST /generate-code                                 ║');
      console.log('║  - POST /explain-code                                  ║');
      console.log('║  - POST /review-code                                   ║');
      console.log('║  - POST /fix-code                                      ║');
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
  async stop(): Promise<void> {
    this.wss.close();
    this.httpServer.close();
    await this.mcpClient.disconnect();
    console.log('Server stopped');
  }
}
