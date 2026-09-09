import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BetSlipDrawer } from './components/BetSlipDrawer';
import { Providers } from './components/Providers';
import { Toaster } from './components/ui/Toaster';

export const metadata: Metadata = {
  title: 'StakeRoom — Live Cricket Betting & Commentary Broadcast',
  description: 'Ultra-low latency live cricket betting exchange with synchronized host audio commentary. Bet on every ball, wicket, and six in real time.',
  keywords: ['cricket betting', 'live betting', 'IPL betting', 'live odds', 'sports betting'],
  themeColor: '#05080f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-[#05080f] text-slate-100 min-h-screen flex flex-col antialiased">
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
