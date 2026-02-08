/**
 * Bible Command
 *
 * Browse and search Story Bible content via CLI
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
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

/**
 * Valid entity types for bible commands
 */
const ENTITY_TYPES = [
  'characters',
  'relationships',
  'locations',
  'factions',
  'timeline',
  'arcs',
  'foreshadowing',
  'hooks',
] as const;

type EntityType = (typeof ENTITY_TYPES)[number];

/**
 * Initialize StoryBibleService from current project
 */
function initService(): IStoryBibleService {
  const dbPath = path.join(process.cwd(), 'inxtone.db');

  if (!fs.existsSync(dbPath)) {
    console.error(chalk.red('Error: Not an Inxtone project directory'));
    console.error(chalk.gray('Run this command from a project directory containing inxtone.db'));
    process.exit(1);
  }

  const db = new Database({ path: dbPath, migrate: false });
  db.connect();

  const eventBus = new EventBus();

  return new StoryBibleService({
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
}

/**
 * List entities of a given type
 */
export async function bibleList(type?: string): Promise<void> {
  const service = initService();

  // If no type specified, show summary of all types
  if (!type) {
    console.log(chalk.bold.cyan('\n📚 Story Bible Overview\n'));

    const characters = await service.getAllCharacters();
    const locations = await service.getAllLocations();
    const factions = await service.getAllFactions();
    const arcs = await service.getAllArcs();
    const foreshadowing = await service.getAllForeshadowing();
    const hooks = await service.getAllHooks();

    console.log(chalk.white('  Characters:    ') + chalk.yellow(characters.length));
    console.log(chalk.white('  Locations:     ') + chalk.yellow(locations.length));
    console.log(chalk.white('  Factions:      ') + chalk.yellow(factions.length));
    console.log(chalk.white('  Arcs:          ') + chalk.yellow(arcs.length));
    console.log(chalk.white('  Foreshadowing: ') + chalk.yellow(foreshadowing.length));
    console.log(chalk.white('  Hooks:         ') + chalk.yellow(hooks.length));

    console.log(
      chalk.gray('\nRun ') +
        chalk.cyan('inxtone bible list <type>') +
        chalk.gray(' for details (e.g., characters, locations)')
    );
    console.log();
    return;
  }

  // Validate type
  if (!ENTITY_TYPES.includes(type as EntityType)) {
    console.error(chalk.red(`Error: Unknown type "${type}"`));
    console.error(chalk.gray(`Valid types: ${ENTITY_TYPES.join(', ')}`));
    process.exit(1);
  }

  // List entities by type
  switch (type as EntityType) {
    case 'characters': {
      const characters = await service.getAllCharacters();
      console.log(chalk.bold.cyan(`\n👤 Characters (${characters.length})\n`));

      if (characters.length === 0) {
        console.log(chalk.gray('  No characters yet'));
      } else {
        characters.forEach((char) => {
          const roleColor = char.role === 'main' ? chalk.yellow : chalk.gray;
          console.log(
            `  ${chalk.bold(char.id)} ${chalk.white(char.name)} ${roleColor(`[${char.role}]`)}`
          );
          if (char.template) {
            console.log(chalk.gray(`    Template: ${char.template}`));
          }
        });
      }
      break;
    }

    case 'relationships': {
      const relationships = await service.getAllRelationships();
      const characters = await service.getAllCharacters();
      const charMap = new Map(characters.map((c) => [c.id, c.name]));

      console.log(chalk.bold.cyan(`\n🔗 Relationships (${relationships.length})\n`));

      if (relationships.length === 0) {
        console.log(chalk.gray('  No relationships yet'));
      } else {
        relationships.forEach((rel) => {
          const sourceName = charMap.get(rel.sourceId) ?? rel.sourceId;
          const targetName = charMap.get(rel.targetId) ?? rel.targetId;
          console.log(
            `  ${chalk.white(sourceName)} ${chalk.gray('→')} ${chalk.white(targetName)} ${chalk.yellow(`[${rel.type}]`)}`
          );
        });
      }
      break;
    }

    case 'locations': {
      const locations = await service.getAllLocations();
      console.log(chalk.bold.cyan(`\n📍 Locations (${locations.length})\n`));

      if (locations.length === 0) {
        console.log(chalk.gray('  No locations yet'));
      } else {
        locations.forEach((loc) => {
          console.log(`  ${chalk.bold(loc.id)} ${chalk.white(loc.name)}`);
          if (loc.type) {
            console.log(chalk.gray(`    Type: ${loc.type}`));
          }
        });
      }
      break;
    }

    case 'factions': {
      const factions = await service.getAllFactions();
      console.log(chalk.bold.cyan(`\n🛡️  Factions (${factions.length})\n`));

      if (factions.length === 0) {
        console.log(chalk.gray('  No factions yet'));
      } else {
        factions.forEach((faction) => {
          const stanceColor =
            faction.stanceToMC === 'friendly'
              ? chalk.green
              : faction.stanceToMC === 'hostile'
                ? chalk.red
                : chalk.gray;
          console.log(`  ${chalk.bold(faction.id)} ${chalk.white(faction.name)}`);
          if (faction.stanceToMC) {
            console.log(stanceColor(`    Stance: ${faction.stanceToMC}`));
          }
        });
      }
      break;
    }

    case 'timeline': {
      const events = await service.getTimelineEvents();
      console.log(chalk.bold.cyan(`\n⏱️  Timeline Events (${events.length})\n`));

      if (events.length === 0) {
        console.log(chalk.gray('  No timeline events yet'));
      } else {
        events.forEach((event) => {
          console.log(`  ${chalk.white(event.description)}`);
          if (event.eventDate) {
            console.log(chalk.gray(`    Date: ${event.eventDate}`));
          }
        });
      }
      break;
    }

    case 'arcs': {
      const arcs = await service.getAllArcs();
      console.log(chalk.bold.cyan(`\n📖 Story Arcs (${arcs.length})\n`));

      if (arcs.length === 0) {
        console.log(chalk.gray('  No arcs yet'));
      } else {
        arcs.forEach((arc) => {
          const typeColor = arc.type === 'main' ? chalk.yellow : chalk.gray;
          console.log(
            `  ${chalk.bold(arc.id)} ${chalk.white(arc.name)} ${typeColor(`[${arc.type}]`)}`
          );
          console.log(chalk.gray(`    Status: ${arc.status} | Progress: ${arc.progress}%`));
        });
      }
      break;
    }

    case 'foreshadowing': {
      const items = await service.getAllForeshadowing();
      console.log(chalk.bold.cyan(`\n🔮 Foreshadowing (${items.length})\n`));

      if (items.length === 0) {
        console.log(chalk.gray('  No foreshadowing yet'));
      } else {
        items.forEach((item) => {
          const statusColor =
            item.status === 'active'
              ? chalk.green
              : item.status === 'resolved'
                ? chalk.blue
                : chalk.gray;
          console.log(`  ${chalk.bold(item.id)} ${statusColor(item.status)}`);
          const preview =
            item.content.length > 60 ? `${item.content.slice(0, 60)}...` : item.content;
          console.log(chalk.gray(`    ${preview}`));
        });
      }
      break;
    }

    case 'hooks': {
      const hooks = await service.getAllHooks();
      console.log(chalk.bold.cyan(`\n🪝 Hooks (${hooks.length})\n`));

      if (hooks.length === 0) {
        console.log(chalk.gray('  No hooks yet'));
      } else {
        hooks.forEach((hook) => {
          console.log(
            `  ${chalk.bold(hook.id)} ${chalk.yellow(`[${hook.type}]`)} ${hook.hookType ? chalk.gray(`(${hook.hookType})`) : ''}`
          );
          const preview =
            hook.content.length > 60 ? `${hook.content.slice(0, 60)}...` : hook.content;
          console.log(chalk.gray(`    ${preview}`));
        });
      }
      break;
    }
  }

  console.log(); // Empty line at end
}

/**
 * Show detailed information about a specific entity
 */
export async function bibleShow(type: string, id: string): Promise<void> {
  const service = initService();

  // Validate type
  if (!ENTITY_TYPES.includes(type as EntityType)) {
    console.error(chalk.red(`Error: Unknown type "${type}"`));
    console.error(chalk.gray(`Valid types: ${ENTITY_TYPES.join(', ')}`));
    process.exit(1);
  }

  switch (type as EntityType) {
    case 'characters': {
      const char = await service.getCharacter(id);
      if (!char) {
        console.error(chalk.red(`Error: Character "${id}" not found`));
        process.exit(1);
      }

      console.log(chalk.bold.cyan(`\n👤 ${char.name}\n`));
      console.log(chalk.gray('ID:       ') + chalk.white(char.id));
      console.log(chalk.gray('Role:     ') + chalk.yellow(char.role));

      if (char.template) {
        console.log(chalk.gray('Template: ') + chalk.white(char.template));
      }

      if (char.appearance) {
        console.log(chalk.gray('\nAppearance:\n') + chalk.white(`  ${char.appearance}`));
      }

      if (char.motivation) {
        console.log(chalk.bold.cyan('\nMotivation:'));
        if (char.motivation.surface) {
          console.log(chalk.gray('  Surface: ') + chalk.white(char.motivation.surface));
        }
        if (char.motivation.hidden) {
          console.log(chalk.gray('  Hidden:  ') + chalk.white(char.motivation.hidden));
        }
        if (char.motivation.core) {
          console.log(chalk.gray('  Core:    ') + chalk.white(char.motivation.core));
        }
      }

      if (char.voiceSamples && char.voiceSamples.length > 0) {
        console.log(chalk.bold.cyan('\nVoice Samples:'));
        char.voiceSamples.forEach((sample) => {
          console.log(chalk.gray('  • ') + chalk.white(`"${sample}"`));
        });
      }

      break;
    }

    case 'locations': {
      const loc = await service.getLocation(id);
      if (!loc) {
        console.error(chalk.red(`Error: Location "${id}" not found`));
        process.exit(1);
      }

      console.log(chalk.bold.cyan(`\n📍 ${loc.name}\n`));
      console.log(chalk.gray('ID:   ') + chalk.white(loc.id));
      if (loc.type) {
        console.log(chalk.gray('Type: ') + chalk.white(loc.type));
      }

      if (loc.significance) {
        console.log(chalk.gray('\nSignificance:\n') + chalk.white(`  ${loc.significance}`));
      }

      if (loc.atmosphere) {
        console.log(chalk.gray('\nAtmosphere:\n') + chalk.white(`  ${loc.atmosphere}`));
      }

      break;
    }

    case 'factions': {
      const faction = await service.getFaction(id);
      if (!faction) {
        console.error(chalk.red(`Error: Faction "${id}" not found`));
        process.exit(1);
      }

      console.log(chalk.bold.cyan(`\n🛡️  ${faction.name}\n`));
      console.log(chalk.gray('ID:     ') + chalk.white(faction.id));
      if (faction.type) {
        console.log(chalk.gray('Type:   ') + chalk.white(faction.type));
      }
      if (faction.status) {
        console.log(chalk.gray('Status: ') + chalk.white(faction.status));
      }
      if (faction.stanceToMC) {
        const stanceColor =
          faction.stanceToMC === 'friendly'
            ? chalk.green
            : faction.stanceToMC === 'hostile'
              ? chalk.red
              : chalk.gray;
        console.log(chalk.gray('Stance: ') + stanceColor(faction.stanceToMC));
      }

      if (faction.goals && faction.goals.length > 0) {
        console.log(chalk.bold.cyan('\nGoals:'));
        faction.goals.forEach((goal) => {
          console.log(chalk.gray('  • ') + chalk.white(goal));
        });
      }

      break;
    }

    case 'arcs': {
      const arc = await service.getArc(id);
      if (!arc) {
        console.error(chalk.red(`Error: Arc "${id}" not found`));
        process.exit(1);
      }

      console.log(chalk.bold.cyan(`\n📖 ${arc.name}\n`));
      console.log(chalk.gray('ID:       ') + chalk.white(arc.id));
      console.log(chalk.gray('Type:     ') + chalk.yellow(arc.type));
      console.log(chalk.gray('Status:   ') + chalk.white(arc.status));
      console.log(chalk.gray('Progress: ') + chalk.white(`${arc.progress}%`));

      if (arc.chapterStart || arc.chapterEnd) {
        console.log(
          chalk.gray('Chapters: ') +
            chalk.white(`${arc.chapterStart ?? '?'} → ${arc.chapterEnd ?? '?'}`)
        );
      }

      break;
    }

    case 'foreshadowing': {
      const item = await service.getForeshadowing(id);
      if (!item) {
        console.error(chalk.red(`Error: Foreshadowing "${id}" not found`));
        process.exit(1);
      }

      console.log(chalk.bold.cyan(`\n🔮 Foreshadowing ${item.id}\n`));
      console.log(chalk.gray('Status: ') + chalk.white(item.status));
      if (item.term) {
        console.log(chalk.gray('Term:   ') + chalk.white(item.term));
      }

      console.log(chalk.bold.cyan('\nContent:'));
      console.log(chalk.white(`  ${item.content}`));

      if (item.plantedChapter) {
        console.log(chalk.gray('\nPlanted: ') + chalk.white(`Chapter ${item.plantedChapter}`));
      }
      if (item.plannedPayoff) {
        console.log(chalk.gray('Payoff:  ') + chalk.white(`Chapter ${item.plannedPayoff}`));
      }

      break;
    }

    case 'hooks': {
      const hook = await service.getHook(id);
      if (!hook) {
        console.error(chalk.red(`Error: Hook "${id}" not found`));
        process.exit(1);
      }

      console.log(chalk.bold.cyan(`\n🪝 Hook ${hook.id}\n`));
      console.log(chalk.gray('Type: ') + chalk.yellow(hook.type));
      if (hook.hookType) {
        console.log(chalk.gray('Style: ') + chalk.white(hook.hookType));
      }
      if (hook.strength) {
        console.log(chalk.gray('Strength: ') + chalk.white(`${hook.strength}/100`));
      }

      console.log(chalk.bold.cyan('\nContent:'));
      console.log(chalk.white(`  ${hook.content}`));

      break;
    }

    default:
      console.error(chalk.red(`Error: 'show' not yet implemented for type "${type}"`));
      process.exit(1);
  }

  console.log(); // Empty line at end
}

/**
 * Search Story Bible content
 */
export async function bibleSearch(query: string): Promise<void> {
  const service = initService();

  console.log(chalk.bold.cyan(`\n🔍 Searching for "${query}"...\n`));

  // Search characters
  const characters = await service.searchCharacters(query);
  if (characters.length > 0) {
    console.log(chalk.bold.yellow(`👤 Characters (${characters.length})`));
    characters.forEach((char) => {
      console.log(
        `  ${chalk.bold(char.id)} ${chalk.white(char.name)} ${chalk.gray(`[${char.role}]`)}`
      );
    });
    console.log();
  }

  // Search locations
  const locations = (await service.getAllLocations()).filter(
    (loc) =>
      loc.name.toLowerCase().includes(query.toLowerCase()) ||
      loc.significance?.toLowerCase().includes(query.toLowerCase())
  );
  if (locations.length > 0) {
    console.log(chalk.bold.yellow(`📍 Locations (${locations.length})`));
    locations.forEach((loc) => {
      console.log(`  ${chalk.bold(loc.id)} ${chalk.white(loc.name)}`);
    });
    console.log();
  }

  // Search factions
  const factions = (await service.getAllFactions()).filter((faction) =>
    faction.name.toLowerCase().includes(query.toLowerCase())
  );
  if (factions.length > 0) {
    console.log(chalk.bold.yellow(`🛡️  Factions (${factions.length})`));
    factions.forEach((faction) => {
      console.log(`  ${chalk.bold(faction.id)} ${chalk.white(faction.name)}`);
    });
    console.log();
  }

  const totalResults = characters.length + locations.length + factions.length;

  if (totalResults === 0) {
    console.log(chalk.gray('No results found'));
  } else {
    console.log(chalk.green(`Found ${totalResults} result(s)`));
  }

  console.log();
}
