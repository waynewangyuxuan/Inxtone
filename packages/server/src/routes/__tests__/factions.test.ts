/**
 * Integration Tests: Factions API Routes
 *
 * Tests the /api/factions endpoints through Fastify's inject() method
 * against an in-memory SQLite database.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, type TestContext } from './testHelper.js';

describe('Factions API - /api/factions', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestServer();
  });

  afterEach(async () => {
    ctx.db.close();
    await ctx.server.close();
  });

  // ------------------------------------------
  // GET /api/factions
  // ------------------------------------------

  describe('GET /api/factions', () => {
    it('should return 200 with empty array initially', async () => {
      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/factions',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });

  // ------------------------------------------
  // POST /api/factions
  // ------------------------------------------

  describe('POST /api/factions', () => {
    it('should create a faction with minimal fields and return 201', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/factions',
        payload: { name: '天机阁' },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('F001');
      expect(body.data.name).toBe('天机阁');
      expect(body.data.createdAt).toBeDefined();
      expect(body.data.updatedAt).toBeDefined();
    });

    it('should create a faction with full body and return 201', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/factions',
        payload: {
          name: '血盟',
          type: 'guild',
          stanceToMC: 'hostile',
          goals: ['称霸'],
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('血盟');
      expect(body.data.type).toBe('guild');
      expect(body.data.stanceToMC).toBe('hostile');
      expect(body.data.goals).toEqual(['称霸']);
    });

    it('should return 400 validation error when name is empty', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/factions',
        payload: { name: '' },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ------------------------------------------
  // GET /api/factions/:id
  // ------------------------------------------

  describe('GET /api/factions/:id', () => {
    it('should return 200 with the created faction', async () => {
      // Create a faction first
      await ctx.server.inject({
        method: 'POST',
        url: '/api/factions',
        payload: { name: '天机阁' },
      });

      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/factions/F001',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('F001');
      expect(body.data.name).toBe('天机阁');
    });

    it('should return 404 for non-existent faction', async () => {
      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/factions/F999',
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  // ------------------------------------------
  // PATCH /api/factions/:id
  // ------------------------------------------

  describe('PATCH /api/factions/:id', () => {
    it('should update a faction and return 200', async () => {
      // Create a faction first
      await ctx.server.inject({
        method: 'POST',
        url: '/api/factions',
        payload: { name: '天机阁' },
      });

      const res = await ctx.server.inject({
        method: 'PATCH',
        url: '/api/factions/F001',
        payload: { stanceToMC: 'friendly' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('F001');
      expect(body.data.name).toBe('天机阁');
      expect(body.data.stanceToMC).toBe('friendly');
    });
  });

  // ------------------------------------------
  // DELETE /api/factions/:id
  // ------------------------------------------

  describe('DELETE /api/factions/:id', () => {
    it('should delete a faction and return 200 with deleted: true', async () => {
      // Create a faction first
      await ctx.server.inject({
        method: 'POST',
        url: '/api/factions',
        payload: { name: '天机阁' },
      });

      const res = await ctx.server.inject({
        method: 'DELETE',
        url: '/api/factions/F001',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ deleted: true });
    });
  });
});
