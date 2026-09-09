import type { Metadata } from 'next';
import './globals.css';
import { AdminSidebar } from './components/AdminSidebar';
import { Providers } from './components/Providers';
import { Toaster } from './components/ui/Toaster';

export const metadata: Metadata = {
  title: 'BettingPlatform Admin Console',
  description: 'Sports Betting Platform — Admin Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto bg-[#0a0e17]">
              {children}
            </main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
