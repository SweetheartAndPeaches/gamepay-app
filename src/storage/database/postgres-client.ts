import { Pool, PoolClient } from 'pg';
import { lookup } from 'dns/promises';

// 创建全局连接池
let pool: Pool | null = null;
let cachedHost: string | null = null;

async function resolveIPv4(hostname: string): Promise<string> {
  // 如果已经缓存了 IPv4 地址，直接返回
  if (cachedHost) {
    return cachedHost;
  }

  // 查询 IPv4 地址
  const { address } = await lookup(hostname, { family: 4 });
  cachedHost = address;
  return address;
}

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set in environment variables');
    }

    // 解析 DATABASE_URL
    const url = new URL(databaseUrl);

    pool = new Pool({
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.substring(1),
      user: url.username,
      password: url.password,
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

  // 确保 DNS 解析为 IPv4
  const databaseUrl = process.env.DATABASE_URL!;
  const url = new URL(databaseUrl);
  await resolveIPv4(url.hostname);

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
