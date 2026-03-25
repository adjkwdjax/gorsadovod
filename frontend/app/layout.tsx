import type {Metadata} from 'next';
import './globals.css'; // Global styles
import AppLayout from '@/components/layout/AppLayout';
import { AuthProvider } from '@/store/auth';

export const metadata: Metadata = {
  title: 'Городской Садовод',
  description: 'Платформа для местного городского сообщества садоводов-любителей',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ru">
      <body suppressHydrationWarning>
        <AuthProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
