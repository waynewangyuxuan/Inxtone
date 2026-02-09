/**
 * Writing API Route Integration Tests
 *
 * Tests for volumes, chapters, versions, and stats endpoints.
 * Uses real in-memory SQLite database via createTestServer().
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, type TestContext } from './testHelper.js';

let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestServer();
});

afterEach(async () => {
  ctx.db.close();
  await ctx.server.close();
});

// ===================================
// Volume API (/api/volumes)
// ===================================

describe('Volume API', () => {
  describe('GET /api/volumes', () => {
    it('should return empty array initially', async () => {
      const res = await ctx.server.inject({ method: 'GET', url: '/api/volumes' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);
    });

    it('should return all volumes', async () => {
      await ctx.writingService.createVolume({ name: 'Vol 1' });
      await ctx.writingService.createVolume({ name: 'Vol 2' });

      const res = await ctx.server.inject({ method: 'GET', url: '/api/volumes' });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveLength(2);
    });
  });

  describe('GET /api/volumes/:id', () => {
    it('should return volume by id', async () => {
      const vol = await ctx.writingService.createVolume({ name: 'Test Vol', theme: 'adventure' });

      const res = await ctx.server.inject({ method: 'GET', url: `/api/volumes/${vol.id}` });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.name).toBe('Test Vol');
      expect(body.data.theme).toBe('adventure');
    });

    it('should return 404 for non-existent volume', async () => {
      const res = await ctx.server.inject({ method: 'GET', url: '/api/volumes/999' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/volumes', () => {
    it('should create volume with 201', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/volumes',
        payload: { name: 'New Volume', theme: 'mystery', status: 'planned' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('New Volume');
      expect(body.data.id).toBeDefined();
    });

    it('should reject invalid status', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/volumes',
        payload: { name: 'Bad', status: 'invalid_status' },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/volumes/:id', () => {
    it('should return 404 for non-existent volume', async () => {
      const res = await ctx.server.inject({
        method: 'PATCH',
        url: '/api/volumes/999',
        payload: { name: 'Nope' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('should update volume', async () => {
      const vol = await ctx.writingService.createVolume({ name: 'Old Name' });

      const res = await ctx.server.inject({
        method: 'PATCH',
        url: `/api/volumes/${vol.id}`,
        payload: { name: 'New Name', status: 'in_progress' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.name).toBe('New Name');
      expect(body.data.status).toBe('in_progress');
    });
  });

  describe('DELETE /api/volumes/:id', () => {
    it('should delete volume and cascade chapters', async () => {
      const vol = await ctx.writingService.createVolume({ name: 'To Delete' });
      await ctx.writingService.createChapter({ volumeId: vol.id, title: 'Ch 1' });
      await ctx.writingService.createChapter({ volumeId: vol.id, title: 'Ch 2' });

      const res = await ctx.server.inject({
        method: 'DELETE',
        url: `/api/volumes/${vol.id}`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.deleted).toBe(true);

      // Verify chapters are gone
      const chapters = await ctx.writingService.getChaptersByVolume(vol.id);
      expect(chapters).toHaveLength(0);
    });

    it('should return 404 for non-existent volume', async () => {
      const res = await ctx.server.inject({ method: 'DELETE', url: '/api/volumes/999' });
      expect(res.statusCode).toBe(404);
    });
  });
});

// ===================================
// Chapter API (/api/chapters)
// ===================================

describe('Chapter API', () => {
  describe('GET /api/chapters', () => {
    it('should return empty array initially', async () => {
      const res = await ctx.server.inject({ method: 'GET', url: '/api/chapters' });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });

    it('should filter by volumeId', async () => {
      const vol = await ctx.writingService.createVolume({ name: 'V1' });
      await ctx.writingService.createChapter({ volumeId: vol.id, title: 'In vol' });
      await ctx.writingService.createChapter({ title: 'No vol' });

      const res = await ctx.server.inject({
        method: 'GET',
        url: `/api/chapters?volumeId=${vol.id}`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toHaveLength(1);
      expect(res.json().data[0].title).toBe('In vol');
    });

    it('should filter by arcId', async () => {
      const arc = await ctx.service.createArc({ name: 'Main Arc', type: 'main' });
      await ctx.writingService.createChapter({ arcId: arc.id, title: 'Arc ch' });
      await ctx.writingService.createChapter({ title: 'No arc' });

      const res = await ctx.server.inject({
        method: 'GET',
        url: `/api/chapters?arcId=${arc.id}`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toHaveLength(1);
      expect(res.json().data[0].title).toBe('Arc ch');
    });

    it('should filter by status', async () => {
      await ctx.writingService.createChapter({ title: 'Outline ch' });
      const ch2 = await ctx.writingService.createChapter({ title: 'Draft ch' });
      await ctx.writingService.updateChapter(ch2.id, { status: 'draft' });

      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/chapters?status=draft',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toHaveLength(1);
      expect(res.json().data[0].title).toBe('Draft ch');
    });
  });

  describe('GET /api/chapters/:id', () => {
    it('should return chapter without content by default', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Test Ch' });
      await ctx.writingService.saveContent({ chapterId: ch.id, content: 'Hello world' });

      const res = await ctx.server.inject({ method: 'GET', url: `/api/chapters/${ch.id}` });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.title).toBe('Test Ch');
      // Without includeContent, content should not be present
      expect(body.data.content).toBeUndefined();
    });

    it('should return chapter with content when includeContent=true', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Test Ch' });
      await ctx.writingService.saveContent({ chapterId: ch.id, content: 'Full content here' });

      const res = await ctx.server.inject({
        method: 'GET',
        url: `/api/chapters/${ch.id}?includeContent=true`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.content).toBe('Full content here');
    });

    it('should return 404 for non-existent chapter', async () => {
      const res = await ctx.server.inject({ method: 'GET', url: '/api/chapters/999' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/chapters', () => {
    it('should create chapter with 201', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters',
        payload: { title: 'New Chapter' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.data.title).toBe('New Chapter');
      expect(body.data.status).toBe('outline');
    });

    it('should create chapter with volumeId', async () => {
      const vol = await ctx.writingService.createVolume({ name: 'V1' });

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters',
        payload: { title: 'Ch in Vol', volumeId: vol.id },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().data.volumeId).toBe(vol.id);
    });

    it('should reject non-existent volumeId', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters',
        payload: { title: 'Bad', volumeId: 999 },
      });
      // ReferenceNotFoundError → 400
      expect(res.statusCode).toBe(400);
    });

    it('should reject non-existent arcId', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters',
        payload: { title: 'Bad', arcId: 'ARC_NONEXISTENT' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('should create chapter with characters and locations', async () => {
      const char = await ctx.service.createCharacter({ name: 'Hero', role: 'main' });
      const loc = await ctx.service.createLocation({ name: 'Temple', type: 'landmark' });

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters',
        payload: {
          title: 'Ch with refs',
          characters: [char.id],
          locations: [loc.id],
        },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().data.characters).toContain(char.id);
      expect(res.json().data.locations).toContain(loc.id);
    });
  });

  describe('PATCH /api/chapters/:id', () => {
    it('should update chapter metadata', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Old Title' });

      const res = await ctx.server.inject({
        method: 'PATCH',
        url: `/api/chapters/${ch.id}`,
        payload: { title: 'New Title', emotionCurve: 'wave' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.title).toBe('New Title');
    });

    it('should allow sequential status transition', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Ch' });

      // outline → draft (valid)
      const res = await ctx.server.inject({
        method: 'PATCH',
        url: `/api/chapters/${ch.id}`,
        payload: { status: 'draft' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.status).toBe('draft');
    });

    it('should reject skipping status (outline → revision)', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Ch' });

      const res = await ctx.server.inject({
        method: 'PATCH',
        url: `/api/chapters/${ch.id}`,
        payload: { status: 'revision' },
      });
      // ValidationError → 400
      expect(res.statusCode).toBe(400);
    });

    it('should allow backward status transition', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Ch' });
      await ctx.writingService.updateChapter(ch.id, { status: 'draft' });
      await ctx.writingService.updateChapter(ch.id, { status: 'revision' });

      // revision → draft (backward, always allowed)
      const res = await ctx.server.inject({
        method: 'PATCH',
        url: `/api/chapters/${ch.id}`,
        payload: { status: 'draft' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.status).toBe('draft');
    });

    it('should allow unlocking done chapter (done → revision)', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Ch' });
      await ctx.writingService.updateChapter(ch.id, { status: 'draft' });
      await ctx.writingService.updateChapter(ch.id, { status: 'revision' });
      await ctx.writingService.updateChapter(ch.id, { status: 'done' });

      const res = await ctx.server.inject({
        method: 'PATCH',
        url: `/api/chapters/${ch.id}`,
        payload: { status: 'revision' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.status).toBe('revision');
    });
  });

  describe('PUT /api/chapters/:id/content', () => {
    it('should save content', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Ch' });

      const res = await ctx.server.inject({
        method: 'PUT',
        url: `/api/chapters/${ch.id}/content`,
        payload: { content: 'Chapter content goes here.' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.wordCount).toBeGreaterThan(0);
    });

    it('should save content with version creation', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Ch' });

      const res = await ctx.server.inject({
        method: 'PUT',
        url: `/api/chapters/${ch.id}/content`,
        payload: { content: 'Some text.', createVersion: true },
      });
      expect(res.statusCode).toBe(200);

      // Verify version was created
      const versions = await ctx.writingService.getVersions(ch.id);
      expect(versions.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject missing content field', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Ch' });

      const res = await ctx.server.inject({
        method: 'PUT',
        url: `/api/chapters/${ch.id}/content`,
        payload: {},
      });
      expect(res.statusCode).toBe(400);
    });

    it('should return 404 for non-existent chapter', async () => {
      const res = await ctx.server.inject({
        method: 'PUT',
        url: '/api/chapters/999/content',
        payload: { content: 'text' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/chapters/reorder', () => {
    it('should reorder chapters', async () => {
      const ch1 = await ctx.writingService.createChapter({ title: 'Ch 1' });
      const ch2 = await ctx.writingService.createChapter({ title: 'Ch 2' });
      const ch3 = await ctx.writingService.createChapter({ title: 'Ch 3' });

      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters/reorder',
        payload: { chapterIds: [ch3.id, ch1.id, ch2.id] },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.reordered).toBe(true);
    });

    it('should reject empty chapterIds', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters/reorder',
        payload: { chapterIds: [] },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/chapters/:id', () => {
    it('should return 404 for non-existent chapter', async () => {
      const res = await ctx.server.inject({ method: 'DELETE', url: '/api/chapters/999' });
      expect(res.statusCode).toBe(404);
    });

    it('should delete chapter', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'To Delete' });

      const res = await ctx.server.inject({
        method: 'DELETE',
        url: `/api/chapters/${ch.id}`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.deleted).toBe(true);

      // Verify deleted
      const getRes = await ctx.server.inject({ method: 'GET', url: `/api/chapters/${ch.id}` });
      expect(getRes.statusCode).toBe(404);
    });
  });
});

// ===================================
// Version API (/api/chapters/:chapterId/versions + /api/versions)
// ===================================

describe('Version API', () => {
  describe('GET /api/chapters/:chapterId/versions', () => {
    it('should return empty array for chapter with no versions', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Ch' });

      const res = await ctx.server.inject({
        method: 'GET',
        url: `/api/chapters/${ch.id}/versions`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });

    it('should list versions for a chapter', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Ch' });
      await ctx.writingService.saveContent({ chapterId: ch.id, content: 'v1 content' });
      await ctx.writingService.createVersion({ chapterId: ch.id, changeSummary: 'First draft' });

      const res = await ctx.server.inject({
        method: 'GET',
        url: `/api/chapters/${ch.id}/versions`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toHaveLength(1);
    });
  });

  describe('POST /api/chapters/:chapterId/versions', () => {
    it('should return 404 for non-existent chapter', async () => {
      const res = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters/999/versions',
        payload: { summary: 'nope' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('should create version snapshot with 201', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Ch' });
      await ctx.writingService.saveContent({ chapterId: ch.id, content: 'Snapshot content' });

      const res = await ctx.server.inject({
        method: 'POST',
        url: `/api/chapters/${ch.id}/versions`,
        payload: { summary: 'My snapshot' },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().data.id).toBeDefined();
    });
  });

  describe('POST /api/chapters/:chapterId/rollback', () => {
    it('should rollback to a specific version', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Ch' });
      await ctx.writingService.saveContent({ chapterId: ch.id, content: 'Original content' });
      const version = await ctx.writingService.createVersion({ chapterId: ch.id });

      // Change content
      await ctx.writingService.saveContent({ chapterId: ch.id, content: 'New content' });

      const res = await ctx.server.inject({
        method: 'POST',
        url: `/api/chapters/${ch.id}/rollback`,
        payload: { versionId: version.id },
      });
      expect(res.statusCode).toBe(200);

      // Verify content was restored
      const restored = await ctx.writingService.getChapterWithContent(ch.id);
      expect(restored.content).toBe('Original content');
    });

    it('should reject rollback with wrong version', async () => {
      const ch1 = await ctx.writingService.createChapter({ title: 'Ch1' });
      const ch2 = await ctx.writingService.createChapter({ title: 'Ch2' });
      await ctx.writingService.saveContent({ chapterId: ch2.id, content: 'ch2 content' });
      const v2 = await ctx.writingService.createVersion({ chapterId: ch2.id });

      // Try to rollback ch1 using ch2's version
      const res = await ctx.server.inject({
        method: 'POST',
        url: `/api/chapters/${ch1.id}/rollback`,
        payload: { versionId: v2.id },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/versions/:id', () => {
    it('should return version by id', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Ch' });
      await ctx.writingService.saveContent({ chapterId: ch.id, content: 'Test content' });
      const version = await ctx.writingService.createVersion({ chapterId: ch.id });

      const res = await ctx.server.inject({
        method: 'GET',
        url: `/api/versions/${version.id}`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.id).toBe(version.id);
    });

    it('should return 404 for non-existent version', async () => {
      const res = await ctx.server.inject({ method: 'GET', url: '/api/versions/999' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/versions/compare', () => {
    it('should compare two versions', async () => {
      const ch = await ctx.writingService.createChapter({ title: 'Ch' });
      await ctx.writingService.saveContent({ chapterId: ch.id, content: 'Line 1' });
      const v1 = await ctx.writingService.createVersion({ chapterId: ch.id });

      await ctx.writingService.saveContent({ chapterId: ch.id, content: 'Line 1\nLine 2\nLine 3' });
      const v2 = await ctx.writingService.createVersion({ chapterId: ch.id });

      const res = await ctx.server.inject({
        method: 'GET',
        url: `/api/versions/compare?versionId1=${v1.id}&versionId2=${v2.id}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.added).toBeDefined();
      expect(body.data.removed).toBeDefined();
      expect(body.data.wordCountDelta).toBeDefined();
    });

    it('should reject missing query params', async () => {
      const res = await ctx.server.inject({
        method: 'GET',
        url: '/api/versions/compare',
      });
      expect(res.statusCode).toBe(400);
    });
  });
});

// ===================================
// Stats API (/api/stats)
// ===================================

describe('Stats API', () => {
  describe('GET /api/stats/word-count', () => {
    it('should return 0 initially', async () => {
      const res = await ctx.server.inject({ method: 'GET', url: '/api/stats/word-count' });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.totalWords).toBe(0);
    });

    it('should return total word count across chapters', async () => {
      const ch1 = await ctx.writingService.createChapter({ title: 'Ch 1' });
      const ch2 = await ctx.writingService.createChapter({ title: 'Ch 2' });
      await ctx.writingService.saveContent({ chapterId: ch1.id, content: 'Hello world' });
      await ctx.writingService.saveContent({ chapterId: ch2.id, content: 'One two three' });

      const res = await ctx.server.inject({ method: 'GET', url: '/api/stats/word-count' });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.totalWords).toBeGreaterThan(0);
    });
  });
});
