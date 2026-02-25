/**
 * Supabase REST API 客户端
 * 用于通过 HTTP API 访问 Supabase
 * 
 * 安全说明：
 * - 服务端应使用 SERVICE_ROLE_KEY（环境变量：SUPABASE_SERVICE_ROLE_KEY）
 * - SERVICE_ROLE_KEY 拥有完全权限，绕过 RLS
 * - 不要将 SERVICE_ROLE_KEY 暴露给前端
 */

interface SupabaseConfig {
  url: string;
  apiKey: string;
  useServiceRole?: boolean;
}

function getConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  // 优先使用 SERVICE_ROLE_KEY（服务端）
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // 如果没有 SERVICE_ROLE_KEY，降级使用 ANON_KEY（不推荐用于生产环境）
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  if (!serviceRoleKey && !anonKey) {
    throw new Error('Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is set');
  }

  // 使用 SERVICE_ROLE_KEY（如果可用），否则使用 ANON_KEY
  const apiKey = serviceRoleKey || anonKey!;
  const useServiceRole = !!serviceRoleKey;

  // 如果使用 ANON_KEY，发出警告
  if (!useServiceRole && process.env.NODE_ENV === 'production') {
    console.warn(
      '[SECURITY WARNING] Using ANON_KEY in production environment. ' +
      'Please set SUPABASE_SERVICE_ROLE_KEY for better security.'
    );
  }

  return { url, apiKey, useServiceRole };
}

/**
 * 从 Supabase 表中查询数据
 */
export async function supabaseQuery<T = any>(
  table: string,
  options: {
    select?: string;
    filter?: Record<string, any>;
    limit?: number;
    offset?: number;
    order?: {
      column: string;
      ascending?: boolean;
    };
  } = {}
): Promise<T[]> {
  const { url, apiKey } = getConfig();

  const queryParams = new URLSearchParams();

  // SELECT
  queryParams.append('select', options.select || '*');

  // WHERE filters
  if (options.filter) {
    Object.entries(options.filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'string' && value.startsWith('neq.')) {
          // Not equal: neq.value
          queryParams.append(`${key}`, `neq.${value.substring(4)}`);
        } else if (typeof value === 'string' && value.startsWith('gt.')) {
          // Greater than: gt.value
          queryParams.append(`${key}`, `gt.${value.substring(3)}`);
        } else if (typeof value === 'string' && value.startsWith('lt.')) {
          // Less than: lt.value
          queryParams.append(`${key}`, `lt.${value.substring(3)}`);
        } else if (typeof value === 'string' && value.startsWith('gte.')) {
          // Greater than or equal: gte.value
          queryParams.append(`${key}`, `gte.${value.substring(4)}`);
        } else if (typeof value === 'string' && value.startsWith('lte.')) {
          // Less than or equal: lte.value
          queryParams.append(`${key}`, `lte.${value.substring(4)}`);
        } else if (typeof value === 'string' && value.startsWith('like.')) {
          // Like: like.value
          queryParams.append(`${key}`, `like.${value.substring(5)}`);
        } else if (typeof value === 'string' && value.startsWith('in.')) {
          // In: in.value1,value2,value3
          queryParams.append(`${key}`, `in.(${value.substring(3)})`);
        } else if (Array.isArray(value)) {
          // IN clause
          queryParams.append(`${key}`, `in.(${value.join(',')})`);
        } else {
          // Equals
          queryParams.append(`${key}`, `eq.${value}`);
        }
      }
    });
  }

  // LIMIT
  if (options.limit) {
    queryParams.append('limit', String(options.limit));
  }

  // OFFSET
  if (options.offset) {
    queryParams.append('offset', String(options.offset));
  }

  // ORDER BY
  if (options.order) {
    queryParams.append('order', `${options.order.column}.${options.order.ascending ? 'asc' : 'desc'}`);
  }

  const response = await fetch(`${url}/rest/v1/${table}?${queryParams.toString()}`, {
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept-Profile': 'public',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase query failed: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * 查询单条数据
 */
export async function supabaseQueryOne<T = any>(
  table: string,
  options: {
    select?: string;
    filter?: Record<string, any>;
  } = {}
): Promise<T | null> {
  const rows = await supabaseQuery<T>(table, {
    ...options,
    limit: 1,
  });

  return rows.length > 0 ? rows[0] : null;
}

/**
 * 插入数据
 */
export async function supabaseInsert<T = any>(
  table: string,
  data: any
): Promise<T> {
  const { url, apiKey } = getConfig();

  const response = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'Accept-Profile': 'public',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase insert failed: ${response.status} ${error}`);
  }

  const rows = await response.json();
  return rows[0];
}

/**
 * 更新数据
 */
export async function supabaseUpdate<T = any>(
  table: string,
  data: any,
  filter: Record<string, any>
): Promise<T[]> {
  const { url, apiKey } = getConfig();

  const queryParams = new URLSearchParams();

  // WHERE filters
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(`${key}`, `eq.${value}`);
    }
  });

  const response = await fetch(`${url}/rest/v1/${table}?${queryParams.toString()}`, {
    method: 'PATCH',
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'Accept-Profile': 'public',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase update failed: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * 执行事务（使用 Supabase RPC）
 */
export async function supabaseRpc<T = any>(
  functionName: string,
  params?: any[]
): Promise<T> {
  const { url, apiKey } = getConfig();

  const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params || {}),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase RPC failed: ${response.status} ${error}`);
  }

  return response.json();
}
