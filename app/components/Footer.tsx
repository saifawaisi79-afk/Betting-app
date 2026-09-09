import { Zap, Shield, Radio, Globe, Twitter, Github } from 'lucide-react';
import Link from 'next/link';

const footerLinks = {
  'Cricket Markets': [
    { label: 'IPL 2026',           href: '/' },
    { label: 'Test Series',        href: '/' },
    { label: 'T20 World Cup',      href: '/' },
    { label: 'ODI Championship',   href: '/' },
  ],
  'Platform': [
    { label: 'My Bets',           href: '/bets'   },
    { label: 'Wallet & Payouts',  href: '/wallet' },
    { label: 'Host Studio',       href: '/admin'  },
    { label: 'Live Rooms',        href: '/'       },
  ],
  'Legal': [
    { label: 'Terms of Service',  href: '/' },
    { label: 'Privacy Policy',    href: '/' },
    { label: 'Responsible Gaming', href: '/' },
    { label: 'Fair Play',         href: '/' },
  ],
};

export function Footer() {
  return (
    <footer className="relative bg-[#030508] border-t border-white/[0.05] overflow-hidden">
      {/* Glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#00e676]/40 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-8 bg-[#00e676]/5 blur-xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">

          {/* Brand column */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00e676] to-[#00b0ff] flex items-center justify-center shadow-lg shadow-[#00e676]/20">
                <Zap size={18} className="text-black fill-black" />
              </div>
              <div>
                <span className="font-black text-[17px] text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  STAKE<span className="text-[#00e676]">ROOM</span>
                </span>
              </div>
            </Link>
            <p className="text-sm text-[#475569] leading-relaxed max-w-xs">
              The next-generation live cricket betting exchange with synchronized ultra-low latency host commentary. Feel every ball.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#00e676] font-semibold">
              <Shield size={13} />
              Licensed · Provably Fair · 18+ Only
            </div>
            {/* Social */}
            <div className="flex items-center gap-2 pt-1">
              {[
                { icon: Globe,   href: '/' },
                { icon: Twitter, href: '/' },
                { icon: Github,  href: '/' },
              ].map(({ icon: Icon, href }, i) => (
                <Link
                  key={i}
                  href={href}
                  className="w-8 h-8 rounded-lg border border-white/[0.07] flex items-center justify-center text-[#475569] hover:text-white hover:border-white/[0.15] transition-all"
                >
                  <Icon size={14} />
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-[#94a3b8] mb-4">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-[#475569] hover:text-[#94a3b8] transition-colors font-medium"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#334155]">
          <p>© 2026 STAKEROOM Gaming Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-2 font-semibold">
            <Radio size={12} className="text-[#00e676]" />
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              Powered by LiveKit WebRTC · &lt; 150ms latency
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
