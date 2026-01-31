import { AppContainer } from '@/core/app-container';
import { loadDatabaseModule } from '@/infrastructure/database/database.module';
import { loadAnalyticsModule } from '@/infrastructure/analytics/analytics.module';
import { loadRedisModule } from '@/infrastructure/redis/redis.module';
import { loadServicesModule } from '@/core/services/service.module';
import { loadManagerModule } from '@/core/managers/manager.module';
import { CatalogManager } from '@/core/managers/catalog.manager';
import { CommandRegistryService } from '@/discord/commands/command-registry.service';
import { loadCommands } from '@/discord/commands/command.loader';
import { ConfigService } from '@/infrastructure/config/config.service';
import { StatsProvider } from '@/discord/providers/stats.provider';
import { ChartGeneratorService } from '@/discord/services/chart-generator.service';
import { 
  DEFAULT_TIERS, 
  DEFAULT_FEATURES, 
  COMMAND_FEATURE_MAP 
} from '@/core/constants/catalog-defaults';
import { createLogger } from '@/infrastructure/logging/logger';
import { RedisService } from '@/infrastructure/redis/redis.service';
import { EntitlementService } from '@/core/services/entitlement.service';

async function main() {
  const container = AppContainer.getInstance();
  const configService = new ConfigService();
  
  const logger = createLogger(configService.get().logLevel).child({ service: 'Seeder' });

  container.register(ConfigService, configService);


  loadDatabaseModule(container);
  loadAnalyticsModule(container); 
  loadRedisModule(container);

  const redisService = container.get(RedisService);
  try { 
    await redisService.connect(); 
    logger.info('Connected to Redis.');
  } catch (e) { 
    logger.warn('Redis connection skipped/failed during seed.'); 
  }
  loadServicesModule(container);

  loadManagerModule(container);

  container.register(StatsProvider, new StatsProvider());
  container.register(ChartGeneratorService, new ChartGeneratorService());

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

    logger.info('Refreshing Global Command Cache...');
    const entitlementService = container.get(EntitlementService);
    await entitlementService.warmupGlobalCommands();
    logger.info('Cache refreshed.');

    logger.info('Platform seeding completed successfully.');
    
    await redisService.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Seeding failed');
    process.exit(1);
  }
}

main();