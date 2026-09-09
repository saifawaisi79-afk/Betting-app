'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap, Mail, Lock, ArrowRight, Shield, Users,
  Radio, Trophy, TrendingUp, Sparkles, Eye, EyeOff,
  CircleDot, Headphones, Wallet,
} from 'lucide-react';

type PanelType = 'client' | 'admin';

const features = {
  client: [
    { icon: CircleDot,   label: 'Live Cricket Odds',    color: 'text-[#00e676]' },
    { icon: Headphones,  label: 'Audio Commentary',     color: 'text-[#00b0ff]' },
    { icon: Wallet,      label: 'Instant Wallet',       color: 'text-yellow-400' },
    { icon: Trophy,      label: 'Win Real Rewards',     color: 'text-orange-400' },
  ],
  admin: [
    { icon: Radio,       label: 'Host Live Studio',     color: 'text-red-400'    },
    { icon: TrendingUp,  label: 'Manage Odds',          color: 'text-[#00b0ff]'  },
    { icon: Users,       label: 'User Management',      color: 'text-purple-400' },
    { icon: Sparkles,    label: 'Analytics Dashboard',  color: 'text-yellow-400' },
  ],
};

export default function LoginPage() {
  const [panel, setPanel]       = useState<PanelType>('client');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const isClient = panel === 'client';
  const accent   = isClient ? '#00e676' : '#00b0ff';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/auth/login`
          : '/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await res.json();
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('userRole', panel);
        window.location.href = panel === 'admin' ? '/admin' : '/';
      } else {
        setError(data.message || 'Invalid credentials. Try again.');
      }
    } catch {
      localStorage.setItem('userRole', panel);
      window.location.href = panel === 'admin' ? '/admin' : '/';
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05080f] flex overflow-hidden">

      {/* ── LEFT: Immersive Panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#050d12] via-[#05080f] to-[#080c18]" />
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{
            background: isClient
              ? 'radial-gradient(ellipse 80% 60% at 30% 40%, rgba(0,230,118,0.08) 0%, transparent 70%)'
              : 'radial-gradient(ellipse 80% 60% at 30% 40%, rgba(0,176,255,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Floating orbs */}
        <div
          className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl transition-all duration-700 opacity-30"
          style={{ background: isClient ? '#00e676' : '#00b0ff' }}
        />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full blur-3xl opacity-10"
          style={{ background: '#9c27b0' }}
        />

        {/* Content */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00e676] to-[#00b0ff] flex items-center justify-center shadow-xl shadow-[#00e676]/30 group-hover:scale-105 transition-transform">
              <Zap size={22} className="text-black fill-black" />
            </div>
            <div>
              <p className="font-black text-2xl text-white leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
                STAKE<span className="text-[#00e676]">ROOM</span>
              </p>
              <p className="text-[10px] text-[#00b0ff] uppercase tracking-[0.25em] font-semibold mt-0.5">
                Live Cricket Betting
              </p>
            </div>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all duration-500"
              style={{ borderColor: `${accent}40`, color: accent, backgroundColor: `${accent}10` }}
            >
              <span className="w-2 h-2 rounded-full live-dot" style={{ backgroundColor: accent }} />
              {isClient ? '🏏 Client Access' : '🛡️ Admin Access'}
            </div>

            <h1 className="text-5xl font-black text-white leading-[1.05]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {isClient ? (
                <>Feel Every<br /><span className="grad-green text-glow-green">Ball. Bet Live.</span></>
              ) : (
                <>Run Your<br /><span className="grad-green text-glow-green">Host Studio.</span></>
              )}
            </h1>
            <p className="text-[#64748b] text-base leading-relaxed max-w-sm">
              {isClient
                ? 'Experience real-time cricket betting with synchronized host commentary, live score updates, and instant settlement.'
                : 'Manage matches, broadcast live audio, set odds, and oversee your entire cricket betting platform.'}
            </p>
          </div>

          {/* Feature pills */}
          <div className="grid grid-cols-2 gap-3">
            {features[panel].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                  <Icon size={15} className={color} />
                </div>
                <span className="text-[13px] font-semibold text-[#94a3b8]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stat bar */}
        <div className="relative z-10 flex items-center gap-8 pt-6 border-t border-white/[0.05]">
          {[
            { val: '< 150ms', label: 'Audio Latency' },
            { val: '24 / 7',  label: 'Live Events'   },
            { val: '100%',    label: 'Secure'         },
          ].map(({ val, label }) => (
            <div key={label}>
              <p className="text-lg font-black text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {val}
              </p>
              <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Login Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-[#05080f] relative">
        {/* Subtle bg gradient */}
        <div className="absolute inset-0 bg-gradient-to-tl from-[#0a0f1a] via-[#05080f] to-[#05080f]" />

        <div className="relative z-10 w-full max-w-[400px] space-y-6">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00e676] to-[#00b0ff] flex items-center justify-center">
                <Zap size={18} className="text-black fill-black" />
              </div>
              <span className="font-black text-xl text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                STAKE<span className="text-[#00e676]">ROOM</span>
              </span>
            </Link>
          </div>

          {/* Panel toggle */}
          <div>
            <p className="text-xs text-[#64748b] font-semibold uppercase tracking-widest mb-3 text-center">
              Choose Access Panel
            </p>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {(['client', 'admin'] as PanelType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPanel(p); setError(''); }}
                  className={`relative flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${
                    panel === p
                      ? 'text-black shadow-lg'
                      : 'text-[#64748b] hover:text-white'
                  }`}
                  style={
                    panel === p
                      ? {
                          background: p === 'client'
                            ? 'linear-gradient(135deg, #00e676, #00c853)'
                            : 'linear-gradient(135deg, #00b0ff, #0288d1)',
                          boxShadow: p === 'client'
                            ? '0 4px 20px rgba(0,230,118,0.3)'
                            : '0 4px 20px rgba(0,176,255,0.3)',
                        }
                      : {}
                  }
                >
                  {p === 'client' ? <Users size={15} /> : <Shield size={15} />}
                  {p === 'client' ? 'Client' : 'Admin'}
                </button>
              ))}
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {isClient ? 'Welcome Back' : 'Admin Login'}
            </h2>
            <p className="text-sm text-[#64748b] mt-1">
              {isClient
                ? 'Sign in to bet on live cricket matches.'
                : 'Access the host studio and management console.'}
            </p>
          </div>

          {/* Demo tip */}
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl text-xs border transition-all duration-500"
            style={{
              background: `${accent}08`,
              borderColor: `${accent}20`,
              color: accent,
            }}
          >
            <Sparkles size={14} className="shrink-0 mt-0.5" />
            <span>
              <strong>Demo mode active —</strong> Click &ldquo;Sign In&rdquo; without credentials to jump straight into the {isClient ? 'client' : 'admin'} panel.
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest block">
                Email Address
              </label>
              <div className="relative group">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] group-focus-within:text-[#00e676] transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white text-sm placeholder-[#334155] focus:outline-none focus:border-[#00e676]/50 focus:bg-white/[0.06] transition-all"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-widest block">
                Password
              </label>
              <div className="relative group">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] group-focus-within:text-[#00e676] transition-colors" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07] text-white text-sm placeholder-[#334155] focus:outline-none focus:border-[#00e676]/50 focus:bg-white/[0.06] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94a3b8] transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-extrabold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
              style={{
                background: isClient
                  ? 'linear-gradient(135deg, #00e676, #00c853)'
                  : 'linear-gradient(135deg, #00b0ff, #0288d1)',
                boxShadow: isClient
                  ? '0 8px 30px rgba(0,230,118,0.25)'
                  : '0 8px 30px rgba(0,176,255,0.25)',
                color: 'black',
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  Enter {isClient ? 'Client' : 'Admin'} Panel
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3 text-xs text-[#475569]">
              <div className="h-px flex-1 bg-white/[0.05]" />
              <span>or</span>
              <div className="h-px flex-1 bg-white/[0.05]" />
            </div>
            <div className="flex flex-col gap-2 text-center text-[13px]">
              <span className="text-[#64748b]">
                No account?{' '}
                <Link href="/register" className="font-bold hover:underline" style={{ color: accent }}>
                  Register for Free
                </Link>
              </span>
              <div className="flex items-center justify-center gap-4 text-xs text-[#475569]">
                <Link href="/" className="hover:text-[#94a3b8] transition-colors flex items-center gap-1">
                  Browse as Guest
                </Link>
                <span className="text-white/10">|</span>
                <Link href="/admin" className="hover:text-[#94a3b8] transition-colors flex items-center gap-1">
                  Admin Direct →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
