'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBetSlipStore } from '../lib/store';
import { formatCurrency } from '../lib/utils';
import { api } from '../lib/api';
import { useToast } from './ui/Toaster';
import { useQueryClient } from '@tanstack/react-query';
import { X, Trash2, ArrowRight, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

export function BetSlipDrawer() {
  const {
    items,
    isOpen,
    setIsOpen,
    removeItem,
    updateStake,
    clearSlip,
    totalStake,
    totalPotentialPayout,
  } = useBetSlipStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePlaceBets = async () => {
    if (items.length === 0) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in or create an account to place real-money bets.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;

    for (const item of items) {
      try {
        const idempotencyKey = `bet-${item.outcomeId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        await api.post('/bets', {
          matchId: item.matchId,
          marketId: item.marketId,
          outcomeId: item.outcomeId,
          stake: item.stake,
          odds: item.odds,
          idempotencyKey,
        });
        successCount++;
      } catch (err: any) {
        toast({
          title: 'Bet Placement Error',
          description: err?.response?.data?.message || `Failed to place bet on ${item.outcomeName}`,
          type: 'error',
        });
      }
    }

    setIsSubmitting(false);

    if (successCount > 0) {
      toast({
        title: 'Bets Placed Successfully! 🎉',
        description: `Successfully placed ${successCount} wager(s). Good luck!`,
        type: 'success',
      });
      clearSlip();
      setIsOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['my-wallet'] });
      void queryClient.invalidateQueries({ queryKey: ['my-bets'] });
    }
  };

  const quickStakes = [10, 25, 50, 100];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Drawer content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="relative w-full max-w-md bg-[#0a0f1d] border-l border-white/[0.08] h-full flex flex-col shadow-2xl z-10"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#06080e]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 flex items-center justify-center">
                  <Zap size={18} className="text-[#00e676]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white font-['Outfit'] text-base tracking-tight">BET SLIP</h3>
                  <p className="text-[10px] text-[#8899aa] uppercase font-semibold">Active Wagers</p>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#00e676]/15 font-mono text-[#00e676] font-bold border border-[#00e676]/30 font-tabular ml-1">
                  {items.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={clearSlip}
                    className="p-2 text-xs text-[#8899aa] hover:text-[#ff3366] hover:bg-[#ff3366]/10 rounded-lg transition-colors"
                    title="Clear ticket"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-[#8899aa] hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Slip Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#8899aa]">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                    <Zap size={28} className="text-white/[0.2]" />
                  </div>
                  <p className="font-bold text-white text-base font-['Outfit']">Your bet slip is empty</p>
                  <p className="text-xs text-[#64748b] mt-1.5 max-w-[220px] leading-relaxed">
                    Select any match outcome to build your ticket and place instant wagers.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item.outcomeId}
                    className="p-4 rounded-2xl bg-[#10172a] border border-white/[0.07] space-y-3 relative group shadow-md"
                  >
                    <button
                      onClick={() => removeItem(item.outcomeId)}
                      className="absolute top-3.5 right-3.5 text-[#64748b] hover:text-[#ff3366] p-1 transition-colors"
                    >
                      <X size={15} />
                    </button>

                    <div className="pr-6">
                      <span className="text-[10px] uppercase font-bold text-[#00e676] tracking-wider block mb-0.5">
                        {item.marketName}
                      </span>
                      <h4 className="font-bold text-sm text-white">{item.outcomeName}</h4>
                      <p className="text-xs text-[#8899aa] truncate mt-0.5">{item.matchTitle}</p>
                    </div>

                    <div className="flex items-center justify-between py-2 border-t border-white/[0.06]">
                      <span className="text-xs text-[#8899aa] font-medium">Odds Multiplier:</span>
                      <span className="font-mono font-extrabold text-[#00e676] text-sm font-tabular px-2 py-0.5 rounded-md bg-[#00e676]/10 border border-[#00e676]/20">
                        {item.odds.toFixed(2)}x
                      </span>
                    </div>

                    {/* Stake input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8899aa] font-medium">Stake ($):</span>
                        <span className="text-[#8899aa]">
                          To Win:{' '}
                          <strong className="text-[#00e676] font-mono font-tabular font-bold">
                            {formatCurrency(item.stake * item.odds)}
                          </strong>
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#8899aa]">$</span>
                        <input
                          type="number"
                          min="1"
                          value={item.stake || ''}
                          onChange={(e) => updateStake(item.outcomeId, parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#06080e] border border-white/[0.1] text-white text-sm font-mono font-bold font-tabular focus:border-[#00e676] focus:outline-none transition-colors"
                        />
                      </div>

                      {/* Quick Chips */}
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {quickStakes.map((val) => (
                          <motion.button
                            key={val}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => updateStake(item.outcomeId, val)}
                            className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono font-bold font-tabular transition-all ${
                              item.stake === val
                                ? 'bg-[#00e676] text-black shadow-md shadow-[#00e676]/20'
                                : 'bg-[#162035] text-[#8899aa] hover:text-white hover:bg-[#1a2842] border border-white/[0.04]'
                            }`}
                          >
                            +${val}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Summary & Submit */}
            {items.length > 0 && (
              <div className="p-4 sm:p-5 bg-[#06080e] border-t border-white/[0.08] space-y-3.5">
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between text-[#8899aa]">
                    <span>Total Wager:</span>
                    <span className="font-mono font-bold text-white font-tabular">{formatCurrency(totalStake())}</span>
                  </div>
                  <div className="flex items-center justify-between text-white font-semibold">
                    <span>Est. Payout:</span>
                    <span className="font-mono font-black text-[#00e676] text-lg font-tabular">
                      {formatCurrency(totalPotentialPayout())}
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePlaceBets}
                  disabled={isSubmitting || totalStake() <= 0}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00b0ff] text-black font-extrabold text-sm hover:opacity-95 transition-all shadow-xl shadow-[#00e676]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    'Processing Wager...'
                  ) : (
                    <>
                      Place Bet Ticket ({formatCurrency(totalStake())}) <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
