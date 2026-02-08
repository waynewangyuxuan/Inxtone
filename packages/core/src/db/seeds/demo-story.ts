/**
 * Demo Story Seed Data - 《墨渊记》Ink Abyss Chronicles
 *
 * A complete demo dataset showcasing all Story Bible features
 */

import type {
  CreateCharacterInput,
  CreateRelationshipInput,
  CreateLocationInput,
  CreateFactionInput,
  CreateTimelineEventInput,
  CreateArcInput,
  CreateForeshadowingInput,
  CreateHookInput,
} from '../../types/services.js';
import type { PowerSystem } from '../../types/entities.js';

// Characters - 6 characters with complete data
export const demoCharacters: CreateCharacterInput[] = [
  {
    name: '林墨',
    role: 'main',
    template: 'seeker',
    conflictType: 'ideal_vs_reality',
    appearance:
      '二十出头的青年，身着青色道袍，眉目清秀却透着坚毅。长发束起，腰间挂着一只古朴的墨玉葫芦。眼神深邃如墨海，举手投足间已有几分宗师气度。',
    motivation: {
      surface: '查明师父死亡真相，为师父正名',
      hidden: '渴望得到墨殿的认可，证明散修也能成为墨道大师',
      core: '害怕孤独，渴望找到真正的归属感',
    },
    voiceSamples: [
      '我不信命，更不信墨殿的所谓正义。',
      '师父，您放心，我一定会找出真相。',
      '这世上没有什么是一笔墨解决不了的，如果有，那就两笔。',
    ],
  },
  {
    name: '苏澜',
    role: 'supporting',
    template: 'guardian',
    conflictType: 'love_vs_duty',
    appearance:
      '温婉的女子，一袭白衣胜雪，长发如瀑。眼眸澄澈如水，笑容温柔却暗藏坚定。手腕上系着一条红绳，是与林墨的定情信物。',
    motivation: {
      surface: '守护青云宗，维护门派安宁',
      hidden: '保护林墨不受伤害，即使背叛门派也在所不惜',
      core: '害怕失去所爱之人，渴望一个安稳的未来',
    },
    voiceSamples: [
      '不管你走到哪里，我都会陪在你身边。',
      '有些事，不做会后悔一辈子。',
      '青云宗是我的家，但你是我的归宿。',
    ],
  },
  {
    name: '云阙',
    role: 'antagonist',
    template: 'fallen',
    conflictType: 'desire_vs_morality',
    appearance:
      '曾经的翩翩佳公子，如今眼中常有红光闪烁。一身黑衣，气质阴郁，右手臂上有诡异的血色纹路。面容俊美，却透着危险的疯狂。',
    motivation: {
      surface: '获得终极力量，统一墨道',
      hidden: '证明自己比林墨强，夺回苏澜的心',
      core: '害怕被抛弃，渴望被认可',
    },
    voiceSamples: [
      '力量，只有力量才是永恒的！',
      '林墨，你凭什么比我强？',
      '规则是弱者的借口，我要打破这个世界的桁梏！',
    ],
  },
  {
    name: '白霜',
    role: 'supporting',
    template: 'guardian',
    conflictType: 'self_vs_society',
    appearance:
      '白发苍苍的老者，实则容颜未老，只因封印反噬。身穿素色长袍，手持墨玉拐杖。眼神睿智而温和，举手投足间有返璞归真之意。',
    motivation: {
      surface: '培养林墨，传承失传的古墨道',
      hidden: '利用林墨完成自己未竟的使命',
      core: '赎罪 - 为百年前的错误决定负责',
    },
    voiceSamples: [
      '墨道的真谛不在技法，而在于心境。',
      '你要记住，力量是手段，永远不是目的。',
      '我这一生啊，做对的事不多，但收你为徒，绝对是最正确的决定。',
    ],
  },
  {
    name: '墨殿主',
    role: 'antagonist',
    template: 'avenger',
    conflictType: 'survival_vs_dignity',
    appearance:
      '中年男子，面容威严，身穿墨殿金边黑袍。双目深邃如深渊，周身环绕着若有若无的墨气。给人压迫感，仿佛随时会吞噬一切。',
    motivation: {
      surface: '维护墨殿统治，镇压异端',
      hidden: '寻找墨海中的至宝，实现永生',
      core: '害怕死亡，渴望超越天道',
    },
    voiceSamples: [
      '墨殿的规矩，就是这个世界的规矩。',
      '为了大业，任何牺牲都是值得的。',
      '永生...终有一日，我会站在天道之上！',
    ],
  },
  {
    name: '小竹',
    role: 'supporting',
    appearance:
      '十六七岁的少女，扎着双马尾，大眼睛里满是好奇。青云宗弟子服总是穿得歪歪扭扭，但灵动可爱。',
    motivation: {
      surface: '成为像师姐苏澜一样的强者',
    },
    voiceSamples: ['师姐！林师兄又来找你啦！', '哇，好厉害的墨术！', '我也想变得更强，保护大家！'],
  },
];

