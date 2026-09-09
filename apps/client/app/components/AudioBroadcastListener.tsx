'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrackPublication,
  RemoteTrack,
  Track,
} from 'livekit-client';
import { api } from '../lib/api';
import { Volume2, VolumeX, Mic, Radio, Headphones } from 'lucide-react';

interface AudioBroadcastListenerProps {
  roomId: string;
  hostName?: string;
}

export function AudioBroadcastListener({ roomId, hostName = 'Host' }: AudioBroadcastListenerProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isHostSpeaking, setIsHostSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [audioTrack, setAudioTrack] = useState<RemoteTrack | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    let activeRoom: Room | null = null;

    async function joinAudioBroadcast() {
      try {
        // 1. Fetch subscribe-only LiveKit token from API
        const res = await api.get<{ token: string; wsUrl: string }>(`/rooms/${roomId}/token`);
        const { token, wsUrl } = res.data;

        const room = new Room({
          adaptiveStream: false,
          dynacast: false,
          audioCaptureDefaults: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        roomRef.current = room;
        activeRoom = room;

        // 2. Handle incoming host audio track
        room.on(
          RoomEvent.TrackSubscribed,
          (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
            if (track.kind === Track.Kind.Audio) {
              setAudioTrack(track);
              if (audioElementRef.current) {
                track.attach(audioElementRef.current);
              }
            }
          }
        );

        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Audio) {
            track.detach();
            setAudioTrack(null);
          }
        });

        // 3. Host speaking indicator
        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          const hostSpeaker = speakers.find((s) => s.identity !== room.localParticipant.identity);
          setIsHostSpeaking(!!hostSpeaker);
        });

        // 4. Connect to LiveKit SFU (client cannot publish anything)
        await room.connect(wsUrl || 'ws://localhost:7880', token);
        setIsConnected(true);
      } catch (err) {
        console.error('Failed to join live host audio broadcast:', err);
      }
    }

    if (roomId) {
      void joinAudioBroadcast();
    }

    return () => {
      if (activeRoom) {
        activeRoom.disconnect();
      }
    };
  }, [roomId]);

  // Handle browser autoplay policy
  const handleEnableAudio = () => {
    setHasUserInteracted(true);
    if (audioElementRef.current) {
      audioElementRef.current.play().catch(console.error);
    }
  };

  const toggleMute = () => {
    if (audioElementRef.current) {
      audioElementRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (audioElementRef.current) {
      audioElementRef.current.volume = newVol;
    }
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e2d45] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
      {/* Hidden audio tag for WebRTC stream */}
      <audio ref={audioElementRef} autoPlay playsInline />

      {/* Host Status & Waveform */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="relative">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
              isHostSpeaking
                ? 'bg-[#00e676]/20 border-[#00e676] text-[#00e676] shadow-lg shadow-[#00e676]/30'
                : isConnected
                ? 'bg-[#1e293b] border-[#334155] text-slate-300'
                : 'bg-red-950/40 border-red-800 text-red-400'
            }`}
          >
            <Headphones size={20} />
          </div>
          {isHostSpeaking && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#00e676] border-2 border-[#0f172a] animate-ping" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white font-['Outfit']">Host Audio Commentary</h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#162238] font-bold text-[#00e676] border border-[#00e676]/30">
              ONE-WAY
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[#8899aa]">{hostName}</span>
            {isHostSpeaking ? (
              <div className="flex items-center gap-1 h-3">
                <span className="waveform-bar" />
                <span className="waveform-bar" />
                <span className="waveform-bar" />
                <span className="waveform-bar" />
                <span className="waveform-bar" />
                <span className="text-[11px] text-[#00e676] font-medium ml-1">Speaking</span>
              </div>
            ) : isConnected ? (
              <span className="text-[11px] text-[#64748b] font-medium">Listening for host...</span>
            ) : (
              <span className="text-[11px] text-amber-400 font-medium">Connecting audio...</span>
            )}
          </div>
        </div>
      </div>

      {/* Audio Controls */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {!hasUserInteracted && (
          <button
            onClick={handleEnableAudio}
            className="px-3 py-1.5 rounded-lg bg-[#00e676] text-black text-xs font-bold hover:bg-[#00c853] transition-all shadow-md shadow-[#00e676]/20"
          >
            Tap to Unmute Audio
          </button>
        )}

        <div className="flex items-center gap-2 bg-[#162238] px-3 py-1.5 rounded-xl border border-[#1e2d45]">
          <button
            onClick={toggleMute}
            className="text-slate-300 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={17} className="text-red-400" /> : <Volume2 size={17} />}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-20 accent-[#00e676] h-1.5 bg-[#0f172a] rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
