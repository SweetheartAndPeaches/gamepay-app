import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  RefreshCw,
  HelpCircle,
  Bell,
  Settings,
  MoreVertical,
  ChevronDown,
} from 'lucide-react';

export interface PageHeaderProps {
  /** 标题 */
  title: string;
  /** 副标题（可选） */
  subtitle?: string;
  /** 是否显示返回按钮 */
  showBack?: boolean;
  /** 返回按钮点击事件 */
  onBack?: () => void;
  /** 右侧操作按钮 */
  actions?: React.ReactNode;
  /** 是否显示帮助按钮 */
  showHelp?: boolean;
  /** 帮助按钮点击事件 */
  onHelp?: () => void;
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
  /** 是否显示设置按钮 */
  showSettings?: boolean;
  /** 设置按钮点击事件 */
  onSettings?: () => void;
  /** 是否显示更多菜单 */
  showMore?: boolean;
  /** 更多菜单点击事件 */
  onMore?: () => void;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 背景渐变颜色 */
  gradient?: 'blue' | 'purple' | 'orange' | 'green' | 'red' | 'gray';
  /** 是否启用下拉切换（用于子页面） */
  showDropdown?: boolean;
  /** 下拉菜单项 */
  dropdownItems?: Array<{ label: string; value: string; icon?: React.ReactNode }>;
  /** 当前选中的下拉项 */
  dropdownValue?: string;
  /** 下拉菜单切换事件 */
  onDropdownChange?: (value: string) => void;
  /** 额外的样式类名 */
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  actions,
  showHelp = false,
  onHelp,
  showRefresh = false,
  onRefresh,
  showNotification = false,
  notificationCount = 0,
  onNotification,
  showSettings = false,
  onSettings,
  showMore = false,
  onMore,
  icon,
  gradient = 'blue',
  showDropdown = false,
  dropdownItems = [],
  dropdownValue,
  onDropdownChange,
  className,
}: PageHeaderProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const gradients = {
    blue: 'from-blue-600 to-blue-700',
    purple: 'from-purple-600 to-purple-700',
    orange: 'from-orange-500 to-orange-600',
    green: 'from-green-600 to-green-700',
    red: 'from-red-600 to-red-700',
    gray: 'from-gray-700 to-gray-800',
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

  return (
    <div className={cn(
      'bg-gradient-to-r px-4 py-3 shadow-md sticky top-0 z-50',
      gradients[gradient],
      className
    )}>
      <div className="flex items-center justify-between">
        {/* 左侧：返回按钮或Logo */}
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/10 h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            {icon && (
              <div className="bg-white/20 p-1.5 rounded-lg">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-white/80 leading-tight mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            {showDropdown && dropdownItems.length > 0 && (
              <button
                onClick={() => {
                  const currentIndex = dropdownItems.findIndex(item => item.value === dropdownValue);
                  const nextIndex = (currentIndex + 1) % dropdownItems.length;
                  onDropdownChange?.(dropdownItems[nextIndex].value);
                }}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors"
              >
                <span className="text-xs text-white">
                  {dropdownItems.find(item => item.value === dropdownValue)?.label}
                </span>
                <ChevronDown className="h-3 w-3 text-white/80" />
              </button>
            )}
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-1">
          {/* 自定义操作按钮 */}
          {actions}

          {/* 刷新按钮 */}
          {showRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-white hover:bg-white/10 h-9 w-9"
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
              className="text-white hover:bg-white/10 h-9 w-9 relative"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>
          )}

          {/* 帮助按钮 */}
          {showHelp && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onHelp}
              className="text-white hover:bg-white/10 h-9 w-9"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          )}

          {/* 设置按钮 */}
          {showSettings && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettings}
              className="text-white hover:bg-white/10 h-9 w-9"
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}

          {/* 更多菜单 */}
          {showMore && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMore}
              className="text-white hover:bg-white/10 h-9 w-9"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
