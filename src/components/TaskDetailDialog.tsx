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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n/context';
import { Copy, Upload, CheckCircle, AlertCircle, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  order_no: string;
  amount: number;
  commission: number;
  status: 'pending' | 'claimed' | 'completed' | 'expired' | 'cancelled';
  payment_method: string | null;
  payment_account: string | null;
  payment_screenshot_url: string | null;
  expires_at: string;
}

interface TaskDetailDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (orderId: string, screenshotUrl: string) => void;
  isCompleting: boolean;
}

export default function TaskDetailDialog({
  order,
  open,
  onOpenChange,
  onComplete,
  isCompleting,
}: TaskDetailDialogProps) {
  const { t, formatCurrency } = useI18n();
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!order) return null;

  // 解析支付账户信息
  const paymentInfo = order.payment_account
    ? JSON.parse(order.payment_account)
    : null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('已复制到剪贴板');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpload = () => {
    if (!screenshotUrl) {
      toast.error('请先上传支付凭证');
      return;
    }
    onComplete(order.id, screenshotUrl);
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

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return '-';
    const methodMap: Record<string, string> = {
      wechat: '微信支付',
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
    return methodMap[method] || method;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>订单详情</span>
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>订单号：{order.order_no}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 金额信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">代付金额</span>
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

          {/* 支付信息 */}
          {order.status === 'claimed' && paymentInfo && (
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">收款信息</h3>

              <div>
                <Label className="text-xs text-gray-600">支付方式</Label>
                <p className="font-medium">{formatPaymentMethod(order.payment_method)}</p>
              </div>

              {paymentInfo.name && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">收款人</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={paymentInfo.name}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleCopy(paymentInfo.name, 'name')}
                    >
                      {copiedField === 'name' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {paymentInfo.account && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">收款账号</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={paymentInfo.account}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleCopy(paymentInfo.account, 'account')}
                    >
                      {copiedField === 'account' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {paymentInfo.bank && (
                <div>
                  <Label className="text-xs text-gray-600">开户银行</Label>
                  <p className="font-medium">{paymentInfo.bank}</p>
                </div>
              )}

              {paymentInfo.branch && (
                <div>
                  <Label className="text-xs text-gray-600">开户行</Label>
                  <p className="font-medium">{paymentInfo.branch}</p>
                </div>
              )}
            </div>
          )}

          {/* 上传支付凭证 */}
          {order.status === 'claimed' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">支付凭证</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="请输入支付凭证图片 URL"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  disabled={!!order.payment_screenshot_url}
                />
                <Button size="icon" variant="outline">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              {order.payment_screenshot_url && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>已上传支付凭证</span>
                </div>
              )}
            </div>
          )}

          {/* 提示信息 */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">温馨提示</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>请确保支付金额与订单金额完全一致</li>
                <li>支付后请及时上传支付凭证</li>
                <li>任务过期前未完成将无法获得奖励</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          {order.status === 'claimed' && !order.payment_screenshot_url && (
            <Button onClick={handleUpload} disabled={isCompleting}>
              {isCompleting ? '提交中...' : '提交支付凭证'}
            </Button>
          )}
          {order.status === 'claimed' && order.payment_screenshot_url && (
            <Button
              onClick={() => onComplete(order.id, order.payment_screenshot_url!)}
              disabled={isCompleting}
            >
              {isCompleting ? '提交中...' : '完成任务'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
