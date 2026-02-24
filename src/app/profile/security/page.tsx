'use client';

import { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n/context';
import { Shield, Lock, KeyRound, AlertCircle } from 'lucide-react';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface GoogleAuthData {
  isBound: boolean;
  secret: string;
  qrCode: string;
  verificationCode: string;
}

export default function SecurityPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'password' | 'google'>('password');

  // 修改密码表单
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Google Authenticator
  const [googleAuth, setGoogleAuth] = useState<GoogleAuthData>({
    isBound: false, // TODO: 从API获取实际绑定状态
    secret: '',
    qrCode: '',
    verificationCode: '',
  });
  const [showGoogleQR, setShowGoogleQR] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [googleSuccess, setGoogleSuccess] = useState('');
  const [isBindingGoogle, setIsBindingGoogle] = useState(false);
  const [isUnbindingGoogle, setIsUnbindingGoogle] = useState(false);

  // 处理修改密码
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // 表单验证
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError(t('common.allRequired'));
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError(t('auth.passwordTooShort'));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('security.passwordMismatch'));
      return;
    }

    try {
      setIsChangingPassword(true);
      // TODO: 调用API修改密码
      // const { data, error } = await supabase.auth.updateUser({
      //   password: passwordForm.newPassword,
      // });

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPasswordSuccess(t('security.passwordChanged'));
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setPasswordError(t('security.changePasswordFailed'));
      console.error('Change password failed:', error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 生成Google Authenticator二维码
  const handleGenerateGoogleQR = async () => {
    try {
      setIsBindingGoogle(true);
      setGoogleError('');
      setShowGoogleQR(true);

      // TODO: 调用API生成二维码
      // const { data, error } = await supabase.functions.invoke('generate-google-qr');

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟生成二维码数据
      setGoogleAuth(prev => ({
        ...prev,
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: 'otpauth://totp/TaskWallet:138****8888?secret=JBSWY3DPEHPK3PXP&issuer=TaskWallet',
      }));
    } catch (error) {
      setGoogleError(t('security.generateQrFailed'));
      console.error('Generate QR failed:', error);
    } finally {
      setIsBindingGoogle(false);
    }
  };

  // 绑定Google Authenticator
  const handleBindGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleError('');
    setGoogleSuccess('');

    if (!googleAuth.verificationCode || googleAuth.verificationCode.length !== 6) {
      setGoogleError(t('security.invalidGoogleCode'));
      return;
    }

    try {
      setIsBindingGoogle(true);
      // TODO: 调用API绑定Google Authenticator
      // const { data, error } = await supabase.functions.invoke('bind-google-auth', {
      //   secret: googleAuth.secret,
      //   code: googleAuth.verificationCode,
      // });

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGoogleSuccess(t('security.googleBindSuccess'));
      setGoogleAuth(prev => ({
        ...prev,
        isBound: true,
        verificationCode: '',
      }));
      setShowGoogleQR(false);
    } catch (error) {
      setGoogleError(t('security.googleBindFailed'));
      console.error('Bind Google failed:', error);
    } finally {
      setIsBindingGoogle(false);
    }
  };

  // 解绑Google Authenticator
  const handleUnbindGoogle = async () => {
    if (!confirm(t('security.unbindConfirm'))) {
      return;
    }

    try {
      setIsUnbindingGoogle(true);
      setGoogleError('');
      setGoogleSuccess('');

      // TODO: 调用API解绑Google Authenticator
      // const { data, error } = await supabase.functions.invoke('unbind-google-auth');

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGoogleSuccess(t('security.googleUnbindSuccess'));
      setGoogleAuth(prev => ({
        ...prev,
        isBound: false,
      }));
    } catch (error) {
      setGoogleError(t('security.googleUnbindFailed'));
      console.error('Unbind Google failed:', error);
    } finally {
      setIsUnbindingGoogle(false);
    }
  };

  return (
    <MainLayout showBalance={false}>
      <div className="p-4 space-y-6">
        {/* 页面标题 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {t('security.title')}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {t('security.description')}
          </p>
        </div>

        {/* 标签页切换 */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'password' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => {
              setActiveTab('password');
              setPasswordError('');
              setPasswordSuccess('');
            }}
          >
            <Lock className="w-4 h-4 mr-2" />
            {t('security.changePassword')}
          </Button>
          <Button
            variant={activeTab === 'google' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => {
              setActiveTab('google');
              setGoogleError('');
              setGoogleSuccess('');
            }}
          >
            <KeyRound className="w-4 h-4 mr-2" />
            Google Authenticator
          </Button>
        </div>

        {/* 修改密码面板 */}
        {activeTab === 'password' && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {t('security.changePassword')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('security.changePasswordTip')}
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">
                    {t('security.currentPassword')} *
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder={t('security.enterCurrentPassword')}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword">
                    {t('security.newPassword')} *
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder={t('security.enterNewPassword')}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">
                    {t('security.confirmNewPassword')} *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder={t('security.confirmNewPassword')}
                    className="mt-1"
                  />
                </div>

                {/* 错误提示 */}
                {passwordError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {passwordError}
                  </div>
                )}

                {/* 成功提示 */}
                {passwordSuccess && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {passwordSuccess}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? t('common.loading') : t('security.changePassword')}
                </Button>
              </form>
            </div>
          </Card>
        )}

        {/* Google Authenticator 面板 */}
        {activeTab === 'google' && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Google Authenticator
                  </h3>
                  <p className="text-sm text-gray-600">
                    {googleAuth.isBound ? t('security.googleBound') : t('security.googleNotBound')}
                  </p>
                </div>
              </div>

              {/* 已绑定状态 */}
              {googleAuth.isBound ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">
                        {t('security.googleAuthEnabled')}
                      </span>
                    </div>
                    <p className="text-sm text-green-600 mt-2">
                      {t('security.googleAuthEnabledTip')}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleUnbindGoogle}
                    disabled={isUnbindingGoogle}
                  >
                    {isUnbindingGoogle ? t('common.loading') : t('security.unbindGoogle')}
                  </Button>
                </div>
              ) : (
                /* 未绑定状态 */
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">
                        {t('security.googleAuthNotEnabled')}
                      </span>
                    </div>
                    <p className="text-sm text-yellow-600 mt-2">
                      {t('security.googleAuthNotEnabledTip')}
                    </p>
                  </div>

                  {!showGoogleQR ? (
                    <Button
                      className="w-full"
                      onClick={handleGenerateGoogleQR}
                      disabled={isBindingGoogle}
                    >
                      {isBindingGoogle ? t('common.loading') : t('security.bindGoogle')}
                    </Button>
                  ) : (
                    /* 绑定表单 */
                    <form onSubmit={handleBindGoogle} className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600 mb-3">
                          {t('security.scanQrCode')}
                        </p>
                        {/* 模拟二维码显示 */}
                        <div className="bg-white p-4 inline-block rounded-lg border-2 border-gray-300">
                          <div className="w-40 h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <Shield className="w-16 h-16 text-gray-400" />
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-white rounded border text-xs font-mono break-all">
                          {googleAuth.secret}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="verificationCode">
                          {t('security.verificationCode')} *
                        </Label>
                        <Input
                          id="verificationCode"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={googleAuth.verificationCode}
                          onChange={(e) => setGoogleAuth(prev => ({ ...prev, verificationCode: e.target.value }))}
                          placeholder={t('security.enterVerificationCode')}
                          className="mt-1 text-center text-lg tracking-widest"
                        />
                      </div>

                      {/* 错误提示 */}
                      {googleError && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          {googleError}
                        </div>
                      )}

                      {/* 成功提示 */}
                      {googleSuccess && (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          {googleSuccess}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowGoogleQR(false)}
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={isBindingGoogle}
                        >
                          {isBindingGoogle ? t('common.loading') : t('security.confirmBind')}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* 帮助信息 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  {t('security.howToUse')}
                </h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>{t('security.step1')}</li>
                  <li>{t('security.step2')}</li>
                  <li>{t('security.step3')}</li>
                </ol>
              </div>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
