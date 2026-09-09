'use client';

import { useEffect, useState, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { api } from '../../lib/api';
import { useBetSlipStore } from '../../lib/store';
import { StreamPlayer } from '../../components/StreamPlayer';
import { AudioBroadcastListener } from '../../components/AudioBroadcastListener';
import {
  Users,
  Radio,
  Clock,
  TrendingUp,
  ShieldCheck,
  Zap,
  ChevronRight,
  Flame,
  AlertCircle,
} from 'lucide-react';

interface Outcome {
  id: string;
  name: string;
  odds: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'SETTLED_WIN' | 'SETTLED_LOSS';
}

interface Market {
  id: string;
  name: string;
  type: string;
  status: 'OPEN' | 'SUSPENDED' | 'SETTLED';
  outcomes: Outcome[];
}

interface MatchRoom {
  id: string;
  status: string;
  participantCount: number;
  livekitRoomName: string;
  match: {
    id: string;
    teamA: string;
    teamB: string;
    currentScore?: string | null;
    streamUrl?: string | null;
    sport: { name: string };
  };
  host: {
    displayName: string;
  };
}

export default function MatchRoomClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomId } = use(params);
  const { addItem, items } = useBetSlipStore();
  const [liveOddsMap, setLiveOddsMap] = useState<Record<string, { odds: number; direction: 'up' | 'down' | null }>>({});
  const [presenceCount, setPresenceCount] = useState<number>(1);

  // Fetch Room Info
  const { data: room, isLoading: isRoomLoading } = useQuery<MatchRoom>({
    queryKey: ['client-room', roomId],
    queryFn: async () => {
      const res = await api.get(`/rooms/${roomId}`);
      return res.data;
    },
    refetchInterval: 8000,
  });

  // Fetch Markets for this match
  const matchId = room?.match?.id;
  const { data: markets, refetch: refetchMarkets } = useQuery<Market[]>({
    queryKey: ['room-markets', matchId],
    queryFn: async () => {
      if (!matchId) return [];
      const res = await api.get(`/markets?matchId=${matchId}`);
      return res.data;
    },
    enabled: !!matchId,
    refetchInterval: 5000,
  });

  // Socket.IO real-time odds & room listener
  useEffect(() => {
    const socketUrl = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000';
    const socket: Socket = io(`${socketUrl}/room`, {
      transports: ['websocket', 'polling'],
    });

    socket.emit('joinRoom', { roomId });

    socket.on('presenceUpdate', (data: { count: number }) => {
      if (data?.count) {
        setPresenceCount(data.count);
      }
    });

    socket.on('oddsUpdate', (data: { outcomeId: string; newOdds: number; oldOdds: number }) => {
      setLiveOddsMap((prev) => ({
        ...prev,
        [data.outcomeId]: {
          odds: data.newOdds,
          direction: data.newOdds > data.oldOdds ? 'up' : 'down',
        },
      }));
      void refetchMarkets();
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, refetchMarkets]);

  if (isRoomLoading || !room) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <Radio size={40} className="mx-auto text-[#00e676] animate-pulse" />
          <p className="text-sm font-semibold text-white">Connecting to live match room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Match Header Info */}
      <div className="bg-[#0b101b] border border-[#1a273e] rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 font-extrabold uppercase border border-red-600/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              LIVE MATCH ROOM
            </span>
            <span className="text-xs text-[#8899aa]">• {room.match.sport?.name}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
            {room.match.teamA} <span className="text-[#8899aa] font-normal text-xl">vs</span> {room.match.teamB}
          </h1>

          {room.match.currentScore && (
            <p className="text-2xl font-mono font-black text-[#00e676]">
              {room.match.currentScore}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Presence Count */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141e30] border border-[#1e2d45]">
            <Users size={16} className="text-[#00e676]" />
            <span className="font-mono font-bold text-white text-sm">
              {Math.max(presenceCount, room.participantCount || 1)}
            </span>
            <span className="text-xs text-[#8899aa]">viewers</span>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-[#8899aa] uppercase tracking-wider block">Host</span>
            <span className="text-xs font-bold text-white">{room.host.displayName}</span>
          </div>
        </div>
      </div>

      {/* Main Room Layout: Video + Audio on left/top, Live Odds on right/bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Stream Embed + One-way Host Audio Broadcast (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <StreamPlayer
            streamUrl={room.match.streamUrl}
            teamA={room.match.teamA}
            teamB={room.match.teamB}
            isLive={room.status === 'LIVE'}
          />

          {/* Host Voice Commentary WebRTC Listener */}
          <AudioBroadcastListener
            roomId={room.id}
            hostName={room.host.displayName}
          />

          <div className="p-4 rounded-xl bg-[#0b101b] border border-[#1a273e] flex items-center justify-between text-xs text-[#8899aa]">
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#00e676]" />
              Host-only verified broadcast. Participant microphoned chat disabled for clean audio.
            </span>
            <span className="font-mono text-[11px] text-[#64748b]">LiveKit RTC 2.0</span>
          </div>
        </div>

        {/* Right column: Real-time Odds Board (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0b101b] border border-[#1a273e] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1a273e] pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-[#00e676]" />
                <h3 className="font-bold text-white font-['Outfit']">LIVE ODDS BOARD</h3>
              </div>
              <span className="text-[11px] text-[#8899aa] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse" /> Real-time
              </span>
            </div>

            {markets && markets.length > 0 ? (
              <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
                {markets.map((market) => (
                  <div
                    key={market.id}
                    className="p-4 rounded-xl bg-[#101726] border border-[#1e2d45] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        {market.name}
                      </h4>
                      {market.status === 'SUSPENDED' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800 font-bold uppercase">
                          SUSPENDED
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {market.outcomes.map((outcome) => {
                        const dynamicOdds = liveOddsMap[outcome.id]?.odds ?? outcome.odds;
                        const direction = liveOddsMap[outcome.id]?.direction;
                        const isSuspended = market.status === 'SUSPENDED' || outcome.status === 'SUSPENDED';
                        const isSelected = items.some((i) => i.outcomeId === outcome.id);

                        return (
                          <button
                            key={outcome.id}
                            disabled={isSuspended}
                            onClick={() =>
                              addItem({
                                matchId: room.match.id,
                                matchTitle: `${room.match.teamA} vs ${room.match.teamB}`,
                                marketId: market.id,
                                marketName: market.name,
                                outcomeId: outcome.id,
                                outcomeName: outcome.name,
                                odds: dynamicOdds,
                              })
                            }
                            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                              isSelected
                                ? 'bg-[#00e676] text-black border-[#00e676] shadow-lg shadow-[#00e676]/20'
                                : 'bg-[#162238] border-[#22334e] text-white hover:border-[#00e676]/60 hover:bg-[#1a2842]'
                            } ${
                              direction === 'up'
                                ? 'odds-up'
                                : direction === 'down'
                                ? 'odds-down'
                                : ''
                            }`}
                          >
                            <span className="text-[11px] font-medium truncate w-full text-center">
                              {outcome.name}
                            </span>
                            <span
                              className={`font-mono font-extrabold text-sm ${
                                isSelected ? 'text-black' : 'text-[#00e676]'
                              }`}
                            >
                              {dynamicOdds.toFixed(2)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-[#8899aa]">
                <Clock size={32} className="mx-auto text-[#1e2d45] mb-2" />
                <p className="text-xs">Odds are being formulated by oddsmakers...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
