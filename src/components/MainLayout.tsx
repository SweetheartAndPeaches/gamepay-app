import { ReactNode } from 'react';
import BottomNavigation from './BottomNavigation';
import BalanceHeader from './BalanceHeader';

interface MainLayoutProps {
  children: ReactNode;
  showBalance?: boolean;
}

export default function MainLayout({ children, showBalance = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {showBalance && <BalanceHeader />}
      <div className="max-w-md mx-auto">
        {children}
      </div>
      <BottomNavigation />
    </div>
  );
}
