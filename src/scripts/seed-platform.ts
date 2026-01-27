import 'dotenv/config';
import { AppContainer } from '@/core/app-container';
import { loadDatabaseModule } from '@/infrastructure/database/database.module';
import { loadAnalyticsModule } from '@/infrastructure/analytics/analytics.module';
import { loadManagerModule } from '@/core/managers/manager.module';
import { CatalogManager } from '@/core/managers/catalog.manager';
import { CommandRegistryService } from '@/discord/commands/command-registry.service';
import { loadCommands } from '@/discord/commands/command.loader';
import { ConfigService } from '@/infrastructure/config/config.service';
import { StatsProvider } from '@/discord/providers/stats.provider';
import { 
  DEFAULT_TIERS, 
  DEFAULT_FEATURES, 
  COMMAND_FEATURE_MAP 
} from '@/core/constants/catalog-defaults';
import { createLogger } from '@/infrastructure/logging/logger';

async function main() {
  const container = AppContainer.getInstance();
  const configService = new ConfigService();
  
  const logger = createLogger(configService.get().logLevel).child({ service: 'Seeder' });

  container.register(ConfigService, configService);
  loadDatabaseModule(container);
  loadAnalyticsModule(container); 
  loadManagerModule(container);

  container.register(StatsProvider, new StatsProvider());

  const commandRegistry = new CommandRegistryService();
  container.register(CommandRegistryService, commandRegistry);

  loadCommands(commandRegistry);
  const commands = commandRegistry.getAll();

  logger.info('Starting platform seeding...');

   const catalogManager = container.get(CatalogManager);

  try {
    for (const tier of DEFAULT_TIERS) {
      try {
        await catalogManager.createTier(tier);
        logger.info(`Tier ensured: ${tier.name}`);
      } catch (e: any) {
        logger.debug(`Tier ${tier.name} skip: ${e.message}`);
      }
    }
    
   

    for (const feat of DEFAULT_FEATURES) {
      try {
        await catalogManager.createFeature({
          code: feat.code,
          name: feat.name,
          description: feat.description,
        });
        logger.info(`Feature ensured: ${feat.name}`);
      } catch (e: any) {
        logger.debug(`Feature ${feat.name} skip: ${e.message}`);
      }

      for (const tierName of feat.tiers) {
        try {
          await catalogManager.linkFeatureToTier({
            featureCode: feat.code,
            tierName: tierName,
          });
          logger.info(`Linked feature ${feat.code} to tier ${tierName}`);
        } catch (e: any) {
          logger.debug(`Link ${feat.code} <-> ${tierName} skip: ${e.message}`);
        }
      }
    }

    for (const cmd of commands) {
      const commandName = cmd.data.name;
      const featureCode = COMMAND_FEATURE_MAP[commandName] || 'core';
      
      const description = (cmd.data as any).description || 'No description provided.';
      
      await catalogManager.registerCommand({
        commandName: commandName,
        featureCode: featureCode,
        description: description,
      });
      logger.info(`Command registered: /${commandName} -> [${featureCode}]`);
    }

    logger.info('Platform seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Seeding failed');
    process.exit(1);
  }
}

main();