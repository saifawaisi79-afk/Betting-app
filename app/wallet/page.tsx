'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { useToast } from '../components/ui/Toaster';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  PlusCircle,
  Clock,
  CheckCircle2,
  Lock,
  DollarSign,
  Receipt,
  Layers,
} from 'lucide-react';

interface WalletData {
  id: string;
  balance: number;
  lockedBalance: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'BET_LOCK' | 'BET_WIN' | 'BET_REFUND';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  description?: string | null;
  createdAt: string;
}

export default function WalletPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState('50');
  const [withdrawAmount, setWithdrawAmount] = useState('50');

  const { data: wallet, isLoading: isWalletLoading } = useQuery<WalletData>({
    queryKey: ['my-wallet'],
    queryFn: async () => {
      const res = await api.get('/wallet');
      return res.data;
    },
  });

  const { data: transactions, isLoading: isTxLoading } = useQuery<Transaction[]>({
    queryKey: ['my-transactions'],
    queryFn: async () => {
      const res = await api.get('/wallet/transactions');
      return res.data;
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await api.post('/wallet/deposit', { amount });
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: 'Deposit Successful 🎉',
        description: `Successfully credited $${depositAmount} to your wagering balance.`,
        type: 'success',
      });
      void queryClient.invalidateQueries({ queryKey: ['my-wallet'] });
      void queryClient.invalidateQueries({ queryKey: ['my-transactions'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Deposit Failed',
        description: err?.response?.data?.message || 'Transaction could not be processed.',
        type: 'error',
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await api.post('/wallet/withdraw', { amount });
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: 'Withdrawal Initiated',
        description: `Successfully requested payout of $${withdrawAmount}.`,
        type: 'success',
      });
      void queryClient.invalidateQueries({ queryKey: ['my-wallet'] });
      void queryClient.invalidateQueries({ queryKey: ['my-transactions'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Withdrawal Failed',
        description: err?.response?.data?.message || 'Insufficient funds or payout error.',
        type: 'error',
      });
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] flex items-center gap-3 tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-[#00e676]/10 flex items-center justify-center">
            <Wallet className="text-[#00e676]" size={22} />
          </div>
          Player Wallet & Payouts
        </h1>
        <p className="text-sm text-[#8899aa] mt-1.5 max-w-2xl leading-relaxed">
          Manage your live wagering balance, instant deposits, and automated winnings payouts with on-chain settlement.
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Available Wagering Balance */}
        <div className="p-6 rounded-2xl bg-[#0a0f1d] border border-white/[0.08] shadow-xl relative overflow-hidden group card-sportsbook">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#00e676]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#00e676]/15 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-[#8899aa] tracking-wider block">
              Available Wagering Balance
            </span>
            <span className="w-2 h-2 rounded-full bg-[#00e676] live-dot" />
          </div>
          {isWalletLoading ? (
            <Skeleton className="h-10 w-36 mt-3 rounded-lg" />
          ) : (
            <p className="text-3xl sm:text-4xl font-black font-mono text-[#00e676] mt-3 font-tabular tracking-tight">
              {formatCurrency(wallet?.balance || 0)}
            </p>
          )}
          <span className="text-[11px] text-[#64748b] mt-2 block font-medium">
            Ready for instant live-match bets
          </span>
        </div>

        {/* Active Bet Exposure (Locked) */}
        <div className="p-6 rounded-2xl bg-[#0a0f1d] border border-white/[0.08] shadow-xl relative overflow-hidden card-sportsbook">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-[#8899aa] tracking-wider block">
              Active Bet Exposure (Locked)
            </span>
            <Lock size={14} className="text-[#8899aa]" />
          </div>
          {isWalletLoading ? (
            <Skeleton className="h-10 w-36 mt-3 rounded-lg" />
          ) : (
            <p className="text-3xl sm:text-4xl font-black font-mono text-white mt-3 font-tabular tracking-tight">
              {formatCurrency(wallet?.lockedBalance || 0)}
            </p>
          )}
          <span className="text-[11px] text-[#64748b] mt-2 block font-medium">
            Held in escrow until match settlement
          </span>
        </div>

        {/* Total Net Worth */}
        <div className="p-6 rounded-2xl bg-[#0a0f1d] border border-white/[0.08] shadow-xl relative overflow-hidden card-sportsbook">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-[#8899aa] tracking-wider block">
              Total Account Net Worth
            </span>
            <Layers size={14} className="text-[#00b0ff]" />
          </div>
          {isWalletLoading ? (
            <Skeleton className="h-10 w-36 mt-3 rounded-lg" />
          ) : (
            <p className="text-3xl sm:text-4xl font-black font-mono text-[#00b0ff] mt-3 font-tabular tracking-tight">
              {formatCurrency((Number(wallet?.balance) || 0) + (Number(wallet?.lockedBalance) || 0))}
            </p>
          )}
          <span className="text-[11px] text-[#64748b] mt-2 block font-medium">
            Combined balance and open tickets
          </span>
        </div>
      </div>

      {/* Action Panels: Quick Deposit & Withdraw */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deposit Box */}
        <div className="bg-[#0a0f1d] border border-white/[0.08] rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 flex items-center justify-center">
              <ArrowDownLeft size={18} className="text-[#00e676]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-['Outfit']">Instant Deposit</h3>
              <p className="text-xs text-[#8899aa]">Credit demo or live funds with zero gas fees.</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              {[20, 50, 100, 500].map((amt) => (
                <motion.button
                  key={amt}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setDepositAmount(amt.toString())}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold font-tabular transition-all border ${
                    depositAmount === amt.toString()
                      ? 'bg-[#00e676] text-black border-[#00e676] shadow-md shadow-[#00e676]/20'
                      : 'bg-[#10172a] border-white/[0.06] text-slate-300 hover:text-white hover:bg-[#162035]'
                  }`}
                >
                  ${amt}
                </motion.button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#8899aa]">$</span>
              <input
                type="number"
                min="5"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#06080e] border border-white/[0.1] text-white font-mono font-bold text-sm font-tabular focus:border-[#00e676] focus:outline-none transition-colors"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => depositMutation.mutate(parseFloat(depositAmount) || 0)}
              disabled={depositMutation.isPending || !depositAmount}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00c853] text-black font-extrabold text-sm hover:opacity-95 transition-all shadow-lg shadow-[#00e676]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {depositMutation.isPending ? 'Processing Deposit...' : `Deposit $${depositAmount}`}
            </motion.button>
          </div>
        </div>

        {/* Withdrawal Box */}
        <div className="bg-[#0a0f1d] border border-white/[0.08] rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00b0ff]/10 flex items-center justify-center">
              <ArrowUpRight size={18} className="text-[#00b0ff]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-['Outfit']">Fast Cashout / Withdrawal</h3>
              <p className="text-xs text-[#8899aa]">Withdraw settled match winnings to your account.</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              {[25, 50, 100, 250].map((amt) => (
                <motion.button
                  key={amt}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setWithdrawAmount(amt.toString())}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold font-tabular transition-all border ${
                    withdrawAmount === amt.toString()
                      ? 'bg-[#00b0ff] text-black border-[#00b0ff] shadow-md shadow-[#00b0ff]/20'
                      : 'bg-[#10172a] border-white/[0.06] text-slate-300 hover:text-white hover:bg-[#162035]'
                  }`}
                >
                  ${amt}
                </motion.button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#8899aa]">$</span>
              <input
                type="number"
                min="10"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#06080e] border border-white/[0.1] text-white font-mono font-bold text-sm font-tabular focus:border-[#00b0ff] focus:outline-none transition-colors"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => withdrawMutation.mutate(parseFloat(withdrawAmount) || 0)}
              disabled={withdrawMutation.isPending || !withdrawAmount}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00b0ff] to-[#0284c7] text-white font-extrabold text-sm hover:opacity-95 transition-all shadow-lg shadow-[#00b0ff]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {withdrawMutation.isPending ? 'Processing Payout...' : `Withdraw $${withdrawAmount}`}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-[#0a0f1d] border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white font-['Outfit'] tracking-tight">TRANSACTION LEDGER</h3>
          <span className="text-xs text-[#8899aa] font-medium font-tabular">
            {transactions?.length || 0} total records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#06080e] border-b border-white/[0.06] text-[11px] uppercase text-[#8899aa] font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Transaction</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 rounded-r-lg">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isTxLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
                  </tr>
                ))
              ) : transactions && transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-white flex items-center gap-2">
                      {tx.type === 'DEPOSIT' || tx.type === 'BET_WIN' ? (
                        <span className="p-1 rounded-md bg-[#00e676]/10 text-[#00e676]">
                          <ArrowDownLeft size={14} />
                        </span>
                      ) : (
                        <span className="p-1 rounded-md bg-[#ff3366]/10 text-[#ff3366]">
                          <ArrowUpRight size={14} />
                        </span>
                      )}
                      {tx.type}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#8899aa]">
                      {tx.description || 'System transfer'}
                    </td>
                    <td
                      className={`px-4 py-3.5 font-mono font-bold font-tabular ${
                        tx.type === 'DEPOSIT' || tx.type === 'BET_WIN'
                          ? 'text-[#00e676]'
                          : 'text-white'
                      }`}
                    >
                      {tx.type === 'DEPOSIT' || tx.type === 'BET_WIN' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                          tx.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-[#00e676] border-emerald-500/25'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#64748b] whitespace-nowrap font-tabular">
                      {formatDate(tx.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[#8899aa]">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                      <Receipt size={22} className="text-white/[0.2]" />
                    </div>
                    <p className="font-bold text-white text-sm">No wallet activity found</p>
                    <p className="text-xs text-[#64748b] mt-1">Make your first deposit to fund your account.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