// Relationships - 7 relationships
export const demoRelationships: CreateRelationshipInput[] = [
  {
    sourceId: 'C001', // 林墨
    targetId: 'C004', // 白霜
    type: 'mentor',
    joinReason: '白霜看中林墨的悟性和坚韧，林墨需要系统的传承',
    independentGoal: '白霜要完成赎罪，林墨要查明真相',
    disagreeScenarios: [
      '是否要直接对抗墨殿（白霜更谨慎）',
      '如何对待云阙（白霜主张救赎，林墨主张阻止）',
    ],
    leaveScenarios: ['白霜发现林墨走上邪道', '林墨得知白霜欺骗了自己的真实目的'],
    mcNeeds: '需要白霜的知识、人脉和保护，但最终要独立面对挑战',
  },
  {
    sourceId: 'C001',
    targetId: 'C002',
    type: 'lover',
    joinReason: '共同经历生死，相互吸引',
    independentGoal: '林墨要查真相，苏澜要守护宗门',
    disagreeScenarios: ['是否应该离开青云宗', '如何对待云阙'],
    leaveScenarios: ['价值观彻底对立', '一方为保护另一方而选择离开'],
    mcNeeds: '需要情感支持和精神寄托，苏澜是林墨坚持下去的动力',
  },
  {
    sourceId: 'C001',
    targetId: 'C003',
    type: 'rival',
    joinReason: '曾是同门师兄弟，互相较劲成长',
    independentGoal: '林墨要正道，云阙要力量',
    disagreeScenarios: ['修炼方式', '对待门派的态度', '对苏澜的感情'],
    leaveScenarios: ['一方彻底死去', '云阙被救赎回归正道'],
    mcNeeds: '云阙是林墨的镜子，反映了林墨可能走的另一条路',
  },
  {
    sourceId: 'C003',
    targetId: 'C005',
    type: 'enemy',
    joinReason: '墨殿主利用云阙的野心，云阙借用墨殿的力量',
    independentGoal: '云阙要超越一切，墨殿主要永生',
    disagreeScenarios: ['最终目的不同', '对彼此的利用价值'],
    leaveScenarios: ['云阙发现被利用后反水', '墨殿主榨干云阙价值后抛弃'],
    mcNeeds: '这段关系推动剧情发展，是主角面对的主要威胁',
  },
  {
    sourceId: 'C002',
    targetId: 'C006',
    type: 'companion',
    joinReason: '同门师姐妹，一起长大',
    independentGoal: '苏澜要保护林墨，小竹要成长',
    disagreeScenarios: ['苏澜冒险时小竹会担心但理解'],
    leaveScenarios: ['几乎不会分开'],
    mcNeeds: '小竹是见证者和调剂角色，让苏澜更立体',
  },
  {
    sourceId: 'C004',
    targetId: 'C001',
    type: 'confidant',
    joinReason: '白霜欣赏林墨，林墨信任师父',
    independentGoal: '各自有秘密，但愿意分享',
    disagreeScenarios: ['是否该告诉林墨全部真相'],
    leaveScenarios: ['信任被打破'],
    mcNeeds: '白霜是林墨的精神导师和知己',
  },
  {
    sourceId: 'C005',
    targetId: 'C004',
    type: 'enemy',
    joinReason: '百年前的恩怨，价值观对立',
    independentGoal: '墨殿主要永生，白霜要阻止他',
    disagreeScenarios: ['一切'],
    leaveScenarios: ['一方死亡'],
    mcNeeds: '这是背景主线，推动整个世界的矛盾',
  },
];

