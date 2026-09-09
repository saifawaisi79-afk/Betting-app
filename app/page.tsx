'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from './lib/api';
import { useBetSlipStore } from './lib/store';
import { formatDate } from './lib/utils';
import Link from 'next/link';
import {
  Radio,
  Trophy,
  Flame,
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
  Headphones,
  Users,
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

  const sports = ['ALL', 'Cricket', 'Tennis', 'Basketball', 'Kabaddi', 'Esports'];

  const filteredMatches = matches?.filter((m) => {
    if (selectedSport === 'ALL') return true;
    return m.sport?.name?.toLowerCase() === selectedSport.toLowerCase();
  });

  const liveMatches = matches?.filter((m) => m.status === 'LIVE' || m.matchRoom?.status === 'LIVE');

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0e1628] via-[#090e18] to-[#080c14] border-b border-[#1a273e] pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00e676]/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="max-w-2xl space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 border border-[#00e676]/30 text-[#00e676] text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#00e676] animate-ping" />
              🏏 Live Cricket Audio Rooms
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white font-['Outfit'] tracking-tight leading-none">
              WATCH. LISTEN. <br />
              <span className="bg-gradient-to-r from-[#00e676] via-[#00b0ff] to-[#38bdf8] bg-clip-text text-transparent">
                BET ON CRICKET.
              </span>
            </h1>
            <p className="text-[#8899aa] text-base sm:text-lg">
              Feel the excitement of live cricket with synchronized host commentary, real-time score updates, and instant bet settlement on every ball.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              {liveMatches && liveMatches.length > 0 && liveMatches[0]?.matchRoom ? (
                <Link
                  href={`/rooms/${liveMatches[0].matchRoom.id}`}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00c853] text-black font-extrabold text-sm hover:scale-105 transition-all shadow-xl shadow-[#00e676]/20 flex items-center gap-2"
                >
                  <Radio size={18} className="animate-pulse" /> Join Featured Live Room
                </Link>
              ) : (
                <Link
                  href="#matches"
                  className="px-6 py-3.5 rounded-xl bg-[#00e676] text-black font-extrabold text-sm hover:bg-[#00c853] transition-all shadow-xl shadow-[#00e676]/20 flex items-center gap-2"
                >
                  <Trophy size={18} /> View All Matches
                </Link>
              )}
              <Link
                href="/wallet"
                className="px-6 py-3.5 rounded-xl bg-[#162238] border border-[#1e2d45] text-white font-bold text-sm hover:bg-[#1e2d45] transition-all"
              >
                Instant Deposit
              </Link>
            </div>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="p-5 rounded-2xl bg-[#0f172a]/80 border border-[#1e2d45] backdrop-blur-md">
              <span className="text-xs text-[#8899aa] uppercase font-bold tracking-wider">Audio Latency</span>
              <p className="text-2xl font-black text-[#00e676] font-mono mt-1">&lt; 150ms</p>
              <p className="text-[11px] text-[#64748b] mt-0.5">WebRTC LiveKit SFU</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#0f172a]/80 border border-[#1e2d45] backdrop-blur-md">
              <span className="text-xs text-[#8899aa] uppercase font-bold tracking-wider">Active Rooms</span>
              <p className="text-2xl font-black text-[#00b0ff] font-mono mt-1">
                {liveMatches?.length || 0} Live
              </p>
              <p className="text-[11px] text-[#64748b] mt-0.5">One-way host voice</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div id="matches" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Live Rooms Section */}
        {liveMatches && liveMatches.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <h2 className="text-xl font-black text-white font-['Outfit'] tracking-wide">
                  LIVE MATCH ROOMS
                </h2>
              </div>
              <span className="text-xs text-[#8899aa]">{liveMatches.length} room(s) broadcasting now</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveMatches.map((m) => (
                <div
                  key={m.id}
                  className="group relative bg-[#0e1628] border border-red-900/40 rounded-2xl p-5 hover:border-red-500/60 transition-all shadow-xl flex flex-col justify-between overflow-hidden"
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none group-hover:bg-red-600/20 transition-all" />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 font-bold border border-red-600/30 uppercase flex items-center gap-1.5">
                        <Radio size={12} className="animate-pulse" /> LIVE STREAM & AUDIO
                      </span>
                      <span className="text-xs text-[#8899aa] flex items-center gap-1">
                        <Users size={12} /> {m.matchRoom?.participantCount || 0}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white group-hover:text-[#00e676] transition-colors font-['Outfit']">
                      {m.teamA} <span className="text-[#8899aa] font-normal text-sm">vs</span> {m.teamB}
                    </h3>
                    {m.currentScore && (
                      <p className="text-xl font-mono font-bold text-[#00e676] mt-1">{m.currentScore}</p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs text-[#8899aa]">
                      <Headphones size={13} className="text-[#00b0ff]" />
                      <span>Host: {m.matchRoom?.host?.displayName || 'Live Host'}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#1a273e]">
                    <Link
                      href={`/rooms/${m.matchRoom?.id || m.id}`}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-extrabold text-sm transition-all shadow-lg shadow-red-600/20"
                    >
                      Enter Live Room <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sports Tabs Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#1a273e]">
          {sports.map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedSport === sport
                  ? 'bg-[#00e676] text-black shadow-md shadow-[#00e676]/20'
                  : 'bg-[#101827] text-[#8899aa] hover:text-white hover:bg-[#162238]'
              }`}
            >
              {sport}
            </button>
          ))}
        </div>

        {/* All Matches Cards Grid */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-white font-['Outfit']">UPCOMING & LIVE MATCHES</h2>

          {isLoading ? (
            <div className="p-16 text-center text-[#8899aa]">Loading live odds and matches...</div>
          ) : filteredMatches && filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMatches.map((m) => {
                const matchWinnerMarket = m.markets?.find((mk) => mk.name.includes('Winner') || mk.name.includes('1X2')) || m.markets?.[0];
                return (
                  <div
                    key={m.id}
                    className="bg-[#0b101b] border border-[#1a273e] rounded-2xl p-5 hover:border-[#2a3f5f] transition-all flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <span className="px-2 py-0.5 rounded bg-[#162238] text-[#8899aa] uppercase font-bold">
                          {m.sport?.name || 'Sports'}
                        </span>
                        <span className="text-[#64748b] flex items-center gap-1 font-medium">
                          <Clock size={12} /> {formatDate(m.scheduledStart)}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-white">
                        {m.teamA} <span className="text-[#8899aa] font-normal text-xs">vs</span> {m.teamB}
                      </h3>

                      {/* Odds Quick-bet Buttons */}
                      {matchWinnerMarket && matchWinnerMarket.outcomes && (
                        <div className="mt-4 space-y-1.5">
                          <span className="text-[10px] text-[#64748b] uppercase font-bold tracking-wider">
                            {matchWinnerMarket.name}
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {matchWinnerMarket.outcomes.slice(0, 3).map((out) => {
                              const isSelected = items.some((i) => i.outcomeId === out.id);
                              return (
                                <button
                                  key={out.id}
                                  onClick={() =>
                                    addItem({
                                      matchId: m.id,
                                      matchTitle: `${m.teamA} vs ${m.teamB}`,
                                      marketId: matchWinnerMarket.id,
                                      marketName: matchWinnerMarket.name,
                                      outcomeId: out.id,
                                      outcomeName: out.name,
                                      odds: out.odds,
                                    })
                                  }
                                  className={`p-2 rounded-xl flex flex-col items-center justify-center border transition-all ${
                                    isSelected
                                      ? 'bg-[#00e676] text-black border-[#00e676] font-bold shadow-md shadow-[#00e676]/20'
                                      : 'bg-[#121b2d] border-[#1e2d45] text-white hover:border-[#00e676]/50 hover:bg-[#162238]'
                                  }`}
                                >
                                  <span className="text-[11px] truncate w-full text-center font-medium">
                                    {out.name}
                                  </span>
                                  <span className="font-mono font-black text-xs text-[#00e676]">
                                    {out.odds.toFixed(2)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#1a273e] flex items-center justify-between">
                      {m.matchRoom ? (
                        <Link
                          href={`/rooms/${m.matchRoom.id}`}
                          className="flex items-center gap-1.5 text-xs text-[#00e676] font-bold hover:underline"
                        >
                          <Radio size={14} className="animate-pulse" /> Live Room Available →
                        </Link>
                      ) : (
                        <span className="text-xs text-[#64748b]">Match Room Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#0b101b] border border-[#1a273e] rounded-2xl p-12 text-center text-[#8899aa]">
              <Trophy size={40} className="mx-auto text-[#1a273e] mb-3" />
              <p className="font-bold text-white">🏏 No cricket matches available right now</p>
              <p className="text-xs text-[#64748b] mt-1">
                Switch sport or check back when the next cricket event goes live.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
