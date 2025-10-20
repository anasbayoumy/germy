import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { config } from './env';

export const client = new Client({ connectionString: config.databaseUrl });
export const db = drizzle(client);

export async function connectDatabase() {
  await client.connect();
}

export async function execute(query: string, params: any[] = []) {
  const result = await client.query(query, params);
  return { rows: result.rows };
}