// World Settings
export const demoPowerSystem: PowerSystem = {
  name: '墨道修炼体系',
  levels: ['凝墨', '化墨', '墨灵', '墨尊', '墨帝'],
  coreRules: [
    '以墨为媒介，在身体或外物上刻画符文进行修炼',
    '情绪波动会影响墨力的稳定性，心境越平和，墨力越纯粹',
    '每次境界突破都需经历"墨劫"的洗礼，失败会导致修为倒退甚至走火入魔',
    '墨力的强度与个人的意志力和悟性成正比',
  ],
  constraints: [
    '使用禁术会大量消耗寿元，一次禁术可能折损十年阳寿',
    '墨力枯竭后需要至少三天时间才能恢复到正常状态',
    '不同流派的墨术不能随意混用，否则会产生墨力冲突',
    '墨海中的墨力乱流会干扰修炼者的感知和判断',
  ],
};

export const demoSocialRules: Record<string, string> = {
  师徒传承制: '修炼高级符文必须拜师学习，禁止私自传授',
  墨殿审判制: '违反墨道戒律者，将由墨殿审判，最高刑罚为终身封印修为',
  血契约束: '以血为誓立下的契约，违背者会遭受墨力反噬，重则修为尽失',
  宗门归属法: '加入宗门后不得随意叛离，否则会被追杀',
  散修限制令: '散修修炼者不得进入各大宗门的禁地和藏书楼',
};

// Locations - 4 locations
export const demoLocations: CreateLocationInput[] = [
  {
    name: '青墨峰',
    type: '修炼圣地',
    significance:
      '林墨的主要修炼场所，山巅有上古墨族留下的神秘符文阵。这里墨力浓郁，是突破境界的最佳之地。',
    atmosphere:
      '云雾缭绕，山石嶙峋。山巅常年被浓郁的墨气笼罩，远看如同一座墨色的仙山。夜晚时分，古老符文会发出幽蓝色的光芒。',
  },
  {
    name: '墨渊城',
    type: '主城',
    significance:
      '墨道修炼者的聚集地，各大宗门在此设有分舵。城中有墨道交易市场，可以买卖珍稀符文和墨宝。',
    atmosphere:
      '繁华喧嚣，人来人往。街道两旁悬挂着墨宝灯笼，夜晚时整座城市都沉浸在淡淡的墨香中。城中心的墨塔高耸入云，是墨殿权力的象征。',
  },
  {
    name: '禁地·墨海',
    type: '危险禁区',
    significance:
      '百年前的异变源头，传说中隐藏着墨道至宝。墨海深处墨力乱流肆虐，贸然进入者十死无生。',
    atmosphere:
      '一望无际的黑色海洋，波涛汹涌却毫无声息。海面上不时有墨色闪电划过，海底深处传来诡异的呼唤声。空气中弥漫着压抑的气息，让人不寒而栗。',
  },
  {
    name: '墨殿',
    type: '权力中心',
    significance: '墨道的最高管理机构，掌握着墨道的最高审判权和资源分配权。',
    atmosphere:
      '庄严肃穆的建筑群，主殿由黑色巨石砌成，雕刻着历代墨帝的雕像。殿内常年点燃着永不熄灭的墨焰，象征着墨殿的权威。进入墨殿的修士都会感到一种无形的压迫感。',
  },
];

