import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { I18nProvider } from '@/i18n/context';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Task Wallet | Payment Platform',
    template: '%s | Task Wallet',
  },
  description: 'Task Wallet - A payment platform for managing payout and payin tasks',
  keywords: [
    'Task Wallet',
    'Payment',
    'Payout',
    'Payin',
    'Payment Platform',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        <AuthProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
