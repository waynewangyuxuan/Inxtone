/**
 * Integration Tests: Locations API Routes
 *
 * Tests the /api/locations endpoints through Fastify's inject() method
 * against an in-memory SQLite database.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, type TestContext } from './testHelper.js';

describe('Locations API - /api/locations', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestServer();
  });

  afterEach(async () => {
    ctx.db.close();
    await ctx.server.close();
  });

  // ------------------------------------------
  // GET /api/locations
  // ------------------------------------------

  describe('GET /api/locations', () => {
    it('should return 200 with empty array initially', async () => {
      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/locations',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });

  // ------------------------------------------
  // POST /api/locations
  // ------------------------------------------

  describe('POST /api/locations', () => {
    it('should create a location with minimal fields and return 201', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/locations',
        payload: { name: '龙门客栈' },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('L001');
      expect(body.data.name).toBe('龙门客栈');
      expect(body.data.createdAt).toBeDefined();
      expect(body.data.updatedAt).toBeDefined();
    });

    it('should create a location with all optional fields and return 201', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/locations',
        payload: {
          name: '蜀山',
          type: 'mountain',
          significance: '修仙圣地',
          atmosphere: '仙气缭绕',
        },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('蜀山');
      expect(body.data.type).toBe('mountain');
      expect(body.data.significance).toBe('修仙圣地');
      expect(body.data.atmosphere).toBe('仙气缭绕');
    });

    it('should return 400 validation error when name is empty', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/locations',
        payload: { name: '' },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ------------------------------------------
  // GET /api/locations/:id
  // ------------------------------------------

  describe('GET /api/locations/:id', () => {
    it('should return 200 with the created location', async () => {
      // Create a location first
      await ctx.server.inject({
        method: 'POST',
        url: '/api/locations',
        payload: { name: '龙门客栈' },
      });

      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/locations/L001',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('L001');
      expect(body.data.name).toBe('龙门客栈');
    });

    it('should return 404 for non-existent location', async () => {
      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/locations/L999',
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  // ------------------------------------------
  // PATCH /api/locations/:id
  // ------------------------------------------

  describe('PATCH /api/locations/:id', () => {
    it('should update a location and return 200', async () => {
      // Create a location first
      await ctx.server.inject({
        method: 'POST',
        url: '/api/locations',
        payload: { name: '龙门客栈' },
      });

      const res = await ctx.server.inject({
        method: 'PATCH',
        url: '/api/locations/L001',
        payload: { atmosphere: '阴森' },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('L001');
      expect(body.data.name).toBe('龙门客栈');
      expect(body.data.atmosphere).toBe('阴森');
    });
  });

  // ------------------------------------------
  // DELETE /api/locations/:id
  // ------------------------------------------

  describe('DELETE /api/locations/:id', () => {
    it('should delete a location and return 200 with deleted: true', async () => {
      // Create a location first
      await ctx.server.inject({
        method: 'POST',
        url: '/api/locations',
        payload: { name: '龙门客栈' },
      });

      const res = await ctx.server.inject({
        method: 'DELETE',
        url: '/api/locations/L001',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ deleted: true });
    });

    it('should return 404 when getting a deleted location', async () => {
      // Create then delete
      await ctx.server.inject({
        method: 'POST',
        url: '/api/locations',
        payload: { name: '龙门客栈' },
      });

      await ctx.server.inject({
        method: 'DELETE',
        url: '/api/locations/L001',
      });

      // Try to get the deleted location
      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/locations/L001',
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });
});
