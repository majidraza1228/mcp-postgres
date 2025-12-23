/**
 * LLM Client - Supports multiple LLM providers
 * Allows the agent to use AI for query generation, explanations, etc.
 */

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'azure' | 'ollama' | 'github';
  apiKey?: string;
  model?: string;
  endpoint?: string;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LLMClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Send a chat completion request
   */
  async chat(messages: LLMMessage[]): Promise<string> {
    switch (this.config.provider) {
      case 'openai':
        return this.chatOpenAI(messages);
      case 'anthropic':
        return this.chatAnthropic(messages);
      case 'ollama':
        return this.chatOllama(messages);
      case 'github':
        return this.chatGitHub(messages);
      default:
        throw new Error(`LLM provider ${this.config.provider} not yet implemented`);
    }
  }

  /**
   * OpenAI Chat Completion
   */
  private async chatOpenAI(messages: LLMMessage[]): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Anthropic Claude Completion
   */
  private async chatAnthropic(messages: LLMMessage[]): Promise<string> {
    // Extract system message
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemMessage,
        messages: chatMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Ollama Local LLM
   */
  private async chatOllama(messages: LLMMessage[]): Promise<string> {
    const endpoint = this.config.endpoint || 'http://localhost:11434';

    const response = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'llama2',
        messages: messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${error}`);
    }

    const data = await response.json();
    return data.message.content;
  }

  /**
   * GitHub Models API (uses OpenAI-compatible endpoint)
   */
  private async chatGitHub(messages: LLMMessage[]): Promise<string> {
    // GitHub Models uses an OpenAI-compatible API
    const endpoint = 'https://models.inference.ai.azure.com/chat/completions';
    const model = this.config.model || 'gpt-4o';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub Models API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Generate SQL from natural language
   */
  async generateSQL(
    userQuery: string,
    schema?: string,
    examples?: string
  ): Promise<string> {
    const systemPrompt = `You are a PostgreSQL expert. Generate SQL queries based on user requests.

${schema ? `Database Schema:\n${schema}\n` : ''}
${examples ? `Example Queries:\n${examples}\n` : ''}

Rules:
1. Return ONLY the SQL query, no explanations
2. Use proper PostgreSQL syntax
3. Include LIMIT clauses for safety
4. Use appropriate JOINs when needed
5. Handle NULL values properly`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuery },
    ];

    const response = await this.chat(messages);

    // Extract SQL from response (remove markdown if present)
    let sql = response.trim();
    if (sql.startsWith('```sql')) {
      sql = sql.replace(/```sql\n/, '').replace(/```$/, '').trim();
    } else if (sql.startsWith('```')) {
      sql = sql.replace(/```\n/, '').replace(/```$/, '').trim();
    }

    return sql;
  }

  /**
   * Explain query results
   */
  async explainResults(
    query: string,
    results: any,
    userQuestion: string
  ): Promise<string> {
    const systemPrompt = `You are a data analyst. Explain database query results in a clear, concise way.`;

    const userPrompt = `User asked: "${userQuestion}"

SQL Query executed:
${query}

Results:
${JSON.stringify(results, null, 2)}

Provide a clear, natural language explanation of what the data shows.`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    return this.chat(messages);
  }

  /**
   * Chat about database
   */
  async chatAboutDatabase(
    userMessage: string,
    context?: string
  ): Promise<string> {
    const systemPrompt = `You are a helpful database assistant. Help users understand and query their PostgreSQL database.

${context ? `Context:\n${context}` : ''}

You can:
1. Help write SQL queries
2. Explain database concepts
3. Suggest optimizations
4. Answer questions about the data`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    return this.chat(messages);
  }
}

/**
 * Create LLM client from environment variables
 */
export function createLLMClient(): LLMClient | null {
  const provider = process.env.LLM_PROVIDER as any;

  if (!provider) {
    console.log('No LLM provider configured. LLM features disabled.');
    return null;
  }

  const config: LLMConfig = {
    provider,
    apiKey: process.env.GITHUB_TOKEN || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
    model: process.env.GITHUB_MODEL || process.env.OPENAI_MODEL || process.env.ANTHROPIC_MODEL || process.env.OLLAMA_MODEL,
    endpoint: process.env.OLLAMA_BASE_URL,
  };

  console.log(`LLM Provider: ${provider}`);
  console.log(`LLM Model: ${config.model || 'default'}`);

  return new LLMClient(config);
}
