import { Zap, Shield, HeartHandshake, Award } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#1a273e] bg-[#060910] text-[#8899aa] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00e676] flex items-center justify-center">
              <Zap size={16} className="text-black fill-black" />
            </div>
            <span className="font-extrabold text-base text-white font-['Outfit']">
              STAKE<span className="text-[#00e676]">ROOM</span>
            </span>
          </div>
          <p className="text-xs text-[#64748b] leading-relaxed">
            The next-generation live interactive sports betting exchange with synchronized ultra-low latency host commentary.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Live Sports</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/" className="hover:text-white transition-colors">Football / Premier League</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors">NBA Basketball</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors">Cricket World Cup</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors">Esports Tournaments</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Platform</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/bets" className="hover:text-white transition-colors">My Bet History</Link></li>
            <li><Link href="/wallet" className="hover:text-white transition-colors">Instant Deposit / Cashout</Link></li>
            <li><a href="http://localhost:3001" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Admin Console ↗</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Responsible Gaming</h4>
          <p className="text-xs text-[#64748b] leading-relaxed">
            18+ Only. Betting involves financial risk. Please play responsibly within your limits.
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-[#00e676]">
            <Shield size={14} /> Licensed & Provably Fair
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-[#1a273e] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748b]">
        <p>© 2026 STAKEROOM Gaming Technologies Inc. All rights reserved.</p>
        <p className="mt-2 sm:mt-0 font-mono">Ultra-low latency WebRTC powered by LiveKit</p>
      </div>
    </footer>
  );
}
