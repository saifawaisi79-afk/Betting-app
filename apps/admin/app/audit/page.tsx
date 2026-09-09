'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';
import { FileText, Shield, User, Clock } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  actor?: { email: string; displayName: string };
  details?: any;
  createdAt: string;
}

export default function AuditPage() {
  const { data: logs, isLoading } = useQuery<AuditEntry[]>({
    queryKey: ['admin-audit'],
    queryFn: async () => {
      const res = await api.get('/admin/audit');
      return res.data;
    },
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-3">
          <FileText className="text-[#00e676]" /> System Audit Log
        </h1>
        <p className="text-sm text-[#8899aa] mt-1">
          Cryptographically timestamped audit trail of administrative adjustments, odds shifts, and payout settlements.
        </p>
      </div>

      <div className="bg-[#0f1622] border border-[#1e2d45] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#162032] border-b border-[#1e2d45] text-xs uppercase text-[#8899aa] font-semibold">
              <tr>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">Entity</th>
                <th className="px-5 py-4">Actor</th>
                <th className="px-5 py-4">Details</th>
                <th className="px-5 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d45]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[#8899aa]">
                    Loading audit records...
                  </td>
                </tr>
              ) : logs && logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#162032]/50 transition-colors">
                    <td className="px-5 py-4 font-mono font-semibold text-[#00e676]">
                      {log.action}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-white">
                      {log.entityType} <span className="text-[#8899aa]">({log.entityId.slice(0, 8)}...)</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-[#8899aa]">
                      {log.actor?.displayName || log.actorId || 'System'}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-[#8899aa] max-w-md truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                    <td className="px-5 py-4 text-xs text-[#8899aa] whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[#8899aa]">
                    No audit records recorded yet.
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
