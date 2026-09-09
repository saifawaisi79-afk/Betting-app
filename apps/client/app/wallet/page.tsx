'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { useToast } from '../components/ui/Toaster';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  PlusCircle,
  Clock,
  CheckCircle2,
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
        title: 'Deposit Successful',
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
        <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] flex items-center gap-3">
          <Wallet className="text-[#00e676]" /> Player Wallet & Payouts
        </h1>
        <p className="text-sm text-[#8899aa] mt-1">
          Manage your real-time wagering balance, instant deposits, and automated winnings payouts.
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#10192a] to-[#0c1322] border border-[#1e2d45] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00e676]/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-xs uppercase font-bold text-[#8899aa] tracking-wider block">
            Available Wagering Balance
          </span>
          <p className="text-3xl sm:text-4xl font-black font-mono text-[#00e676] mt-2">
            {isWalletLoading ? '...' : formatCurrency(wallet?.balance || 0)}
          </p>
          <span className="text-[11px] text-[#64748b] mt-2 block">
            Ready for instant live-match bets
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[#0e1626] border border-[#1e2d45] shadow-xl">
          <span className="text-xs uppercase font-bold text-[#8899aa] tracking-wider block">
            Active Bet Exposure (Locked)
          </span>
          <p className="text-3xl sm:text-4xl font-black font-mono text-white mt-2">
            {isWalletLoading ? '...' : formatCurrency(wallet?.lockedBalance || 0)}
          </p>
          <span className="text-[11px] text-[#64748b] mt-2 block">
            Held in escrow until match settlement
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-[#0e1626] border border-[#1e2d45] shadow-xl">
          <span className="text-xs uppercase font-bold text-[#8899aa] tracking-wider block">
            Total Net Worth
          </span>
          <p className="text-3xl sm:text-4xl font-black font-mono text-[#00b0ff] mt-2">
            {isWalletLoading
              ? '...'
              : formatCurrency((Number(wallet?.balance) || 0) + (Number(wallet?.lockedBalance) || 0))}
          </p>
          <span className="text-[11px] text-[#64748b] mt-2 block">
            Combined balance and open tickets
          </span>
        </div>
      </div>

      {/* Action Panels: Quick Deposit & Withdraw */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deposit Box */}
        <div className="bg-[#0b101b] border border-[#1a273e] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <ArrowDownLeft size={20} className="text-[#00e676]" />
            <h3 className="text-lg font-bold text-white font-['Outfit']">Instant Deposit</h3>
          </div>
          <p className="text-xs text-[#8899aa]">
            Credit demo / test betting tokens to your account instantly with zero fees.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {[20, 50, 100, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setDepositAmount(amt.toString())}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                    depositAmount === amt.toString()
                      ? 'bg-[#00e676] text-black border-[#00e676]'
                      : 'bg-[#101726] border-[#1e2d45] text-slate-300 hover:text-white hover:bg-[#162238]'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#8899aa]">$</span>
              <input
                type="number"
                min="5"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#101726] border border-[#1e2d45] text-white font-mono font-bold text-sm focus:border-[#00e676] focus:outline-none"
              />
            </div>

            <button
              onClick={() => depositMutation.mutate(parseFloat(depositAmount) || 0)}
              disabled={depositMutation.isPending || !depositAmount}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00c853] text-black font-extrabold text-sm hover:opacity-95 transition-all shadow-lg shadow-[#00e676]/20 disabled:opacity-50"
            >
              {depositMutation.isPending ? 'Processing Deposit...' : `Deposit $${depositAmount}`}
            </button>
          </div>
        </div>

        {/* Withdrawal Box */}
        <div className="bg-[#0b101b] border border-[#1a273e] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <ArrowUpRight size={20} className="text-[#00b0ff]" />
            <h3 className="text-lg font-bold text-white font-['Outfit']">Fast Cashout / Withdrawal</h3>
          </div>
          <p className="text-xs text-[#8899aa]">
            Withdraw settled winnings back to your personal payment method.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {[25, 50, 100, 250].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setWithdrawAmount(amt.toString())}
                  className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                    withdrawAmount === amt.toString()
                      ? 'bg-[#00b0ff] text-black border-[#00b0ff]'
                      : 'bg-[#101726] border-[#1e2d45] text-slate-300 hover:text-white hover:bg-[#162238]'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#8899aa]">$</span>
              <input
                type="number"
                min="10"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#101726] border border-[#1e2d45] text-white font-mono font-bold text-sm focus:border-[#00b0ff] focus:outline-none"
              />
            </div>

            <button
              onClick={() => withdrawMutation.mutate(parseFloat(withdrawAmount) || 0)}
              disabled={withdrawMutation.isPending || !withdrawAmount}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00b0ff] to-[#0284c7] text-white font-extrabold text-sm hover:opacity-95 transition-all shadow-lg shadow-[#00b0ff]/20 disabled:opacity-50"
            >
              {withdrawMutation.isPending ? 'Processing Payout...' : `Withdraw $${withdrawAmount}`}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-[#0b101b] border border-[#1a273e] rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white font-['Outfit']">Wallet Ledger</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#101726] border-b border-[#1a273e] text-xs uppercase text-[#8899aa] font-semibold">
              <tr>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a273e]">
              {isTxLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#8899aa]">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions && transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#101726]/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                      {tx.type === 'DEPOSIT' || tx.type === 'BET_WIN' ? (
                        <ArrowDownLeft size={16} className="text-[#00e676]" />
                      ) : (
                        <ArrowUpRight size={16} className="text-[#ff3366]" />
                      )}
                      {tx.type}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#8899aa]">
                      {tx.description || 'System transfer'}
                    </td>
                    <td
                      className={`px-4 py-3 font-mono font-bold ${
                        tx.type === 'DEPOSIT' || tx.type === 'BET_WIN'
                          ? 'text-[#00e676]'
                          : 'text-white'
                      }`}
                    >
                      {tx.type === 'DEPOSIT' || tx.type === 'BET_WIN' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-[#00e676] border border-emerald-800 font-bold">
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#8899aa] whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[#8899aa]">
                    No wallet activity found. Make your first deposit!
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
