/**
 * Performance Test Seed Script
 *
 * Generates large dataset for performance testing:
 * - 100+ characters with full profiles
 * - Corresponding relationships
 * - Locations and factions
 *
 * Usage:
 *   pnpm perf:seed                    # Seeds to ~/.inxtone/perf-test.db
 *   DB_PATH=custom.db pnpm perf:seed  # Seeds to custom path
 */

import type {
  CreateCharacterInput,
  CreateRelationshipInput,
  CreateLocationInput,
  CreateFactionInput,
} from '../../types/services.js';

// Character templates and traits for generating variety
const FIRST_NAMES = [
  '林',
  '苏',
  '云',
  '白',
  '墨',
  '陈',
  '王',
  '李',
  '张',
  '刘',
  '赵',
  '孙',
  '周',
  '吴',
  '郑',
  '冯',
  '陆',
  '韩',
  '杨',
  '朱',
];

const GIVEN_NAMES = [
  '墨',
  '澜',
  '阙',
  '霜',
  '渊',
  '寒',
  '影',
  '烟',
  '雪',
  '风',
  '月',
  '星',
  '云',
  '山',
  '海',
  '河',
  '峰',
  '谷',
  '林',
  '泉',
];

const ROLES: Array<'main' | 'supporting' | 'antagonist' | 'mentioned'> = [
  'main',
  'supporting',
  'supporting',
  'supporting',
  'antagonist',
  'mentioned',
  'mentioned',
  'mentioned',
];

const TEMPLATES: Array<'seeker' | 'guardian' | 'fallen' | 'avenger' | undefined> = [
  'seeker',
  'guardian',
  'fallen',
  'avenger',
  undefined,
  undefined,
];

const CONFLICT_TYPES: Array<
  | 'desire_vs_morality'
  | 'ideal_vs_reality'
  | 'love_vs_duty'
  | 'survival_vs_dignity'
  | 'self_vs_society'
  | undefined
> = [
  'desire_vs_morality',
  'ideal_vs_reality',
  'love_vs_duty',
  'survival_vs_dignity',
  'self_vs_society',
  undefined,
];

const APPEARANCES = [
  '身着{color}色道袍的{age}修士，眉目{feature}，周身{aura}。',
  '{age}的{gender}，一袭{color}衣，气质{trait}。',
  '{feature}的{age}修士，手持{weapon}，目光{gaze}。',
  '面容{face}的{age}{gender}，{color}发{hair}，神情{emotion}。',
];

const COLOR_WORDS = ['青', '白', '黑', '红', '金', '银', '紫', '墨'];
const AGE_WORDS = ['年轻', '中年', '年迈', '少年', '壮年'];
const FEATURE_WORDS = ['清秀', '英俊', '威严', '阴郁', '温和', '锐利'];
const AURA_WORDS = ['环绕灵气', '沉稳如山', '凌厉如剑', '深不可测'];
const TRAIT_WORDS = ['从容', '冷峻', '温柔', '狂傲', '淡漠'];

/**
 * Generate random character name
 */
function generateName(index: number): string {
  const firstIdx = index % FIRST_NAMES.length;
  const givenIdx = Math.floor(index / FIRST_NAMES.length) % GIVEN_NAMES.length;
  return `${FIRST_NAMES[firstIdx]}${GIVEN_NAMES[givenIdx]}`;
}

/**
 * Generate appearance description
 */
function generateAppearance(index: number): string {
  const template = APPEARANCES[index % APPEARANCES.length];
  return template!
    .replace('{color}', COLOR_WORDS[index % COLOR_WORDS.length]!)
    .replace('{age}', AGE_WORDS[index % AGE_WORDS.length]!)
    .replace('{feature}', FEATURE_WORDS[index % FEATURE_WORDS.length]!)
    .replace('{aura}', AURA_WORDS[index % AURA_WORDS.length]!)
    .replace('{trait}', TRAIT_WORDS[index % TRAIT_WORDS.length]!)
    .replace('{gender}', index % 2 === 0 ? '男子' : '女子')
    .replace('{weapon}', '长剑')
    .replace('{gaze}', '坚定')
    .replace('{face}', '俊秀')
    .replace('{hair}', '如瀑')
    .replace('{emotion}', '专注');
}

/**
 * Generate motivation layers
 */
