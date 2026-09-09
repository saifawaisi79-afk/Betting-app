import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BetSlipDrawer } from './components/BetSlipDrawer';
import { Providers } from './components/Providers';
import { Toaster } from './components/ui/Toaster';

export const metadata: Metadata = {
  title: 'StakeRoom — Live Sports Betting & Commentary Broadcast',
  description: 'Ultra-low latency live sports betting exchange with synchronized host audio commentary rooms.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#080c14] text-slate-100 min-h-screen flex flex-col antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <BetSlipDrawer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
