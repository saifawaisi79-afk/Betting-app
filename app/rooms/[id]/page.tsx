'use client';

import { useEffect, useState, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { api } from '../../lib/api';
import { useBetSlipStore } from '../../lib/store';
import { StreamPlayer } from '../../components/StreamPlayer';
import { AudioBroadcastListener } from '../../components/AudioBroadcastListener';
import { Skeleton, OddsBoardSkeleton } from '../../components/ui/Skeleton';
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
  Eye,
  Activity,
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="rounded-2xl bg-[#0a0f1d] border border-white/[0.06] p-6 space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Dual Column Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-[#0a0f1d] border border-white/[0.06] p-5 space-y-4">
              <Skeleton className="h-6 w-40" />
              <OddsBoardSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Match Header Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a0f1d] border border-white/[0.08] rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-[#00e676]/5 to-transparent pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-extrabold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-dot" />
              LIVE MATCH ROOM
            </span>
            <span className="text-xs text-[#8899aa] font-medium">• {room.match.sport?.name}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
            {room.match.teamA} <span className="text-[#8899aa] font-normal text-xl">vs</span> {room.match.teamB}
          </h1>

          {room.match.currentScore && (
            <p className="text-2xl font-mono font-black text-[#00e676] font-tabular tracking-wider">
              {room.match.currentScore}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 z-10">
          {/* Presence Count */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#10172a] border border-white/[0.08] shadow-inner">
            <Eye size={15} className="text-[#00e676]" />
            <span className="font-mono font-bold text-white text-sm font-tabular">
              {Math.max(presenceCount, room.participantCount || 1)}
            </span>
            <span className="text-xs text-[#8899aa]">viewers</span>
          </div>

          <div className="text-right hidden sm:block px-3 py-1.5 rounded-xl bg-[#10172a]/60 border border-white/[0.05]">
            <span className="text-[10px] text-[#8899aa] uppercase tracking-wider block font-semibold">Verified Host</span>
            <span className="text-xs font-bold text-white flex items-center gap-1 justify-end">
              <ShieldCheck size={12} className="text-[#00e676]" /> {room.host.displayName}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Main Room Layout: Video + Audio on left/top, Live Odds on right/bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Stream Embed + One-way Host Audio Broadcast (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl bg-black">
            <StreamPlayer
              streamUrl={room.match.streamUrl}
              teamA={room.match.teamA}
              teamB={room.match.teamB}
              isLive={room.status === 'LIVE'}
            />
          </div>

          {/* Host Voice Commentary WebRTC Listener */}
          <AudioBroadcastListener
            roomId={room.id}
            hostName={room.host.displayName}
          />

          <div className="p-3.5 rounded-xl bg-[#0a0f1d] border border-white/[0.06] flex items-center justify-between text-xs text-[#8899aa]">
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#00e676]" />
              Host-only verified low-latency commentary broadcast (WebRTC)
            </span>
            <span className="font-mono text-[11px] text-[#64748b]">LiveKit RTC 2.0</span>
          </div>
        </div>

        {/* Right column: Real-time Odds Board (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0a0f1d] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#00e676]/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-[#00e676]" />
                </div>
                <h3 className="font-bold text-white font-['Outfit'] text-sm uppercase tracking-wider">LIVE ODDS BOARD</h3>
              </div>
              <span className="text-[11px] text-[#8899aa] font-medium flex items-center gap-1.5 font-tabular">
                <span className="w-2 h-2 rounded-full bg-[#00e676] live-dot" /> Real-time
              </span>
            </div>

            {markets && markets.length > 0 ? (
              <div className="space-y-3.5 max-h-[560px] overflow-y-auto pr-1">
                {markets.map((market) => (
                  <div
                    key={market.id}
                    className="p-4 rounded-xl bg-[#10172a] border border-white/[0.06] space-y-2.5 hover:border-white/[0.1] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        {market.name}
                      </h4>
                      {market.status === 'SUSPENDED' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800 font-bold uppercase">
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
                          <motion.button
                            key={outcome.id}
                            disabled={isSuspended}
                            whileHover={!isSuspended ? { scale: 1.02 } : undefined}
                            whileTap={!isSuspended ? { scale: 0.97 } : undefined}
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
                            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                              isSelected
                                ? 'bg-[#00e676] text-black border-[#00e676] shadow-lg shadow-[#00e676]/25 font-bold'
                                : 'bg-[#162035] border-white/[0.06] text-white hover:border-[#00e676]/50 hover:bg-[#1a2842]'
                            } ${
                              direction === 'up'
                                ? 'odds-up'
                                : direction === 'down'
                                ? 'odds-down'
                                : ''
                            }`}
                          >
                            <span className={`text-[11px] font-medium truncate w-full text-center ${isSelected ? 'text-black/80' : 'text-[#8899aa]'}`}>
                              {outcome.name}
                            </span>
                            <span
                              className={`font-mono font-extrabold text-sm font-tabular mt-0.5 ${
                                isSelected ? 'text-black' : 'text-[#00e676]'
                              }`}
                            >
                              {dynamicOdds.toFixed(2)}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-[#8899aa]">
                <Clock size={32} className="mx-auto text-white/[0.1] mb-2" />
                <p className="text-xs">Odds are being formulated by oddsmakers...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
