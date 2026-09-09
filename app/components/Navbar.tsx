'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { useBetSlipStore } from '../lib/store';
import {
  Zap, Radio, Wallet, Receipt, LogIn, LogOut,
  ChevronRight, Activity, BarChart3, CircleDot,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const { items, setIsOpen } = useBetSlipStore();
  const [hasToken, setHasToken] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setHasToken(!!localStorage.getItem('accessToken'));
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    localStorage.removeItem('userRole');
    setHasToken(false);
    window.location.href = '/login';
  };

  const navLinks = [
    { href: '/',       label: 'Cricket',     icon: CircleDot },
    { href: '/bets',   label: 'My Bets',     icon: Activity  },
    { href: '/wallet', label: 'Wallet',       icon: BarChart3 },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-[#05080f]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl shadow-black/40'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* ── Brand ── */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group select-none">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00e676] to-[#00b0ff] flex items-center justify-center shadow-lg shadow-[#00e676]/30 group-hover:scale-110 transition-transform duration-200">
                <Zap size={18} className="text-black fill-black" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00e676] live-dot border-2 border-[#05080f]" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-[17px] text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                STAKE<span className="text-[#00e676]">ROOM</span>
              </span>
              <span className="text-[9px] text-[#00b0ff] uppercase tracking-[0.2em] font-semibold mt-0.5 hidden sm:block">
                🏏 Live Cricket
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
                    active
                      ? 'text-white bg-white/[0.08] border border-white/[0.08]'
                      : 'text-[#64748b] hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-[#00e676]' : ''} />
                  {label}
                </Link>
              );
            })}
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-bold transition-all duration-200 border ml-1 ${
                pathname.startsWith('/admin')
                  ? 'text-[#00e676] bg-[#00e676]/10 border-[#00e676]/30'
                  : 'text-[#00e676]/80 border-[#00e676]/15 hover:bg-[#00e676]/8 hover:text-[#00e676]'
              }`}
            >
              <Radio size={13} className="animate-pulse" />
              Host Studio
            </Link>
          </nav>
        </div>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2">

          {hasToken ? (
            <>
              {/* Wallet Pill */}
              <Link
                href="/wallet"
                className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:border-[#00e676]/30 hover:bg-white/[0.06] transition-all duration-200 group"
              >
                <div className="w-6 h-6 rounded-lg bg-[#00e676]/15 flex items-center justify-center">
                  <Wallet size={13} className="text-[#00e676]" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] text-[#64748b] font-semibold uppercase tracking-wider">Balance</span>
                  <span className="text-xs font-bold text-white mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {formatCurrency(wallet?.balance || 0)}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:text-[#ff3366] hover:bg-[#ff3366]/10 transition-all duration-200"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold text-[#64748b] hover:text-white transition-all"
              >
                <LogIn size={14} />
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-bold bg-gradient-to-r from-[#00e676] to-[#00b0ff] text-black hover:opacity-90 transition-all shadow-lg shadow-[#00e676]/20"
              >
                Join Free <ChevronRight size={13} />
              </Link>
            </div>
          )}

          {/* Bet Slip Badge */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:border-[#00e676]/30 text-white hover:bg-white/[0.06] transition-all duration-200"
          >
            <Receipt size={15} className="text-[#00e676]" />
            <span className="text-xs font-semibold hidden sm:inline text-[#94a3b8]">Slip</span>
            {items.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#00e676] text-black font-black text-[10px] flex items-center justify-center animate-bounce">
                {items.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
