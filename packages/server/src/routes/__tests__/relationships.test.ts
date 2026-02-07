/**
 * Relationships API Route Integration Tests
 *
 * Tests the full HTTP request/response cycle for relationship CRUD endpoints
 * using an in-memory SQLite database and Fastify's inject API.
 *
 * Characters are created via the service layer (not HTTP) as test fixtures.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, type TestContext } from './testHelper.js';
import type { Character } from '@inxtone/core';

describe('Relationships API - /api/relationships', () => {
  let ctx: TestContext;
  let c1: Character;
  let c2: Character;

  beforeEach(async () => {
    ctx = await createTestServer();
    // Create two characters as fixtures for relationship tests
    c1 = await ctx.service.createCharacter({ name: 'A', role: 'main' });
    c2 = await ctx.service.createCharacter({ name: 'B', role: 'supporting' });
  });

  afterEach(async () => {
    ctx.db.close();
    await ctx.server.close();
  });

  // ============================================
  // GET /api/relationships
  // ============================================

  describe('GET /api/relationships', () => {
    it('should return 200 with empty array initially', async () => {
      const response = await ctx.server.inject({
        method: 'GET',
        url: '/api/relationships',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });
  });

  // ============================================
  // POST /api/relationships
  // ============================================

  describe('POST /api/relationships', () => {
    it('should create a relationship and return 201', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/relationships',
        payload: {
          sourceId: c1.id,
          targetId: c2.id,
          type: 'companion',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBeDefined();
      expect(body.data.sourceId).toBe(c1.id);
      expect(body.data.targetId).toBe(c2.id);
      expect(body.data.type).toBe('companion');
      expect(body.data.createdAt).toBeDefined();
    });

    it('should return 400 when sourceId and targetId are the same (self-reference)', async () => {
      const response = await ctx.server.inject({
        method: 'POST',
        url: '/api/relationships',
        payload: {
          sourceId: c1.id,
          targetId: c1.id,
          type: 'companion',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('SELF_REFERENCE');
    });
  });

  // ============================================
  // GET /api/relationships?characterId=...
  // ============================================

  describe('GET /api/relationships?characterId=...', () => {
    it('should return 200 with relationships for a specific character', async () => {
      // Create a relationship first
      await ctx.service.createRelationship({
        sourceId: c1.id,
        targetId: c2.id,
        type: 'companion',
      });

      const response = await ctx.server.inject({
        method: 'GET',
        url: `/api/relationships?characterId=${c1.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].sourceId).toBe(c1.id);
      expect(body.data[0].targetId).toBe(c2.id);
    });
  });

  // ============================================
  // GET /api/relationships/:id
  // ============================================

  describe('GET /api/relationships/:id', () => {
    it('should return 200 with the relationship when found', async () => {
      const rel = await ctx.service.createRelationship({
        sourceId: c1.id,
        targetId: c2.id,
        type: 'companion',
      });

      const response = await ctx.server.inject({
        method: 'GET',
        url: `/api/relationships/${rel.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(rel.id);
      expect(body.data.sourceId).toBe(c1.id);
      expect(body.data.targetId).toBe(c2.id);
      expect(body.data.type).toBe('companion');
    });

    it('should return 404 when relationship does not exist', async () => {
      const response = await ctx.server.inject({
        method: 'GET',
        url: '/api/relationships/999',
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  // ============================================
  // PATCH /api/relationships/:id
  // ============================================

  describe('PATCH /api/relationships/:id', () => {
    it('should return 200 with the updated relationship', async () => {
      const rel = await ctx.service.createRelationship({
        sourceId: c1.id,
        targetId: c2.id,
        type: 'companion',
      });

      const response = await ctx.server.inject({
        method: 'PATCH',
        url: `/api/relationships/${rel.id}`,
        payload: { type: 'rival' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(rel.id);
      expect(body.data.type).toBe('rival');
      // Source and target should remain unchanged
      expect(body.data.sourceId).toBe(c1.id);
      expect(body.data.targetId).toBe(c2.id);
    });
  });

  // ============================================
  // DELETE /api/relationships/:id
  // ============================================

  describe('DELETE /api/relationships/:id', () => {
    it('should return 200 with deleted confirmation', async () => {
      const rel = await ctx.service.createRelationship({
        sourceId: c1.id,
        targetId: c2.id,
        type: 'companion',
      });

      const response = await ctx.server.inject({
        method: 'DELETE',
        url: `/api/relationships/${rel.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ deleted: true });

      // Verify the relationship is actually gone
      const getResponse = await ctx.server.inject({
        method: 'GET',
        url: `/api/relationships/${rel.id}`,
      });
      expect(getResponse.statusCode).toBe(404);
    });
  });
});
