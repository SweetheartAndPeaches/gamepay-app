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

  // 解析支付账户信息（支持 JSON 格式和纯文本格式）
  const paymentInfo = (() => {
    if (!order.payment_account) return null;

    try {
      // 尝试解析为 JSON
      const parsed = JSON.parse(order.payment_account);

      // 如果解析成功，检查是否是对象
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }

      // 如果是字符串，直接返回作为账号
      if (typeof parsed === 'string') {
        return { account: parsed };
      }

      return null;
    } catch {
      // 如果解析失败，将原始值作为账号
      return { account: order.payment_account };
    }
  })();

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('已复制到剪贴板');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpload = () => {
    if (!screenshotUrl) {
      toast.error(t('tasks.payout.paymentProofPlaceholder'));
      return;
    }
    onComplete(order.id, screenshotUrl);
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case 'pending':
        return <Badge variant="outline">{t('tasks.payout.status.pending')}</Badge>;
      case 'claimed':
        return <Badge variant="secondary">{t('tasks.payout.inProgress')}</Badge>;
      case 'completed':
        return <Badge variant="default">{t('tasks.payout.completed')}</Badge>;
      case 'expired':
        return <Badge variant="destructive">{t('common.error')}</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">{t('common.cancel')}</Badge>;
      default:
        return <Badge>{order.status}</Badge>;
    }
  };

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return '-';
    return t(`tasks.payout.paymentMethods.${method}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t('tasks.payout.taskDetails')}</span>
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>{t('tasks.payout.orderNo')}: {order.order_no}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 金额信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">{t('tasks.payout.orderAmount')}</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(order.amount)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{t('tasks.payout.reward')}</span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                +{formatCurrency(order.commission)}
              </p>
            </div>
          </div>

          {/* 过期时间 */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{t('tasks.payout.expiryTime')}: {new Date(order.expires_at).toLocaleString('zh-CN')}</span>
          </div>

          {/* 支付信息 */}
          {order.status === 'claimed' && paymentInfo && (
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">{t('tasks.payout.paymentInfo')}</h3>

              <div>
                <Label className="text-xs text-gray-600">{t('tasks.payout.paymentMethod')}</Label>
                <p className="font-medium">{formatPaymentMethod(order.payment_method)}</p>
              </div>

              {paymentInfo.name && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">{t('tasks.payout.receiverName')}</Label>
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
                  <Label className="text-xs text-gray-600">{t('tasks.payout.receiverAccount')}</Label>
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
                  <Label className="text-xs text-gray-600">{t('tasks.payout.bankName')}</Label>
                  <p className="font-medium">{paymentInfo.bank}</p>
                </div>
              )}

              {paymentInfo.branch && (
                <div>
                  <Label className="text-xs text-gray-600">{t('tasks.payout.bankBranch')}</Label>
                  <p className="font-medium">{paymentInfo.branch}</p>
                </div>
              )}
            </div>
          )}

          {/* 上传支付凭证 */}
          {order.status === 'claimed' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('tasks.payout.paymentProof')}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t('tasks.payout.paymentProofPlaceholder')}
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
                  <span>{t('tasks.payout.proofUploaded')}</span>
                </div>
              )}
            </div>
          )}

          {/* 提示信息 */}
          <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">{t('tasks.payout.tips')}</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>{t('tasks.payout.tip1')}</li>
                <li>{t('tasks.payout.tip2')}</li>
                <li>{t('tasks.payout.tip3')}</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close')}
          </Button>
          {order.status === 'claimed' && !order.payment_screenshot_url && (
            <Button onClick={handleUpload} disabled={isCompleting}>
              {isCompleting ? t('tasks.payout.submitting') : t('tasks.payout.submitProof')}
            </Button>
          )}
          {order.status === 'claimed' && order.payment_screenshot_url && (
            <Button
              onClick={() => onComplete(order.id, order.payment_screenshot_url!)}
              disabled={isCompleting}
            >
              {isCompleting ? t('tasks.payout.submitting') : t('tasks.payout.completeTask')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