// Factions - 3 factions
export const demoFactions: CreateFactionInput[] = [
  {
    name: '青云宗',
    type: '正道宗门',
    status: 'active',
    leaderId: 'C002', // 苏澜（代理宗主）
    stanceToMC: 'friendly',
    goals: ['维护正道秩序', '培养优秀弟子', '对抗魔道'],
    resources: ['丰富的藏书', '完善的符文传承', '稳定的弟子来源'],
    internalConflict: '保守派与改革派的理念冲突，部分长老反对接纳散修弟子',
  },
  {
    name: '墨殿',
    type: '统治机构',
    status: 'active',
    leaderId: 'C005', // 墨殿主
    stanceToMC: 'hostile',
    goals: ['维持墨殿统治', '垄断高级符文', '镇压一切异端'],
    resources: ['最高权力', '庞大的执法队伍', '古代禁术'],
    internalConflict: '内部腐败严重，多位长老暗中争权夺利',
  },
  {
    name: '散修联盟',
    type: '松散组织',
    status: 'active',
    stanceToMC: 'neutral',
    goals: ['争取散修权益', '对抗宗门歧视', '互助共享资源'],
    resources: ['数量众多', '分布广泛', '信息网络'],
    internalConflict: '内部派系林立，缺乏统一领导',
  },
];

// Timeline Events - 5 events
export const demoTimelineEvents: CreateTimelineEventInput[] = [
  {
    eventDate: '百年前',
    description: '墨海异变，大量修士死亡。白霜为封印异变源头，自我封印百年。',
    relatedCharacters: ['C004'],
    relatedLocations: ['L003'],
  },
  {
    eventDate: '二十年前',
    description: '林墨师父被墨殿以"私藏禁术"罪名处死，林墨开始踏上修炼之路。',
    relatedCharacters: ['C001', 'C005'],
  },
  {
    eventDate: '三年前',
    description: '林墨偶遇白霜，通过考验后拜其为师，开始系统学习古墨道。',
    relatedCharacters: ['C001', 'C004'],
    relatedLocations: ['L001'],
  },
  {
    eventDate: '一年前',
    description: '云阙在墨殿长老的诱导下修炼禁术，堕入魔道，被青云宗驱逐。',
    relatedCharacters: ['C003', 'C005'],
  },
  {
    eventDate: '当前',
    description: '墨殿暗中策划"墨海再启"计划，企图利用墨海中的力量实现永生。',
    relatedCharacters: ['C005'],
    relatedLocations: ['L003', 'L004'],
  },
];

// Arcs - 2 story arcs
export const demoArcs: CreateArcInput[] = [
  {
    name: '寻找真相',
    type: 'main',
    chapterStart: 1,
    chapterEnd: 30,
    status: 'in_progress',
    sections: [
      { name: '起：师父遗愿', chapters: [1, 2, 3, 4, 5], type: '引入', status: 'complete' },
      {
        name: '承：墨殿阴谋',
        chapters: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        type: '发展',
        status: 'in_progress',
      },
      {
        name: '转：墨海试炼',
        chapters: [16, 17, 18, 19, 20, 21, 22, 23],
        type: '转折',
        status: 'planned',
      },
      {
        name: '合：终极对决',
        chapters: [24, 25, 26, 27, 28, 29, 30],
        type: '高潮',
        status: 'planned',
      },
    ],
    characterArcs: {
      C001: '从孤独学徒成长为墨道宗师',
      C002: '从宗门弟子转变为坚定的爱人和战友',
      C003: '从天才少年堕落为魔道修士',
      C004: '从隐世高人到重出江湖，完成救赎',
    },
  },
  {
    name: '禁术诱惑',
    type: 'sub',
    chapterStart: 8,
    chapterEnd: 15,
    status: 'complete',
    mainArcRelation: '云阙堕落推动主角认识到力量的代价，强化主题',
  },
];

