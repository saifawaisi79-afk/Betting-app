'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { TrendingUp, Plus, ShieldAlert, CheckCircle2, Lock, Unlock, RefreshCw } from 'lucide-react';

interface Outcome {
  id: string;
  name: string;
  odds: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'SETTLED_WIN' | 'SETTLED_LOSS';
}

interface Market {
  id: string;
  name: string;
  type: string;
  status: 'OPEN' | 'SUSPENDED' | 'SETTLED' | 'CANCELLED';
  match: { id: string; teamA: string; teamB: string };
  outcomes: Outcome[];
}

interface Match {
  id: string;
  teamA: string;
  teamB: string;
}

export default function MarketsAdminPage() {
  const queryClient = useQueryClient();
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [editingOdds, setEditingOdds] = useState<{ [outcomeId: string]: string }>({});

  const { data: matches } = useQuery<Match[]>({
    queryKey: ['admin-matches'],
    queryFn: async () => {
      const res = await api.get('/matches');
      return res.data;
    },
  });

  const { data: markets, isLoading } = useQuery<Market[]>({
    queryKey: ['admin-markets', selectedMatchId],
    queryFn: async () => {
      const url = selectedMatchId ? `/markets?matchId=${selectedMatchId}` : '/markets';
      const res = await api.get(url);
      return res.data;
    },
  });

  const updateOddsMutation = useMutation({
    mutationFn: async ({ outcomeId, newOdds }: { outcomeId: string; newOdds: number }) => {
      const res = await api.patch(`/markets/outcomes/${outcomeId}/odds`, { odds: newOdds });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
    },
  });

  const toggleMarketSuspension = useMutation({
    mutationFn: async ({ marketId, suspend }: { marketId: string; suspend: boolean }) => {
      const res = await api.patch(`/markets/${marketId}/status`, {
        status: suspend ? 'SUSPENDED' : 'OPEN',
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
    },
  });

  const settleOutcomeMutation = useMutation({
    mutationFn: async ({ marketId, winningOutcomeId }: { marketId: string; winningOutcomeId: string }) => {
      const res = await api.post(`/markets/${marketId}/settle`, { winningOutcomeId });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-markets'] });
    },
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-3">
            <TrendingUp className="text-[#00e676]" /> Markets & Odds Control
          </h1>
          <p className="text-sm text-[#8899aa] mt-1">
            Real-time odds adjustment, market suspension, and immediate settlement payout triggers.
          </p>
        </div>

        {/* Filter by Match */}
        <select
          value={selectedMatchId}
          onChange={(e) => setSelectedMatchId(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#0f1622] border border-[#1e2d45] text-white text-sm"
        >
          <option value="">All Matches</option>
          {matches?.map((m) => (
            <option key={m.id} value={m.id}>
              {m.teamA} vs {m.teamB}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-[#8899aa]">Loading markets...</div>
      ) : markets && markets.length > 0 ? (
        <div className="space-y-4">
          {markets.map((m) => (
            <div
              key={m.id}
              className="bg-[#0f1622] border border-[#1e2d45] rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#1e2d45] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{m.name}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        m.status === 'OPEN'
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          : m.status === 'SUSPENDED'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#8899aa] mt-0.5">
                    Match: {m.match.teamA} vs {m.match.teamB} ({m.type})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      toggleMarketSuspension.mutate({
                        marketId: m.id,
                        suspend: m.status === 'OPEN',
                      })
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      m.status === 'OPEN'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                    }`}
                  >
                    {m.status === 'OPEN' ? (
                      <>
                        <Lock size={12} /> Suspend Betting
                      </>
                    ) : (
                      <>
                        <Unlock size={12} /> Re-open Market
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Outcomes & Odds Edit */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {m.outcomes?.map((outcome) => {
                  const currentValue = editingOdds[outcome.id] ?? outcome.odds.toString();
                  return (
                    <div
                      key={outcome.id}
                      className="bg-[#162032] border border-[#1e2d45] rounded-lg p-3 flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white">{outcome.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            outcome.status === 'SETTLED_WIN'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : outcome.status === 'SETTLED_LOSS'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-[#1e2d45] text-[#8899aa]'
                          }`}
                        >
                          {outcome.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="0.01"
                            min="1.01"
                            value={currentValue}
                            onChange={(e) =>
                              setEditingOdds((prev) => ({
                                ...prev,
                                [outcome.id]: e.target.value,
                              }))
                            }
                            className="w-full px-2.5 py-1.5 rounded bg-[#0f1622] border border-[#1e2d45] text-[#00e676] font-mono font-bold text-sm"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const newOdds = parseFloat(currentValue);
                            if (!isNaN(newOdds) && newOdds >= 1.01) {
                              updateOddsMutation.mutate({ outcomeId: outcome.id, newOdds });
                            }
                          }}
                          disabled={updateOddsMutation.isPending}
                          className="px-2.5 py-1.5 rounded bg-[#1e2d45] text-white text-xs hover:bg-[#00e676] hover:text-black font-semibold transition-all"
                        >
                          Push
                        </button>
                      </div>

                      {m.status !== 'SETTLED' && (
                        <button
                          onClick={() =>
                            settleOutcomeMutation.mutate({
                              marketId: m.id,
                              winningOutcomeId: outcome.id,
                            })
                          }
                          className="text-[11px] text-[#00e676] hover:underline text-left mt-1"
                        >
                          ✓ Settle as Winner
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f1622] border border-[#1e2d45] rounded-xl p-12 text-center text-[#8899aa]">
          No markets created yet.
        </div>
      )}
    </div>
  );
}
