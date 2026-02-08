/**
 * World API Route Integration Tests
 *
 * Tests the full HTTP request/response cycle for world/setting endpoints
 * using an in-memory SQLite database and Fastify's inject API.
 *
 * The world is a singleton resource - only one exists per project.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, type TestContext } from './testHelper.js';

describe('World API - /api/world', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestServer();
  });

  afterEach(async () => {
    ctx.db.close();
    await ctx.server.close();
  });

  // ============================================
  // GET /api/world
  // ============================================

  describe('GET /api/world', () => {
    it('should return 200 with null data initially', async () => {
      const response = await ctx.server.inject({
        method: 'GET',
        url: '/api/world',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toEqual({ success: true, data: null });
    });

    it('should return 200 with the world after update', async () => {
      // Create a world first
      await ctx.service.updateWorld({ name: '测试世界' } as Record<string, unknown>);

      const response = await ctx.server.inject({
        method: 'GET',
        url: '/api/world',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data).not.toBeNull();
      expect(body.data.id).toBeDefined();
    });
  });

  // ============================================
  // PATCH /api/world
  // ============================================

  describe('PATCH /api/world', () => {
    it('should create/return the world with 200 on first update', async () => {
      const response = await ctx.server.inject({
        method: 'PATCH',
        url: '/api/world',
        payload: { name: '测试世界' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data).not.toBeNull();
      expect(body.data.id).toBeDefined();
      expect(body.data.createdAt).toBeDefined();
      expect(body.data.updatedAt).toBeDefined();
    });
  });

  // ============================================
  // PUT /api/world/power-system
  // ============================================

  describe('PUT /api/world/power-system', () => {
    it('should set the power system and return 200 with updated world', async () => {
      const response = await ctx.server.inject({
        method: 'PUT',
        url: '/api/world/power-system',
        payload: {
          name: '灵力体系',
          levels: ['初级', '中级'],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data).not.toBeNull();
      expect(body.data.powerSystem).toBeDefined();
      expect(body.data.powerSystem.name).toBe('灵力体系');
      expect(body.data.powerSystem.levels).toEqual(['初级', '中级']);
    });
  });

  // ============================================
  // PUT /api/world/social-rules
  // ============================================

  describe('PUT /api/world/social-rules', () => {
    it('should set social rules and return 200 with updated world', async () => {
      const response = await ctx.server.inject({
        method: 'PUT',
        url: '/api/world/social-rules',
        payload: { 规则1: '值1' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data).not.toBeNull();
      expect(body.data.socialRules).toBeDefined();
      expect(body.data.socialRules['规则1']).toBe('值1');
    });
  });
});
