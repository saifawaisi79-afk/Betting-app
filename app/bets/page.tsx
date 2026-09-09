'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { useToast } from '../components/ui/Toaster';
import {
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface MyBet {
  id: string;
  stake: number;
  odds: number;
  potentialPayout: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'VOIDED' | 'CANCELLED';
  match: {
    id: string;
    teamA: string;
    teamB: string;
    currentScore?: string | null;
  };
  market: {
    name: string;
  };
  outcome: {
    name: string;
  };
  createdAt: string;
}

export default function MyBetsPage() {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'WON' | 'LOST'>('ALL');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: bets, isLoading } = useQuery<MyBet[]>({
    queryKey: ['my-bets'],
    queryFn: async () => {
      const res = await api.get('/bets/me');
      return res.data;
    },
    refetchInterval: 5000,
  });

  const cashoutMutation = useMutation({
    mutationFn: async (betId: string) => {
      const res = await api.post(`/bets/${betId}/cashout`);
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: 'Cashout Successful',
        description: 'Your cashout value was credited immediately to your balance.',
        type: 'success',
      });
      void queryClient.invalidateQueries({ queryKey: ['my-bets'] });
      void queryClient.invalidateQueries({ queryKey: ['my-wallet'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Cashout Unavailable',
        description: err?.response?.data?.message || 'Cashout could not be executed at this time.',
        type: 'error',
      });
    },
  });

  const filteredBets = bets?.filter((b) => {
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] flex items-center gap-3">
          <Receipt className="text-[#00e676]" /> My Wagers & Tickets
        </h1>
        <p className="text-sm text-[#8899aa] mt-1">
          Review your open active slips, track live odds progression, and inspect settled results.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1a273e] pb-3">
        {(['ALL', 'PENDING', 'WON', 'LOST'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === tab
                ? 'bg-[#00e676] text-black shadow-md shadow-[#00e676]/20'
                : 'bg-[#101726] text-[#8899aa] hover:text-white hover:bg-[#162238]'
            }`}
          >
            {tab === 'PENDING' ? 'Active / Open' : tab}
          </button>
        ))}
      </div>

      {/* Bets Cards / Feed */}
      {isLoading ? (
        <div className="p-16 text-center text-[#8899aa]">Loading your bet history...</div>
      ) : filteredBets && filteredBets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBets.map((bet) => {
            const isPending = bet.status === 'PENDING';
            const isWon = bet.status === 'WON';
            const isLost = bet.status === 'LOST';

            return (
              <div
                key={bet.id}
                className={`bg-[#0b101b] border rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition-all ${
                  isWon
                    ? 'border-emerald-800/80 bg-[#07130e]'
                    : isLost
                    ? 'border-red-900/40 opacity-70'
                    : 'border-[#1a273e]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-[#8899aa]">
                      {bet.market?.name}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        isWon
                          ? 'bg-emerald-950 text-[#00e676] border border-emerald-800'
                          : isLost
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {isWon && <CheckCircle2 size={12} />}
                      {isLost && <XCircle size={12} />}
                      {isPending && <Clock size={12} />}
                      {bet.status}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-white">
                    {bet.match?.teamA} <span className="text-[#8899aa] font-normal text-xs">vs</span> {bet.match?.teamB}
                  </h3>

                  <div className="mt-3 p-3 rounded-xl bg-[#101726] border border-[#1e2d45] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#8899aa] uppercase font-bold block">Selection</span>
                      <span className="text-sm font-bold text-[#00e676]">{bet.outcome?.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#8899aa] uppercase font-bold block">Odds</span>
                      <span className="font-mono font-extrabold text-white text-sm">
                        {Number(bet.odds).toFixed(2)}x
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1a273e] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8899aa]">Stake:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(bet.stake)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8899aa]">
                      {isWon ? 'Won Amount:' : 'To Return:'}
                    </span>
                    <span
                      className={`font-mono font-extrabold text-sm ${
                        isWon ? 'text-[#00e676]' : 'text-white'
                      }`}
                    >
                      {formatCurrency(bet.potentialPayout)}
                    </span>
                  </div>

                  {isPending && (
                    <button
                      onClick={() => cashoutMutation.mutate(bet.id)}
                      disabled={cashoutMutation.isPending}
                      className="w-full py-2 rounded-xl bg-[#162238] border border-[#1e2d45] hover:border-[#00e676]/40 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <DollarSign size={13} className="text-[#00e676]" />
                      Early Cashout ({formatCurrency(bet.stake * 0.9)})
                    </button>
                  )}

                  <p className="text-[10px] text-[#64748b] text-right">
                    Placed: {formatDate(bet.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#0b101b] border border-[#1a273e] rounded-2xl p-12 text-center text-[#8899aa]">
          <Receipt size={40} className="mx-auto text-[#1a273e] mb-3" />
          <p className="font-bold text-white">No wagers found in this category</p>
          <p className="text-xs text-[#64748b] mt-1 mb-4">
            Place your first live bet on an active match to see your ticket here!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00e676] text-black font-extrabold text-xs hover:bg-[#00c853] transition-all"
          >
            Explore Live Matches <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
