import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Generic MCP Client that connects to any MCP server
 * The server provides the LLM functionality
 */
export class MCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private isConnected: boolean = false;

  constructor(
    private serverCommand: string,
    private serverArgs: string[] = []
  ) {}

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    try {
      console.log(`Connecting to MCP server: ${this.serverCommand} ${this.serverArgs.join(' ')}`);

      // Create transport (this will spawn the process)
      this.transport = new StdioClientTransport({
        command: this.serverCommand,
        args: this.serverArgs,
      });

      // Create MCP client
      this.client = new Client(
        {
          name: 'github-copilot-agent',
          version: '2.0.0',
        },
        {
          capabilities: {},
        }
      );

      // Connect to server
      await this.client.connect(this.transport);
      this.isConnected = true;

      console.log('✓ Connected to MCP server');
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }

    if (this.transport) {
      await this.transport.close();
      this.transport = null;
    }

    this.isConnected = false;
    console.log('Disconnected from MCP server');
  }

  /**
   * Check if connected
   */
  isServerConnected(): boolean {
    return this.isConnected;
  }

  /**
   * List available tools from the MCP server
   */
  async listTools(): Promise<any[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('Not connected to MCP server');
    }

    const response = await this.client.listTools();
    return response.tools;
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(name: string, args: any): Promise<string> {
    if (!this.client || !this.isConnected) {
      throw new Error('Not connected to MCP server');
    }

    const response = await this.client.callTool({
      name,
      arguments: args,
    });

    // Extract text from response
    if (response.content && Array.isArray(response.content) && response.content.length > 0) {
      const textContent = response.content
        .filter((item: any) => item.type === 'text')
        .map((item: any) => item.text)
        .join('\n');

      return textContent;
    }

    return '';
  }

  /**
   * Send a chat message (if the MCP server has a chat tool)
   */
  async chat(message: string): Promise<string> {
    // Try to find a chat-like tool
    const tools = await this.listTools();
    const chatTool = tools.find(
      (t) =>
        t.name === 'chat' ||
        t.name === 'ask' ||
        t.name === 'query' ||
        t.name === 'prompt'
    );

    if (chatTool) {
      return this.callTool(chatTool.name, { message, prompt: message, query: message });
    }

    throw new Error('No chat tool available in MCP server');
  }

  /**
   * Generate code using MCP server
   */
  async generateCode(prompt: string, language: string, context?: string): Promise<string> {
    const tools = await this.listTools();
    const codeTool = tools.find(
      (t) => t.name === 'generate_code' || t.name === 'code_generate' || t.name === 'generate'
    );

    if (codeTool) {
      return this.callTool(codeTool.name, { prompt, language, context });
    }

    // Fallback to chat
    const codePrompt = context
      ? `Context: ${context}\n\nGenerate ${language} code for: ${prompt}`
      : `Generate ${language} code for: ${prompt}`;

    return this.chat(codePrompt);
  }

  /**
   * Explain code using MCP server
   */
  async explainCode(code: string, language?: string): Promise<string> {
    const tools = await this.listTools();
    const explainTool = tools.find(
      (t) => t.name === 'explain_code' || t.name === 'code_explain' || t.name === 'explain'
    );

    if (explainTool) {
      return this.callTool(explainTool.name, { code, language });
    }

    // Fallback to chat
    const explainPrompt = language
      ? `Explain this ${language} code:\n\n${code}`
      : `Explain this code:\n\n${code}`;

    return this.chat(explainPrompt);
  }

  /**
   * Review code using MCP server
   */
  async reviewCode(code: string, language?: string): Promise<string> {
    const tools = await this.listTools();
    const reviewTool = tools.find(
      (t) => t.name === 'review_code' || t.name === 'code_review' || t.name === 'review'
    );

    if (reviewTool) {
      return this.callTool(reviewTool.name, { code, language });
    }

    // Fallback to chat
    const reviewPrompt = language
      ? `Review this ${language} code and suggest improvements:\n\n${code}`
      : `Review this code and suggest improvements:\n\n${code}`;

    return this.chat(reviewPrompt);
  }

  /**
   * Fix code using MCP server
   */
  async fixCode(code: string, error: string, language?: string): Promise<string> {
    const tools = await this.listTools();
    const fixTool = tools.find(
      (t) => t.name === 'fix_code' || t.name === 'code_fix' || t.name === 'fix'
    );

    if (fixTool) {
      return this.callTool(fixTool.name, { code, error, language });
    }

    // Fallback to chat
    const fixPrompt = language
      ? `Fix this ${language} code that has the following error:\n\nError: ${error}\n\nCode:\n${code}`
      : `Fix this code that has the following error:\n\nError: ${error}\n\nCode:\n${code}`;

    return this.chat(fixPrompt);
  }
}
