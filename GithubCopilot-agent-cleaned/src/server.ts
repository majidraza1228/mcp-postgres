#!/usr/bin/env node

import { AgentWithLLM } from './agent-with-llm.js';

/**
 * Main entry point for GitHub Copilot Agent with LLM
 * Connects web chatbots to LLM and HTTP-based PostgreSQL MCP Server
 */
async function main() {
  const port = parseInt(process.env.PORT || '8080');
  const mcpServerUrl = process.env.MCP_SERVER_URL || 'http://localhost:3000';

  try {
    console.log('Starting GitHub Copilot Agent with LLM...\n');

    const server = new AgentWithLLM(port, mcpServerUrl);

    // Start HTTP/WebSocket server
    server.start();

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\nShutting down gracefully...');
      server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\nShutting down gracefully...');
      server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
