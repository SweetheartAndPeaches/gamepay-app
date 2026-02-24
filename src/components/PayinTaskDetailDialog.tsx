'use client';

import { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/i18n/context';
import { CheckCircle, AlertCircle, DollarSign, Clock, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_no: string;
  amount: number;
  commission: number;
  status: 'pending' | 'claimed' | 'completed' | 'expired' | 'cancelled';
  expires_at: string;
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
  onClaim: (orderId: string, accountId: string) => void;
  onConfirm: (orderId: string) => void;
  isClaiming: boolean;
  isConfirming: boolean;
  userBalance: number;
  accounts: Account[];
  enabled: boolean;
}

export default function PayinTaskDetailDialog({
  order,
  open,
  onOpenChange,
  onClaim,
  onConfirm,
  isClaiming,
  isConfirming,
  userBalance,
  accounts,
  enabled,
}: PayinTaskDetailDialogProps) {
  const { t, formatCurrency } = useI18n();
  const [selectedAccountId, setSelectedAccountId] = useState('');

  if (!order) return null;

  const handleClaim = () => {
    if (!selectedAccountId) {
      toast.error('请选择代收账户');
      return;
    }
    onClaim(order.id, selectedAccountId);
  };

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

  const formatPaymentMethod = (type: string) => {
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

          {/* 选择代收账户 */}
          {order.status === 'pending' && enabled && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">选择代收账户</Label>
              <Select
                value={selectedAccountId}
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择代收账户" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      暂无代收账户，请先添加
                    </div>
                  ) : (
                    accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <span>{formatPaymentMethod(account.type)}</span>
                          <span className="text-gray-500">
                            {account.account_name}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 提示信息 */}
          {order.status === 'pending' && enabled && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">温馨提示</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>领取任务后会冻结对应的余额</li>
                  <li>代收完成后，代收金额会返还到您的余额</li>
                  <li>完成代收后可获得佣金奖励</li>
                  <li>请确保代收账户信息正确</li>
                </ul>
              </div>
            </div>
          )}

          {order.status === 'claimed' && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">进行中</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>已冻结 {formatCurrency(order.amount)} 余额</li>
                  <li>请及时完成代收任务</li>
                  <li>代收完成后确认收到款项即可完成任务</li>
                </ul>
              </div>
            </div>
          )}

          {!enabled && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
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
          {order.status === 'pending' && enabled && accounts.length > 0 && (
            <Button onClick={handleClaim} disabled={isClaiming}>
              {isClaiming ? '领取中...' : '领取任务'}
            </Button>
          )}
          {order.status === 'pending' && enabled && accounts.length === 0 && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              去添加账户
            </Button>
          )}
          {order.status === 'claimed' && (
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
