'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit, QrCode, CreditCard, Smartphone, Wallet, TrendingUp } from 'lucide-react';
import { ACCOUNT_TYPES } from '@/lib/constants';
import { useI18n } from '@/i18n/context';

interface PaymentAccount {
  id: string;
  accountType: string;
  accountInfo: Record<string, any>;
  isActive: boolean;
  // 代收相关字段
  payinEnabled?: boolean;
  payinMaxAmount?: number;
  payinAllocatedAmount?: number;
  payinEarnedCommission?: number;
  payinTotalCount?: number;
}

export default function AccountsPage() {
  const { t, formatCurrency } = useI18n();
  const [payinAccounts, setPayinAccounts] = useState<PaymentAccount[]>([]);
  const [payoutAccounts, setPayoutAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const [currentTab, setCurrentTab] = useState<'payin' | 'payout'>('payin');

  const [formData, setFormData] = useState({
    accountType: '',
    accountName: '',
    accountNumber: '',
    bankName: '',
    qrCode: null as File | null,
    // 代收设置
    payinEnabled: false,
    payinMaxAmount: '',
  });

  // 账户类型配置
  const payinAccountTypes = [
    { value: 'wechat_qrcode', label: '微信二维码', icon: QrCode },
    { value: 'alipay_qrcode', label: '支付宝二维码', icon: QrCode },
    { value: 'alipay_account', label: '支付宝账号', icon: Smartphone },
    { value: 'bank_card', label: '银行卡', icon: CreditCard },
  ];

  const payoutAccountTypes = [
    { value: 'wechat_qrcode', label: '微信二维码', icon: QrCode },
    { value: 'alipay_qrcode', label: '支付宝二维码', icon: QrCode },
    { value: 'alipay_account', label: '支付宝账号', icon: Smartphone },
  ];

  const fetchAccounts = async () => {
    try {
      // 获取代收账户
      const payinRes = await fetch('/api/profile/accounts?type=payin');
      const payinData = await payinRes.json();
      if (payinData.success) {
        setPayinAccounts(payinData.data.accounts || []);
      }

      // 获取代付账户
      const payoutRes = await fetch('/api/profile/accounts?type=payout');
      const payoutData = await payoutRes.json();
      if (payoutData.success) {
        setPayoutAccounts(payoutData.data.accounts || []);
      }
    } catch (error) {
      console.error('Fetch accounts error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenDialog = (account?: PaymentAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        accountType: account.accountType,
        accountName: account.accountInfo.name || '',
        accountNumber: account.accountInfo.accountNumber || '',
        bankName: account.accountInfo.bankName || '',
        qrCode: null,
        payinEnabled: account.payinEnabled || false,
        payinMaxAmount: account.payinMaxAmount ? String(account.payinMaxAmount) : '',
      });
    } else {
      setEditingAccount(null);
      setFormData({
        accountType: '',
        accountName: '',
        accountNumber: '',
        bankName: '',
        qrCode: null,
        payinEnabled: false,
        payinMaxAmount: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
    setFormData({
      accountType: '',
      accountName: '',
      accountNumber: '',
      bankName: '',
      qrCode: null,
      payinEnabled: false,
      payinMaxAmount: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('accountType', formData.accountType);
      formDataToSend.append('accountName', formData.accountName);
      formDataToSend.append('accountNumber', formData.accountNumber);
      formDataToSend.append('bankName', formData.bankName);
      formDataToSend.append('usageType', currentTab);

      // 如果是代收账户，添加代收设置
      if (currentTab === 'payin') {
        formDataToSend.append('payinEnabled', String(formData.payinEnabled));
        formDataToSend.append('payinMaxAmount', formData.payinMaxAmount || '0');
      }

      if (formData.qrCode) {
        formDataToSend.append('qrCode', formData.qrCode);
      }

      const url = editingAccount
        ? `/api/profile/accounts/${editingAccount.id}`
        : '/api/profile/accounts';

      const method = editingAccount ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        handleCloseDialog();
        fetchAccounts();
      } else {
        alert(result.message || '操作失败');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('操作失败，请重试');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('确定要删除这个账户吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/profile/accounts/${accountId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        fetchAccounts();
      } else {
        alert(result.message || '删除失败');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('删除失败，请重试');
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const allTypes = [...payinAccountTypes, ...payoutAccountTypes];
    const found = allTypes.find(t => t.value === type);
    return found?.label || type;
  };

  const renderPayinAccountCard = (account: PaymentAccount) => {
    const info = account.accountInfo;
    const isQrcode = account.accountType.includes('qrcode');
    const remainingAmount = account.payinMaxAmount && account.payinMaxAmount > 0
      ? account.payinMaxAmount - (account.payinAllocatedAmount || 0)
      : null;

    return (
      <Card key={account.id} className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-900">
                {getAccountTypeLabel(account.accountType)}
              </span>
              {!account.isActive && (
                <span className="text-xs text-red-500">已禁用</span>
              )}
              {account.payinEnabled && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  代收中
                </span>
              )}
            </div>

            {info.name && (
              <p className="text-sm text-gray-600">
                名称：{info.name}
              </p>
            )}

            {info.accountNumber && (
              <p className="text-sm text-gray-600">
                账号：{info.accountNumber}
              </p>
            )}

            {info.bankName && (
              <p className="text-sm text-gray-600">
                银行：{info.bankName}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDialog(account)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteAccount(account.id)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>

        {/* 代收统计 */}
        {account.payinEnabled && (
          <div className="mt-3 pt-3 border-t">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Wallet className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">已分配：</span>
                <span className="font-medium">{formatCurrency(account.payinAllocatedAmount || 0)}</span>
              </div>
              {remainingAmount !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">剩余：</span>
                  <span className="font-medium">{formatCurrency(remainingAmount)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-gray-600">佣金：</span>
                <span className="font-medium">{formatCurrency(account.payinEarnedCommission || 0)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-gray-600">完成：</span>
                <span className="font-medium">{account.payinTotalCount || 0} 单</span>
              </div>
            </div>
            {account.payinMaxAmount && account.payinMaxAmount > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>使用进度</span>
                  <span>{((account.payinAllocatedAmount || 0) / account.payinMaxAmount * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((account.payinAllocatedAmount || 0) / account.payinMaxAmount * 100))}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {isQrcode && info.qrCodeUrl && (
          <div className="mt-2">
            <img
              src={info.qrCodeUrl}
              alt="二维码"
              className="w-24 h-24 object-cover rounded border"
            />
          </div>
        )}
      </Card>
    );
  };

  const renderPayoutAccountCard = (account: PaymentAccount) => {
    const info = account.accountInfo;
    const isQrcode = account.accountType.includes('qrcode');

    return (
      <Card key={account.id} className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-900">
                {getAccountTypeLabel(account.accountType)}
              </span>
              {!account.isActive && (
                <span className="text-xs text-red-500">已禁用</span>
              )}
            </div>

            {info.name && (
              <p className="text-sm text-gray-600">
                名称：{info.name}
              </p>
            )}

            {info.accountNumber && (
              <p className="text-sm text-gray-600">
                账号：{info.accountNumber}
              </p>
            )}

            {info.bankName && (
              <p className="text-sm text-gray-600">
                银行：{info.bankName}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenDialog(account)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteAccount(account.id)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>

        {isQrcode && info.qrCodeUrl && (
          <div className="mt-2">
            <img
              src={info.qrCodeUrl}
              alt="二维码"
              className="w-24 h-24 object-cover rounded border"
            />
          </div>
        )}
      </Card>
    );
  };

  return (
    <MainLayout showBalance={false}>
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">账户管理</h2>
            <p className="text-sm text-gray-600">管理您的收付款账户</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            添加账户
          </Button>
        </div>

        <Tabs
          value={currentTab}
          onValueChange={(v) => setCurrentTab(v as 'payin' | 'payout')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payin">代收账户</TabsTrigger>
            <TabsTrigger value="payout">代付账户</TabsTrigger>
          </TabsList>

          <TabsContent value="payin" className="space-y-3 mt-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                加载中...
              </div>
            ) : payinAccounts.length > 0 ? (
              payinAccounts.map((account) => renderPayinAccountCard(account))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500 mb-4">暂无代收账户</p>
                <p className="text-xs text-gray-400 mb-4">添加代收账户后可以接收代收任务</p>
                <Button onClick={() => handleOpenDialog()}>
                  添加第一个账户
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="payout" className="space-y-3 mt-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                加载中...
              </div>
            ) : payoutAccounts.length > 0 ? (
              payoutAccounts.map((account) => renderPayoutAccountCard(account))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-gray-500 mb-4">暂无代付账户</p>
                <Button onClick={() => handleOpenDialog()}>
                  添加第一个账户
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* 添加/编辑对话框 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? '编辑账户' : '添加账户'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="accountType">账户类型</Label>
                <Select
                  value={formData.accountType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, accountType: value })
                  }
                  disabled={!!editingAccount}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择账户类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {(currentTab === 'payin' ? payinAccountTypes : payoutAccountTypes).map(
                      (type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      }
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="accountName">账户名称</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) =>
                    setFormData({ ...formData, accountName: e.target.value })
                  }
                  placeholder="例如：我的微信"
                  required
                />
              </div>

              {formData.accountType && !formData.accountType.includes('qrcode') && (
                <>
                  <div>
                    <Label htmlFor="accountNumber">账号</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, accountNumber: e.target.value })
                      }
                      placeholder="请输入账号"
                      required
                    />
                  </div>

                  {formData.accountType === 'bank_card' && (
                    <div>
                      <Label htmlFor="bankName">开户银行</Label>
                      <Input
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) =>
                          setFormData({ ...formData, bankName: e.target.value })
                        }
                        placeholder="例如：中国工商银行"
                        required
                      />
                    </div>
                  )}
                </>
              )}

              {formData.accountType && formData.accountType.includes('qrcode') && (
                <div>
                  <Label htmlFor="qrCode">二维码图片</Label>
                  <Input
                    id="qrCode"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        qrCode: e.target.files?.[0] || null,
                      })
                    }
                    required={!editingAccount}
                  />
                  {editingAccount && (
                    <p className="text-xs text-gray-500 mt-1">
                      不上传则保留原二维码
                    </p>
                  )}
                </div>
              )}

              {/* 代收设置（仅代收账户显示） */}
              {currentTab === 'payin' && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-3">代收设置</h3>

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <Label htmlFor="payinEnabled">启用代收</Label>
                        <p className="text-xs text-gray-500 mt-1">
                          启用后可以接收代收任务
                        </p>
                      </div>
                      <Switch
                        id="payinEnabled"
                        checked={formData.payinEnabled}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, payinEnabled: checked })
                        }
                      />
                    </div>

                    {formData.payinEnabled && (
                      <div className="pt-2">
                        <Label htmlFor="payinMaxAmount">代收金额上限</Label>
                        <Input
                          id="payinMaxAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.payinMaxAmount}
                          onChange={(e) =>
                            setFormData({ ...formData, payinMaxAmount: e.target.value })
                          }
                          placeholder="0 表示无限制"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          0 表示无限制，可使用全部余额
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  取消
                </Button>
                <Button type="submit">
                  {editingAccount ? '保存' : '添加'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
