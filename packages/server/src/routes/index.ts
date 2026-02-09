/**
 * Route Registration
 *
 * Central point for registering all API routes.
 * Uses the route factory pattern for dependency injection.
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { IStoryBibleService, IAIService } from '@inxtone/core';

import { characterRoutes } from './characters.js';
import { relationshipRoutes } from './relationships.js';
import { worldRoutes } from './world.js';
import { locationRoutes } from './locations.js';
import { factionRoutes } from './factions.js';
import { timelineRoutes } from './timeline.js';
import { arcRoutes } from './arcs.js';
import { foreshadowingRoutes } from './foreshadowing.js';
import { hookRoutes } from './hooks.js';
import { aiRoutes } from './ai.js';

/**
 * Dependencies required by route handlers.
 */
export interface RouteDeps {
  storyBibleService: IStoryBibleService;
  aiService?: IAIService;
}

/**
 * Register all Story Bible API routes.
 *
 * @param fastify - Fastify instance
 * @param deps - Route dependencies
 */
export async function registerRoutes(fastify: FastifyInstance, deps: RouteDeps): Promise<void> {
  // Register each domain's routes with appropriate prefix
  await fastify.register(characterRoutes(deps), { prefix: '/api/characters' });
  await fastify.register(relationshipRoutes(deps), { prefix: '/api/relationships' });
  await fastify.register(worldRoutes(deps), { prefix: '/api/world' });
  await fastify.register(locationRoutes(deps), { prefix: '/api/locations' });
  await fastify.register(factionRoutes(deps), { prefix: '/api/factions' });
  await fastify.register(timelineRoutes(deps), { prefix: '/api/timeline' });
  await fastify.register(arcRoutes(deps), { prefix: '/api/arcs' });
  await fastify.register(foreshadowingRoutes(deps), { prefix: '/api/foreshadowing' });
  await fastify.register(hookRoutes(deps), { prefix: '/api/hooks' });

  // AI routes (optional - only registered if aiService is provided)
  if (deps.aiService) {
    await fastify.register(aiRoutes(deps), { prefix: '/api/ai' });
  }
}

/**
 * Type for route factory functions.
 * Each domain exports a function that takes deps and returns a FastifyPluginAsync.
 */
export type RouteFactory = (deps: RouteDeps) => FastifyPluginAsync;
