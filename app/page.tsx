'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from './lib/api';
import { useBetSlipStore } from './lib/store';
import { formatDate } from './lib/utils';
import { MatchCardSkeleton } from './components/ui/Skeleton';
import { Badge } from './components/ui/Badge';
import Link from 'next/link';
import {
  Radio, Trophy, Flame, Zap, TrendingUp, Clock,
  ArrowRight, Headphones, Users, CircleDot, Activity,
  ChevronRight, Star, Shield, Sparkles,
} from 'lucide-react';

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  sport: { id: string; name: string };
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  currentScore?: string | null;
  scheduledStart: string;
  streamUrl?: string | null;
  matchRoom?: {
    id: string;
    status: string;
    participantCount: number;
    host: { displayName: string };
  } | null;
  markets?: Array<{
    id: string;
    name: string;
    status: string;
    outcomes: Array<{
      id: string;
      name: string;
      odds: number;
      status: string;
    }>;
  }>;
}

const SPORTS = ['ALL', 'Cricket', 'Tennis', 'Basketball', 'Kabaddi', 'Esports'];

const CRICKET_FACTS = [
  { icon: CircleDot, val: '12+', label: 'Live Matches', color: 'text-[#00e676]' },
  { icon: Headphones, val: '<150ms', label: 'Audio Latency', color: 'text-[#00b0ff]' },
  { icon: Users, val: '50K+', label: 'Active Bettors', color: 'text-yellow-400' },
  { icon: Shield, val: '100%', label: 'Secure Escrow', color: 'text-purple-400' },
];

