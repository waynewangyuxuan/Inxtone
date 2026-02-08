/**
 * Bible Command Tests
 *
 * Integration tests for bible list/show/search commands
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
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
import type { IStoryBibleService } from '@inxtone/core';

describe('Bible Commands', () => {
  let testDir: string;
  let dbPath: string;
  let service: IStoryBibleService;
  let db: Database;
  let cwdSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    // Create temp directory for test project
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'inxtone-bible-test-'));
    dbPath = path.join(testDir, 'inxtone.db');

    // Mock process.cwd() to return test directory
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(testDir);

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock process.exit to prevent test termination
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });

    // Create database and service
    db = new Database({ path: dbPath, migrate: true });
    db.connect();

    const eventBus = new EventBus();
    service = new StoryBibleService({
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

    // Add test data
    await service.createCharacter({
      name: 'Alice',
      role: 'main',
      appearance: 'A brave hero',
      motivation: {
        surface: 'Save the kingdom',
        hidden: 'Prove herself',
        core: 'Find belonging',
      },
    });

    await service.createCharacter({
      name: 'Bob',
      role: 'antagonist',
      appearance: 'A dark villain',
    });

    await service.createLocation({
      name: 'Capital City',
      type: 'settlement',
      significance: 'Main hub',
    });

    await service.createFaction({
      name: 'Royal Guard',
      type: 'military',
      status: 'active',
    });
  });

  afterEach(() => {
    // Cleanup
    db.close();
    cwdSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('bibleList', () => {
    it('should list overview when no type specified', async () => {
      const { bibleList } = await import('../commands/bible.js');
      await bibleList();

      // Verify console.log was called with overview
      const logs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = logs.join('\n');

      expect(output).toContain('Story Bible Overview');
      expect(output).toContain('Characters:');
      expect(output).toContain('2'); // 2 characters
      expect(output).toContain('Locations:');
      expect(output).toContain('1'); // 1 location
      expect(output).toContain('Factions:');
      expect(output).toContain('1'); // 1 faction
    });

    it('should list characters when type is characters', async () => {
      const { bibleList } = await import('../commands/bible.js');
      await bibleList('characters');

      const logs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = logs.join('\n');

      expect(output).toContain('Characters (2)');
      expect(output).toContain('Alice');
      expect(output).toContain('Bob');
      expect(output).toContain('[main]');
      expect(output).toContain('[antagonist]');
    });

    it('should list locations when type is locations', async () => {
      const { bibleList } = await import('../commands/bible.js');
      await bibleList('locations');

      const logs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = logs.join('\n');

      expect(output).toContain('Locations (1)');
      expect(output).toContain('Capital City');
      expect(output).toContain('settlement');
    });

    it('should list factions when type is factions', async () => {
      const { bibleList } = await import('../commands/bible.js');
      await bibleList('factions');

      const logs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = logs.join('\n');

      expect(output).toContain('Factions (1)');
      expect(output).toContain('Royal Guard');
      // Note: faction list doesn't show type/status, only stanceToMC if present
    });

    it('should show error for invalid type', async () => {
      const { bibleList } = await import('../commands/bible.js');

      await expect(bibleList('invalid')).rejects.toThrow('process.exit(1)');

      const errors = consoleErrorSpy.mock.calls.map((call) => call.join(' '));
      const errorOutput = errors.join('\n');

      expect(errorOutput).toContain('Unknown type "invalid"');
      expect(errorOutput).toContain('Valid types:');
    });

    it('should show empty state for timeline events', async () => {
      const { bibleList } = await import('../commands/bible.js');
      await bibleList('timeline');

      const logs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = logs.join('\n');

      expect(output).toContain('Timeline Events (0)');
      expect(output).toContain('No timeline events yet');
    });
  });

  describe('bibleShow', () => {
    it('should show character details', async () => {
      const { bibleShow } = await import('../commands/bible.js');
      const characters = await service.getAllCharacters();
      const alice = characters.find((c) => c.name === 'Alice');

      expect(alice).toBeDefined();
      await bibleShow('characters', alice!.id); // Note: plural form

      const logs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = logs.join('\n');

      expect(output).toContain('Alice');
      expect(output).toContain('main');
      expect(output).toContain('A brave hero');
      expect(output).toContain('Save the kingdom');
    });

    it('should show location details', async () => {
      const { bibleShow } = await import('../commands/bible.js');
      const locations = await service.getAllLocations();
      const city = locations[0];

      expect(city).toBeDefined();
      await bibleShow('locations', city!.id); // Note: plural form

      const logs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = logs.join('\n');

      expect(output).toContain('Capital City');
      expect(output).toContain('settlement');
      expect(output).toContain('Main hub');
    });

    it('should show faction details', async () => {
      const { bibleShow } = await import('../commands/bible.js');
      const factions = await service.getAllFactions();
      const guard = factions[0];

      expect(guard).toBeDefined();
      await bibleShow('factions', guard!.id); // Note: plural form

      const logs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = logs.join('\n');

      expect(output).toContain('Royal Guard');
      expect(output).toContain('military');
      expect(output).toContain('active');
    });

    it('should show error for invalid entity type', async () => {
      const { bibleShow } = await import('../commands/bible.js');

      await expect(bibleShow('invalid', 'id123')).rejects.toThrow('process.exit(1)');

      const errors = consoleErrorSpy.mock.calls.map((call) => call.join(' '));
      const errorOutput = errors.join('\n');

      expect(errorOutput).toContain('Unknown type "invalid"');
    });

    it('should show error for non-existent entity', async () => {
      const { bibleShow } = await import('../commands/bible.js');

      await expect(bibleShow('characters', 'nonexistent')).rejects.toThrow('process.exit(1)');

      const errors = consoleErrorSpy.mock.calls.map((call) => call.join(' '));
      const errorOutput = errors.join('\n');

      expect(errorOutput).toContain('not found');
    });
  });

  describe('bibleSearch', () => {
    it('should search characters by name', async () => {
      const { bibleSearch } = await import('../commands/bible.js');
      await bibleSearch('Alice');

      const logs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = logs.join('\n');

      expect(output).toContain('Searching for "Alice"');
      expect(output).toContain('Alice');
      expect(output).toContain('main');
      expect(output).toContain('Found 1 result');
    });

    it('should search locations', async () => {
      const { bibleSearch } = await import('../commands/bible.js');
      await bibleSearch('Capital');

      const logs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = logs.join('\n');

      expect(output).toContain('Searching for "Capital"');
      expect(output).toContain('Capital City');
      expect(output).toContain('Found 1 result');
    });

    it('should search factions', async () => {
      const { bibleSearch } = await import('../commands/bible.js');
      await bibleSearch('Guard');

      const logs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = logs.join('\n');

      expect(output).toContain('Searching for "Guard"');
      expect(output).toContain('Royal Guard');
      expect(output).toContain('Found 1 result');
    });

    it('should show no results message when nothing found', async () => {
      const { bibleSearch } = await import('../commands/bible.js');
      await bibleSearch('NonExistentThing');

      const logs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = logs.join('\n');

      expect(output).toContain('No results found');
    });

    it('should be case-insensitive', async () => {
      const { bibleSearch } = await import('../commands/bible.js');
      await bibleSearch('alice'); // lowercase

      const logs = consoleLogSpy.mock.calls.map((call) => call.join(' '));
      const output = logs.join('\n');

      expect(output).toContain('Alice'); // Should find 'Alice'
    });
  });

  describe('Error Handling', () => {
    it('should error if not in project directory', async () => {
      // Remove database file
      fs.unlinkSync(dbPath);

      const { bibleList } = await import('../commands/bible.js');

      await expect(bibleList()).rejects.toThrow('process.exit(1)');

      const errors = consoleErrorSpy.mock.calls.map((call) => call.join(' '));
      const errorOutput = errors.join('\n');

      expect(errorOutput).toContain('Not an Inxtone project directory');
    });
  });
});
