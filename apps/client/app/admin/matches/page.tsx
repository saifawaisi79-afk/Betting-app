'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Trophy, Plus, Radio, Clock } from 'lucide-react';
import Link from 'next/link';

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  sport: { id: string; name: string };
  scheduledStart: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
  currentScore?: string | null;
  matchRoom?: { id: string; status: string; participantCount: number } | null;
}

export default function MatchesAdminPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [sportName, setSportName] = useState('Football');
  const [scheduledStart, setScheduledStart] = useState('');
  const [streamUrl, setStreamUrl] = useState('');

  const { data: matches, isLoading } = useQuery<Match[]>({
    queryKey: ['admin-matches'],
    queryFn: async () => {
      const res = await api.get('/matches');
      return res.data;
    },
  });

  const createMatchMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/matches', {
        teamA,
        teamB,
        sportName,
        scheduledStart: scheduledStart || new Date().toISOString(),
        streamUrl,
      });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
      setIsCreateOpen(false);
      setTeamA('');
      setTeamB('');
      setStreamUrl('');
    },
  });

  const createRoomMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const res = await api.post(`/rooms`, { matchId });
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
    },
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white font-['Outfit'] flex items-center gap-3">
            <Trophy className="text-[#00e676]" /> Matches Management
          </h1>
          <p className="text-xs text-[#8899aa] mt-1">
            Schedule sports matches, attach video streams, and spawn interactive live match rooms.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00e676] text-black font-extrabold text-xs hover:bg-[#00c853] transition-all shadow-lg shadow-[#00e676]/20"
        >
          <Plus size={16} /> New Match
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-[#8899aa]">Loading matches...</div>
      ) : matches && matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((m) => (
            <div
              key={m.id}
              className="bg-[#0b101b] border border-[#1a273e] rounded-2xl p-5 hover:border-[#2a3f5f] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] px-2.5 py-1 rounded bg-[#162238] text-[#8899aa] font-bold uppercase tracking-wider">
                    {m.sport?.name || 'General'}
                  </span>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                      m.status === 'LIVE'
                        ? 'bg-red-950/80 text-red-400 border border-red-800 animate-pulse'
                        : m.status === 'FINISHED'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-blue-950/80 text-blue-400 border border-blue-800'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                <div className="my-3 space-y-1">
                  <h3 className="text-base font-extrabold text-white">
                    {m.teamA} <span className="text-[#8899aa] font-normal text-xs">vs</span> {m.teamB}
                  </h3>
                  {m.currentScore && (
                    <p className="text-lg font-mono font-bold text-[#00e676]">{m.currentScore}</p>
                  )}
                  <p className="text-xs text-[#8899aa] flex items-center gap-1.5 mt-1">
                    <Clock size={12} /> {formatDate(m.scheduledStart)}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1a273e] mt-4 flex items-center justify-between">
                {m.matchRoom ? (
                  <Link
                    href={`/admin/rooms/${m.matchRoom.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-600/40 text-xs font-bold hover:bg-red-600/30 transition-all"
                  >
                    <Radio size={14} className="animate-pulse" /> Live Room Control ({m.matchRoom.participantCount || 0})
                  </Link>
                ) : (
                  <button
                    onClick={() => createRoomMutation.mutate(m.id)}
                    disabled={createRoomMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#162238] text-white hover:bg-[#22334e] text-xs font-medium transition-all"
                  >
                    <Radio size={14} /> Launch Room
                  </button>
                )}

                <Link
                  href={`/admin/markets?matchId=${m.id}`}
                  className="text-xs text-[#00e676] font-bold hover:underline flex items-center gap-1"
                >
                  Manage Odds →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0b101b] border border-[#1a273e] rounded-2xl p-12 text-center text-[#8899aa]">
          <Trophy size={48} className="mx-auto text-[#1a273e] mb-4" />
          <h3 className="text-lg font-bold text-white">No matches scheduled</h3>
          <p className="text-xs text-[#8899aa] mt-1 mb-4">
            Create your first sporting event to start hosting live betting streams.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#00e676] text-black font-extrabold text-xs hover:bg-[#00c853] transition-all"
          >
            Create Match
          </button>
        </div>
      )}

      {/* Create Match Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101b] border border-[#1a273e] rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-black text-white font-['Outfit']">Create New Match</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#8899aa]">Sport</label>
                <select
                  value={sportName}
                  onChange={(e) => setSportName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#101726] border border-[#1a273e] text-white text-xs"
                >
                  <option value="Football">Football / Soccer</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Esports">Esports</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#8899aa]">Home / Team A</label>
                  <input
                    type="text"
                    value={teamA}
                    onChange={(e) => setTeamA(e.target.value)}
                    placeholder="Real Madrid"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[#101726] border border-[#1a273e] text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#8899aa]">Away / Team B</label>
                  <input
                    type="text"
                    value={teamB}
                    onChange={(e) => setTeamB(e.target.value)}
                    placeholder="Barcelona"
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[#101726] border border-[#1a273e] text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#8899aa]">Scheduled Start Time</label>
                <input
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#101726] border border-[#1a273e] text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8899aa]">Stream Embed URL (YouTube Live / HLS .m3u8)</label>
                <input
                  type="url"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or .m3u8"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#101726] border border-[#1a273e] text-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1a273e]">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-[#8899aa] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => createMatchMutation.mutate()}
                disabled={!teamA || !teamB || createMatchMutation.isPending}
                className="px-4 py-2 rounded-xl bg-[#00e676] text-black font-extrabold text-xs hover:bg-[#00c853] disabled:opacity-50"
              >
                {createMatchMutation.isPending ? 'Creating...' : 'Create Match'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
