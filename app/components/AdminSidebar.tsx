'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
    <aside className="w-64 flex-shrink-0 flex flex-col bg-[#06080e] border-r border-white/[0.08] min-h-screen">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.08]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00e676] to-[#00b0ff] flex items-center justify-center shadow-lg shadow-[#00e676]/25">
          <Zap size={17} className="text-black fill-black" />
        </div>
        <div>
          <p className="font-black text-sm text-white font-['Outfit'] tracking-tight">STAKEROOM</p>
          <p className="text-[9px] text-[#00e676] uppercase tracking-widest font-mono font-bold">Host & Studio Control</p>
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
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative',
                active
                  ? 'bg-[#00e676]/12 text-[#00e676] border border-[#00e676]/30 shadow-md shadow-[#00e676]/10'
                  : 'text-[#8899aa] hover:text-white hover:bg-white/[0.04]'
              )}
            >
              <Icon size={16} strokeWidth={2} className={active ? 'text-[#00e676]' : 'text-[#8899aa]'} />
              {item.label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00e676] shadow-sm shadow-[#00e676]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Return to Sportsbook Client */}
      <div className="p-4 border-t border-white/[0.08]">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-extrabold text-black bg-gradient-to-r from-[#00e676] to-[#00c853] hover:opacity-95 transition-all shadow-lg shadow-[#00e676]/20"
        >
          <ArrowLeft size={14} /> Back to Sportsbook
        </Link>
      </div>
    </aside>
  );
}