// Foreshadowing - 3 items
export const demoForeshadowing: CreateForeshadowingInput[] = [
  {
    content: '白霜的真实身份——他是百年前墨殿的副殿主，因反对当时的殿主而被陷害',
    plantedChapter: 3,
    plantedText: '白霜看到墨殿时眼神复杂，喃喃自语："百年了..."',
    plannedPayoff: 28,
    term: 'long',
  },
  {
    content: '墨海深处的秘密——封印着上古墨帝的残魂，墨殿主想夺取其力量',
    plantedChapter: 5,
    plantedText: '林墨在梦中听到墨海深处传来呼唤："后辈...救我..."',
    plannedPayoff: 18,
    term: 'mid',
  },
  {
    content: '苏澜的血脉秘密——她是上古墨族皇室后裔，血液可以净化墨力',
    plantedChapter: 10,
    plantedText: '苏澜的血滴在林墨的墨玉葫芦上，葫芦发出耀眼的金光',
    plannedPayoff: 12,
    term: 'short',
  },
];

// Hooks - 4 hooks
export const demoHooks: CreateHookInput[] = [
  {
    type: 'opening',
    content: '师父临终前留下一块神秘的墨符，上面写着："真相在墨海深处，小心墨殿。"',
    hookType: 'mystery',
    strength: 95,
  },
  {
    type: 'arc',
    chapterId: 7,
    content: '林墨在墨海边缘听到了师父的声音："徒儿，快逃！他们要杀你！" 但师父已经死了两年...',
    hookType: 'suspense',
    strength: 90,
  },
  {
    type: 'chapter',
    chapterId: 7,
    content: '云阙转身离去的瞬间，林墨看到他的眼中闪过诡异的红光，仿佛不再是人类的眼睛。',
    hookType: 'anticipation',
    strength: 85,
  },
  {
    type: 'chapter',
    chapterId: 15,
    content:
      '墨殿主摘下面具，露出的竟然是...（章末悬念）下一章揭晓：原来是已经死去百年的前代墨帝！',
    hookType: 'suspense',
    strength: 98,
  },
];

/**
 * Seed the database with demo data
 *
 * Usage:
 *   pnpm seed:demo                    # Seeds to ~/.inxtone/data.db (dev server database)
 *   DB_PATH=inxtone.db pnpm seed:demo # Seeds to custom path
 */
