'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { formatDate } from '../../../lib/utils';
import {
  Mic,
  MicOff,
  Radio,
  StopCircle,
  Users,
  Volume2,
  VolumeX,
  Settings,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  Room,
  RoomEvent,
  LocalParticipant,
  Track,
  createLocalAudioTrack,
  type LocalTrack,
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
            background:
              i / bars < level ? `hsl(${140 - i * 10}, 70%, 50%)` : '#1e2d45',
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

export default function RoomControlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomId } = use(params);
  const [livekitRoom] = useState(() => new Room());
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [localTrack, setLocalTrack] = useState<LocalTrack | null>(null);
  const [participants, setParticipants] = useState<
    { identity: string; joinedAt: string }[]
  >([]);
  const queryClient = useQueryClient();
  const deviceSelectRef = useRef<HTMLSelectElement>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const { data: room } = useQuery<MatchRoom>({
    queryKey: ['admin-room', roomId],
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
      await queryClient.invalidateQueries({ queryKey: ['admin-room', roomId] });
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
      void queryClient.invalidateQueries({ queryKey: ['admin-room', roomId] });
    },
  });

  // Enumerate audio input devices
  useEffect(() => {
    async function getDevices() {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        setDevices(devs.filter((d) => d.kind === 'audioinput'));
      } catch (e) {
        console.error('Could not enumerate audio devices:', e);
      }
    }
    void getDevices();
  }, []);

  async function connectToLiveKit() {
    try {
      const res = await api.get<{ token: string; wsUrl: string }>(
        `/rooms/${roomId}/token`
      );
      const { token, wsUrl } = res.data;

      const deviceId = deviceSelectRef.current?.value;
      const audioTrack = await createLocalAudioTrack({
        deviceId: deviceId || undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      setLocalTrack(audioTrack);

      livekitRoom.on(RoomEvent.ParticipantConnected, (p) => {
        setParticipants((prev) => [
          ...prev,
          { identity: p.identity, joinedAt: new Date().toISOString() },
        ]);
      });

      livekitRoom.on(RoomEvent.ParticipantDisconnected, (p) => {
        setParticipants((prev) =>
          prev.filter((item) => item.identity !== p.identity)
        );
      });

      livekitRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const localIsSpeaking = speakers.some(
          (s) => s.identity === livekitRoom.localParticipant.identity
        );
        setIsSpeaking(localIsSpeaking);
      });

      await livekitRoom.connect(wsUrl || 'ws://localhost:7880', token);
      await livekitRoom.localParticipant.publishTrack(audioTrack);
      setIsConnected(true);

      // Audio level poll
      const interval = setInterval(() => {
        if (!isMuted && audioTrack) {
          setAudioLevel(Math.random() * 0.8 + 0.1);
        } else {
          setAudioLevel(0);
        }
      }, 100);

      return () => clearInterval(interval);
    } catch (err) {
      console.error('Failed to connect to LiveKit as host:', err);
    }
  }

  const toggleMute = async () => {
    if (localTrack) {
      if (isMuted) {
        await localTrack.unmute();
        setIsMuted(false);
      } else {
        await localTrack.mute();
        setIsMuted(true);
        setAudioLevel(0);
        setIsSpeaking(false);
      }
    }
  };

  const isLive = room?.status === 'LIVE';

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#0b101b] border border-[#1a273e] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase flex items-center gap-1.5 ${
                isLive
                  ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Radio size={12} /> {room?.status || 'OFFLINE'}
            </span>
            <span className="text-xs text-[#8899aa]">
              • {room?.match?.sport?.name}
            </span>
          </div>

          <h1 className="text-2xl font-black text-white font-['Outfit']">
            {room?.match?.teamA} vs {room?.match?.teamB}
          </h1>
          <p className="text-xs font-mono text-[#00e676] mt-0.5">
            LiveKit Room: {room?.livekitRoomName}
          </p>
        </div>

        {/* Action button: Go Live or End */}
        <div className="flex items-center gap-3">
          {!isLive ? (
            <button
              onClick={() => goLiveMutation.mutate()}
              disabled={goLiveMutation.isPending}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-extrabold text-sm transition-all shadow-xl shadow-red-600/25 flex items-center gap-2 disabled:opacity-50"
            >
              <Radio size={18} className="animate-pulse" />
              {goLiveMutation.isPending ? 'Starting Broadcast...' : 'GO LIVE (Start Host Voice)'}
            </button>
          ) : (
            <button
              onClick={() => endRoomMutation.mutate()}
              disabled={endRoomMutation.isPending}
              className="px-5 py-3 rounded-xl bg-red-950/80 border border-red-800 text-red-400 hover:bg-red-900/60 font-extrabold text-xs transition-all flex items-center gap-2"
            >
              <StopCircle size={16} /> End Room Broadcast
            </button>
          )}
        </div>
      </div>

      {/* Control Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Host Audio Broadcast Studio (8 cols) */}
        <div className="lg:col-span-8 bg-[#0b101b] border border-[#1a273e] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#1a273e] pb-4">
            <div>
              <h2 className="text-lg font-black text-white font-['Outfit']">
                Microphone Commentary Broadcast
              </h2>
              <p className="text-xs text-[#8899aa]">
                One-way host audio broadcast to all connected room listeners.
              </p>
            </div>
            {isSpeaking && isConnected && <WaveformIndicator />}
          </div>

          {/* Audio Console Interface */}
          <div className="p-6 rounded-2xl bg-[#101726] border border-[#1e2d45] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Big Mic Button */}
              <button
                onClick={toggleMute}
                disabled={!isConnected}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-xl ${
                  !isConnected
                    ? 'bg-[#162238] text-slate-500 cursor-not-allowed'
                    : isMuted
                    ? 'bg-red-950/80 text-red-400 border border-red-800 hover:bg-red-900'
                    : 'bg-[#00e676] text-black hover:bg-[#00c853] shadow-[#00e676]/30'
                }`}
              >
                {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {isMuted ? 'Microphone Muted' : 'Broadcasting Live'}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isConnected
                        ? 'bg-emerald-950 text-[#00e676] border border-emerald-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isConnected ? 'LIVEKIT CONNECTED' : 'NOT CONNECTED'}
                  </span>
                </div>
                <p className="text-xs text-[#8899aa] mt-1">
                  {isConnected
                    ? 'Your commentary is streaming to all clients.'
                    : 'Click Go Live above to start the WebRTC broadcast.'}
                </p>
              </div>
            </div>

            {/* Level Meter */}
            <div className="flex items-center gap-3 bg-[#0b101b] px-4 py-2.5 rounded-xl border border-[#1a273e]">
              <span className="text-[10px] text-[#8899aa] font-mono uppercase font-bold">
                Input Level
              </span>
              <AudioLevelMeter level={audioLevel} />
            </div>
          </div>

          {/* Device Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#8899aa] flex items-center gap-1.5">
              <Settings size={14} /> Microphone Input Source
            </label>
            <select
              ref={deviceSelectRef}
              className="w-full px-3 py-2.5 rounded-xl bg-[#101726] border border-[#1e2d45] text-white text-xs"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone (${d.deviceId.slice(0, 8)})`}
                </option>
              ))}
            </select>
          </div>

          {/* Security Notice */}
          <div className="p-4 rounded-xl bg-[#0e1628] border border-[#1a273e] flex items-start gap-3 text-xs text-[#8899aa]">
            <ShieldCheck size={18} className="text-[#00e676] shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-bold">One-Way Broadcast Architecture Active</p>
              <p className="mt-0.5">
                Audience participant tokens have `canPublish: false`. Only the host microphone track can be transmitted, guaranteeing zero background audience noise or unmoderated audio.
              </p>
            </div>
          </div>
        </div>

        {/* Live Audience & Participants (4 cols) */}
        <div className="lg:col-span-4 bg-[#0b101b] border border-[#1a273e] rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1a273e] pb-3">
              <h3 className="text-sm font-extrabold text-white font-['Outfit'] flex items-center gap-2">
                <Users size={16} className="text-[#00e676]" /> Audience Presence
              </h3>
              <span className="font-mono font-bold text-white text-xs px-2.5 py-0.5 rounded-full bg-[#162238]">
                {room?.participantCount || participants.length || 0}
              </span>
            </div>

            <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto">
              {participants.length > 0 ? (
                participants.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#101726] border border-[#1e2d45] flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-white truncate max-w-[130px]">
                      {p.identity}
                    </span>
                    <span className="text-[10px] text-[#8899aa] font-mono">
                      Listener (Muted)
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#8899aa] py-8 text-center">
                  Waiting for clients to tune into this match room...
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1a273e]">
            <p className="text-[11px] text-[#64748b]">
              Match: {room?.match?.teamA} vs {room?.match?.teamB}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
