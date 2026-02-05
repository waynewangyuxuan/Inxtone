/**
 * @inxtone/server
 *
 * HTTP server using Fastify
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { VERSION } from '@inxtone/core';

const DEFAULT_PORT = 3456;

export async function createServer(_port: number = DEFAULT_PORT) {
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

  return server;
}

// Start server if run directly
async function main() {
  const port = parseInt(process.env.PORT ?? String(DEFAULT_PORT), 10);
  const server = await createServer(port);

  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

void main();
