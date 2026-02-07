/**
 * @inxtone/server
 *
 * HTTP server using Fastify for Inxtone Web GUI
 */

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { VERSION } from '@inxtone/core';
import * as path from 'node:path';
import * as fs from 'node:fs';

export const DEFAULT_PORT = 3456;

export interface ServerOptions {
  port?: number;
  logger?: boolean;
  staticDir?: string; // Path to web build directory
}

/**
 * Create and configure the Fastify server
 *
 * @param options - Server configuration options
 * @returns Configured Fastify instance (not yet listening)
 */
export async function createServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const server = Fastify({
    logger: options.logger ?? true,
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

  // Serve static files from web build (if available)
  const staticDir = options.staticDir ?? findWebBuildDir();
  if (staticDir && fs.existsSync(staticDir)) {
    await server.register(fastifyStatic, {
      root: staticDir,
      prefix: '/',
      // Serve index.html for SPA routes
      wildcard: false,
    });

    // SPA fallback - serve index.html for non-API routes
    server.setNotFoundHandler((request, reply) => {
      if (!request.url.startsWith('/api')) {
        return reply.sendFile('index.html');
      }
      return reply.status(404).send({ error: 'Not found' });
    });
  }

  return server;
}

/**
 * Attempt to find the web build directory
 */
function findWebBuildDir(): string | undefined {
  // Try common locations relative to server package
  const candidates = [
    path.join(process.cwd(), 'packages', 'web', 'dist'),
    path.join(process.cwd(), '..', 'web', 'dist'),
    path.join(import.meta.dirname, '..', '..', 'web', 'dist'),
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  return undefined;
}

/**
 * Start the server (for standalone execution)
 */
export async function startServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const port = options.port ?? DEFAULT_PORT;
  const server = await createServer(options);

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
