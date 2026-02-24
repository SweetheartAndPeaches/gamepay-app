'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n/context';
import { CheckCircle, AlertCircle, DollarSign, Clock, Wallet, CreditCard } from 'lucide-react';

interface Order {
  id: string;
  order_no: string;
  amount: number;
  commission: number;
  status: 'pending' | 'claimed' | 'completed' | 'expired' | 'cancelled';
  expires_at: string;
  payment_method?: string | null;
  payment_account?: string | null;
}

interface Account {
  id: string;
  type: string;
  account_name: string;
  account_number: string;
  bank_name: string | null;
}

interface PayinTaskDetailDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (orderId: string) => void;
  isConfirming: boolean;
  userBalance: number;
  enabled: boolean;
}

export default function PayinTaskDetailDialog({
  order,
  open,
  onOpenChange,
  onConfirm,
  isConfirming,
  userBalance,
  enabled,
}: PayinTaskDetailDialogProps) {
  const { t, formatCurrency } = useI18n();

  if (!order) return null;

  const getStatusBadge = () => {
    switch (order.status) {
      case 'pending':
        return <Badge variant="outline">待领取</Badge>;
      case 'claimed':
        return <Badge variant="secondary">进行中</Badge>;
      case 'completed':
        return <Badge variant="default">已完成</Badge>;
      case 'expired':
        return <Badge variant="destructive">已过期</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">已取消</Badge>;
      default:
        return <Badge>{order.status}</Badge>;
    }
  };

  const formatPaymentMethod = (type: string | null) => {
    if (!type) return '-';
    const methodMap: Record<string, string> = {
      wechat: '微信',
      alipay: '支付宝',
      bank: '银行卡',
      paypal: 'PayPal',
      venmo: 'Venmo',
      cash_app: 'Cash App',
      zelle: 'Zelle',
      stripe: 'Stripe',
      wise: 'Wise',
      payoneer: 'Payoneer',
      swift: 'SWIFT',
    };
    return methodMap[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>代收任务详情</span>
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>订单号：{order.order_no}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 余额信息 */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Wallet className="w-4 h-4" />
              <span className="text-sm">您的可用余额</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(userBalance)}
            </p>
          </div>

          {/* 金额信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">代收金额</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(order.amount)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">任务奖励</span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                +{formatCurrency(order.commission)}
              </p>
            </div>
          </div>

          {/* 过期时间 */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>过期时间：{new Date(order.expires_at).toLocaleString('zh-CN')}</span>
          </div>

          {/* 代收账户信息 */}
          {order.status === 'claimed' && enabled && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                代收账户
              </Label>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-900">
                  {formatPaymentMethod(order.payment_method || '')}
                </p>
                {order.payment_account && (
                  <p className="text-sm text-blue-700 mt-1">
                    请使用此账户接收款项
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 提示信息 */}
          {order.status === 'claimed' && enabled && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">任务进行中</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>系统已冻结 {formatCurrency(order.amount)} 余额</li>
                  <li>请使用指定的代收账户接收款项</li>
                  <li>代收完成后请及时确认收款</li>
                  <li>确认后会自动解冻余额并发放奖励</li>
                </ul>
              </div>
            </div>
          )}

          {order.status === 'completed' && (
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">任务已完成</p>
                <p className="text-xs">
                  代收任务已完成，奖励已发放到您的余额
                </p>
              </div>
            </div>
          )}

          {!enabled && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">系统维护中</p>
                <p className="text-xs">代收任务暂未开启，请稍后再试</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          {order.status === 'claimed' && enabled && (
            <Button
              onClick={() => onConfirm(order.id)}
              disabled={isConfirming}
            >
              {isConfirming ? '提交中...' : '确认已收到款项'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