export async function seedDemoStory(dbPath?: string): Promise<void> {
  // Dynamic imports to avoid circular dependencies
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

  // Use provided path, env var, or default to ~/.inxtone/data.db (same as dev server)
  const finalDbPath =
    dbPath ?? process.env.DB_PATH ?? path.join(os.homedir(), '.inxtone', 'data.db');

  // Ensure directory exists
  const dbDir = path.dirname(finalDbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  console.log('🌱 Starting demo story seed...');
  console.log(`📁 Database: ${finalDbPath}\n`);

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
    // 1. World Settings (power system + social rules)
    console.log('📚 Creating world settings...');
    await service.updateWorld({
      powerSystem: demoPowerSystem,
      socialRules: demoSocialRules,
    });
    console.log('✅ World settings created\n');

    // 2. Characters
    console.log('👥 Creating characters...');
    const characterIdMap = new Map<string, string>();
    for (let i = 0; i < demoCharacters.length; i++) {
      const char = demoCharacters[i];
      if (!char) continue;
      const created = await service.createCharacter(char);
      const placeholderId = `C${String(i + 1).padStart(3, '0')}`; // C001, C002, etc.
      characterIdMap.set(placeholderId, created.id);
      console.log(`  ✓ ${char.name} (${placeholderId} -> ${created.id})`);
    }
    console.log('✅ Characters created\n');

    // 3. Locations
    console.log('📍 Creating locations...');
    const locationIdMap = new Map<string, string>();
    for (let i = 0; i < demoLocations.length; i++) {
      const loc = demoLocations[i];
      if (!loc) continue;
      const created = await service.createLocation(loc);
      const placeholderId = `L${String(i + 1).padStart(3, '0')}`; // L001, L002, etc.
      locationIdMap.set(placeholderId, created.id);
      console.log(`  ✓ ${loc.name} (${placeholderId} -> ${created.id})`);
    }
    console.log('✅ Locations created\n');

    // 4. Relationships (with ID substitution)
    console.log('🔗 Creating relationships...');
    for (const rel of demoRelationships) {
      const sourceId = characterIdMap.get(rel.sourceId);
      const targetId = characterIdMap.get(rel.targetId);

      if (!sourceId || !targetId) {
        console.warn(
          `  ⚠️  Skipping relationship ${rel.sourceId} -> ${rel.targetId}: character not found`
        );
        continue;
      }

      await service.createRelationship({
        ...rel,
        sourceId,
        targetId,
      });
      console.log(`  ✓ ${rel.sourceId} -> ${rel.targetId} (${rel.type})`);
    }
    console.log('✅ Relationships created\n');

    // 5. Factions (with ID substitution for leaderId)
    console.log('⚔️  Creating factions...');
    for (const faction of demoFactions) {
      if (faction.leaderId) {
        const leaderId = characterIdMap.get(faction.leaderId);
        if (!leaderId) {
          console.warn(
            `  ⚠️  Skipping faction ${faction.name}: leader ${faction.leaderId} not found`
          );
          continue;
        }
        await service.createFaction({
          ...faction,
          leaderId,
        });
        console.log(`  ✓ ${faction.name} (leader: ${faction.leaderId})`);
      } else {
        await service.createFaction(faction);
        console.log(`  ✓ ${faction.name}`);
      }
    }
    console.log('✅ Factions created\n');

    // 6. Timeline Events (with ID substitution)
    console.log('📅 Creating timeline events...');
    for (const event of demoTimelineEvents) {
      const relatedCharacters = event.relatedCharacters
        ?.map((id) => characterIdMap.get(id))
        .filter((id): id is string => id !== undefined);

      const relatedLocations = event.relatedLocations
        ?.map((id) => locationIdMap.get(id))
        .filter((id): id is string => id !== undefined);

      await service.createTimelineEvent({
        ...(event.eventDate ? { eventDate: event.eventDate } : {}),
        description: event.description,
        ...(relatedCharacters && relatedCharacters.length > 0 ? { relatedCharacters } : {}),
        ...(relatedLocations && relatedLocations.length > 0 ? { relatedLocations } : {}),
      });
      console.log(`  ✓ ${event.eventDate}: ${event.description.slice(0, 40)}...`);
    }
    console.log('✅ Timeline events created\n');

    // 7. Arcs
    console.log('🎬 Creating story arcs...');
    for (const arc of demoArcs) {
      await service.createArc(arc);
      console.log(`  ✓ ${arc.name} (${arc.type})`);
    }
    console.log('✅ Story arcs created\n');

    // 8. Foreshadowing
    console.log('🔮 Creating foreshadowing...');
    for (const foreshadow of demoForeshadowing) {
      await service.createForeshadowing(foreshadow);
      console.log(`  ✓ ${foreshadow.content.slice(0, 40)}... (${foreshadow.term})`);
    }
    console.log('✅ Foreshadowing created\n');

    // 9. Hooks
    console.log('🎣 Creating hooks...');
    for (const hook of demoHooks) {
      await service.createHook(hook);
      console.log(`  ✓ ${hook.type}: ${hook.content.slice(0, 40)}...`);
    }
    console.log('✅ Hooks created\n');

    console.log('🎉 Demo story "墨渊记 Ink Abyss Chronicles" seed completed!');
    console.log(`\n📦 Data saved to: ${finalDbPath}`);
    console.log('\nExplore the data:');
    console.log('  • Web UI: pnpm dev → http://localhost:5173/bible');
    console.log('  • CLI: inxtone bible list');
    console.log('  • CLI: inxtone bible show character C001\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoStory().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
