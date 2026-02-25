import { Pool, PoolClient } from 'pg';

// 创建全局连接池
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set in environment variables');
    }

    pool = new Pool({
      connectionString: databaseUrl,
      max: 20, // 最大连接数
      idleTimeoutMillis: 30000, // 空闲连接超时时间
      connectionTimeoutMillis: 10000, // 连接超时时间
    });
  }

  return pool;
}

/**
 * 获取 PostgreSQL 客户端
 * 用于直接执行 SQL 查询（绕过 Supabase 的 JWT 验证）
 */
export async function getPostgresClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}

/**
 * 执行 SQL 查询
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = await getPostgresClient();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * 执行 SQL 查询并返回单行
 */
export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * 执行 SQL 查询并返回受影响的行数
 */
export async function execute(
  text: string,
  params?: any[]
): Promise<number> {
  const client = await getPostgresClient();
  try {
    const result = await client.query(text, params);
    return result.rowCount || 0;
  } finally {
    client.release();
  }
}

/**
 * 关闭连接池
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
