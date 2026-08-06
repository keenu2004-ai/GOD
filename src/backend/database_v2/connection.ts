import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
export type { PoolClient } from 'pg';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean | object;
}

class DatabaseConnectionManager {
  private pool: pg.Pool;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private config: DatabaseConfig;

  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '100', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      max: this.config.maxConnections,
      idleTimeoutMillis: this.config.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.connectionTimeoutMillis,
    });
  }

  public getPool(): pg.Pool {
    return this.pool;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      console.log('[DatabaseV2 Engine] Bootstrapping PostgreSQL enterprise architecture...');

      const { initializeEnterpriseSchema } = await import('./schema.js');
      await initializeEnterpriseSchema();

      const { initializeIndexes } = await import('./indexes.js');
      await initializeIndexes();

      const { initializeConstraints } = await import('./constraints.js');
      await initializeConstraints();

      const { initializeTriggersAndFunctions } = await import('./triggers.js');
      await initializeTriggersAndFunctions();

      const { initializeViews } = await import('./views.js');
      await initializeViews();

      const { seedEnterpriseDatabase } = await import('./seed.js');
      await seedEnterpriseDatabase();

      this.isInitialized = true;
      console.log('[DatabaseV2 Engine] PostgreSQL enterprise architecture operational.');
    })();

    return this.initPromise;
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const startTime = Date.now();
    try {
      const result = await this.pool.query(sql, params);
      const executionTimeMs = Date.now() - startTime;

      if (executionTimeMs > 200) {
        console.warn(`[DatabaseV2 Slow Query] (${executionTimeMs}ms): ${sql.substring(0, 100)}...`);
      }

      return {
        rows: (result.rows as T[]) || [],
        rowCount: result.rowCount ?? (result.rows ? result.rows.length : 0),
      };
    } catch (error: any) {
      console.error(`[DatabaseV2 Query Error]: ${error.message} | Query: ${sql}`);
      throw error;
    }
  }

  async exec(sql: string): Promise<void> {
    await this.query(sql);
  }

  async transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<{ status: string; latencyMs: number; poolInfo: DatabaseConfig; version?: string }> {
    const startTime = Date.now();
    try {
      const result = await this.query<{ version: string }>('SELECT version();');
      const latencyMs = Date.now() - startTime;

      return {
        status: result.rows.length > 0 ? 'HEALTHY' : 'UNHEALTHY',
        latencyMs,
        poolInfo: this.config,
        version: result.rows[0]?.version,
      };
    } catch (error: any) {
      return {
        status: 'UNHEALTHY',
        latencyMs: Date.now() - startTime,
        poolInfo: this.config,
      };
    }
  }

  async shutdown(): Promise<void> {
    console.log('[DatabaseV2 Engine] Gracefully shutting down PostgreSQL connection pool...');
    await this.pool.end();
    this.isInitialized = false;
  }
}

export const dbConnectionV2 = new DatabaseConnectionManager();
export default dbConnectionV2;
