'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  TrendingUp,
  Users,
  Radio,
  DollarSign,
  Activity,
  Trophy,
  ArrowUpRight,
  ShieldAlert,
  BarChart3,
  Sliders,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  activeRooms: number;
  totalBetsPlaced: number;
  totalVolume: number;
  activeExposure: number;
  liveMatches: Array<{
    id: string;
    teamA: string;
    teamB: string;
    currentScore?: string;
    matchRoom?: { id: string; participantCount: number };
  }>;
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const cards = [
    {
      title: 'Platform Volume',
      value: formatCurrency(stats?.totalVolume || 0),
      icon: DollarSign,
      color: 'text-[#00e676]',
      bg: 'bg-[#00e676]/10 border-[#00e676]/25',
    },
    {
      title: 'Active Exposure',
      value: formatCurrency(stats?.activeExposure || 0),
      icon: TrendingUp,
      color: 'text-[#00b0ff]',
      bg: 'bg-[#00b0ff]/10 border-[#00b0ff]/25',
    },
    {
      title: 'Live Rooms',
      value: stats?.activeRooms ?? 0,
      icon: Radio,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/25',
    },
    {
      title: 'Total Bets',
      value: stats?.totalBetsPlaced ?? 0,
      icon: Activity,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/25',
    },
    {
      title: 'Registered Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/25',
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00e676] live-dot" />
            <span className="text-[11px] font-bold text-[#00e676] uppercase tracking-widest font-mono">
              Live Operations Control
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
            Host Studio & Admin Console
          </h1>
          <p className="text-xs text-[#8899aa] mt-1">
            Telemetry metrics, real-time audio rooms, market settling, and escrow oversight.
          </p>
        </div>
        <Link
          href="/admin/matches"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00c853] text-black font-extrabold text-xs hover:opacity-95 transition-all shadow-lg shadow-[#00e676]/20 self-start sm:self-auto"
        >
          <Plus size={15} /> Schedule Match
        </Link>
      </div>

      {/* 5 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.title}
              whileHover={{ translateY: -2 }}
              className="p-5 rounded-2xl bg-[#0a0f1d] border border-white/[0.08] shadow-xl flex flex-col justify-between card-sportsbook relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#8899aa] uppercase tracking-wider">
                  {c.title}
                </span>
                <div className={`p-2 rounded-xl border ${c.bg}`}>
                  <Icon size={15} className={c.color} />
                </div>
              </div>
              <div className="mt-4">
                {isLoading ? (
                  <Skeleton className="h-8 w-24 rounded-lg" />
                ) : (
                  <p className="text-2xl font-black font-mono text-white font-tabular tracking-tight">
                    {c.value}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Live Matches & Control Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Match Rooms */}
        <div className="bg-[#0a0f1d] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="text-sm font-extrabold text-white font-['Outfit'] flex items-center gap-2 uppercase tracking-wider">
              <Radio className="text-red-500 animate-pulse" size={17} /> Active Match Rooms
            </h3>
            <Link href="/admin/rooms" className="text-xs text-[#00e676] font-bold hover:underline flex items-center gap-1">
              View All <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-[#10172a] border border-white/[0.06] flex justify-between items-center">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              ))
            ) : stats?.liveMatches && stats.liveMatches.length > 0 ? (
              stats.liveMatches.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-[#10172a] border border-white/[0.06] flex items-center justify-between hover:border-white/[0.1] transition-all"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {m.teamA} vs {m.teamB}
                    </h4>
                    {m.currentScore && (
                      <p className="text-xs font-mono font-bold text-[#00e676] font-tabular mt-0.5">{m.currentScore}</p>
                    )}
                  </div>
                  {m.matchRoom ? (
                    <Link
                      href={`/admin/rooms/${m.matchRoom.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 text-xs font-bold hover:bg-red-500/25 transition-all flex items-center gap-1.5"
                    >
                      <Radio size={13} className="animate-pulse" /> Enter Studio
                    </Link>
                  ) : (
                    <Link
                      href="/admin/matches"
                      className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-300 text-xs font-semibold hover:bg-white/[0.08] transition-all"
                    >
                      Launch Room
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-[#8899aa]">
                <Radio size={28} className="mx-auto text-white/[0.1] mb-2" />
                <p className="text-xs">No active live match rooms. Launch a room from the Matches tab!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Operations Links */}
        <div className="bg-[#0a0f1d] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-extrabold text-white font-['Outfit'] uppercase tracking-wider">
            Host Quick Operations
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/matches"
              className="p-4 rounded-xl bg-[#10172a] border border-white/[0.06] hover:border-[#00e676]/40 transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 flex items-center justify-center">
                <Trophy className="text-[#00e676]" size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-[#00e676] transition-colors">
                  Matches & Streams
                </h4>
                <p className="text-[11px] text-[#8899aa] mt-0.5">Schedule & link HLS video streams</p>
              </div>
            </Link>

            <Link
              href="/admin/markets"
              className="p-4 rounded-xl bg-[#10172a] border border-white/[0.06] hover:border-[#00b0ff]/40 transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#00b0ff]/10 flex items-center justify-center">
                <TrendingUp className="text-[#00b0ff]" size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-[#00b0ff] transition-colors">
                  Odds & Markets
                </h4>
                <p className="text-[11px] text-[#8899aa] mt-0.5">Adjust lines & settle winners</p>
              </div>
            </Link>

            <Link
              href="/admin/bets"
              className="p-4 rounded-xl bg-[#10172a] border border-white/[0.06] hover:border-purple-400/40 transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Activity className="text-purple-400" size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                  All Bets Stream
                </h4>
                <p className="text-[11px] text-[#8899aa] mt-0.5">Inspect user tickets in real-time</p>
              </div>
            </Link>

            <Link
              href="/admin/users"
              className="p-4 rounded-xl bg-[#10172a] border border-white/[0.06] hover:border-amber-400/40 transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Users className="text-amber-400" size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                  User Directory
                </h4>
                <p className="text-[11px] text-[#8899aa] mt-0.5">Review balances & permissions</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
