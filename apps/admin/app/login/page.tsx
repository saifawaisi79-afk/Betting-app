'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { Zap, ShieldCheck, Lock, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0e17]">
      <div className="w-full max-w-md bg-[#0f1622] border border-[#1e2d45] rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00e676] to-[#00c853] flex items-center justify-center mx-auto shadow-lg shadow-[#00e676]/20">
            <Zap size={24} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white font-['Outfit']">Admin Portal</h1>
          <p className="text-xs text-[#8899aa]">
            Restricted access. Sign in with administrative privileges.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#8899aa] uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-[#8899aa] w-4 h-4" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@platform.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#162032] border border-[#1e2d45] text-white text-sm focus:border-[#00e676] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8899aa] uppercase tracking-wider block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-[#8899aa] w-4 h-4" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#162032] border border-[#1e2d45] text-white text-sm focus:border-[#00e676] focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#00e676] text-black font-bold text-sm hover:bg-[#00c853] transition-all shadow-lg shadow-[#00e676]/20 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Console'}
          </button>
        </form>

        <div className="pt-4 border-t border-[#1e2d45] flex items-center justify-center gap-2 text-xs text-[#8899aa]">
          <ShieldCheck size={14} className="text-[#00e676]" />
          Protected with Argon2id + 2FA TOTP enforcement
        </div>
      </div>
    </div>
  );
}