function generateMotivation(index: number): { surface: string; hidden?: string; core?: string } {
  const motivations = [
    {
      surface: '成为宗门最强者',
      hidden: '证明自己的价值',
      core: '渴望被认可',
    },
    {
      surface: '守护家族荣耀',
      hidden: '摆脱家族束缚',
      core: '追求真正的自由',
    },
    {
      surface: '报仇雪恨',
      hidden: '害怕再次失去',
      core: '渴望安全感',
    },
    {
      surface: '寻找真相',
      hidden: '逃避现实',
      core: '害怕面对自己',
    },
    {
      surface: '获得力量',
    },
    {
      surface: '完成使命',
    },
  ];

  return motivations[index % motivations.length]!;
}

/**
 * Generate 100+ characters
 */
export function generateCharacters(count = 120): CreateCharacterInput[] {
  const characters: CreateCharacterInput[] = [];

  for (let i = 0; i < count; i++) {
    const role = ROLES[i % ROLES.length]!;
    const template = TEMPLATES[i % TEMPLATES.length];
    const conflictType = CONFLICT_TYPES[i % CONFLICT_TYPES.length];

    characters.push({
      name: generateName(i),
      role,
      ...(template && { template }),
      ...(conflictType && { conflictType }),
      appearance: generateAppearance(i),
      motivation: generateMotivation(i),
      // Add voice samples for some characters
      ...(i % 3 === 0 && {
        voiceSamples: [
          `这是${generateName(i)}的台词样本一。`,
          `这是${generateName(i)}的台词样本二。`,
        ],
      }),
    });
  }

  return characters;
}

/**
 * Generate relationships between characters
 */
export function generateRelationships(characterCount: number): CreateRelationshipInput[] {
  const relationships: CreateRelationshipInput[] = [];
  const types: Array<'mentor' | 'rival' | 'enemy' | 'companion' | 'lover' | 'confidant'> = [
    'mentor',
    'rival',
    'enemy',
    'companion',
    'lover',
    'confidant',
  ];

  // Generate relationships: each character has 1-3 relationships
  for (let i = 0; i < characterCount; i++) {
    const relationCount = (i % 3) + 1; // 1-3 relationships per character

    for (let j = 0; j < relationCount; j++) {
      const targetIdx = (i + j + 1) % characterCount;
      if (targetIdx === i) continue; // Skip self

      relationships.push({
        sourceId: `C${String(i + 1).padStart(3, '0')}`,
        targetId: `C${String(targetIdx + 1).padStart(3, '0')}`,
        type: types[(i + j) % types.length]!,
        joinReason: `因缘际会，${generateName(i)}与${generateName(targetIdx)}相识`,
        independentGoal: `各有追求，但能互相帮助`,
        disagreeScenarios: ['道路选择不同', '价值观有差异'],
        leaveScenarios: ['目标完成', '理念彻底对立'],
        mcNeeds: `需要${generateName(targetIdx)}的支持`,
      });
    }
  }

  return relationships;
}

/**
 * Generate locations
 */
export function generateLocations(count = 30): CreateLocationInput[] {
  const locations: CreateLocationInput[] = [];
  const types: Array<'settlement' | 'landmark' | 'battlefield' | 'hideout' | 'natural'> = [
    'settlement',
    'landmark',
    'battlefield',
    'hideout',
    'natural',
  ];

  const locationNames = [
    '青云峰',
    '墨渊城',
    '剑阁',
    '灵泉谷',
    '天机阁',
    '血煞林',
    '星月湖',
    '玄冰洞',
    '烈火山',
    '幽冥涧',
  ];

  for (let i = 0; i < count; i++) {
    const baseName = locationNames[i % locationNames.length];
    const suffix = i >= 10 ? `·${Math.floor(i / 10)}` : '';

    locations.push({
      name: `${baseName}${suffix}`,
      type: types[i % types.length]!,
      significance: `重要地点之${i + 1}`,
      atmosphere: `神秘而${i % 2 === 0 ? '危险' : '宁静'}的氛围`,
    });
  }

  return locations;
}

/**
 * Generate factions
 */
export function generateFactions(count = 20): CreateFactionInput[] {
  const factions: CreateFactionInput[] = [];
  const types: Array<'sect' | 'family' | 'guild' | 'military' | 'underground'> = [
    'sect',
    'family',
    'guild',
    'military',
    'underground',
  ];
  const statuses: Array<'active' | 'hidden' | 'disbanded'> = ['active', 'active', 'hidden'];
  const stances: Array<'friendly' | 'neutral' | 'hostile'> = ['friendly', 'neutral', 'hostile'];

  const factionNames = ['云宗', '墨门', '剑派', '世家', '联盟', '殿', '阁', '府', '会', '帮'];

  for (let i = 0; i < count; i++) {
    const baseName = factionNames[i % factionNames.length];
    const prefix = ['天', '地', '玄', '黄', '青', '赤', '白', '黑'][i % 8];

    factions.push({
      name: `${prefix}${baseName}`,
      type: types[i % types.length]!,
      status: statuses[i % statuses.length]!,
      stanceToMC: stances[i % stances.length]!,
      // First 10 factions have leaders
      ...(i < 10 && { leaderId: `C${String(i + 1).padStart(3, '0')}` }),
      goals: [`扩大势力`, `维持平衡`, `寻求突破`],
    });
  }

  return factions;
}

