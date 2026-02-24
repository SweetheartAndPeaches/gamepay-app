/**
 * 获取当前用户的认证 Token
 * @returns Token 字符串，如果未登录返回 null
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('token');
}

/**
 * 获取当前用户信息
 * @returns 用户对象，如果未登录返回 null
 */
export function getUser() {
  if (typeof window === 'undefined') {
    return null;
  }
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return null;
  }
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Failed to parse user from localStorage:', error);
    return null;
  }
}

/**
 * 检查用户是否已登录
 * @returns true 如果已登录，否则 false
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * 带认证的 fetch 封装
 * 自动在请求头中添加 Authorization: Bearer {token}
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