export default function HomePage() {
  const [selectedSport, setSelectedSport] = useState<string>('Cricket');
  const { addItem, items } = useBetSlipStore();

  const { data: matches, isLoading } = useQuery<Match[]>({
    queryKey: ['client-matches'],
    queryFn: async () => {
      const res = await api.get('/matches');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const filteredMatches = matches?.filter((m) =>
    selectedSport === 'ALL' ? true : m.sport?.name?.toLowerCase() === selectedSport.toLowerCase()
  );
  const liveMatches = matches?.filter((m) => m.status === 'LIVE' || m.matchRoom?.status === 'LIVE');

  return (
    <div className="space-y-0 pb-20 bg-[#05080f]">

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden min-h-[88vh] flex flex-col justify-center">
        {/* Multi-layer background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080d18] via-[#05080f] to-[#05080f]" />
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/5 w-96 h-96 bg-[#00e676]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-[#00b0ff]/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '2s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-purple-600/4 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left copy */}
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00e676]/8 border border-[#00e676]/20 text-[#00e676] text-xs font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-[#00e676] live-dot" />
                🏏 Live Cricket Betting Platform
              </div>

              <div className="space-y-2">
                <h1 className="text-5xl sm:text-7xl font-black leading-[0.95] tracking-tight text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  WATCH.
                  <br />
                  <span className="grad-green">LISTEN.</span>
                  <br />
                  BET LIVE.
                </h1>
                <p className="text-[#64748b] text-base sm:text-lg max-w-lg leading-relaxed pt-2">
                  Feel every boundary, wicket, and six with synchronized host audio commentary. Place bets in real time with ultra-low latency settlement.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {liveMatches && liveMatches.length > 0 && liveMatches[0]?.matchRoom ? (
                  <Link
                    href={`/rooms/${liveMatches[0].matchRoom.id}`}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00b0ff] text-black font-extrabold text-sm hover:opacity-90 transition-all shadow-xl shadow-[#00e676]/25 group"
                  >
                    <Radio size={17} className="animate-pulse" />
                    Join Live Room
                    <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <Link
                    href="#matches"
                    className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00c853] text-black font-extrabold text-sm hover:opacity-90 transition-all shadow-xl shadow-[#00e676]/25 group"
                  >
                    <Trophy size={17} />
                    Browse Matches
                    <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                <Link
                  href="/wallet"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white font-bold text-sm hover:bg-white/[0.07] transition-all"
                >
                  <Zap size={16} className="text-[#00e676]" />
                  Instant Deposit
                </Link>
              </div>

              {/* Stat row */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                {CRICKET_FACTS.map(({ icon: Icon, val, label, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon size={15} className={color} />
                    <div>
                      <p className="text-sm font-black text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{val}</p>
                      <p className="text-[10px] text-[#475569] uppercase tracking-wider font-semibold">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Live Rooms Preview */}
            <div className="hidden lg:block">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 live-dot" />
                    <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Active Rooms</span>
                  </div>
                  <span className="text-xs text-[#475569]">{liveMatches?.length || 0} broadcasting</span>
                </div>

                {liveMatches && liveMatches.length > 0 ? (
                  liveMatches.slice(0, 3).map((m, i) => (
                    <Link
                      key={m.id}
                      href={`/rooms/${m.matchRoom?.id || m.id}`}
                      className="group flex items-center justify-between p-4 rounded-2xl glass border border-white/[0.06] hover:border-red-500/30 transition-all card-lift"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                          <Radio size={15} className="text-red-400 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{m.teamA} vs {m.teamB}</p>
                          {m.currentScore && (
                            <p className="text-xs text-[#00e676] font-mono font-bold">{m.currentScore}</p>
                          )}
                          <div className="flex items-center gap-1 mt-0.5">
                            <Headphones size={11} className="text-[#00b0ff]" />
                            <span className="text-[10px] text-[#475569]">
                              {m.matchRoom?.host?.displayName || 'Live Host'} •{' '}
                              {m.matchRoom?.participantCount || 0} listening
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-red-400 group-hover:text-red-300 transition-colors">
                        LIVE <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))
                ) : (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-2xl glass border border-white/[0.04] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl shimmer" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 rounded shimmer w-3/4" />
                        <div className="h-2 rounded shimmer w-1/2" />
                      </div>
                    </div>
                  ))
                )}

                {/* Platform trust badge */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#00e676]/5 border border-[#00e676]/10 mt-4">
                  <Shield size={14} className="text-[#00e676]" />
                  <span className="text-[11px] text-[#64748b]">
                    Licensed platform — all bets settled on-chain with provably fair escrow
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#05080f] to-transparent" />
      </section>

      {/* ══════════ SPORT FILTER + MATCHES ══════════ */}
      <section id="matches" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">

        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Upcoming & Live Matches
            </h2>
            <p className="text-xs text-[#475569] mt-1">
              {filteredMatches?.length || 0} matches available · refreshes every 10s
            </p>
          </div>

          {/* Sport filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {SPORTS.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                  selectedSport === sport
                    ? 'bg-[#00e676] text-black border-[#00e676] shadow-lg shadow-[#00e676]/20'
                    : 'text-[#64748b] border-white/[0.07] bg-white/[0.02] hover:text-white hover:border-white/[0.12]'
                }`}
              >
                {sport === 'Cricket' ? '🏏 ' : sport === 'Tennis' ? '🎾 ' : sport === 'Basketball' ? '🏀 ' : sport === 'Kabaddi' ? '🤼 ' : sport === 'Esports' ? '🎮 ' : ''}
                {sport}
              </button>
            ))}
          </div>
        </div>

        {/* Matches Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredMatches && filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMatches.map((m) => {
              const market = m.markets?.find((mk) => mk.name.includes('Winner') || mk.name.includes('1X2')) || m.markets?.[0];
              const isLive = m.status === 'LIVE';
              return (
                <div
                  key={m.id}
                  className="group relative bg-[#0a0f1d] border border-white/[0.07] rounded-2xl p-5 hover:border-[#00e676]/30 transition-all duration-300 card-lift flex flex-col justify-between overflow-hidden shadow-lg shadow-black/20"
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00e676]/0 to-[#00e676]/0 group-hover:from-[#00e676]/5 transition-all duration-500 rounded-2xl pointer-events-none" />

                  <div>
                    {/* Meta row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isLive ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-extrabold uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-dot" /> LIVE
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#8899aa] text-[10px] font-bold uppercase">
                            {m.sport?.name || 'Cricket'}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#64748b] flex items-center gap-1 font-medium font-tabular">
                        <Clock size={12} /> {formatDate(m.scheduledStart)}
                      </span>
                    </div>

                    {/* Teams */}
                    <div className="mb-4">
                      <h3 className="text-base font-extrabold text-white group-hover:text-[#00e676] transition-colors leading-tight font-['Outfit']">
                        {m.teamA}
                      </h3>
                      <p className="text-[11px] text-[#64748b] font-medium my-0.5">vs</p>
                      <h3 className="text-base font-extrabold text-white leading-tight font-['Outfit']">
                        {m.teamB}
                      </h3>
                      {m.currentScore && (
                        <p className="mt-2 text-lg font-black text-[#00e676] font-mono font-tabular tracking-wider">{m.currentScore}</p>
                      )}
                    </div>

                    {/* Odds buttons */}
                    {market?.outcomes && (
                      <div className="space-y-2">
                        <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-bold">{market.name}</p>
                        <div className={`grid gap-2 ${market.outcomes.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                          {market.outcomes.slice(0, 3).map((out) => {
                            const selected = items.some((i) => i.outcomeId === out.id);
                            return (
                              <motion.button
                                key={out.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() =>
                                  addItem({
                                    matchId: m.id,
                                    matchTitle: `${m.teamA} vs ${m.teamB}`,
                                    marketId: market.id,
                                    marketName: market.name,
                                    outcomeId: out.id,
                                    outcomeName: out.name,
                                    odds: out.odds,
                                  })
                                }
                                className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-center transition-all duration-150 overflow-hidden ${
                                  selected
                                    ? 'bg-[#00e676] border-[#00e676] text-black shadow-lg shadow-[#00e676]/25 font-bold'
                                    : 'bg-[#10172a] border-white/[0.07] text-white hover:border-[#00e676]/40 hover:bg-[#162035]'
                                }`}
                              >
                                <span className={`text-[10px] font-semibold truncate w-full text-center ${selected ? 'text-black/80' : 'text-[#8899aa]'}`}>
                                  {out.name}
                                </span>
                                <span className={`text-sm font-black mt-0.5 font-tabular ${selected ? 'text-black' : 'text-[#00e676]'}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                  {out.odds.toFixed(2)}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                    {m.matchRoom ? (
                      <Link
                        href={`/rooms/${m.matchRoom.id}`}
                        className="flex items-center gap-1.5 text-xs text-red-400 font-bold hover:text-red-300 transition-colors"
                      >
                        <Radio size={13} className="animate-pulse" /> Live Room →
                      </Link>
                    ) : (
                      <span className="text-xs text-[#334155] flex items-center gap-1">
                        <Clock size={11} /> Room opening soon
                      </span>
                    )}
                    <span className="text-[10px] text-[#334155] flex items-center gap-1">
                      <Activity size={10} /> {market?.outcomes?.length || 0} markets
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center glass border border-white/[0.05] rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <CircleDot size={28} className="text-[#334155]" />
            </div>
            <p className="font-bold text-lg text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              🏏 No Cricket Matches Right Now
            </p>
            <p className="text-sm text-[#475569] mt-2 max-w-xs">
              Next session starts soon. Switch sport tab or check back when the next event goes live.
            </p>
            <button
              onClick={() => setSelectedSport('ALL')}
              className="mt-5 px-5 py-2.5 rounded-xl border border-white/[0.08] text-sm font-semibold text-[#94a3b8] hover:text-white hover:border-[#00e676]/30 transition-all"
            >
              View All Sports →
            </button>
          </div>
        )}
      </section>

      {/* ══════════ FEATURES STRIP ══════════ */}
      <section className="border-t border-white/[0.04] bg-gradient-to-r from-[#05080f] via-[#080c18] to-[#05080f] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Headphones,
                color: 'from-[#00e676] to-[#00b0ff]',
                glow: '#00e676',
                title: 'Host Audio Commentary',
                desc: 'Hear real-time one-way host voice as you watch the match — sub-150ms WebRTC latency.',
              },
              {
                icon: Zap,
                color: 'from-[#00b0ff] to-[#9c27b0]',
                glow: '#00b0ff',
                title: 'Instant Bet Settlement',
                desc: 'Bets are auto-settled the moment the match event resolves. Winnings credited in milliseconds.',
              },
              {
                icon: TrendingUp,
                color: 'from-[#ffc107] to-[#ff9800]',
                glow: '#ffc107',
                title: 'Live Odds Updates',
                desc: 'Odds refresh every 10 seconds based on live play. Catch the best lines before they shift.',
              },
            ].map(({ icon: Icon, color, glow, title, desc }) => (
              <div
                key={title}
                className="group relative p-6 rounded-2xl glass border border-white/[0.06] hover:border-white/[0.12] transition-all card-lift"
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at top left, ${glow}06, transparent 70%)` }}
                />
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}
                  style={{ boxShadow: `0 8px 24px ${glow}25` }}
                >
                  <Icon size={20} className="text-black" />
                </div>
                <h3 className="text-base font-extrabold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>{title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
