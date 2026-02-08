/**
 * Hooks API Routes
 *
 * RESTful endpoints for story hook management.
 * 6 endpoints: CRUD + list all + filter by chapter.
 */

import type { FastifyPluginAsync } from 'fastify';
import type { CreateHookInput } from '@inxtone/core';
import type { RouteDeps } from './index.js';
import { success, error } from '../utils/response.js';

/**
 * Hook routes factory.
 */
export const hookRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { storyBibleService } = deps;

    /**
     * GET / - List hooks
     * Query params: chapterId (optional filter)
     */
    fastify.get<{
      Querystring: { chapterId?: string };
    }>('/', async (request) => {
      const { chapterId } = request.query;

      if (chapterId) {
        const hooks = await storyBibleService.getHooksForChapter(parseInt(chapterId, 10));
        return success(hooks);
      }

      const hooks = await storyBibleService.getAllHooks();
      return success(hooks);
    });

    /**
     * GET /:id - Get hook by ID
     */
    fastify.get<{
      Params: { id: string };
    }>('/:id', async (request, reply) => {
      const hook = await storyBibleService.getHook(request.params.id);

      if (!hook) {
        return reply.status(404).send(error('NOT_FOUND', `Hook ${request.params.id} not found`));
      }

      return success(hook);
    });

    /**
     * POST / - Create a new hook
     */
    fastify.post<{
      Body: CreateHookInput;
    }>('/', async (request, reply) => {
      const hook = await storyBibleService.createHook(request.body);
      return reply.status(201).send(success(hook));
    });

    /**
     * PATCH /:id - Update a hook
     */
    fastify.patch<{
      Params: { id: string };
      Body: Partial<CreateHookInput>;
    }>('/:id', async (request) => {
      const hook = await storyBibleService.updateHook(request.params.id, request.body);
      return success(hook);
    });

    /**
     * DELETE /:id - Delete a hook
     */
    fastify.delete<{
      Params: { id: string };
    }>('/:id', async (request) => {
      await storyBibleService.deleteHook(request.params.id);
      return success({ deleted: true });
    });
  };
};
