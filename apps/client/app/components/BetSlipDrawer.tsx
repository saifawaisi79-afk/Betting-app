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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-[#0b101b] border-l border-[#1a273e] h-full flex flex-col shadow-2xl z-10"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#1a273e] flex items-center justify-between bg-[#0e1626]">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-[#00e676]" />
                <h3 className="font-bold text-white font-['Outfit']">Bet Slip</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#162238] font-mono text-[#00e676] font-bold">
                  {items.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={clearSlip}
                    className="p-1.5 text-xs text-[#8899aa] hover:text-[#ff3366] transition-colors"
                    title="Clear all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-[#8899aa] hover:text-white rounded-lg hover:bg-[#1a273e] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Slip Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8899aa]">
                  <Zap size={36} className="text-[#1a273e] mb-3" />
                  <p className="font-semibold text-white text-sm">Your bet slip is empty</p>
                  <p className="text-xs text-[#64748b] mt-1 max-w-[200px]">
                    Click on any match odds to add selections to your ticket.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.outcomeId}
                    className="p-3.5 rounded-xl bg-[#111928] border border-[#1e2d45] space-y-3 relative group"
                  >
                    <button
                      onClick={() => removeItem(item.outcomeId)}
                      className="absolute top-3 right-3 text-[#64748b] hover:text-[#ff3366] transition-colors"
                    >
                      <X size={14} />
                    </button>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#00e676] tracking-wider">
                        {item.marketName}
                      </span>
                      <h4 className="font-bold text-sm text-white">{item.outcomeName}</h4>
                      <p className="text-xs text-[#8899aa] truncate">{item.matchTitle}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#1e2d45]">
                      <span className="text-xs text-[#8899aa]">Odds:</span>
                      <span className="font-mono font-bold text-[#00e676] text-sm">
                        {item.odds.toFixed(2)}x
                      </span>
                    </div>

                    {/* Stake input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8899aa]">Wager:</span>
                        <span className="text-[#64748b]">
                          To Win:{' '}
                          <strong className="text-[#00e676] font-mono">
                            {formatCurrency(item.stake * item.odds)}
                          </strong>
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-[#8899aa]">$</span>
                        <input
                          type="number"
                          min="1"
                          value={item.stake || ''}
                          onChange={(e) => updateStake(item.outcomeId, parseFloat(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-[#0b101b] border border-[#1e2d45] text-white text-sm font-mono font-bold focus:border-[#00e676] focus:outline-none"
                        />
                      </div>

                      {/* Quick Chips */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {quickStakes.map((val) => (
                          <button
                            key={val}
                            onClick={() => updateStake(item.outcomeId, val)}
                            className={`flex-1 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
                              item.stake === val
                                ? 'bg-[#00e676] text-black'
                                : 'bg-[#1a273e] text-[#8899aa] hover:text-white'
                            }`}
                          >
                            +${val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary & Submit */}
            {items.length > 0 && (
              <div className="p-4 bg-[#0e1626] border-t border-[#1a273e] space-y-3">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between text-[#8899aa]">
                    <span>Total Stake:</span>
                    <span className="font-mono font-bold text-white">{formatCurrency(totalStake())}</span>
                  </div>
                  <div className="flex items-center justify-between text-white font-semibold">
                    <span>Est. Potential Returns:</span>
                    <span className="font-mono font-extrabold text-[#00e676] text-base">
                      {formatCurrency(totalPotentialPayout())}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceBets}
                  disabled={isSubmitting || totalStake() <= 0}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00b0ff] text-black font-extrabold text-sm hover:opacity-95 transition-all shadow-lg shadow-[#00e676]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Processing Wager...'
                  ) : (
                    <>
                      Place Bet Ticket ({formatCurrency(totalStake())}) <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
