'use client';

import { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useI18n } from '@/i18n/context';
import {
  Settings as SettingsIcon,
  Globe,
  Moon,
  Sun,
  Bell,
  Trash2,
  Info,
  LogOut,
  ChevronRight,
  Smartphone,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

interface SettingItem {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: () => void;
  showToggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
  showChevron?: boolean;
}

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [clearingCache, setClearingCache] = useState(false);
  const [appVersion] = useState('1.0.0');
  const [buildNumber] = useState('2024.01.01');
  const [systemInfo, setSystemInfo] = useState({
    userAgent: '',
    screenWidth: 0,
    screenHeight: 0,
    devicePixelRatio: 1,
  });

  // 检测系统主题偏好并获取系统信息
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' ||
                   (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    applyTheme(isDark);

    // 获取系统信息
    setSystemInfo({
      userAgent: navigator.userAgent.substring(0, 50),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    });
  }, []);

  // 应用主题
  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // 切换主题
  const toggleTheme = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    applyTheme(newValue);
  };

  // 清除缓存
  const handleClearCache = async () => {
    if (!confirm(t('settings.clearCacheConfirm'))) {
      return;
    }

    try {
      setClearingCache(true);
      // 清除 localStorage
      localStorage.clear();
      
      // 清除 sessionStorage
      sessionStorage.clear();

      // 清除 cookies（保留认证相关的）
      document.cookie.split(";").forEach((c) => {
        const [name] = c.trim().split("=");
        if (!name.includes('token') && !name.includes('auth')) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
      });

      // 重新设置必要的配置
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      localStorage.setItem('locale', locale);

      // 延迟后刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert(t('settings.clearCacheFailed'));
    } finally {
      setClearingCache(false);
    }
  };

  // 退出登录
  const handleLogout = () => {
    if (!confirm(t('settings.logoutConfirm'))) {
      return;
    }
    // TODO: 实现登出逻辑
    console.log('Logout');
  };

  // 设置项列表
  const generalSettings: SettingItem[] = [
    {
      icon: Globe,
      title: t('settings.language'),
      description: t('settings.languageDescription'),
      showChevron: true,
    },
    {
      icon: isDarkMode ? Moon : Sun,
      title: t('settings.darkMode'),
      description: t('settings.darkModeDescription'),
      showToggle: true,
      toggleValue: isDarkMode,
      onToggleChange: toggleTheme,
    },
  ];

  const notificationSettings: SettingItem[] = [
    {
      icon: Bell,
      title: t('settings.pushNotifications'),
      description: t('settings.pushNotificationsDescription'),
      showToggle: true,
      toggleValue: notificationsEnabled,
      onToggleChange: setNotificationsEnabled,
    },
    {
      icon: Smartphone,
      title: t('settings.soundEffects'),
      description: t('settings.soundEffectsDescription'),
      showToggle: true,
      toggleValue: soundEnabled,
      onToggleChange: setSoundEnabled,
    },
  ];

  const dataSettings: SettingItem[] = [
    {
      icon: Trash2,
      title: t('settings.clearCache'),
      description: t('settings.clearCacheDescription'),
      action: handleClearCache,
    },
  ];

  const aboutSettings: SettingItem[] = [
    {
      icon: Info,
      title: t('settings.about'),
      description: t('settings.aboutDescription'),
      showChevron: true,
    },
  ];

  return (
    <MainLayout showBalance={false}>
      <div className="p-4 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {t('settings.title')}
            </h2>
            <p className="text-sm text-gray-600">
              {t('settings.description')}
            </p>
          </div>
        </div>

        {/* 通用设置 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t('settings.general')}
          </h3>
          <Card>
            <div className="divide-y">
              {/* 语言选择器 */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {t('settings.language')}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {t('settings.languageDescription')}
                    </p>
                  </div>
                </div>
                <LanguageSelector />
              </div>

              {/* 主题切换 */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isDarkMode ? (
                      <Moon className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Sun className="w-5 h-5 text-gray-600" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {t('settings.darkMode')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {t('settings.darkModeDescription')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={toggleTheme}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 通知设置 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t('settings.notifications')}
          </h3>
          <Card>
            <div className="divide-y">
              {/* 推送通知 */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {t('settings.pushNotifications')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {t('settings.pushNotificationsDescription')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>
              </div>

              {/* 音效 */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {t('settings.soundEffects')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {t('settings.soundEffectsDescription')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 数据管理 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t('settings.dataManagement')}
          </h3>
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {t('settings.clearCache')}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {t('settings.clearCacheDescription')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCache}
                  disabled={clearingCache}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {clearingCache ? t('common.loading') : t('settings.clear')}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* 关于 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t('settings.about')}
          </h3>
          <Card>
            <div className="divide-y">
              {/* 应用信息 */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <SettingsIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Task Wallet
                      </h4>
                      <p className="text-sm text-gray-600">
                        {t('settings.taskWalletApp')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('settings.version')}:</span>
                    <span className="font-medium text-gray-900">{appVersion}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('settings.buildNumber')}:</span>
                    <span className="font-medium text-gray-900">{buildNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('settings.currentLanguage')}:</span>
                    <span className="font-medium text-gray-900">{locale}</span>
                  </div>
                </div>
              </div>

              {/* 系统信息 */}
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  {t('settings.systemInfo')}
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">User Agent:</span>
                    <span className="font-medium text-gray-900 text-right flex-1 ml-4 truncate">
                      {systemInfo.userAgent}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Screen:</span>
                    <span className="font-medium text-gray-900">
                      {systemInfo.screenWidth} × {systemInfo.screenHeight}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">DPR:</span>
                    <span className="font-medium text-gray-900">
                      {systemInfo.devicePixelRatio}
                    </span>
                  </div>
                </div>
              </div>

              {/* 隐私政策 */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {t('settings.privacyPolicy')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {t('settings.privacyPolicyDescription')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* 服务条款 */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {t('settings.termsOfService')}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {t('settings.termsOfServiceDescription')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 退出登录 */}
        <Card className="p-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('auth.logout')}
          </Button>
        </Card>

        {/* 版权信息 */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 Task Wallet. {t('settings.allRightsReserved')}</p>
        </div>
      </div>
    </MainLayout>
  );
}
