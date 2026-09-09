'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { TrendingUp, Users, Radio, DollarSign, Activity, Trophy, ArrowUpRight } from 'lucide-react';
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
      title: 'Total Platform Volume',
      value: formatCurrency(stats?.totalVolume || 0),
      icon: DollarSign,
      color: 'text-[#00e676]',
      bg: 'bg-[#00e676]/10 border-[#00e676]/30',
    },
    {
      title: 'Active Exposure (Escrow)',
      value: formatCurrency(stats?.activeExposure || 0),
      icon: TrendingUp,
      color: 'text-[#00b0ff]',
      bg: 'bg-[#00b0ff]/10 border-[#00b0ff]/30',
    },
    {
      title: 'Active Live Rooms',
      value: stats?.activeRooms ?? 0,
      icon: Radio,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/30',
    },
    {
      title: 'Total Bets Placed',
      value: stats?.totalBetsPlaced ?? 0,
      icon: Activity,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/30',
    },
    {
      title: 'Registered Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white font-['Outfit']">Host Studio & Admin Console</h1>
          <p className="text-xs text-[#8899aa] mt-1">
            Real-time platform metrics, live host audio rooms, and odds management.
          </p>
        </div>
        <Link
          href="/admin/matches"
          className="px-4 py-2 rounded-xl bg-[#00e676] text-black font-extrabold text-xs hover:bg-[#00c853] transition-all shadow-lg shadow-[#00e676]/20"
        >
          + Schedule Match
        </Link>
      </div>

      {/* 5 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="p-5 rounded-2xl bg-[#0b101b] border border-[#1a273e] shadow-xl flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#8899aa] uppercase tracking-wider">
                  {c.title}
                </span>
                <div className={`p-2 rounded-xl border ${c.bg}`}>
                  <Icon size={16} className={c.color} />
                </div>
              </div>
              <p className="text-2xl font-black font-mono text-white mt-4">
                {isLoading ? '...' : c.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Live Matches & Control Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0b101b] border border-[#1a273e] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1a273e] pb-3">
            <h3 className="text-base font-extrabold text-white font-['Outfit'] flex items-center gap-2">
              <Radio className="text-red-500 animate-pulse" size={18} /> Active Match Rooms
            </h3>
            <Link href="/admin/rooms" className="text-xs text-[#00e676] font-bold hover:underline">
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.liveMatches && stats.liveMatches.length > 0 ? (
              stats.liveMatches.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-[#101726] border border-[#1e2d45] flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {m.teamA} vs {m.teamB}
                    </h4>
                    {m.currentScore && (
                      <p className="text-xs font-mono font-bold text-[#00e676]">{m.currentScore}</p>
                    )}
                  </div>
                  {m.matchRoom ? (
                    <Link
                      href={`/admin/rooms/${m.matchRoom.id}`}
                      className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-600/30 text-xs font-bold hover:bg-red-600/30 transition-all flex items-center gap-1.5"
                    >
                      <Radio size={13} className="animate-pulse" /> Enter Studio
                    </Link>
                  ) : (
                    <Link
                      href="/admin/matches"
                      className="px-3 py-1.5 rounded-lg bg-[#1a273e] text-slate-300 text-xs font-medium hover:bg-[#22334e] transition-all"
                    >
                      Launch Room
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-[#8899aa] py-6 text-center">
                No active live match rooms. Launch a room from the Matches tab!
              </p>
            )}
          </div>
        </div>

        {/* Quick Operations Links */}
        <div className="bg-[#0b101b] border border-[#1a273e] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-extrabold text-white font-['Outfit']">Host Quick Actions</h3>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/matches"
              className="p-4 rounded-xl bg-[#101726] border border-[#1e2d45] hover:border-[#00e676]/40 transition-all flex flex-col justify-between gap-3 group"
            >
              <Trophy className="text-[#00e676]" size={20} />
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-[#00e676] transition-colors">
                  Matches & Streams
                </h4>
                <p className="text-[11px] text-[#8899aa]">Create & link video stream URLs</p>
              </div>
            </Link>

            <Link
              href="/admin/markets"
              className="p-4 rounded-xl bg-[#101726] border border-[#1e2d45] hover:border-[#00b0ff]/40 transition-all flex flex-col justify-between gap-3 group"
            >
              <TrendingUp className="text-[#00b0ff]" size={20} />
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-[#00b0ff] transition-colors">
                  Odds & Markets
                </h4>
                <p className="text-[11px] text-[#8899aa]">Adjust live odds & settle winners</p>
              </div>
            </Link>

            <Link
              href="/admin/bets"
              className="p-4 rounded-xl bg-[#101726] border border-[#1e2d45] hover:border-purple-400/40 transition-all flex flex-col justify-between gap-3 group"
            >
              <Activity className="text-purple-400" size={20} />
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                  All Bets Stream
                </h4>
                <p className="text-[11px] text-[#8899aa]">Inspect all placed user tickets</p>
              </div>
            </Link>

            <Link
              href="/admin/users"
              className="p-4 rounded-xl bg-[#101726] border border-[#1e2d45] hover:border-amber-400/40 transition-all flex flex-col justify-between gap-3 group"
            >
              <Users className="text-amber-400" size={20} />
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                  User Accounts
                </h4>
                <p className="text-[11px] text-[#8899aa]">Review balances & roles</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
