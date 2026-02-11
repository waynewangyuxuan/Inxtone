/**
 * E2E Tests — Writing + AI + Plot Integration
 *
 * Tests cross-service flows: AI generation → chapter save → version history,
 * version rollback, and plot lifecycle (arc → foreshadowing → resolve).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, type TestContext } from './testHelper.js';

function parseSSE(body: string): Array<Record<string, unknown>> {
  return body
    .split('\n\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => JSON.parse(line.replace('data: ', '')) as Record<string, unknown>);
}

describe('E2E: Writing + Plot Integration', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await createTestServer();
  });

  afterEach(async () => {
    ctx.db.close();
    await ctx.server.close();
  });

  // ============================================
  // Writing Flow: Create → Edit → Save → Version
  // ============================================

  describe('Writing Flow', () => {
    it('should create chapter, save content, and create a version', async () => {
      // 1. Create volume
      const volRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/volumes',
        payload: { title: 'Volume 1' },
      });
      expect(volRes.statusCode).toBe(201);
      const volumeId = volRes.json().data.id;

      // 2. Create chapter
      const chRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters',
        payload: { title: 'Chapter 1', volumeId },
      });
      expect(chRes.statusCode).toBe(201);
      const chapterId = chRes.json().data.id;

      // 3. Save content
      const saveRes = await ctx.server.inject({
        method: 'PUT',
        url: `/api/chapters/${chapterId}/content`,
        payload: { content: 'The journey begins in a vast wilderness.', createVersion: true },
      });
      expect(saveRes.statusCode).toBe(200);

      // 4. Verify content persisted
      const getRes = await ctx.server.inject({
        method: 'GET',
        url: `/api/chapters/${chapterId}?includeContent=true`,
      });
      expect(getRes.json().data.content).toBe('The journey begins in a vast wilderness.');

      // 5. Verify version was created
      const versionsRes = await ctx.server.inject({
        method: 'GET',
        url: `/api/chapters/${chapterId}/versions`,
      });
      const versions = versionsRes.json().data;
      expect(versions.length).toBe(1);
      expect(versions[0].source).toBe('manual');
    });

    it('should save merged content after AI accept', async () => {
      // 1. Create chapter with initial content
      const volRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/volumes',
        payload: { title: 'Vol 1' },
      });
      const chRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters',
        payload: { title: 'Ch 1', volumeId: volRes.json().data.id },
      });
      const chapterId = chRes.json().data.id;

      await ctx.server.inject({
        method: 'PUT',
        url: `/api/chapters/${chapterId}/content`,
        payload: { content: 'The hero stood at the gate.' },
      });

      // 2. Simulate "Accept AI" — save merged content
      const merged = 'The hero stood at the gate.\n\nA cold wind swept through the courtyard.';
      const mergeRes = await ctx.server.inject({
        method: 'PUT',
        url: `/api/chapters/${chapterId}/content`,
        payload: { content: merged, createVersion: false },
      });
      expect(mergeRes.statusCode).toBe(200);

      // 3. Verify final content
      const getRes = await ctx.server.inject({
        method: 'GET',
        url: `/api/chapters/${chapterId}?includeContent=true`,
      });
      expect(getRes.json().data.content).toBe(merged);
    });
  });

  // ============================================
  // Version Rollback Flow
  // ============================================

  describe('Version Rollback', () => {
    it('should rollback to a previous version', async () => {
      // 1. Create chapter
      const volRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/volumes',
        payload: { title: 'Vol' },
      });
      const chRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters',
        payload: { title: 'Ch', volumeId: volRes.json().data.id },
      });
      const chapterId = chRes.json().data.id;

      // 2. Save initial content + create version
      await ctx.server.inject({
        method: 'PUT',
        url: `/api/chapters/${chapterId}/content`,
        payload: { content: 'Version A content', createVersion: true },
      });

      // 3. Get the version ID
      const versionsRes = await ctx.server.inject({
        method: 'GET',
        url: `/api/chapters/${chapterId}/versions`,
      });
      const versionId = versionsRes.json().data[0].id;

      // 4. Modify content
      await ctx.server.inject({
        method: 'PUT',
        url: `/api/chapters/${chapterId}/content`,
        payload: { content: 'Version B content (modified)', createVersion: false },
      });

      // 5. Rollback to version A
      const rollbackRes = await ctx.server.inject({
        method: 'POST',
        url: `/api/chapters/${chapterId}/rollback`,
        payload: { versionId },
      });
      expect(rollbackRes.statusCode).toBe(200);

      // 6. Verify content is restored
      const getRes = await ctx.server.inject({
        method: 'GET',
        url: `/api/chapters/${chapterId}?includeContent=true`,
      });
      expect(getRes.json().data.content).toBe('Version A content');
    });
  });

  // ============================================
  // Plot Lifecycle: Arc → Foreshadowing → Resolve
  // ============================================

  describe('Plot Lifecycle', () => {
    it('should manage arc → chapter → foreshadowing lifecycle', async () => {
      // 1. Create arc
      const arcRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/arcs',
        payload: { name: 'Main Arc', type: 'main' },
      });
      expect(arcRes.statusCode).toBe(201);
      const arcId = arcRes.json().data.id;

      // 2. Create chapters assigned to arc
      const volRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/volumes',
        payload: { title: 'Vol' },
      });
      const volumeId = volRes.json().data.id;

      const ch1Res = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters',
        payload: { title: 'Ch1', volumeId, arcId },
      });
      expect(ch1Res.statusCode).toBe(201);

      const ch2Res = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters',
        payload: { title: 'Ch2', volumeId, arcId },
      });
      expect(ch2Res.statusCode).toBe(201);

      // 3. Create foreshadowing
      const fsRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: {
          content: 'The hidden truth about the sword',
          plantedChapter: 1,
          targetChapter: 5,
        },
      });
      expect(fsRes.statusCode).toBe(201);
      const fsId = fsRes.json().data.id;

      // 4. Add hint
      const hintRes = await ctx.server.inject({
        method: 'POST',
        url: `/api/foreshadowing/${fsId}/hint`,
        payload: { chapterNumber: 2, text: 'A faint glow from the scabbard' },
      });
      expect(hintRes.statusCode).toBe(200);

      // 5. Verify foreshadowing has hint
      const fsGet = await ctx.server.inject({
        method: 'GET',
        url: `/api/foreshadowing/${fsId}`,
      });
      const fsData = fsGet.json().data;
      expect(fsData.hints).toHaveLength(1);
      expect(fsData.hints[0].text).toBe('A faint glow from the scabbard');

      // 6. Resolve foreshadowing
      const resolveRes = await ctx.server.inject({
        method: 'POST',
        url: `/api/foreshadowing/${fsId}/resolve`,
        payload: { resolvedChapter: 5 },
      });
      expect(resolveRes.statusCode).toBe(200);

      // 7. Verify lifecycle complete
      const fsResolved = await ctx.server.inject({
        method: 'GET',
        url: `/api/foreshadowing/${fsId}`,
      });
      expect(fsResolved.json().data.status).toBe('resolved');
      expect(fsResolved.json().data.resolvedChapter).toBe(5);
    });

    it('should abandon foreshadowing', async () => {
      const fsRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/foreshadowing',
        payload: { content: 'Red herring plot', plantedChapter: 1 },
      });
      const fsId = fsRes.json().data.id;

      const abandonRes = await ctx.server.inject({
        method: 'POST',
        url: `/api/foreshadowing/${fsId}/abandon`,
      });
      expect(abandonRes.statusCode).toBe(200);

      const fsGet = await ctx.server.inject({
        method: 'GET',
        url: `/api/foreshadowing/${fsId}`,
      });
      expect(fsGet.json().data.status).toBe('abandoned');
    });
  });

  // ============================================
  // Chapter Status Transitions
  // ============================================

  describe('Chapter Status State Machine', () => {
    it('should transition outline → draft → revision → done', async () => {
      const volRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/volumes',
        payload: { title: 'Vol' },
      });
      const chRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters',
        payload: { title: 'Status Ch', volumeId: volRes.json().data.id },
      });
      const chapterId = chRes.json().data.id;
      expect(chRes.json().data.status).toBe('outline');

      // outline → draft
      let res = await ctx.server.inject({
        method: 'PATCH',
        url: `/api/chapters/${chapterId}`,
        payload: { status: 'draft' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.status).toBe('draft');

      // draft → revision
      res = await ctx.server.inject({
        method: 'PATCH',
        url: `/api/chapters/${chapterId}`,
        payload: { status: 'revision' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.status).toBe('revision');

      // revision → done
      res = await ctx.server.inject({
        method: 'PATCH',
        url: `/api/chapters/${chapterId}`,
        payload: { status: 'done' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.status).toBe('done');
    });
  });

  // ============================================
  // Word Count Stats
  // ============================================

  describe('Word Count Stats', () => {
    it('should track word counts across chapters', async () => {
      // Initial: zero
      const emptyStats = await ctx.server.inject({ method: 'GET', url: '/api/stats/word-count' });
      expect(emptyStats.json().data.totalWords).toBe(0);

      // Create and fill chapters
      const volRes = await ctx.server.inject({
        method: 'POST',
        url: '/api/volumes',
        payload: { title: 'Vol' },
      });
      const volumeId = volRes.json().data.id;

      const ch1Res = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters',
        payload: { title: 'Ch1', volumeId },
      });
      const ch2Res = await ctx.server.inject({
        method: 'POST',
        url: '/api/chapters',
        payload: { title: 'Ch2', volumeId },
      });

      await ctx.server.inject({
        method: 'PUT',
        url: `/api/chapters/${ch1Res.json().data.id}/content`,
        payload: { content: 'Hello world this is a test' },
      });
      await ctx.server.inject({
        method: 'PUT',
        url: `/api/chapters/${ch2Res.json().data.id}/content`,
        payload: { content: '这是一段中文测试内容' },
      });

      const stats = await ctx.server.inject({ method: 'GET', url: '/api/stats/word-count' });
      expect(stats.json().data.totalWords).toBeGreaterThan(0);
    });
  });
});
