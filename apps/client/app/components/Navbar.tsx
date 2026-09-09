'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { useBetSlipStore } from '../lib/store';
import { Zap, Radio, Trophy, Wallet, Receipt, ShoppingBag, User, LogIn, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const { items, setIsOpen } = useBetSlipStore();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!localStorage.getItem('accessToken'));
  }, [pathname]);

  const { data: wallet } = useQuery({
    queryKey: ['my-wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet');
      return res.data;
    },
    enabled: hasToken,
    refetchInterval: 10000,
  });

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setHasToken(false);
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080c14]/90 backdrop-blur-md border-b border-[#1a273e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00e676] to-[#00b0ff] flex items-center justify-center shadow-lg shadow-[#00e676]/20 group-hover:scale-105 transition-all">
              <Zap size={20} className="text-black fill-black" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white font-['Outfit'] tracking-tight">
                STAKE<span className="text-[#00e676]">ROOM</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] text-[#00b0ff] uppercase tracking-widest font-mono ml-2 px-1.5 py-0.5 rounded bg-[#00b0ff]/10 border border-[#00b0ff]/20">
                Live Broadcast
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                pathname === '/'
                  ? 'text-white bg-[#162238]'
                  : 'text-[#8899aa] hover:text-white hover:bg-[#0f172a]'
              }`}
            >
              Live Matches
            </Link>
            <Link
              href="/bets"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                pathname === '/bets'
                  ? 'text-white bg-[#162238]'
                  : 'text-[#8899aa] hover:text-white hover:bg-[#0f172a]'
              }`}
            >
              My Bets
            </Link>
            <Link
              href="/wallet"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                pathname === '/wallet'
                  ? 'text-white bg-[#162238]'
                  : 'text-[#8899aa] hover:text-white hover:bg-[#0f172a]'
              }`}
            >
              Wallet
            </Link>
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ml-2 ${
                pathname.startsWith('/admin')
                  ? 'text-[#00e676] bg-[#00e676]/15 border border-[#00e676]/30'
                  : 'text-[#00e676] hover:bg-[#00e676]/10 border border-[#00e676]/20'
              }`}
            >
              <Radio size={13} className="text-[#00e676] animate-pulse" />
              Host Studio
            </Link>
          </nav>
        </div>

        {/* Right Side / Actions */}
        <div className="flex items-center gap-3">
          {hasToken ? (
            <>
              {/* Wallet pill */}
              <Link
                href="/wallet"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0e1726] border border-[#1e2d45] hover:border-[#00e676]/40 transition-all text-sm group"
              >
                <Wallet size={15} className="text-[#00e676]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#8899aa] font-medium leading-none">Balance</span>
                  <span className="font-mono font-bold text-white text-xs">
                    {formatCurrency(wallet?.balance || 0)}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-lg text-[#8899aa] hover:text-[#ff3366] hover:bg-[#ff3366]/10 transition-all"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-[#8899aa] hover:text-white transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 rounded-lg text-sm font-bold bg-[#00e676] text-black hover:bg-[#00c853] transition-all shadow-lg shadow-[#00e676]/20"
              >
                Join Now
              </Link>
            </div>
          )}

          {/* Bet Slip trigger button with badge */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#162238] border border-[#1e2d45] text-white hover:border-[#00e676]/40 transition-all"
          >
            <Receipt size={17} className="text-[#00e676]" />
            <span className="text-xs font-semibold hidden sm:inline">Bet Slip</span>
            {items.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#00e676] text-black font-mono font-bold text-[11px] flex items-center justify-center animate-bounce">
                {items.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
