'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, Users, Radio, DollarSign, Activity, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalUsers: number;
  activeRooms: number;
  pendingBets: number;
  todayBetVolume: number;
  totalExposure: number;
}

function StatCard({
  label, value, icon: Icon, color, subtitle,
}: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; subtitle?: string;
}) {
  return (
    <div className="bg-[#111827] border border-[#1e2d45] rounded-[12px] p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[#8899aa] text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-[#4a5568] mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

const mockChartData = [
  { hour: '00', volume: 1200 }, { hour: '04', volume: 800 },
  { hour: '08', volume: 2400 }, { hour: '12', volume: 5800 },
  { hour: '16', volume: 9200 }, { hour: '20', volume: 7400 },
  { hour: '23', volume: 4100 },
];

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get<DashboardStats>('/admin/dashboard');
      return res.data;
    },
    refetchInterval: 15_000,
  });

  const { data: liveRooms } = useQuery({
    queryKey: ['live-rooms'],
    queryFn: async () => {
      const res = await api.get<{ data: { id: string; match: { teamA: string; teamB: string }; participantCount: number }[] }>('/rooms?status=LIVE');
      return res.data.data;
    },
    refetchInterval: 10_000,
  });

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white font-['Outfit']">Dashboard</h1>
        <p className="text-[#8899aa] text-sm mt-1">Live platform overview — auto-refreshes every 15s</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Total Users" icon={Users} color="bg-blue-500/10 text-blue-400"
          value={isLoading ? '...' : (stats?.totalUsers ?? 0).toLocaleString()}
        />
        <StatCard
          label="Active Rooms" icon={Radio} color="bg-[rgba(0,230,118,0.12)] text-[#00e676]"
          value={isLoading ? '...' : stats?.activeRooms ?? 0}
          subtitle="Broadcasting live"
        />
        <StatCard
          label="Pending Bets" icon={Trophy} color="bg-amber-500/10 text-amber-400"
          value={isLoading ? '...' : (stats?.pendingBets ?? 0).toLocaleString()}
        />
        <StatCard
          label="Today Volume" icon={TrendingUp} color="bg-purple-500/10 text-purple-400"
          value={isLoading ? '...' : formatCurrency(stats?.todayBetVolume ?? 0)}
        />
        <StatCard
          label="Total Exposure" icon={DollarSign} color="bg-red-500/10 text-red-400"
          value={isLoading ? '...' : formatCurrency(stats?.totalExposure ?? 0)}
          subtitle="Pending payouts"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Volume chart */}
        <div className="xl:col-span-2 bg-[#111827] border border-[#1e2d45] rounded-[12px] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-white">Bet Volume (Today)</h2>
              <p className="text-xs text-[#8899aa]">Hourly breakdown in USD</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="live-dot" />
              <span className="text-xs text-[#00e676]">Live</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockChartData}>
              <XAxis dataKey="hour" stroke="#4a5568" tick={{ fontSize: 11 }} />
              <YAxis stroke="#4a5568" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 8 }}
                labelStyle={{ color: '#8899aa' }}
                itemStyle={{ color: '#00e676' }}
              />
              <Bar dataKey="volume" fill="#00e676" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Live rooms panel */}
        <div className="bg-[#111827] border border-[#1e2d45] rounded-[12px] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-[#00e676]" />
            <h2 className="font-semibold text-white">Live Rooms</h2>
          </div>
          {!liveRooms || liveRooms.length === 0 ? (
            <p className="text-[#8899aa] text-sm text-center py-8">No rooms are live right now</p>
          ) : (
            <div className="space-y-3">
              {liveRooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between p-3 bg-[#0f1622] rounded-[8px] border border-[#1e2d45]">
                  <div>
                    <p className="text-sm font-medium text-white">{room.match.teamA} vs {room.match.teamB}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="live-dot w-1.5 h-1.5" />
                      <span className="text-xs text-[#00e676]">LIVE</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{room.participantCount}</p>
                    <p className="text-xs text-[#8899aa]">listeners</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
