'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../lib/api';
import { Zap, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', { displayName, email, password });
      if (res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0b101b] border border-[#1a273e] rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00e676] to-[#00b0ff] flex items-center justify-center mx-auto shadow-xl shadow-[#00e676]/20">
            <Zap size={24} className="text-black fill-black" />
          </div>
          <h1 className="text-2xl font-black text-white font-['Outfit']">Create Account</h1>
          <p className="text-xs text-[#8899aa]">
            Get immediate access to live match commentary rooms and demo funds.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#8899aa] uppercase tracking-wider block mb-1.5">
              Display Name / Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 text-[#8899aa] w-4 h-4" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ProBettor99"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101726] border border-[#1e2d45] text-white text-sm focus:border-[#00e676] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8899aa] uppercase tracking-wider block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-[#8899aa] w-4 h-4" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101726] border border-[#1e2d45] text-white text-sm focus:border-[#00e676] focus:outline-none transition-all"
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
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101726] border border-[#1e2d45] text-white text-sm focus:border-[#00e676] focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00e676] to-[#00b0ff] text-black font-extrabold text-sm hover:opacity-95 transition-all shadow-lg shadow-[#00e676]/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Registering Account...' : 'Claim Account & Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        <div className="pt-4 border-t border-[#1a273e] text-center text-xs text-[#8899aa]">
          Already registered?{' '}
          <Link href="/login" className="text-[#00e676] font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
