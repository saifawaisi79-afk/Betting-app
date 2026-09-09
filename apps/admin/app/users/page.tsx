'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Users, Shield, ShieldCheck, UserX, UserCheck, Wallet } from 'lucide-react';

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
        <h1 className="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-3">
          <Users className="text-[#00e676]" /> User Management
        </h1>
        <p className="text-sm text-[#8899aa] mt-1">
          Review registered platform users, monitor wallet balances, and configure user permissions.
        </p>
      </div>

      <div className="bg-[#0f1622] border border-[#1e2d45] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#162032] border-b border-[#1e2d45] text-xs uppercase text-[#8899aa] font-semibold">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Wallet Balance</th>
                <th className="px-5 py-4">Locked Exposure</th>
                <th className="px-5 py-4">Joined Date</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d45]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#8899aa]">
                    Loading users...
                  </td>
                </tr>
              ) : users && users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#162032]/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{u.displayName}</p>
                      <p className="text-xs text-[#8899aa]">{u.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-950/80 text-purple-400 border border-purple-800'
                            : 'bg-blue-950/80 text-blue-400 border border-blue-800'
                        }`}
                      >
                        {u.role === 'ADMIN' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-white">
                      {formatCurrency(u.wallet?.balance || 0)}
                    </td>
                    <td className="px-5 py-4 font-mono text-[#8899aa]">
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 ${
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
