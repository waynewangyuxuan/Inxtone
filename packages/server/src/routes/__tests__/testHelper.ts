/**
 * Test Helper for Route Integration Tests
 *
 * Creates a fully wired Fastify server with in-memory SQLite database.
 * Used by all route test files for consistent setup.
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { Database } from '@inxtone/core/db';
import {
  CharacterRepository,
  RelationshipRepository,
  WorldRepository,
  LocationRepository,
  FactionRepository,
  TimelineEventRepository,
  ArcRepository,
  ForeshadowingRepository,
  HookRepository,
} from '@inxtone/core/db';
import { EventBus, StoryBibleService } from '@inxtone/core/services';
import { errorHandler } from '../../middleware/errorHandler.js';
import { registerRoutes } from '../index.js';

export interface TestContext {
  server: FastifyInstance;
  service: StoryBibleService;
  db: Database;
}

/**
 * Create a test server with all routes registered against an in-memory database.
 */
export async function createTestServer(): Promise<TestContext> {
  const db = new Database({ path: ':memory:', migrate: true });
  db.connect();

  const eventBus = new EventBus();
  const service = new StoryBibleService({
    db,
    characterRepo: new CharacterRepository(db),
    relationshipRepo: new RelationshipRepository(db),
    worldRepo: new WorldRepository(db),
    locationRepo: new LocationRepository(db),
    factionRepo: new FactionRepository(db),
    timelineEventRepo: new TimelineEventRepository(db),
    arcRepo: new ArcRepository(db),
    foreshadowingRepo: new ForeshadowingRepository(db),
    hookRepo: new HookRepository(db),
    eventBus,
  });

  const server = Fastify({ logger: false });
  server.setErrorHandler(errorHandler);
  await registerRoutes(server, { storyBibleService: service });
  await server.ready();

  return { server, service, db };
}
