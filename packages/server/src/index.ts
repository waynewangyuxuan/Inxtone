/**
 * @inxtone/server
 *
 * HTTP server using Fastify for Inxtone Web GUI
 */

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { VERSION } from '@inxtone/core';

export const DEFAULT_PORT = 3456;

export interface ServerOptions {
  port?: number;
  logger?: boolean;
}

/**
 * Create and configure the Fastify server
 *
 * @param port - Port number (default: 3456)
 * @returns Configured Fastify instance (not yet listening)
 */
export async function createServer(_port: number = DEFAULT_PORT): Promise<FastifyInstance> {
  const server = Fastify({
    logger: true,
  });

  // Register CORS for development
  await server.register(cors, {
    origin: true,
  });

  // Health check endpoint
  server.get('/api/health', () => {
    return {
      status: 'ok',
      version: VERSION,
      timestamp: new Date().toISOString(),
    };
  });

  // API info endpoint
  server.get('/api', () => {
    return {
      name: 'Inxtone API',
      version: VERSION,
      endpoints: {
        health: '/api/health',
        // Future endpoints will be added here
        // storyBible: '/api/story-bible',
        // writing: '/api/writing',
        // ai: '/api/ai',
        // quality: '/api/quality',
        // export: '/api/export',
      },
    };
  });

  return server;
}

/**
 * Start the server (for standalone execution)
 */
export async function startServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const port = options.port ?? DEFAULT_PORT;
  const server = await createServer(port);

  await server.listen({ port, host: '0.0.0.0' });

  return server;
}

// Re-export types for consumers
export type { FastifyInstance };

// CLI entry point - only runs when executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const port = parseInt(process.env.PORT ?? String(DEFAULT_PORT), 10);

  startServer({ port })
    .then(() => {
      console.log(`Server running at http://localhost:${port}`);

      // Handle shutdown
      const shutdown = () => {
        console.log('\nShutting down...');
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
