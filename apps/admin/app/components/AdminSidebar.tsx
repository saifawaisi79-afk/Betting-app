'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Trophy, Radio, BarChart3,
  Users, FileText, LogOut, Zap, TrendingUp,
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Matches', href: '/matches', icon: Trophy },
  { label: 'Live Rooms', href: '/rooms', icon: Radio },
  { label: 'Markets & Odds', href: '/markets', icon: TrendingUp },
  { label: 'All Bets', href: '/bets', icon: BarChart3 },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Audit Log', href: '/audit', icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-[#0f1622] border-r border-[#1e2d45]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1e2d45]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00e676] to-[#00c853] flex items-center justify-center">
          <Zap size={16} className="text-black" />
        </div>
        <div>
          <p className="font-bold text-sm text-white font-['Outfit']">BettingPlatform</p>
          <p className="text-[10px] text-[#8899aa] uppercase tracking-widest">Admin Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-all',
                active
                  ? 'bg-[rgba(0,230,118,0.12)] text-[#00e676] border border-[rgba(0,230,118,0.2)]'
                  : 'text-[#8899aa] hover:text-white hover:bg-[#1a2238]',
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#1e2d45]">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm text-[#8899aa] hover:text-[#ff4757] hover:bg-[rgba(255,71,87,0.08)] transition-all w-full">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
