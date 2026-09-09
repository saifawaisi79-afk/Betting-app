'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Users,
  Radio,
  Trophy,
  TrendingUp,
  Star,
} from 'lucide-react';

type PanelType = 'client' | 'admin';

export default function LoginPage() {
  const [panel, setPanel] = useState<PanelType>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        setError(data.message || 'Login failed. Please verify credentials.');
      }
    } catch {
      // Allow access in demo mode — route directly
      localStorage.setItem('userRole', panel);
      window.location.href = panel === 'admin' ? '/admin' : '/';
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00e676]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00b0ff]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Cricket field pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 40px, #00e676 40px, #00e676 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #00e676 40px, #00e676 41px)',
        }}
      />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 group mb-10 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00e676] to-[#00b0ff] flex items-center justify-center shadow-xl shadow-[#00e676]/30 group-hover:scale-105 transition-all">
          <Zap size={22} className="text-black fill-black" />
        </div>
        <div>
          <span className="font-extrabold text-xl text-white font-['Outfit'] tracking-tight">
            STAKE<span className="text-[#00e676]">ROOM</span>
          </span>
          <span className="hidden sm:block text-[10px] text-[#00b0ff] uppercase tracking-widest font-mono">
            Live Cricket Betting
          </span>
        </div>
      </Link>

      {/* Panel Selector */}
      <div className="w-full max-w-2xl relative z-10 mb-6">
        <p className="text-center text-[#8899aa] text-sm mb-4 font-medium">
          Choose your access panel to continue
        </p>
        <div className="grid grid-cols-2 gap-4">
          {/* Client Panel Card */}
          <button
            onClick={() => { setPanel('client'); setError(''); }}
            className={`group relative rounded-2xl p-5 text-left border-2 transition-all duration-300 overflow-hidden ${
              panel === 'client'
                ? 'border-[#00e676] bg-[#00e676]/10 shadow-xl shadow-[#00e676]/20'
                : 'border-[#1a273e] bg-[#0b101b] hover:border-[#2a3f5f] hover:bg-[#0e1628]'
            }`}
          >
            {panel === 'client' && (
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#00e676]/20 rounded-full blur-2xl" />
            )}
            <div className="relative z-10">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-all ${
                panel === 'client'
                  ? 'bg-gradient-to-br from-[#00e676] to-[#00c853] shadow-lg shadow-[#00e676]/30'
                  : 'bg-[#162238] border border-[#1e2d45]'
              }`}>
                <Users size={20} className={panel === 'client' ? 'text-black' : 'text-[#00e676]'} />
              </div>
              <h3 className={`text-base font-black font-['Outfit'] mb-1 ${panel === 'client' ? 'text-white' : 'text-[#8899aa]'}`}>
                Client Panel
              </h3>
              <p className="text-[11px] text-[#64748b] leading-relaxed">
                Bet on live cricket, watch streams & join commentary rooms
              </p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="flex items-center gap-1 text-[10px] text-[#00e676] font-bold">
                  <TrendingUp size={11} /> Live Odds
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#00b0ff] font-bold">
                  <Radio size={11} /> Audio Rooms
                </span>
                <span className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold">
                  <Trophy size={11} /> My Bets
                </span>
              </div>
            </div>
            {panel === 'client' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#00e676] flex items-center justify-center">
                <Star size={10} className="text-black fill-black" />
              </div>
            )}
          </button>

          {/* Admin Panel Card */}
          <button
            onClick={() => { setPanel('admin'); setError(''); }}
            className={`group relative rounded-2xl p-5 text-left border-2 transition-all duration-300 overflow-hidden ${
              panel === 'admin'
                ? 'border-[#00b0ff] bg-[#00b0ff]/10 shadow-xl shadow-[#00b0ff]/20'
                : 'border-[#1a273e] bg-[#0b101b] hover:border-[#2a3f5f] hover:bg-[#0e1628]'
            }`}
          >
            {panel === 'admin' && (
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#00b0ff]/20 rounded-full blur-2xl" />
            )}
            <div className="relative z-10">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-all ${
                panel === 'admin'
                  ? 'bg-gradient-to-br from-[#00b0ff] to-[#0077ff] shadow-lg shadow-[#00b0ff]/30'
                  : 'bg-[#162238] border border-[#1e2d45]'
              }`}>
                <Shield size={20} className={panel === 'admin' ? 'text-black' : 'text-[#00b0ff]'} />
              </div>
              <h3 className={`text-base font-black font-['Outfit'] mb-1 ${panel === 'admin' ? 'text-white' : 'text-[#8899aa]'}`}>
                Admin Panel
              </h3>
              <p className="text-[11px] text-[#64748b] leading-relaxed">
                Manage matches, host rooms, set odds & oversee platform
              </p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="flex items-center gap-1 text-[10px] text-[#00b0ff] font-bold">
                  <Radio size={11} /> Host Studio
                </span>
                <span className="flex items-center gap-1 text-[10px] text-purple-400 font-bold">
                  <Shield size={11} /> Manage Users
                </span>
                <span className="flex items-center gap-1 text-[10px] text-orange-400 font-bold">
                  <TrendingUp size={11} /> Analytics
                </span>
              </div>
            </div>
            {panel === 'admin' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#00b0ff] flex items-center justify-center">
                <Star size={10} className="text-black fill-black" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-md relative z-10">
        <div className={`rounded-3xl p-8 shadow-2xl border transition-all duration-300 ${
          panel === 'client'
            ? 'bg-[#0b101b] border-[#00e676]/20'
            : 'bg-[#0b101b] border-[#00b0ff]/20'
        }`}>
          {/* Form Header */}
          <div className="text-center mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl ${
              panel === 'client'
                ? 'bg-gradient-to-br from-[#00e676] to-[#00c853] shadow-[#00e676]/20'
                : 'bg-gradient-to-br from-[#00b0ff] to-[#0077ff] shadow-[#00b0ff]/20'
            }`}>
              {panel === 'client'
                ? <Users size={22} className="text-black" />
                : <Shield size={22} className="text-black" />
              }
            </div>
            <h2 className="text-xl font-black text-white font-['Outfit']">
              {panel === 'client' ? 'Client Sign In' : 'Admin Sign In'}
            </h2>
            <p className="text-xs text-[#8899aa] mt-1">
              {panel === 'client'
                ? 'Access your betting wallet and live cricket rooms'
                : 'Access host studio and platform management tools'}
            </p>
          </div>

          {/* Demo Mode Banner */}
          <div className={`mb-5 p-3 rounded-xl border text-xs flex items-center gap-2 ${
            panel === 'client'
              ? 'bg-[#00e676]/5 border-[#00e676]/20 text-[#00e676]'
              : 'bg-[#00b0ff]/5 border-[#00b0ff]/20 text-[#00b0ff]'
          }`}>
            <Zap size={13} className="shrink-0" />
            <span>
              <strong>Demo mode:</strong> Click Sign In without credentials to explore the {panel === 'client' ? 'client' : 'admin'} panel directly.
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#8899aa] uppercase tracking-wider block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-[#8899aa] w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101726] border text-white text-sm focus:outline-none transition-all ${
                    panel === 'client'
                      ? 'border-[#1e2d45] focus:border-[#00e676]'
                      : 'border-[#1e2d45] focus:border-[#00b0ff]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8899aa] uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-[#8899aa] w-4 h-4" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101726] border text-white text-sm focus:outline-none transition-all ${
                    panel === 'client'
                      ? 'border-[#1e2d45] focus:border-[#00e676]'
                      : 'border-[#1e2d45] focus:border-[#00b0ff]'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                panel === 'client'
                  ? 'bg-gradient-to-r from-[#00e676] to-[#00c853] text-black hover:opacity-90 shadow-[#00e676]/20'
                  : 'bg-gradient-to-r from-[#00b0ff] to-[#0077ff] text-black hover:opacity-90 shadow-[#00b0ff]/20'
              }`}
            >
              {loading ? 'Signing in...' : `Enter ${panel === 'client' ? 'Client' : 'Admin'} Panel`}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="pt-5 border-t border-[#1a273e] text-center text-xs text-[#8899aa] mt-5 space-y-2">
            <div>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-[#00e676] font-bold hover:underline">
                Register for Free
              </Link>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Link href="/" className="text-[#64748b] hover:text-[#8899aa] transition-colors">
                → Browse as Guest
              </Link>
              <span className="text-[#1a273e]">|</span>
              <Link href="/admin" className="text-[#64748b] hover:text-[#8899aa] transition-colors">
                → Admin Direct
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
