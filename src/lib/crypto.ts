import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * 密码加密
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 生成邀请码
 */
export function generateInviteCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成订单号
 */
export function generateOrderNo(prefix: string = 'ORD'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * 生成随机小数金额（用于代收任务拆分）
 */
export function generateRandomAmount(baseAmount: number, range: number = 0.1): number {
  const randomDecimal = (Math.random() * 2 - 1) * range;
  return Number((baseAmount + randomDecimal).toFixed(2));
}
