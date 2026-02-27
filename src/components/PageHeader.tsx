import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  Bell,
  Menu,
  MessageSquare,
  Headphones,
  User,
  ChevronDown,
} from 'lucide-react';

export interface PageHeaderProps {
  /** 标题 */
  title: string;
  /** 副标题（可选） */
  subtitle?: string;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 背景渐变颜色 */
  gradient?: 'blue' | 'purple' | 'orange' | 'green' | 'red' | 'gray' | 'modern';
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
  /** 是否显示侧边栏按钮 */
  showMenu?: boolean;
  /** 侧边栏按钮点击事件 */
  onMenu?: () => void;
  /** 是否显示用户头像 */
  showAvatar?: boolean;
  /** 用户头像 */
  avatarUrl?: string;
  /** 用户名称（用于头像 fallback） */
  userName?: string;
  /** 用户菜单点击事件 */
  onAvatarClick?: () => void;
  /** Tab 切换项 */
  tabs?: Array<{ label: string; value: string; icon?: React.ReactNode }>;
  /** 当前选中的 Tab */
  activeTab?: string;
  /** Tab 切换事件 */
  onTabChange?: (value: string) => void;
  /** 额外的样式类名 */
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  gradient = 'blue',
  showRefresh = false,
  onRefresh,
  showNotification = false,
  notificationCount = 0,
  onNotification,
  showSupport = false,
  onSupport,
  showMenu = false,
  onMenu,
  showAvatar = false,
  avatarUrl,
  userName = 'U',
  onAvatarClick,
  tabs = [],
  activeTab,
  onTabChange,
  className,
}: PageHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const gradients = {
    blue: 'from-blue-600 via-blue-700 to-blue-800',
    purple: 'from-purple-600 via-purple-700 to-purple-800',
    orange: 'from-orange-500 via-orange-600 to-orange-700',
    green: 'from-green-600 via-green-700 to-green-800',
    red: 'from-red-600 via-red-700 to-red-800',
    gray: 'from-gray-700 via-gray-800 to-gray-900',
    modern: 'from-slate-900 via-slate-800 to-slate-900',
  };

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
    <div className={cn(
      'sticky top-0 z-50 backdrop-blur-md bg-gradient-to-br shadow-lg',
      gradients[gradient],
      className
    )}>
      <div className="px-4 py-3">
        {/* 顶部：标题和操作按钮 */}
        <div className="flex items-center justify-between mb-3">
          {/* 左侧：菜单按钮、Logo、标题 */}
          <div className="flex items-center gap-3">
            {showMenu && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenu}
                className="text-white hover:bg-white/10 h-9 w-9 transition-all hover:scale-105"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            
            <div className="flex items-center gap-2.5">
              {icon && (
                <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-xl shadow-inner">
                  {React.cloneElement(icon as React.ReactElement<any>, {
                    className: 'h-5 w-5 text-white',
                  } as any)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-white leading-tight drop-shadow-sm">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-white/80 leading-tight mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-1.5">
            {/* 刷新按钮 */}
            {showRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-white hover:bg-white/10 h-9 w-9 transition-all hover:scale-105"
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
                className="text-white hover:bg-white/10 h-9 w-9 relative transition-all hover:scale-105"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-0 text-xs font-bold shadow-lg animate-pulse"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* 人工客服按钮 */}
            {showSupport && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSupport}
                className="text-white hover:bg-white/10 h-9 w-9 transition-all hover:scale-105"
                title="人工客服"
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
                className="text-white hover:bg-white/10 h-9 w-9 p-0 transition-all hover:scale-105"
              >
                <Avatar className="h-8 w-8 border-2 border-white/30">
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-white/20 to-white/10 text-white text-xs font-bold">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            )}
          </div>
        </div>

        {/* 底部：Tab 切换（如果有） */}
        {tabs && tabs.length > 0 && (
          <div className="flex items-center gap-1 bg-black/20 backdrop-blur-sm p-1 rounded-xl">
            {tabs.map((tab) => {
              const isActive = tab.value === activeTab;
              return (
                <button
                  key={tab.value}
                  onClick={() => onTabChange?.(tab.value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1',
                    isActive
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  {tab.icon && (
                    <span className={cn(
                      'flex-shrink-0',
                      isActive ? 'text-slate-900' : 'text-white/70'
                    )}>
                      {React.cloneElement(tab.icon as React.ReactElement<any>, {
                        className: 'h-4 w-4',
                      } as any)}
                    </span>
                  )}
                  <span>{tab.label}</span>
                  {isActive && (
                    <Badge
                      variant="secondary"
                      className="ml-auto h-5 px-1.5 text-xs bg-slate-200 text-slate-700"
                    >
                      {tab.value === 'hall' ? '任务大厅' : tab.value === 'claimed' ? '已领取' : '已完成'}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
