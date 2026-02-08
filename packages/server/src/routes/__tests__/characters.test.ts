/**
 * Characters API Route Integration Tests
 *
 * Tests the full HTTP request/response cycle for character CRUD endpoints
 * using an in-memory SQLite database and Fastify's inject API.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, type TestContext } from './testHelper.js';

describe('Characters API - /api/characters', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestServer();
  });

  afterEach(async () => {
    ctx.db.close();
    await ctx.server.close();
  });

  // ============================================
  // GET /api/characters
  // ============================================

  describe('GET /api/characters', () => {
    it('should return 200 with empty array initially', async () => {
      const response = await ctx.server.inject({
        method: 'GET',
        url: '/api/characters',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toEqual({ success: true, data: [] });
    });

    it('should return all characters after creation', async () => {
      await ctx.service.createCharacter({ name: '张三', role: 'main' });
      await ctx.service.createCharacter({ name: '李四', role: 'supporting' });

      const response = await ctx.server.inject({
        method: 'GET',
        url: '/api/characters',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
    });
  });

  // ============================================
  // GET /api/characters?role=main
  // ============================================

  describe('GET /api/characters?role=main', () => {
    it('should return 200 with filtered list by role', async () => {
      await ctx.service.createCharacter({ name: '张三', role: 'main' });
      await ctx.service.createCharacter({ name: '李四', role: 'supporting' });
      await ctx.service.createCharacter({ name: '王五', role: 'main' });

      const response = await ctx.server.inject({
        method: 'GET',
        url: '/api/characters?role=main',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(2);
      expect(body.data.every((c: { role: string }) => c.role === 'main')).toBe(true);
    });
  });

  // ============================================
  // POST /api/characters
  // ============================================

  describe('POST /api/characters', () => {
    it('should create a character and return 201 with id C001', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/characters',
        payload: { name: '张三', role: 'main' },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('C001');
      expect(body.data.name).toBe('张三');
      expect(body.data.role).toBe('main');
      expect(body.data.createdAt).toBeDefined();
      expect(body.data.updatedAt).toBeDefined();
    });

    it('should return 400 validation error when name is empty', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/characters',
        payload: { name: '', role: 'main' },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 validation error when role is invalid', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/characters',
        payload: { name: '张三', role: 'invalid_role' },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ============================================
  // GET /api/characters/:id
  // ============================================

  describe('GET /api/characters/:id', () => {
    it('should return 200 with the character when found', async () => {
      await ctx.service.createCharacter({ name: '张三', role: 'main' });

      const response = await ctx.server.inject({
        method: 'GET',
        url: '/api/characters/C001',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('C001');
      expect(body.data.name).toBe('张三');
      expect(body.data.role).toBe('main');
    });

    it('should return 404 when character does not exist', async () => {
      const response = await ctx.server.inject({
        method: 'GET',
        url: '/api/characters/C999',
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  // ============================================
  // GET /api/characters/search/:query
  // ============================================

  describe('GET /api/characters/search/:query', () => {
    it('should return 200 with search results matching the query', async () => {
      await ctx.service.createCharacter({ name: '张三', role: 'main' });
      await ctx.service.createCharacter({ name: '张飞', role: 'supporting' });
      await ctx.service.createCharacter({ name: '李四', role: 'supporting' });

      const response = await ctx.server.inject({
        method: 'GET',
        url: '/api/characters/search/张',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data.every((c: { name: string }) => c.name.includes('张'))).toBe(true);
    });
  });

  // ============================================
  // PATCH /api/characters/:id
  // ============================================

  describe('PATCH /api/characters/:id', () => {
    it('should return 200 with the updated character', async () => {
      await ctx.service.createCharacter({ name: '张三', role: 'main' });

      const response = await ctx.server.inject({
        method: 'PATCH',
        url: '/api/characters/C001',
        payload: { appearance: '高大' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('C001');
      expect(body.data.appearance).toBe('高大');
      expect(body.data.name).toBe('张三');
    });
  });

  // ============================================
  // DELETE /api/characters/:id
  // ============================================

  describe('DELETE /api/characters/:id', () => {
    it('should return 200 with deleted confirmation', async () => {
      await ctx.service.createCharacter({ name: '张三', role: 'main' });

      const response = await ctx.server.inject({
        method: 'DELETE',
        url: '/api/characters/C001',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toEqual({ success: true, data: { deleted: true } });

      // Verify the character is actually gone
      const getResponse = await ctx.server.inject({
        method: 'GET',
        url: '/api/characters/C001',
      });
      expect(getResponse.statusCode).toBe(404);
    });
  });

  // ============================================
  // GET /api/characters/:id/relations
  // ============================================

  describe('GET /api/characters/:id/relations', () => {
    it('should return 200 with empty relations initially', async () => {
      await ctx.service.createCharacter({ name: '张三', role: 'main' });

      const response = await ctx.server.inject({
        method: 'GET',
        url: '/api/characters/C001/relations',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('C001');
      expect(body.data.name).toBe('张三');
      expect(body.data.relationships).toEqual([]);
    });

    it('should return 404 when character does not exist', async () => {
      const response = await ctx.server.inject({
        method: 'GET',
        url: '/api/characters/C999/relations',
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });
});
