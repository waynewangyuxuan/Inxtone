/**
 * LocationRepository Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from '../../Database.js';
import { LocationRepository } from '../LocationRepository.js';

describe('LocationRepository', () => {
  let db: Database;
  let repo: LocationRepository;

  beforeEach(() => {
    db = new Database({ path: ':memory:', migrate: true });
    db.connect();
    repo = new LocationRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('create', () => {
    it('should create a location with required fields', () => {
      const location = repo.create({
        name: '青云宗',
      });

      expect(location.id).toBe('L001');
      expect(location.name).toBe('青云宗');
    });

    it('should create a location with all fields', () => {
      const location = repo.create({
        name: '幽冥殿',
        type: 'sect',
        significance: '魔道第一大派',
        atmosphere: '阴森恐怖',
        details: {
          population: 50000,
          founded: '千年前',
        },
      });

      expect(location.type).toBe('sect');
      expect(location.significance).toBe('魔道第一大派');
      expect(location.details?.population).toBe(50000);
    });

    it('should auto-increment IDs', () => {
      const loc1 = repo.create({ name: '地点1' });
      const loc2 = repo.create({ name: '地点2' });

      expect(loc1.id).toBe('L001');
      expect(loc2.id).toBe('L002');
    });
  });

  describe('findById', () => {
    it('should find a location by ID', () => {
      repo.create({ name: '青云宗' });

      const found = repo.findById('L001');

      expect(found?.name).toBe('青云宗');
    });

    it('should return null for non-existent ID', () => {
      const found = repo.findById('L999');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all locations ordered by name', () => {
      repo.create({ name: 'B地点' });
      repo.create({ name: 'A地点' });
      repo.create({ name: 'C地点' });

      const all = repo.findAll();

      expect(all).toHaveLength(3);
      expect(all[0].name).toBe('A地点');
    });
  });

  describe('findByType', () => {
    it('should filter by type', () => {
      repo.create({ name: '青云宗', type: 'sect' });
      repo.create({ name: '京城', type: 'city' });
      repo.create({ name: '玄天宗', type: 'sect' });

      const sects = repo.findByType('sect');

      expect(sects).toHaveLength(2);
    });
  });

  describe('searchByName', () => {
    it('should search by partial name', () => {
      repo.create({ name: '青云宗' });
      repo.create({ name: '青玄宗' });
      repo.create({ name: '玄天宗' });

      const results = repo.searchByName('青');

      expect(results).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update location fields', () => {
      repo.create({ name: '青云宗' });

      const updated = repo.update('L001', {
        atmosphere: '仙气缭绕',
        significance: '正道第一宗门',
      });

      expect(updated.atmosphere).toBe('仙气缭绕');
      expect(updated.significance).toBe('正道第一宗门');
    });

    it('should throw for non-existent location', () => {
      expect(() => repo.update('L999', { name: 'Test' })).toThrow('Location L999 not found');
    });
  });

  describe('delete', () => {
    it('should delete a location', () => {
      repo.create({ name: '青云宗' });

      const deleted = repo.delete('L001');

      expect(deleted).toBe(true);
      expect(repo.findById('L001')).toBeNull();
    });
  });

  describe('getTypes', () => {
    it('should return all unique types', () => {
      repo.create({ name: '地点1', type: 'sect' });
      repo.create({ name: '地点2', type: 'city' });
      repo.create({ name: '地点3', type: 'sect' });
      repo.create({ name: '地点4' }); // No type

      const types = repo.getTypes();

      expect(types).toHaveLength(2);
      expect(types).toContain('sect');
      expect(types).toContain('city');
    });
  });
});
