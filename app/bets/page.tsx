'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { useToast } from '../components/ui/Toaster';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  DollarSign,
  TrendingUp,
  Activity,
  Ticket,
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
        title: 'Cashout Successful 🎉',
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] flex items-center gap-3 tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-[#00e676]/10 flex items-center justify-center">
            <Receipt className="text-[#00e676]" size={22} />
          </div>
          My Wagers & Bet History
        </h1>
        <p className="text-sm text-[#8899aa] mt-1.5 max-w-2xl leading-relaxed">
          Inspect your active open tickets, real-time potential returns, early cashout options, and settled payouts.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 overflow-x-auto no-scrollbar">
        {(['ALL', 'PENDING', 'WON', 'LOST'] as const).map((tab) => {
          const count = bets?.filter((b) => (tab === 'ALL' ? true : b.status === tab)).length ?? 0;
          return (
            <motion.button
              key={tab}
              whileTap={{ scale: 0.96 }}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                filter === tab
                  ? 'bg-[#00e676] text-black border-[#00e676] shadow-md shadow-[#00e676]/20'
                  : 'bg-[#0a0f1d] border-white/[0.06] text-[#8899aa] hover:text-white hover:bg-[#10172a]'
              }`}
            >
              <span>{tab === 'PENDING' ? 'Active / Open' : tab}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-tabular ${
                  filter === tab ? 'bg-black/20 text-black' : 'bg-white/[0.06] text-[#8899aa]'
                }`}
              >
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Bets Cards / Feed */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-[#0a0f1d] border border-white/[0.06] p-5 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <div className="pt-2 flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredBets && filteredBets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBets.map((bet) => {
            const isPending = bet.status === 'PENDING';
            const isWon = bet.status === 'WON';
            const isLost = bet.status === 'LOST';

            return (
              <motion.div
                key={bet.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-[#0a0f1d] border rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between transition-all card-sportsbook ${
                  isWon
                    ? 'border-emerald-500/40 bg-[#07130e]'
                    : isLost
                    ? 'border-rose-500/25 opacity-75'
                    : 'border-white/[0.08]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] uppercase font-bold text-[#8899aa] tracking-wider">
                      {bet.market?.name}
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                        isWon
                          ? 'bg-emerald-500/10 text-[#00e676] border-emerald-500/25'
                          : isLost
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                      }`}
                    >
                      {isWon && <CheckCircle2 size={11} />}
                      {isLost && <XCircle size={11} />}
                      {isPending && <Clock size={11} />}
                      {bet.status}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-white font-['Outfit'] tracking-tight leading-snug">
                    {bet.match?.teamA} <span className="text-[#8899aa] font-normal text-xs">vs</span> {bet.match?.teamB}
                  </h3>

                  <div className="mt-3 p-3.5 rounded-xl bg-[#10172a] border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#8899aa] uppercase font-semibold block">Selection</span>
                      <span className="text-sm font-bold text-[#00e676]">{bet.outcome?.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#8899aa] uppercase font-semibold block">Odds</span>
                      <span className="font-mono font-extrabold text-white text-sm font-tabular px-2 py-0.5 rounded bg-white/[0.05]">
                        {Number(bet.odds).toFixed(2)}x
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8899aa]">Stake:</span>
                    <span className="font-mono font-bold text-white font-tabular">{formatCurrency(bet.stake)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8899aa]">
                      {isWon ? 'Won Amount:' : 'Potential Return:'}
                    </span>
                    <span
                      className={`font-mono font-black text-sm font-tabular ${
                        isWon ? 'text-[#00e676]' : 'text-white'
                      }`}
                    >
                      {formatCurrency(bet.potentialPayout)}
                    </span>
                  </div>

                  {isPending && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => cashoutMutation.mutate(bet.id)}
                      disabled={cashoutMutation.isPending}
                      className="w-full py-2.5 rounded-xl bg-[#10172a] border border-white/[0.08] hover:border-[#00e676]/40 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <DollarSign size={13} className="text-[#00e676]" />
                      Early Cashout ({formatCurrency(bet.stake * 0.9)})
                    </motion.button>
                  )}

                  <p className="text-[10px] text-[#64748b] text-right font-tabular">
                    Placed: {formatDate(bet.createdAt)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#0a0f1d] border border-white/[0.08] rounded-2xl p-14 text-center text-[#8899aa] shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <Ticket size={28} className="text-white/[0.2]" />
          </div>
          <p className="font-bold text-white text-base font-['Outfit']">No wagers found in this category</p>
          <p className="text-xs text-[#64748b] mt-1.5 mb-5 max-w-sm mx-auto leading-relaxed">
            Place your first live bet on an active match to see real-time updates and early cashout options.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00e676] text-black font-extrabold text-xs hover:bg-[#00c853] transition-all shadow-lg shadow-[#00e676]/20"
          >
            Explore Live Matches <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
