import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  Bell,
  Headphones,
  User,
  ChevronDown,
  Wallet,
  Menu,
  X,
} from 'lucide-react';

export interface PageHeaderProps {
  /** 标题 */
  title?: string;
  /** 副标题（可选） */
  subtitle?: string;
  /** 是否显示标题 */
  showTitle?: boolean;
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 刷新按钮点击事件 */
  onRefresh?: () => void;
  /** 是否显示通知按钮 */
  showNotification?: boolean;
  /** 通知数量 */
  notificationCount?: number;
  /** 通知按钮点击事件 */
  onNotification?: () => void;
  /** 是否显示客服按钮 */
  showSupport?: boolean;
  /** 客服按钮点击事件 */
  onSupport?: () => void;
  /** 是否显示用户头像 */
  showAvatar?: boolean;
  /** 用户头像 URL */
  avatarUrl?: string;
  /** 用户名称（用于头像 fallback） */
  userName?: string;
  /** 用户菜单点击事件 */
  onAvatarClick?: () => void;
  /** 主导航项 */
  navItems?: Array<{ label: string; value: string; icon?: React.ReactNode }>;
  /** 当前激活的导航项 */
  activeNav?: string;
  /** 导航切换事件 */
  onNavChange?: (value: string) => void;
  /** 是否显示移动端菜单按钮 */
  showMobileMenu?: boolean;
  /** 移动端菜单点击事件 */
  onMobileMenu?: () => void;
  /** 额外的样式类名 */
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  showTitle = true,
  showRefresh = false,
  onRefresh,
  showNotification = false,
  notificationCount = 0,
  onNotification,
  showSupport = false,
  onSupport,
  showAvatar = false,
  avatarUrl,
  userName = 'User',
  onAvatarClick,
  navItems = [],
  activeNav,
  onNavChange,
  showMobileMenu = false,
  onMobileMenu,
  className,
}: PageHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className={cn(
      'sticky top-0 z-50 bg-[#0b0e11] border-b border-[#1e2329]',
      className
    )}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 左侧：移动端菜单 + Logo + 主导航 */}
          <div className="flex items-center gap-4">
            {/* 移动端菜单按钮 */}
            {showMobileMenu && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMobileMenu}
                className="text-[#848e9c] hover:text-white hover:bg-[#1e2329] h-9 w-9"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-br from-[#f0b90b] to-[#d4a00a] p-2 rounded-lg shadow-lg">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              {showTitle && title && (
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-white leading-tight">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-xs text-[#848e9c] leading-tight mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 主导航 - 桌面端显示 */}
            {navItems && navItems.length > 0 && (
              <nav className="hidden md:flex items-center gap-1 ml-4">
                {navItems.map((item) => {
                  const isActive = item.value === activeNav;
                  return (
                    <button
                      key={item.value}
                      onClick={() => onNavChange?.(item.value)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-[#f0b90b] text-[#0b0e11]'
                          : 'text-[#848e9c] hover:text-white hover:bg-[#1e2329]'
                      )}
                    >
                      {item.icon && (
                        <span className={cn(
                          'flex-shrink-0',
                          isActive ? 'text-[#0b0e11]' : 'text-[#848e9c]'
                        )}>
                          {React.cloneElement(item.icon as React.ReactElement<any>, {
                            className: 'h-4 w-4',
                          } as any)}
                        </span>
                      )}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2">
            {/* 刷新按钮 */}
            {showRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-[#848e9c] hover:text-white hover:bg-[#1e2329] h-9 w-9"
              >
                <RefreshCw className={cn(
                  'h-5 w-5',
                  isRefreshing && 'animate-spin'
                )} />
              </Button>
            )}

            {/* 通知按钮 */}
            {showNotification && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onNotification}
                className="text-[#848e9c] hover:text-white hover:bg-[#1e2329] h-9 w-9 relative"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-0 text-xs font-bold bg-[#f0b90b] text-[#0b0e11] hover:bg-[#f0b90b]"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* 客服按钮 */}
            {showSupport && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSupport}
                className="text-[#848e9c] hover:text-white hover:bg-[#1e2329] h-9 w-9"
                title={userName ? '人工客服' : undefined}
              >
                <Headphones className="h-5 w-5" />
              </Button>
            )}

            {/* 用户头像 */}
            {showAvatar && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onAvatarClick}
                className="text-[#848e9c] hover:text-white hover:bg-[#1e2329] h-9 w-9 p-0"
              >
                <Avatar className="h-8 w-8 border-2 border-[#1e2329]">
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback className="bg-[#1e2329] text-white text-xs font-bold">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            )}
          </div>
        </div>

        {/* 移动端导航 Tab */}
        {navItems && navItems.length > 0 && (
          <div className="md:hidden mt-3">
            <div className="flex items-center gap-1 bg-[#1e2329] p-1 rounded-lg overflow-x-auto">
              {navItems.map((item) => {
                const isActive = item.value === activeNav;
                return (
                  <button
                    key={item.value}
                    onClick={() => onNavChange?.(item.value)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0 whitespace-nowrap',
                      isActive
                        ? 'bg-[#f0b90b] text-[#0b0e11]'
                        : 'text-[#848e9c] hover:text-white'
                    )}
                  >
                    {item.icon && (
                      <span className={cn(
                        'flex-shrink-0',
                        isActive ? 'text-[#0b0e11]' : 'text-[#848e9c]'
                      )}>
                        {React.cloneElement(item.icon as React.ReactElement<any>, {
                          className: 'h-4 w-4',
                        } as any)}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
