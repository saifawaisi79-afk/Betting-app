'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { BarChart3, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface Bet {
  id: string;
  user: { email: string; displayName: string };
  match: { teamA: string; teamB: string };
  market: { name: string };
  outcome: { name: string };
  stake: number;
  odds: number;
  potentialPayout: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'VOIDED' | 'CANCELLED';
  createdAt: string;
}

export default function BetsAdminPage() {
  const { data: bets, isLoading } = useQuery<Bet[]>({
    queryKey: ['admin-bets'],
    queryFn: async () => {
      const res = await api.get('/admin/bets');
      return res.data;
    },
    refetchInterval: 5000,
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white font-['Outfit'] flex items-center gap-3">
          <BarChart3 className="text-[#00e676]" /> All Bets Feed
        </h1>
        <p className="text-xs text-[#8899aa] mt-1">
          Live streaming audit trail of all placed client bets, stakes, odds multipliers, and settlement statuses.
        </p>
      </div>

      <div className="bg-[#0b101b] border border-[#1a273e] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#101726] border-b border-[#1a273e] text-[11px] uppercase text-[#8899aa] font-bold tracking-wider">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Match</th>
                <th className="px-5 py-4">Selection</th>
                <th className="px-5 py-4">Odds</th>
                <th className="px-5 py-4">Stake</th>
                <th className="px-5 py-4">Potential Win</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Placed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a273e]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-[#8899aa]">
                    Loading bets...
                  </td>
                </tr>
              ) : bets && bets.length > 0 ? (
                bets.map((bet) => (
                  <tr key={bet.id} className="hover:bg-[#101726]/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-white text-xs">{bet.user?.displayName || 'Client'}</p>
                      <p className="text-[11px] text-[#8899aa] truncate max-w-[140px]">{bet.user?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-white text-xs font-semibold">
                      {bet.match?.teamA} <span className="text-[#8899aa] font-normal">vs</span> {bet.match?.teamB}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#00e676] text-xs">{bet.outcome?.name}</p>
                      <p className="text-[11px] text-[#8899aa]">{bet.market?.name}</p>
                    </td>
                    <td className="px-5 py-4 font-mono font-black text-white text-xs">
                      {Number(bet.odds).toFixed(2)}x
                    </td>
                    <td className="px-5 py-4 font-mono font-medium text-white text-xs">
                      {formatCurrency(bet.stake)}
                    </td>
                    <td className="px-5 py-4 font-mono font-extrabold text-[#00e676] text-xs">
                      {formatCurrency(bet.potentialPayout)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 ${
                          bet.status === 'WON'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : bet.status === 'LOST'
                            ? 'bg-red-950/80 text-red-400 border border-red-800'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {bet.status === 'WON' && <CheckCircle2 size={12} />}
                        {bet.status === 'LOST' && <XCircle size={12} />}
                        {bet.status === 'PENDING' && <Clock size={12} />}
                        {bet.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-[#8899aa] whitespace-nowrap font-mono">
                      {formatDate(bet.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-[#8899aa]">
                    No bets placed yet.
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
