/**
 * Seed Routes
 *
 * Endpoints for loading demo data and checking/clearing database state.
 */

import type { FastifyPluginAsync, FastifyReply } from 'fastify';
import { z } from 'zod';
import type { Database, SeedLang } from '@inxtone/core/db';
import { runSeed, clearAllData, isDatabaseEmpty } from '@inxtone/core/db';
import { success } from '../utils/response.js';

export interface SeedDeps {
  db: Database;
}

const loadSchema = z.object({
  lang: z.enum(['en', 'zh']),
});

function validateBody<T>(body: unknown, schema: z.ZodType<T>, reply: FastifyReply): T | null {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    void reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid request body: ${errors.join('; ')}`,
      },
    });
    return null;
  }
  return result.data;
}

/**
 * Seed routes factory.
 */
export const seedRoutes = (deps: SeedDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    /**
     * GET /status - Check if database has content
     */
    fastify.get('/status', () => {
      const isEmpty = isDatabaseEmpty(deps.db);
      return success({ isEmpty });
    });

    /**
     * POST /load - Load demo data for a given language
     */

    fastify.post('/load', async (request, reply) => {
      const body = validateBody(request.body, loadSchema, reply);
      if (!body) return reply;
      runSeed(deps.db, body.lang as SeedLang);
      return success({ loaded: true, lang: body.lang });
    });

    /**
     * POST /clear - Clear all content data
     */
    // eslint-disable-next-line @typescript-eslint/require-await
    fastify.post('/clear', async () => {
      clearAllData(deps.db);
      return success({ cleared: true });
    });
  };
};