/**
 * Seed database with performance test data
 */
export async function seedPerfTest(dbPath?: string): Promise<void> {
  // Dynamic imports
  const {
    Database,
    CharacterRepository,
    RelationshipRepository,
    WorldRepository,
    LocationRepository,
    FactionRepository,
    TimelineEventRepository,
    ArcRepository,
    ForeshadowingRepository,
    HookRepository,
  } = await import('../../db/index.js');
  const { StoryBibleService, EventBus } = await import('../../services/index.js');
  const path = await import('node:path');
  const fs = await import('node:fs');
  const os = await import('node:os');

  // Default to perf-test.db in home directory
  const finalDbPath =
    dbPath ?? process.env.DB_PATH ?? path.join(os.homedir(), '.inxtone', 'perf-test.db');

  // Ensure directory exists
  const dbDir = path.dirname(finalDbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  console.log('🚀 Starting performance test seed...');
  console.log(`📁 Database: ${finalDbPath}\n`);

  const startTime = Date.now();

  // Initialize database and service
  const db = new Database({ path: finalDbPath, migrate: true });
  db.connect();

  const eventBus = new EventBus();
  const service = new StoryBibleService({
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

  try {
    // Generate data
    const characterCount = 120;
    const characters = generateCharacters(characterCount);
    const relationships = generateRelationships(characterCount);
    const locations = generateLocations(30);
    const factions = generateFactions(20);

    console.log(`📊 Generating:`);
    console.log(`   ${characters.length} characters`);
    console.log(`   ${relationships.length} relationships`);
    console.log(`   ${locations.length} locations`);
    console.log(`   ${factions.length} factions\n`);

    // 1. Create characters
    console.log('👥 Creating characters...');
    const characterIdMap = new Map<string, string>();
    let charProgress = 0;

    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      if (!char) continue;

      const created = await service.createCharacter(char);
      const placeholderId = `C${String(i + 1).padStart(3, '0')}`;
      characterIdMap.set(placeholderId, created.id);

      charProgress++;
      if (charProgress % 20 === 0) {
        console.log(`  ✓ ${charProgress}/${characters.length} characters created`);
      }
    }
    console.log(`✅ ${characters.length} characters created\n`);

    // 2. Create locations
    console.log('📍 Creating locations...');
    const locationIdMap = new Map<string, string>();

    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];
      if (!loc) continue;

      const created = await service.createLocation(loc);
      const placeholderId = `L${String(i + 1).padStart(3, '0')}`;
      locationIdMap.set(placeholderId, created.id);
    }
    console.log(`✅ ${locations.length} locations created\n`);

    // 3. Create factions
    console.log('⚔️  Creating factions...');
    for (const faction of factions) {
      if (faction.leaderId) {
        const leaderId = characterIdMap.get(faction.leaderId);
        if (leaderId) {
          await service.createFaction({
            ...faction,
            leaderId,
          });
        }
      } else {
        await service.createFaction(faction);
      }
    }
    console.log(`✅ ${factions.length} factions created\n`);

    // 4. Create relationships
    console.log('🔗 Creating relationships...');
    let relProgress = 0;

    for (const rel of relationships) {
      const sourceId = characterIdMap.get(rel.sourceId);
      const targetId = characterIdMap.get(rel.targetId);

      if (!sourceId || !targetId) continue;

      await service.createRelationship({
        ...rel,
        sourceId,
        targetId,
      });

      relProgress++;
      if (relProgress % 50 === 0) {
        console.log(`  ✓ ${relProgress}/${relationships.length} relationships created`);
      }
    }
    console.log(`✅ ${relationships.length} relationships created\n`);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('🎉 Performance test seed completed!');
    console.log(`📦 Data saved to: ${finalDbPath}`);
    console.log(`⏱️  Time taken: ${duration}s\n`);

    console.log('📈 Test with:');
    console.log(`  • CLI search: inxtone bible search 林 (from project dir)`);
    console.log(`  • API endpoint: GET /api/characters`);
    console.log(`  • FTS5 query: SELECT * FROM characters_fts WHERE characters_fts MATCH '林'`);
    console.log();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPerfTest().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
