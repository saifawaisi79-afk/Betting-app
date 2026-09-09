'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import {
  Mic, MicOff, Radio, StopCircle, Users,
  Volume2, VolumeX, Settings, ChevronRight,
} from 'lucide-react';
import {
  Room, RoomEvent, LocalParticipant, Track,
  createLocalAudioTrack, type LocalTrack,
} from 'livekit-client';

interface MatchRoom {
  id: string;
  status: string;
  participantCount: number;
  livekitRoomName: string;
  match: { id: string; teamA: string; teamB: string; sport: { name: string } };
  host: { displayName: string };
}

function AudioLevelMeter({ level }: { level: number }) {
  const bars = 8;
  return (
    <div className="flex items-end gap-0.5 h-6">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm transition-all duration-75"
          style={{
            height: `${Math.max(3, ((i + 1) / bars) * 24)}px`,
            background: i / bars < level
              ? `hsl(${140 - i * 10}, 70%, 50%)`
              : '#1e2d45',
          }}
        />
      ))}
    </div>
  );
}

function WaveformIndicator() {
  return (
    <div className="flex items-center gap-0.5 h-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="waveform-bar" />
      ))}
    </div>
  );
}

export default function RoomControlPage({ params }: { params: Promise<{ id: string }> }) {
  const [roomId, setRoomId] = useState('');
  const [livekitRoom] = useState(() => new Room());
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [localTrack, setLocalTrack] = useState<LocalTrack | null>(null);
  const [participants, setParticipants] = useState<{ identity: string; joinedAt: string }[]>([]);
  const queryClient = useQueryClient();
  const deviceSelectRef = useRef<HTMLSelectElement>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    void params.then((p) => setRoomId(p.id));
  }, [params]);

  const { data: room } = useQuery<MatchRoom>({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const res = await api.get<MatchRoom>(`/rooms/${roomId}`);
      return res.data;
    },
    enabled: !!roomId,
    refetchInterval: 5000,
  });

  const goLiveMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/rooms/${roomId}/go-live`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      await connectToLiveKit();
    },
  });

  const endRoomMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/rooms/${roomId}/end`);
      await livekitRoom.disconnect();
      setIsConnected(false);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['room', roomId] });
    },
  });

  async function connectToLiveKit() {
    const res = await api.get<{ token: string; url: string }>(`/rooms/${roomId}/token`);
    const { token, url } = res.data;

    livekitRoom.on(RoomEvent.ParticipantConnected, () => refreshParticipants());
    livekitRoom.on(RoomEvent.ParticipantDisconnected, () => refreshParticipants());
    livekitRoom.on(RoomEvent.LocalTrackPublished, () => setIsConnected(true));

    await livekitRoom.connect(url, token);

    // Publish host audio
    const track = await createLocalAudioTrack({ echoCancellation: true, noiseSuppression: true });
    setLocalTrack(track);
    await livekitRoom.localParticipant.publishTrack(track);

    // Audio level monitoring
    const interval = setInterval(() => {
      const lp = livekitRoom.localParticipant as LocalParticipant;
      const level = lp.audioLevel ?? 0;
      setAudioLevel(level);
      setIsSpeaking(level > 0.05);
    }, 100);

    setIsConnected(true);
    refreshParticipants();

    return () => clearInterval(interval);
  }

  function refreshParticipants() {
    const parts = Array.from(livekitRoom.remoteParticipants.values()).map((p) => ({
      identity: p.identity,
      joinedAt: new Date().toISOString(),
    }));
    setParticipants(parts);
  }

  async function toggleMute() {
    if (!localTrack) return;
    if (isMuted) {
      await localTrack.unmute();
    } else {
      await localTrack.mute();
    }
    setIsMuted(!isMuted);
  }

  useEffect(() => {
    void navigator.mediaDevices.enumerateDevices().then((devs) => {
      setDevices(devs.filter((d) => d.kind === 'audioinput'));
    });
  }, []);

  if (!room) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-[#8899aa]">Loading room...</div>
      </div>
    );
  }

  const isLive = room.status === 'LIVE';
  const isEnded = room.status === 'ENDED';

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-[#8899aa] mb-2">
          <span>Live Rooms</span>
          <ChevronRight size={14} />
          <span className="text-white">{room.match.teamA} vs {room.match.teamB}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">
              Room Control Panel
            </h1>
            <p className="text-[#8899aa] text-sm">{room.match.sport.name} · Host: {room.host.displayName}</p>
          </div>
          {isLive && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(0,230,118,0.12)] border border-[rgba(0,230,118,0.25)]">
              <div className="live-dot" />
              <span className="text-[#00e676] text-sm font-semibold">LIVE</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main controls */}
        <div className="xl:col-span-2 space-y-4">
          {/* Go Live / End Room */}
          <div className="bg-[#111827] border border-[#1e2d45] rounded-[12px] p-6">
            <h2 className="font-semibold text-white mb-4">Broadcast Control</h2>

            {!isLive && !isEnded && (
              <button
                onClick={() => goLiveMutation.mutate()}
                disabled={goLiveMutation.isPending}
                className="flex items-center gap-3 px-6 py-3 rounded-[10px] bg-[#00e676] text-black font-bold hover:bg-[#00c853] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Radio size={18} />
                {goLiveMutation.isPending ? 'Starting...' : 'Go Live'}
              </button>
            )}

            {isLive && (
              <div className="space-y-4">
                {/* Audio controls */}
                <div className="p-4 bg-[#0f1622] rounded-[10px] border border-[#1e2d45]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {isSpeaking ? <WaveformIndicator /> : <Volume2 size={16} className="text-[#8899aa]" />}
                      <div>
                        <p className="text-sm font-medium text-white">Host Microphone</p>
                        <p className="text-xs text-[#8899aa]">
                          {isConnected
                            ? isMuted ? 'Muted' : isSpeaking ? 'Speaking' : 'Connected — silent'
                            : 'Connecting to LiveKit...'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleMute}
                      disabled={!isConnected}
                      className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-medium transition-all ${
                        isMuted
                          ? 'bg-[rgba(255,71,87,0.12)] text-[#ff4757] border border-[rgba(255,71,87,0.25)]'
                          : 'bg-[rgba(0,230,118,0.12)] text-[#00e676] border border-[rgba(0,230,118,0.2)]'
                      } disabled:opacity-40`}
                    >
                      {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                      {isMuted ? 'Unmute' : 'Mute'}
                    </button>
                  </div>
                  <AudioLevelMeter level={audioLevel} />
                </div>

                {/* Device picker */}
                <div className="flex items-center gap-3">
                  <Settings size={14} className="text-[#8899aa]" />
                  <select
                    ref={deviceSelectRef}
                    className="flex-1 bg-[#0f1622] border border-[#1e2d45] text-[#8899aa] text-sm rounded-[8px] px-3 py-2 outline-none"
                  >
                    {devices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || 'Microphone'}</option>
                    ))}
                  </select>
                </div>

                {/* End room */}
                <button
                  onClick={() => endRoomMutation.mutate()}
                  disabled={endRoomMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[rgba(255,71,87,0.1)] text-[#ff4757] border border-[rgba(255,71,87,0.2)] text-sm font-medium hover:bg-[rgba(255,71,87,0.18)] transition-all"
                >
                  <StopCircle size={14} />
                  {endRoomMutation.isPending ? 'Ending...' : 'End Room'}
                </button>
              </div>
            )}

            {isEnded && (
              <div className="text-center py-8">
                <p className="text-[#8899aa]">This room has ended.</p>
              </div>
            )}
          </div>

          {/* Stream info */}
          <div className="bg-[#111827] border border-[#1e2d45] rounded-[12px] p-6">
            <h2 className="font-semibold text-white mb-4">Match Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#8899aa] uppercase tracking-wide">Sport</p>
                <p className="text-white font-medium mt-1">{room.match.sport.name}</p>
              </div>
              <div>
                <p className="text-xs text-[#8899aa] uppercase tracking-wide">Room ID</p>
                <p className="text-white font-mono text-sm mt-1">{room.livekitRoomName}</p>
              </div>
              <div>
                <p className="text-xs text-[#8899aa] uppercase tracking-wide">Status</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${
                  isLive ? 'bg-[rgba(0,230,118,0.12)] text-[#00e676]' :
                  isEnded ? 'bg-[rgba(255,71,87,0.1)] text-[#ff4757]' :
                  'bg-[rgba(250,204,21,0.1)] text-amber-400'
                }`}>{room.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Participants panel */}
        <div className="bg-[#111827] border border-[#1e2d45] rounded-[12px] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Live Listeners</h2>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#8899aa]" />
              <span className="text-white font-bold">{room.participantCount}</span>
            </div>
          </div>

          {participants.length === 0 ? (
            <div className="text-center py-8">
              <Users size={24} className="text-[#1e2d45] mx-auto mb-2" />
              <p className="text-[#4a5568] text-sm">No listeners yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {participants.map((p) => (
                <div key={p.identity} className="flex items-center justify-between p-3 bg-[#0f1622] rounded-[8px]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#1e2d45] flex items-center justify-center text-xs text-[#8899aa] font-medium">
                      {p.identity.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-sm text-white font-mono">{p.identity.slice(0, 12)}...</p>
                  </div>
                  <VolumeX size={12} className="text-[#4a5568]" title="Subscriber only" />
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-3 bg-[rgba(0,230,118,0.05)] rounded-[8px] border border-[rgba(0,230,118,0.1)]">
            <p className="text-xs text-[#00e676] font-medium">🔒 Clients are subscriber-only</p>
            <p className="text-xs text-[#4a5568] mt-1">No client can publish audio — enforced server-side at token issuance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
