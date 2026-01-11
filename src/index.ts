import 'dotenv/config';
import { App } from '@/core/app';

const main = async (): Promise<void> => {
  try {
    const app = new App();
    await app.start();
  } catch (error) {
    console.error('An unhandled error occurred during application startup:', error);
    process.exit(1);
  }
};

main();