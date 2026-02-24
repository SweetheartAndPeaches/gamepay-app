'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/context';
import { Save, AlertCircle, CheckCircle, Loader2, Activity } from 'lucide-react';

interface PayinSettings {
  enabled?: boolean;
  max_amount?: number;
  daily_limit?: number;
  auto_accept?: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: PayinSettings;
}

export default function PayinSettingsPage() {
  const { t, formatCurrency } = useI18n();

  const [settings, setSettings] = useState<PayinSettings>({
    enabled: false,
    max_amount: 0,
    daily_limit: 0,
    auto_accept: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [diagnosing, setDiagnosing] = useState(false);

  // 获取 token
  const getToken = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('token') || '';
  };

  // 获取代收设置
  const fetchSettings = async () => {
    const token = getToken();
    if (!token) {
      setMessage({
        type: 'error',
        text: '请先登录',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('[PayinSettings] Fetching settings...');
      const response = await fetch('/api/user/payin-settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: ApiResponse = await response.json();
      console.log('[PayinSettings] Response:', data);

      if (data.success) {
        setSettings(data.data || {
          enabled: false,
          max_amount: 0,
          daily_limit: 0,
          auto_accept: false,
        });
        setMessage(null);
      } else {
        setMessage({
          type: 'error',
          text: data.message || '获取代收设置失败',
        });
      }
    } catch (error) {
      console.error('[PayinSettings] Error:', error);
      setMessage({
        type: 'error',
        text: '网络错误，请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };

  // 运行诊断
  const runDiagnosis = async () => {
    const token = getToken();
    if (!token) {
      setDiagnosis({ error: '未登录，无法运行诊断' });
      return;
    }

    setDiagnosing(true);
    try {
      console.log('[Diagnosis] Running...');
      const response = await fetch('/api/diagnosis', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[Diagnosis] Response:', data);
      setDiagnosis(data);
    } catch (error) {
      console.error('[Diagnosis] Error:', error);
      setDiagnosis({ error: (error as Error).message });
    } finally {
      setDiagnosing(false);
    }
  };

  // 保存代收设置
  const handleSave = async () => {
    const token = getToken();
    if (!token) {
      setMessage({
        type: 'error',
        text: '请先登录',
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      console.log('[PayinSettings] Saving settings:', settings);
      const response = await fetch('/api/user/payin-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled: settings.enabled,
          maxAmount: settings.max_amount,
          dailyLimit: settings.daily_limit,
          autoAccept: settings.auto_accept,
        }),
      });

      const data: ApiResponse = await response.json();
      console.log('[PayinSettings] Save response:', data);

      if (data.success) {
        setMessage({
          type: 'success',
          text: '代收设置保存成功',
        });
      } else {
        setMessage({
          type: 'error',
          text: data.message || '保存设置失败',
        });
      }
    } catch (error) {
      console.error('[PayinSettings] Save error:', error);
      setMessage({
        type: 'error',
        text: '网络错误，请稍后重试',
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">代收设置</h1>
        <p className="text-muted-foreground">
          配置您的代收任务规则和账户信息
        </p>
      </div>

      {/* 诊断按钮 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            诊断工具
          </CardTitle>
          <CardDescription>检查数据库连接和表结构</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={runDiagnosis}
            disabled={diagnosing}
          >
            {diagnosing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                诊断中...
              </>
            ) : (
              '运行诊断'
            )}
          </Button>

          {diagnosis && (
            <div className="mt-4 p-4 bg-slate-950 text-slate-50 rounded-md overflow-auto max-h-96">
              <pre className="text-xs">{JSON.stringify(diagnosis, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 消息提示 */}
      {message && (
        <Card className={`mb-6 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {message.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                  {message.text}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 代收设置表单 */}
      <Card>
        <CardHeader>
          <CardTitle>代收任务设置</CardTitle>
          <CardDescription>
            配置代收任务的自动分配规则
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* 启用代收 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled">启用代收</Label>
                  <p className="text-sm text-muted-foreground">
                    开启后系统将自动为您分配代收任务
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enabled: checked })
                  }
                />
              </div>

              {/* 单笔限额 */}
              <div className="space-y-2">
                <Label htmlFor="maxAmount">单笔限额</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.max_amount || 0}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      max_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={!settings.enabled}
                />
                <p className="text-sm text-muted-foreground">
                  单笔代收任务的最大金额（0 表示无限制）
                </p>
              </div>

              {/* 每日限额 */}
              <div className="space-y-2">
                <Label htmlFor="dailyLimit">每日限额（次）</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  min="0"
                  value={settings.daily_limit || 0}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      daily_limit: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={!settings.enabled}
                />
                <p className="text-sm text-muted-foreground">
                  每日最多接受的代收任务次数（0 表示无限制）
                </p>
              </div>

              {/* 自动接受 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoAccept">自动接受</Label>
                  <p className="text-sm text-muted-foreground">
                    自动接受系统分配的代收任务
                  </p>
                </div>
                <Switch
                  id="autoAccept"
                  checked={settings.auto_accept}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, auto_accept: checked })
                  }
                  disabled={!settings.enabled}
                />
              </div>

              {/* 保存按钮 */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      保存
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 账户信息 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
          <CardDescription>
            管理您的收款账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            请确保您的收款账户信息正确，以便完成代收任务。
          </p>
          <Button variant="outline">
            管理收款账户
          </Button>
        </CardContent>
      </Card>

      {/* 快速操作 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>
            常用操作和帮助链接
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="link" className="p-0 h-auto" asChild>
            <a href="/tasks/payin" target="_blank">
              查看代收任务列表
            </a>
          </Button>
          <br />
          <Button variant="link" className="p-0 h-auto" asChild>
            <a href="https://supabase.com/dashboard/project/eplavqbtysmknzdcbgbq/sql" target="_blank" rel="noopener noreferrer">
              打开 Supabase SQL Editor
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
