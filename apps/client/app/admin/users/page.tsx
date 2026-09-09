'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Users, Shield, ShieldCheck, UserX, UserCheck } from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'USER' | 'MODERATOR';
  isBanned?: boolean;
  wallet?: {
    balance: number;
    lockedBalance: number;
    currency: string;
  };
  createdAt: string;
}

export default function UsersAdminPage() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<UserItem[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
  });

  const toggleBanMutation = useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: string; isBanned: boolean }) => {
      const res = await api.patch(`/users/${userId}`, { isBanned });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white font-['Outfit'] flex items-center gap-3">
          <Users className="text-[#00e676]" /> User Management
        </h1>
        <p className="text-xs text-[#8899aa] mt-1">
          Review registered platform users, monitor wallet balances, and configure user permissions.
        </p>
      </div>

      <div className="bg-[#0b101b] border border-[#1a273e] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#101726] border-b border-[#1a273e] text-[11px] uppercase text-[#8899aa] font-bold tracking-wider">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Wallet Balance</th>
                <th className="px-5 py-4">Locked Exposure</th>
                <th className="px-5 py-4">Joined Date</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a273e]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#8899aa]">
                    Loading users...
                  </td>
                </tr>
              ) : users && users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#101726]/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-white text-xs">{u.displayName}</p>
                      <p className="text-[11px] text-[#8899aa]">{u.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold inline-flex items-center gap-1 ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-950/80 text-purple-400 border border-purple-800'
                            : 'bg-blue-950/80 text-blue-400 border border-blue-800'
                        }`}
                      >
                        {u.role === 'ADMIN' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-white text-xs">
                      {formatCurrency(u.wallet?.balance || 0)}
                    </td>
                    <td className="px-5 py-4 font-mono text-[#8899aa] text-xs">
                      {formatCurrency(u.wallet?.lockedBalance || 0)}
                    </td>
                    <td className="px-5 py-4 text-xs text-[#8899aa]">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() =>
                          toggleBanMutation.mutate({
                            userId: u.id,
                            isBanned: !u.isBanned,
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 ${
                          u.isBanned
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                        }`}
                      >
                        {u.isBanned ? (
                          <>
                            <UserCheck size={12} /> Unban
                          </>
                        ) : (
                          <>
                            <UserX size={12} /> Ban User
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#8899aa]">
                    No users registered yet.
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
