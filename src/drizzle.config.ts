import 'dotenv/config';

export default {
  schema: './src/infrastructure/database/schema/index.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
};