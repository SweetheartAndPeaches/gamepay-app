'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n/context';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    inviteCode: '',
    googleCode: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: 实现登录/注册逻辑
      if (isLogin) {
        // 登录
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: formData.phone,
            password: formData.password,
            googleCode: formData.googleCode,
          }),
        });

        if (response.ok) {
          router.push('/tasks/payout');
        }
      } else {
        // 注册
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          setIsLogin(true);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 头部 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Task Wallet
          </h1>
          <LanguageSelector />
        </div>
      </div>

      {/* 登录/注册表单 */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* 切换标签 */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  isLogin
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('auth.login')}
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  !isLogin
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('auth.register')}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="phone">{t('auth.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t('auth.phone')}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.password')}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="inviteCode">{t('auth.inviteCodeOptional')}</Label>
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder={t('auth.inviteCode')}
                    value={formData.inviteCode}
                    onChange={(e) =>
                      setFormData({ ...formData, inviteCode: e.target.value })
                    }
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? t('common.loading') : isLogin ? t('auth.login') : t('auth.register')}
              </Button>
            </form>

            {isLogin && (
              <div className="mt-4 text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
