'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Radio, Users, Mic } from 'lucide-react';
import Link from 'next/link';

interface MatchRoom {
  id: string;
  status: string;
  participantCount: number;
  livekitRoomName: string;
  match: {
    id: string;
    teamA: string;
    teamB: string;
    sport: { name: string };
    streamUrl?: string | null;
  };
  host: { displayName: string };
  createdAt: string;
}

export default function RoomsListPage() {
  const { data: rooms, isLoading } = useQuery<MatchRoom[]>({
    queryKey: ['admin-rooms'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data;
    },
    refetchInterval: 5000,
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white font-['Outfit'] flex items-center gap-3">
          <Radio className="text-red-500 animate-pulse" /> Live Match Rooms
        </h1>
        <p className="text-xs text-[#8899aa] mt-1">
          Monitor all active match rooms, participant counts, host voice broadcasts, and stream links.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-[#8899aa]">Loading rooms...</div>
      ) : rooms && rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const isLive = room.status === 'LIVE';
            return (
              <div
                key={room.id}
                className="bg-[#0b101b] border border-[#1a273e] rounded-2xl p-5 hover:border-[#2a3f5f] transition-all flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1.5 ${
                        isLive
                          ? 'bg-red-950/80 text-red-400 border border-red-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isLive ? 'bg-red-500 animate-ping' : 'bg-slate-500'
                        }`}
                      />
                      {room.status}
                    </span>
                    <span className="text-xs text-[#8899aa] flex items-center gap-1">
                      <Users size={12} /> {room.participantCount || 0} watching
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white">
                    {room.match.teamA} vs {room.match.teamB}
                  </h3>
                  <p className="text-xs text-[#8899aa] mt-1">
                    Sport: <span className="text-white">{room.match.sport?.name}</span>
                  </p>
                  <p className="text-xs text-[#8899aa]">
                    Host: <span className="text-white">{room.host?.displayName || 'Admin'}</span>
                  </p>
                  <p className="text-xs font-mono text-[#00e676] mt-2 truncate">
                    Room: {room.livekitRoomName}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#1a273e] mt-4">
                  <Link
                    href={`/admin/rooms/${room.id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00e676] text-black font-extrabold text-xs hover:bg-[#00c853] transition-all shadow-lg shadow-[#00e676]/20"
                  >
                    <Mic size={16} /> Enter Host Studio
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#0b101b] border border-[#1a273e] rounded-2xl p-12 text-center">
          <Radio size={48} className="mx-auto text-[#1a273e] mb-4" />
          <h3 className="text-lg font-bold text-white">No active live rooms</h3>
          <p className="text-xs text-[#8899aa] mt-1 mb-4">
            Create or launch a room from the Matches tab to broadcast voice commentary to clients.
          </p>
          <Link
            href="/admin/matches"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00e676] text-black font-extrabold text-xs hover:bg-[#00c853] transition-all"
          >
            Go to Matches
          </Link>
        </div>
      )}
    </div>
  );
}
