/**
 * 代收任务支付平台签名工具函数
 * 用于生成和验证NEQUPAY支付平台的签名
 */

import { createHash } from 'crypto';

/**
 * 签名参数接口
 */
export interface SignParams {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * 生成签名
 * @param params 签名参数对象
 * @param key 商户私钥
 * @returns 签名字符串（大写MD5）
 */
export function generateSignature(params: SignParams | Record<string, any>, key: string): string {
  // 1. 过滤掉值为空的参数和sign参数
  const filteredParams: Record<string, string> = {};

  Object.keys(params)
    .sort() // 按参数名ASCII码从小到大排序（字典序）
    .forEach((paramName) => {
      // 跳过sign参数
      if (paramName.toLowerCase() === 'sign') {
        return;
      }

      const value = params[paramName];

      // 跳过值为空、null、undefined的参数
      if (value === null || value === undefined || value === '') {
        return;
      }

      // 将值转换为字符串
      filteredParams[paramName] = String(value);
    });

  // 2. 拼接成URL键值对格式：key1=value1&key2=value2...
  const stringA = Object.entries(filteredParams)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // 3. 拼接key：stringA + "&key=" + key
  const stringSignTemp = `${stringA}&key=${key}`;

  // 4. MD5运算并转为大写
  const hash = createHash('md5');
  hash.update(stringSignTemp);
  const signValue = hash.digest('hex').toUpperCase();

  return signValue;
}

/**
 * 验证签名
 * @param params 签名参数对象（包含sign字段）
 * @param key 商户私钥
 * @returns 签名是否有效
 */
export function verifySignature(params: SignParams | Record<string, any>, key: string): boolean {
  const sign = params.sign as string;

  if (!sign) {
    return false;
  }

  // 生成签名
  const calculatedSign = generateSignature(params, key);

  // 比较签名（不区分大小写）
  return calculatedSign.toLowerCase() === sign.toLowerCase();
}

/**
 * 生成商户订单号
 * @param prefix 订单号前缀（默认：PAYIN）
 * @param timestamp 时间戳（默认：当前时间）
 * @returns 商户订单号
 */
export function generateMchOrderNo(prefix: string = 'PAYIN', timestamp: number = Date.now()): string {
  // 生成一个6位随机数
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${prefix}${timestamp}${random}`;
}
