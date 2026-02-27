/**
 * 代收任务支付平台配置
 */

/**
 * 支付方式配置
 */
export interface PaymentWayConfig {
  /** 支付方式代码 */
  wayCode: string;
  /** 货币代码 */
  currency: string;
  /** 显示名称 */
  label: string;
}

/**
 * 支付方式映射表
 * 根据需求文档：
 * - 哥伦比亚固定：COLOMBIA_QR
 * - 秘鲁固定：MILURU_QR
 */
export const PAYMENT_WAYS: Record<string, PaymentWayConfig> = {
  colombia_qr: {
    wayCode: 'COLOMBIA_QR',
    currency: 'COP',
    label: 'Colombia QR',
  },
  peru_qr: {
    wayCode: 'MILURU_QR',
    currency: 'PEN',
    label: 'Peru QR',
  },
  // 可以添加更多支付方式
  alipay: {
    wayCode: 'ALI_BAR',
    currency: 'CNY',
    label: 'Alipay',
  },
};

/**
 * 支付平台配置
 */
export const PAYIN_PLATFORM_CONFIG = {
  /** 支付平台接口地址 */
  apiUrl: process.env.PAYIN_PLATFORM_API_URL || 'https://kopay.bet/api/pay/unifiedOrder',

  /** 商户号 */
  mchNo: process.env.PAYIN_MCH_NO || '',

  /** 应用ID */
  appId: process.env.PAYIN_APP_ID || '',

  /** 商户私钥（用于签名） */
  privateKey: process.env.PAYIN_PRIVATE_KEY || '',

  /** 异步通知地址（支付平台回调我们的接口） */
  notifyUrl: process.env.PAYIN_NOTIFY_URL || '',

  /** 跳转通知地址（用户支付完成后跳转的地址） */
  returnUrl: process.env.PAYIN_RETURN_URL || '',

  /** 接口版本 */
  version: '1.0',

  /** 签名类型 */
  signType: 'MD5',
};

/**
 * 订单状态枚举
 */
export enum OrderState {
  /** 订单生成 */
  CREATED = 0,
  /** 支付中 */
  PAYING = 1,
  /** 支付成功 */
  SUCCESS = 2,
  /** 支付失败 */
  FAILED = 3,
  /** 已撤销 */
  REVOKED = 4,
  /** 已退款 */
  REFUNDED = 5,
  /** 订单关闭 */
  CLOSED = 6,
}

/**
 * 订单状态显示名称映射
 */
export const ORDER_STATE_LABELS: Record<number, string> = {
  [OrderState.CREATED]: '订单生成',
  [OrderState.PAYING]: '支付中',
  [OrderState.SUCCESS]: '支付成功',
  [OrderState.FAILED]: '支付失败',
  [OrderState.REVOKED]: '已撤销',
  [OrderState.REFUNDED]: '已退款',
  [OrderState.CLOSED]: '订单关闭',
};

/**
 * 支付平台API请求参数接口
 */
export interface UnifiedOrderRequest {
  /** 商户号 */
  mchNo: string;
  /** 应用ID */
  appId: string;
  /** 商户订单号 */
  mchOrderNo: string;
  /** 支付方式 */
  wayCode: string;
  /** 支付金额（单位：分） */
  amount: number;
  /** 货币代码 */
  currency: string;
  /** 商品标题 */
  subject: string;
  /** 商品描述 */
  body: string;
  /** 异步通知地址 */
  notifyUrl?: string;
  /** 跳转通知地址 */
  returnUrl?: string;
  /** 请求时间（13位时间戳） */
  reqTime: number;
  /** 接口版本 */
  version: string;
  /** 签名 */
  sign: string;
  /** 签名类型 */
  signType: string;
  /** 客户端IP */
  clientIp: string;
}

/**
 * 支付平台API响应数据接口
 */
export interface UnifiedOrderResponseData {
  /** 支付订单号 */
  payOrderId: string;
  /** 商户订单号 */
  mchOrderNo: string;
  /** 订单状态 */
  orderState: number;
  /** 支付数据类型 */
  payDataType: string;
  /** 支付地址 */
  payData?: string;
  /** 渠道错误码 */
  errCode?: string;
  /** 渠道错误描述 */
  errMsg?: string;
}

/**
 * 支付平台API响应接口
 */
export interface UnifiedOrderResponse {
  /** 返回状态（0-下单成功，其他-处理有误） */
  code: number;
  /** 返回信息 */
  msg?: string;
  /** 签名信息 */
  sign?: string;
  /** 返回数据 */
  data?: UnifiedOrderResponseData | string;
}

/**
 * 支付平台回调通知参数接口
 */
export interface PayinNotifyRequest {
  /** 支付订单号 */
  payOrderId: string;
  /** 商户号 */
  mchNo: string;
  /** 应用ID */
  appId: string;
  /** 商户订单号 */
  mchOrderNo: string;
  /** 支付金额（单位：分） */
  amount: number;
  /** 订单状态 */
  state: number;
  /** 签名 */
  sign: string;
}

/**
 * 验证支付平台配置是否完整
 * @returns 配置是否有效
 */
export function isPayinConfigValid(): boolean {
  const {
    mchNo,
    appId,
    privateKey,
    apiUrl,
  } = PAYIN_PLATFORM_CONFIG;

  return !!(mchNo && appId && privateKey && apiUrl);
}
