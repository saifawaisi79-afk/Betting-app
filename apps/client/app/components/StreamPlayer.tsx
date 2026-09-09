'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Volume2, VolumeX, Maximize, Video, Radio } from 'lucide-react';

interface StreamPlayerProps {
  streamUrl?: string | null;
  teamA: string;
  teamB: string;
  isLive?: boolean;
}

export function StreamPlayer({ streamUrl, teamA, teamB, isLive = true }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHls, setIsHls] = useState(false);
  const [isYouTube, setIsYouTube] = useState(false);
  const [ytEmbedUrl, setYtEmbedUrl] = useState('');

  useEffect(() => {
    if (!streamUrl) return;

    if (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be')) {
      setIsYouTube(true);
      let videoId = '';
      if (streamUrl.includes('youtu.be/')) {
        videoId = streamUrl.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (streamUrl.includes('watch?v=')) {
        videoId = streamUrl.split('watch?v=')[1]?.split('&')[0] || '';
      } else if (streamUrl.includes('embed/')) {
        videoId = streamUrl.split('embed/')[1]?.split('?')[0] || '';
      }
      setYtEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&rel=0`);
    } else if (streamUrl.endsWith('.m3u8')) {
      setIsHls(true);
      const video = videoRef.current;
      if (video) {
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          return () => {
            hls.destroy();
          };
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
        }
      }
    }
  }, [streamUrl]);

  return (
    <div className="relative w-full aspect-video bg-[#05070c] rounded-2xl overflow-hidden border border-[#1a273e] shadow-2xl flex items-center justify-center group">
      {/* Live Badge */}
      {isLive && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-extrabold uppercase tracking-wider backdrop-blur-md shadow-lg shadow-red-600/30">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          LIVE MATCH
        </div>
      )}

      {isYouTube && ytEmbedUrl ? (
        <iframe
          src={ytEmbedUrl}
          title="Live Sports Stream"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      ) : isHls ? (
        <video
          ref={videoRef}
          controls
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        /* Visual Interactive Stadium / Match Visualizer when no direct video link */
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0c1322] via-[#070b14] to-[#04060a] p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,230,118,0.06),transparent_60%)]" />

          {/* Virtual pitch markings */}
          <div className="absolute inset-x-8 inset-y-6 border border-[#1a273e]/40 rounded-2xl flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border border-[#1a273e]/40 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e676]/40" />
            </div>
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#1a273e]/40" />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#162238]/80 border border-[#233554] flex items-center justify-center mx-auto text-[#00e676] shadow-xl shadow-[#00e676]/10">
              <Radio size={32} className="animate-pulse" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
                {teamA} <span className="text-[#00e676] font-light">vs</span> {teamB}
              </h2>
              <p className="text-xs text-[#8899aa] mt-1">
                Live Host Commentary Broadcast Room Active
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
