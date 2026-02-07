/**
 * Relationships API Routes
 *
 * RESTful endpoints for character relationship management.
 * 6 endpoints covering CRUD + list all + filter by character.
 */

import type { FastifyPluginAsync } from 'fastify';
import type { CreateRelationshipRequest, UpdateRelationshipRequest } from '@inxtone/core';
import type { RouteDeps } from './index.js';
import { success, error } from '../utils/response.js';

/**
 * Relationship routes factory.
 */
export const relationshipRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { storyBibleService } = deps;

    /**
     * GET / - List relationships
     * Query params: characterId (optional filter)
     */
    fastify.get<{
      Querystring: { characterId?: string };
    }>('/', async (request) => {
      const { characterId } = request.query;

      if (characterId) {
        const relationships = await storyBibleService.getRelationshipsForCharacter(characterId);
        return success(relationships);
      }

      const relationships = await storyBibleService.getAllRelationships();
      return success(relationships);
    });

    /**
     * GET /:id - Get relationship by ID
     */
    fastify.get<{
      Params: { id: string };
    }>('/:id', async (request, reply) => {
      const id = parseInt(request.params.id, 10);
      const relationship = await storyBibleService.getRelationship(id);

      if (!relationship) {
        return reply.status(404).send(error('NOT_FOUND', `Relationship ${id} not found`));
      }

      return success(relationship);
    });

    /**
     * POST / - Create a new relationship
     * Validates that source and target characters exist.
     * Throws SelfReferenceError if sourceId === targetId.
     */
    fastify.post<{
      Body: CreateRelationshipRequest;
    }>('/', async (request, reply) => {
      const relationship = await storyBibleService.createRelationship(request.body);
      return reply.status(201).send(success(relationship));
    });

    /**
     * PATCH /:id - Update a relationship
     */
    fastify.patch<{
      Params: { id: string };
      Body: UpdateRelationshipRequest;
    }>('/:id', async (request) => {
      const id = parseInt(request.params.id, 10);
      const relationship = await storyBibleService.updateRelationship(id, request.body);
      return success(relationship);
    });

    /**
     * DELETE /:id - Delete a relationship
     */
    fastify.delete<{
      Params: { id: string };
    }>('/:id', async (request) => {
      const id = parseInt(request.params.id, 10);
      await storyBibleService.deleteRelationship(id);
      return success({ deleted: true });
    });
  };
};
