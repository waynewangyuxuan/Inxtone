/**
 * Locations API Routes
 *
 * RESTful endpoints for location/setting management.
 * Standard CRUD: 5 endpoints.
 */

import type { FastifyPluginAsync } from 'fastify';
import type { CreateLocationRequest, UpdateLocationRequest } from '@inxtone/core';
import type { RouteDeps } from './index.js';
import { success, error } from '../utils/response.js';

/**
 * Location routes factory.
 */
export const locationRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { storyBibleService } = deps;

    /**
     * GET / - List all locations
     */
    fastify.get('/', async () => {
      const locations = await storyBibleService.getAllLocations();
      return success(locations);
    });

    /**
     * GET /:id - Get location by ID
     */
    fastify.get<{
      Params: { id: string };
    }>('/:id', async (request, reply) => {
      const location = await storyBibleService.getLocation(request.params.id);

      if (!location) {
        return reply
          .status(404)
          .send(error('NOT_FOUND', `Location ${request.params.id} not found`));
      }

      return success(location);
    });

    /**
     * POST / - Create a new location
     */
    fastify.post<{
      Body: CreateLocationRequest;
    }>('/', async (request, reply) => {
      const location = await storyBibleService.createLocation(request.body);
      return reply.status(201).send(success(location));
    });

    /**
     * PATCH /:id - Update a location
     */
    fastify.patch<{
      Params: { id: string };
      Body: UpdateLocationRequest;
    }>('/:id', async (request) => {
      const location = await storyBibleService.updateLocation(request.params.id, request.body);
      return success(location);
    });

    /**
     * DELETE /:id - Delete a location
     */
    fastify.delete<{
      Params: { id: string };
    }>('/:id', async (request) => {
      await storyBibleService.deleteLocation(request.params.id);
      return success({ deleted: true });
    });
  };
};
