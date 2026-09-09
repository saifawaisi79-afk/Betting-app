'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Trophy,
  Radio,
  TrendingUp,
  BarChart3,
  Users,
  FileText,
  ArrowLeft,
  Zap,
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Matches', href: '/admin/matches', icon: Trophy },
  { label: 'Live Rooms', href: '/admin/rooms', icon: Radio },
  { label: 'Markets & Odds', href: '/admin/markets', icon: TrendingUp },
  { label: 'All Bets Feed', href: '/admin/bets', icon: BarChart3 },
  { label: 'User Directory', href: '/admin/users', icon: Users },
  { label: 'Audit Log', href: '/admin/audit', icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-[#0b101b] border-r border-[#1a273e] min-h-screen">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1a273e]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00e676] to-[#00c853] flex items-center justify-center">
          <Zap size={16} className="text-black fill-black" />
        </div>
        <div>
          <p className="font-extrabold text-sm text-white font-['Outfit']">StakeRoom</p>
          <p className="text-[10px] text-[#00e676] uppercase tracking-widest font-mono">Host & Admin Studio</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all',
                active
                  ? 'bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30 shadow-md shadow-[#00e676]/10'
                  : 'text-[#8899aa] hover:text-white hover:bg-[#121b2d]'
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Return to Sportsbook Client */}
      <div className="p-4 border-t border-[#1a273e]">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#00e676] to-[#00c853] hover:opacity-90 transition-all shadow-lg shadow-[#00e676]/20"
        >
          <ArrowLeft size={14} /> Back to Sportsbook
        </Link>
      </div>
    </aside>
  );
}
