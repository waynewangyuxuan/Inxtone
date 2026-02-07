/**
 * World API Routes
 *
 * RESTful endpoints for world/setting management.
 * Singleton resource - only one world per project.
 * 4 endpoints: get, update, setPowerSystem, setSocialRules.
 */

import type { FastifyPluginAsync } from 'fastify';
import type { World, PowerSystem } from '@inxtone/core';
import type { RouteDeps } from './index.js';
import { success } from '../utils/response.js';

/**
 * World routes factory.
 */
export const worldRoutes = (deps: RouteDeps): FastifyPluginAsync => {
  // eslint-disable-next-line @typescript-eslint/require-await
  return async (fastify) => {
    const { storyBibleService } = deps;

    /**
     * GET / - Get world settings
     * Returns null if no world has been created yet.
     */
    fastify.get('/', async () => {
      const world = await storyBibleService.getWorld();
      return success(world);
    });

    /**
     * PATCH / - Update world settings
     */
    fastify.patch<{
      Body: Partial<World>;
    }>('/', async (request) => {
      const world = await storyBibleService.updateWorld(request.body);
      return success(world);
    });

    /**
     * PUT /power-system - Set the power/magic system
     */
    fastify.put<{
      Body: PowerSystem;
    }>('/power-system', async (request) => {
      await storyBibleService.setPowerSystem(request.body);
      const world = await storyBibleService.getWorld();
      return success(world);
    });

    /**
     * PUT /social-rules - Set social/cultural rules
     */
    fastify.put<{
      Body: Record<string, string>;
    }>('/social-rules', async (request) => {
      await storyBibleService.setSocialRules(request.body);
      const world = await storyBibleService.getWorld();
      return success(world);
    });
  };
};
