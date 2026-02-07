/**
 * Integration Tests for Arcs API Routes
 *
 * Tests the /api/arcs endpoints end-to-end with an in-memory database.
 * Covers CRUD operations and validation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, type TestContext } from './testHelper.js';

describe('Arcs API Routes', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestServer();
  });

  afterEach(async () => {
    ctx.db.close();
    await ctx.server.close();
  });

  // ============================================
  // GET /api/arcs
  // ============================================

  describe('GET /api/arcs', () => {
    it('should return 200 with empty array when no arcs exist', async () => {
      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/arcs',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });

  // ============================================
  // POST /api/arcs
  // ============================================

  describe('POST /api/arcs', () => {
    it('should create a main arc and return 201 with id ARC001', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/arcs',
        payload: { name: '主线', type: 'main' },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        id: 'ARC001',
        name: '主线',
        type: 'main',
      });
      expect(body.data.status).toBeDefined();
      expect(body.data.createdAt).toBeDefined();
    });

    it('should create a sub arc and return 201', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/arcs',
        payload: { name: '支线：寻宝', type: 'sub' },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        name: '支线：寻宝',
        type: 'sub',
      });
      expect(body.data.id).toBeDefined();
    });

    it('should return 400 validation error when name is empty', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/arcs',
        payload: { name: '', type: 'main' },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
      expect(body.error.code).toMatch(/VALIDATION/i);
    });
  });

  // ============================================
  // GET /api/arcs/:id
  // ============================================

  describe('GET /api/arcs/:id', () => {
    it('should return 200 with arc data for existing arc', async () => {
      // Create an arc first
      await ctx.server.inject({
        method: 'POST',
        url: '/api/arcs',
        payload: { name: '主线', type: 'main' },
      });

      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/arcs/ARC001',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('ARC001');
      expect(body.data.name).toBe('主线');
    });

    it('should return 404 for non-existent arc', async () => {
      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/arcs/ARC999',
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  // ============================================
  // PATCH /api/arcs/:id
  // ============================================

  describe('PATCH /api/arcs/:id', () => {
    it('should update arc progress and return 200', async () => {
      // Create an arc first
      await ctx.server.inject({
        method: 'POST',
        url: '/api/arcs',
        payload: { name: '主线', type: 'main' },
      });

      const res = await ctx.server.inject({
        method: 'PATCH',
        url: '/api/arcs/ARC001',
        payload: { progress: 50 },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.progress).toBe(50);
      expect(body.data.id).toBe('ARC001');
    });
  });

  // ============================================
  // DELETE /api/arcs/:id
  // ============================================

  describe('DELETE /api/arcs/:id', () => {
    it('should delete arc and return 200 with deleted: true', async () => {
      // Create an arc first
      await ctx.server.inject({
        method: 'POST',
        url: '/api/arcs',
        payload: { name: '主线', type: 'main' },
      });

      const res = await ctx.server.inject({
        method: 'DELETE',
        url: '/api/arcs/ARC001',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ deleted: true });

      // Verify arc is gone
      const getRes = await ctx.server.inject({
        method: 'GET',
        url: '/api/arcs/ARC001',
      });
      expect(getRes.statusCode).toBe(404);
    });
  });
});
