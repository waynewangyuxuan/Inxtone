/**
 * Integration Tests for Hooks API Routes
 *
 * Tests the /api/hooks endpoints end-to-end with an in-memory database.
 * Covers CRUD operations, chapter filtering, and validation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, type TestContext } from './testHelper.js';

describe('Hooks API Routes', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestServer();
  });

  afterEach(async () => {
    ctx.db.close();
    await ctx.server.close();
  });

  // ============================================
  // GET /api/hooks
  // ============================================

  describe('GET /api/hooks', () => {
    it('should return 200 with empty array when no chapterId filter is provided', async () => {
      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/hooks',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });

  // ============================================
  // POST /api/hooks
  // ============================================

  describe('POST /api/hooks', () => {
    it('should create a chapter hook and return 201', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/hooks',
        payload: { type: 'chapter', content: '悬念钩子' },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        type: 'chapter',
        content: '悬念钩子',
      });
      expect(body.data.id).toBeDefined();
      expect(body.data.createdAt).toBeDefined();
    });

    it('should create an opening hook with chapterId and return 201', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/hooks',
        payload: { type: 'opening', content: '开头钩子', chapterId: 1 },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        type: 'opening',
        content: '开头钩子',
        chapterId: 1,
      });
    });

    it('should return 400 validation error when content is empty', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/hooks',
        payload: { type: 'chapter', content: '' },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
      expect(body.error.code).toMatch(/VALIDATION/i);
    });
  });

  // ============================================
  // GET /api/hooks?chapterId=
  // ============================================

  describe('GET /api/hooks?chapterId=', () => {
    it('should return hooks filtered by chapterId', async () => {
      // Create hooks with chapterId
      await ctx.server.inject({
        method: 'POST',
        url: '/api/hooks',
        payload: { type: 'opening', content: '开头钩子', chapterId: 1 },
      });
      await ctx.server.inject({
        method: 'POST',
        url: '/api/hooks',
        payload: { type: 'chapter', content: '章末悬念', chapterId: 1 },
      });
      // Hook for different chapter
      await ctx.server.inject({
        method: 'POST',
        url: '/api/hooks',
        payload: { type: 'chapter', content: '其他章节钩子', chapterId: 2 },
      });

      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/hooks?chapterId=1',
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      // Should only contain hooks for chapter 1
      for (const hook of body.data) {
        expect(hook.chapterId).toBe(1);
      }
    });
  });

  // ============================================
  // GET /api/hooks/:id
  // ============================================

  describe('GET /api/hooks/:id', () => {
    it('should return 200 with hook data for existing hook (HK prefix)', async () => {
      // Create a hook first
      const createRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/hooks',
        payload: { type: 'chapter', content: '悬念钩子' },
      });
      const hookId = createRes.json().data.id;

      const res = await ctx.server.inject({
        method: 'GET',
        url: `/api/hooks/${hookId}`,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(hookId);
      // Hook IDs use HK prefix
      expect(String(hookId).startsWith('HK')).toBe(true);
    });

    it('should return 404 for non-existent hook', async () => {
      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/hooks/HK999',
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  // ============================================
  // PATCH /api/hooks/:id
  // ============================================

  describe('PATCH /api/hooks/:id', () => {
    it('should update hook strength and return 200', async () => {
      // Create a hook first
      const createRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/hooks',
        payload: { type: 'chapter', content: '悬念钩子' },
      });
      const hookId = createRes.json().data.id;

      const res = await ctx.server.inject({
        method: 'PATCH',
        url: `/api/hooks/${hookId}`,
        payload: { strength: 8 },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.strength).toBe(8);
      expect(body.data.id).toBe(hookId);
    });
  });

  // ============================================
  // DELETE /api/hooks/:id
  // ============================================

  describe('DELETE /api/hooks/:id', () => {
    it('should delete hook and return 200 with deleted: true', async () => {
      // Create a hook first
      const createRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/hooks',
        payload: { type: 'chapter', content: '悬念钩子' },
      });
      const hookId = createRes.json().data.id;

      const res = await ctx.server.inject({
        method: 'DELETE',
        url: `/api/hooks/${hookId}`,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ deleted: true });

      // Verify hook is gone
      const getRes = await ctx.server.inject({
        method: 'GET',
        url: `/api/hooks/${hookId}`,
      });
      expect(getRes.statusCode).toBe(404);
    });
  });
});
