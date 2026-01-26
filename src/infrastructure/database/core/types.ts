import * as schema from '@/infrastructure/database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTransaction } from 'drizzle-orm/pg-core';
import { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import { ExtractTablesWithRelations } from 'drizzle-orm';

// This type allows our services to accept either the main DB instance OR an active transaction
export type DbConnection = 
  | NodePgDatabase<typeof schema> 
  | PgTransaction<NodePgQueryResultHKT, typeof schema, ExtractTablesWithRelations<typeof schema>>;