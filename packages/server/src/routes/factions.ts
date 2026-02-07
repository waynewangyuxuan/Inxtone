/**
 * Factions API Routes
 *
 * RESTful endpoints for faction/organization management.
 * Standard CRUD: 5 endpoints.
 */

import type { FastifyPluginAsync } from 'fastify';
import type { CreateFactionInput } from '@inxtone/core';
import type { RouteDeps } from './index.js';
import { success, error } from '../utils/response.js';

/**
 * Faction routes factory.
 */
export const factionRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { storyBibleService } = deps;

    /**
     * GET / - List all factions
     */
    fastify.get('/', async () => {
      const factions = await storyBibleService.getAllFactions();
      return success(factions);
    });

    /**
     * GET /:id - Get faction by ID
     */
    fastify.get<{
      Params: { id: string };
    }>('/:id', async (request, reply) => {
      const faction = await storyBibleService.getFaction(request.params.id);

      if (!faction) {
        return reply.status(404).send(error('NOT_FOUND', `Faction ${request.params.id} not found`));
      }

      return success(faction);
    });

    /**
     * POST / - Create a new faction
     * Validates leader reference if provided.
     */
    fastify.post<{
      Body: CreateFactionInput;
    }>('/', async (request, reply) => {
      const faction = await storyBibleService.createFaction(request.body);
      return reply.status(201).send(success(faction));
    });

    /**
     * PATCH /:id - Update a faction
     */
    fastify.patch<{
      Params: { id: string };
      Body: Partial<CreateFactionInput>;
    }>('/:id', async (request) => {
      const faction = await storyBibleService.updateFaction(request.params.id, request.body);
      return success(faction);
    });

    /**
     * DELETE /:id - Delete a faction
     */
    fastify.delete<{
      Params: { id: string };
    }>('/:id', async (request) => {
      await storyBibleService.deleteFaction(request.params.id);
      return success({ deleted: true });
    });
  };
};
