#!/usr/bin/env node
/**
 * n8n-mcp: MCP (Model Context Protocol) server for n8n workflow automation
 * Main entry point - initializes and starts the MCP server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/index.js';
import { N8nClient } from './n8n/client.js';
import { loadConfig } from './config.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  const config = loadConfig();

  logger.info('Starting n8n-mcp server', {
    version: process.env.npm_package_version ?? 'unknown',
    n8nBaseUrl: config.n8nBaseUrl,
  });

  // Initialize the n8n API client
  const n8nClient = new N8nClient({
    baseUrl: config.n8nBaseUrl,
    apiKey: config.n8nApiKey,
    timeout: config.requestTimeout,
  });

  // Verify connectivity to n8n instance
  try {
    await n8nClient.healthCheck();
    logger.info('Successfully connected to n8n instance');
  } catch (error) {
    logger.warn('Could not connect to n8n instance at startup', { error });
    // Non-fatal: server will still start and retry on requests
  }

  // Create MCP server instance
  const server = new Server(
    {
      name: 'n8n-mcp',
      version: process.env.npm_package_version ?? '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Register all tools (workflow management, execution, etc.)
  const tools = registerTools(n8nClient);
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => t.definition),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find((t) => t.definition.name === request.params.name);
    if (!tool) {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }
    logger.debug('Calling tool', { name: request.params.name });
    return tool.handler(request.params.arguments ?? {});
  });

  // Register all resources (workflow definitions, execution logs, etc.)
  const resources = registerResources(n8nClient);
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: resources.map((r) => r.definition),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const resource = resources.find((r) =>
      request.params.uri.startsWith(r.uriPrefix)
    );
    if (!resource) {
      throw new Error(`Unknown resource URI: ${request.params.uri}`);
    }
    logger.debug('Reading resource', { uri: request.params.uri });
    return resource.handler(request.params.uri);
  });

  // Start the stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('n8n-mcp server running on stdio');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down n8n-mcp server...');
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error('Fatal error during startup', { error });
  process.exit(1);
});
