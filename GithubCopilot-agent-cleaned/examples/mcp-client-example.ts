/**
 * Example MCP client that connects to the GitHub Copilot Agent
 * This demonstrates how to use the agent programmatically
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function main() {
  console.log('Starting MCP Client Example\n');

  // Spawn the server process
  const serverProcess = spawn('node', ['../dist/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit'], // stdin, stdout, stderr
  });

  // Create client transport
  const transport = new StdioClientTransport({
    reader: serverProcess.stdout,
    writer: serverProcess.stdin,
  });

  // Create MCP client
  const client = new Client(
    {
      name: 'example-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    // Connect to the server
    await client.connect(transport);
    console.log('✓ Connected to GitHub Copilot Agent\n');

    // List available tools
    console.log('=== Available Tools ===');
    const toolsResponse = await client.listTools();
    toolsResponse.tools.forEach((tool) => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Example 1: Generate Code
    console.log('=== Example 1: Generate Code ===');
    const codeResult = await client.callTool({
      name: 'generate_code',
      arguments: {
        prompt: 'Create a function to validate email addresses',
        language: 'typescript',
      },
    });
    console.log(codeResult.content[0].text);
    console.log();

    // Example 2: Explain Code
    console.log('=== Example 2: Explain Code ===');
    const explainResult = await client.callTool({
      name: 'explain_code',
      arguments: {
        code: 'const double = (x) => x * 2;',
        language: 'javascript',
      },
    });
    console.log(explainResult.content[0].text);
    console.log();

    // Example 3: Ask a Question
    console.log('=== Example 3: Ask Claude ===');
    const questionResult = await client.callTool({
      name: 'ask_claude',
      arguments: {
        question: 'What are the benefits of TypeScript over JavaScript?',
      },
    });
    console.log(questionResult.content[0].text);
    console.log();

    // Example 4: Review Code
    console.log('=== Example 4: Review Code ===');
    const reviewResult = await client.callTool({
      name: 'review_code',
      arguments: {
        code: `function add(a, b) {
  return a + b;
}`,
        language: 'javascript',
      },
    });
    console.log(reviewResult.content[0].text);
    console.log();

    // Example 5: Fix Code
    console.log('=== Example 5: Fix Code ===');
    const fixResult = await client.callTool({
      name: 'fix_code',
      arguments: {
        code: 'const arr = [1, 2, 3];\nconsole.log(arr[10].toString());',
        error: "TypeError: Cannot read property 'toString' of undefined",
        language: 'javascript',
      },
    });
    console.log(fixResult.content[0].text);
    console.log();

    console.log('✓ All examples completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Cleanup
    await client.close();
    serverProcess.kill();
    console.log('\n✓ Connection closed');
  }
}

main().catch(console.error);
