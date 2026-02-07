/**
 * Characters API Routes
 *
 * RESTful endpoints for character management.
 * 8 endpoints covering CRUD + search + relations.
 */

import type { FastifyPluginAsync } from 'fastify';
import type { CharacterRole, CreateCharacterRequest, UpdateCharacterRequest } from '@inxtone/core';
import type { RouteDeps } from './index.js';
import { success, error } from '../utils/response.js';

/**
 * Character routes factory.
 *
 * @param deps - Route dependencies including StoryBibleService
 * @returns Fastify plugin with character routes
 */
export const characterRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { storyBibleService } = deps;

    /**
     * GET / - List all characters
     * Query params: role (optional filter by role)
     */
    fastify.get<{
      Querystring: { role?: CharacterRole };
    }>('/', async (request) => {
      const { role } = request.query;

      if (role) {
        const characters = await storyBibleService.getCharactersByRole(role);
        return success(characters);
      }

      const characters = await storyBibleService.getAllCharacters();
      return success(characters);
    });

    /**
     * GET /search/:query - Search characters
     */
    fastify.get<{
      Params: { query: string };
    }>('/search/:query', async (request) => {
      const characters = await storyBibleService.searchCharacters(request.params.query);
      return success(characters);
    });

    /**
     * GET /:id - Get character by ID
     * Returns 404 if not found.
     */
    fastify.get<{
      Params: { id: string };
    }>('/:id', async (request, reply) => {
      const character = await storyBibleService.getCharacter(request.params.id);

      if (!character) {
        return reply
          .status(404)
          .send(error('NOT_FOUND', `Character ${request.params.id} not found`));
      }

      return success(character);
    });

    /**
     * GET /:id/relations - Get character with enriched relationship data
     * Returns 404 if not found.
     */
    fastify.get<{
      Params: { id: string };
    }>('/:id/relations', async (request, reply) => {
      const characterWithRelations = await storyBibleService.getCharacterWithRelations(
        request.params.id
      );

      if (!characterWithRelations) {
        return reply
          .status(404)
          .send(error('NOT_FOUND', `Character ${request.params.id} not found`));
      }

      return success(characterWithRelations);
    });

    /**
     * POST / - Create a new character
     * Service validates input and throws ValidationError on failure.
     */
    fastify.post<{
      Body: CreateCharacterRequest;
    }>('/', async (request, reply) => {
      const character = await storyBibleService.createCharacter(request.body);
      return reply.status(201).send(success(character));
    });

    /**
     * PATCH /:id - Update an existing character
     * Service validates and throws EntityNotFoundError if not found.
     */
    fastify.patch<{
      Params: { id: string };
      Body: UpdateCharacterRequest;
    }>('/:id', async (request) => {
      const character = await storyBibleService.updateCharacter(request.params.id, request.body);
      return success(character);
    });

    /**
     * DELETE /:id - Delete a character
     * Cascades to delete related relationships.
     * Service throws EntityNotFoundError if not found.
     */
    fastify.delete<{
      Params: { id: string };
    }>('/:id', async (request) => {
      await storyBibleService.deleteCharacter(request.params.id);
      return success({ deleted: true });
    });
  };
};
