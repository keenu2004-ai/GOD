import pkg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

class DatabaseService {
  private pool: pkg.Pool | null = null;
  private isInitialized = false;

  getPool(): pkg.Pool {
    if (!this.pool) {
      const isProduction = process.env.NODE_ENV === 'production';
      const connectionString = process.env.DATABASE_URL;

      if (connectionString) {
        this.pool = new Pool({
          connectionString,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
          ssl: connectionString.includes('sslmode=disable')
            ? false
            : { rejectUnauthorized: false },
        });
      } else {
        this.pool = new Pool({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          database: process.env.DB_NAME || 'theiakshi_hrms',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
        });
      }

      this.pool.on('error', (err) => {
        console.error('[Neon PostgreSQL Pool Error]', err);
      });
    }
    return this.pool;
  }

  async getDb(): Promise<pkg.Pool> {
    const pool = this.getPool();
    if (!this.isInitialized) {
      await this.init();
    }
    return pool;
  }

  private async init() {
    this.isInitialized = true;
    console.log('[PostgreSQL Engine] Initializing PostgreSQL enterprise schema & seed...');
    try {
      const { initializeSchema } = await import('./schema.js');
      await initializeSchema();
      const { seedDatabase } = await import('./seed.js');
      await seedDatabase();
      console.log('[PostgreSQL Engine] Schema & Seed initialized successfully.');
    } catch (err) {
      console.warn('[PostgreSQL Engine Init Warning] Could not auto-seed database (Ensure PostgreSQL server is running):', err);
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[] }> {
    const pool = this.getPool();
    const result = await pool.query(sql, params);
    return { rows: (result.rows as T[]) || [] };
  }

  async exec(sql: string): Promise<void> {
    const pool = this.getPool();
    await pool.query(sql);
  }

  async transaction<T>(callback: (client: pkg.PoolClient) => Promise<T>): Promise<T> {
    const pool = this.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('[PostgreSQL Pool] Connection pool closed.');
    }
  }
}

export const dbService = new DatabaseService();
export default dbService;

