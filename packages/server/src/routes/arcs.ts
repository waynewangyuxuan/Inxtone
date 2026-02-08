/**
 * Arcs API Routes
 *
 * RESTful endpoints for story arc management.
 * Standard CRUD: 5 endpoints.
 */

import type { FastifyPluginAsync } from 'fastify';
import type { CreateArcInput } from '@inxtone/core';
import type { RouteDeps } from './index.js';
import { success, error } from '../utils/response.js';

/**
 * Arc routes factory.
 */
export const arcRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { storyBibleService } = deps;

    /**
     * GET / - List all arcs
     */
    fastify.get('/', async () => {
      const arcs = await storyBibleService.getAllArcs();
      return success(arcs);
    });

    /**
     * GET /:id - Get arc by ID
     */
    fastify.get<{
      Params: { id: string };
    }>('/:id', async (request, reply) => {
      const arc = await storyBibleService.getArc(request.params.id);

      if (!arc) {
        return reply.status(404).send(error('NOT_FOUND', `Arc ${request.params.id} not found`));
      }

      return success(arc);
    });

    /**
     * POST / - Create a new arc
     */
    fastify.post<{
      Body: CreateArcInput;
    }>('/', async (request, reply) => {
      const arc = await storyBibleService.createArc(request.body);
      return reply.status(201).send(success(arc));
    });

    /**
     * PATCH /:id - Update an arc
     * Can update progress, status, sections, etc.
     */
    fastify.patch<{
      Params: { id: string };
      Body: Partial<CreateArcInput> & { progress?: number };
    }>('/:id', async (request) => {
      const arc = await storyBibleService.updateArc(request.params.id, request.body);
      return success(arc);
    });

    /**
     * DELETE /:id - Delete an arc
     */
    fastify.delete<{
      Params: { id: string };
    }>('/:id', async (request) => {
      await storyBibleService.deleteArc(request.params.id);
      return success({ deleted: true });
    });
  };
};
