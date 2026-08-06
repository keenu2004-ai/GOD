import React, { useState } from 'react';
import { Lock, Mail, Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';
import apiClient from '../services/apiClient.js';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('admin@theiakshi.com');
  const [password, setPassword] = useState<string>('admin123');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { tokens, user } = res.data.data;
        login(tokens.accessToken, tokens.refreshToken, user);
      } else {
        setError(res.data?.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials or server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden">
        {/* Logo Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-xl bg-slate-900 mx-auto flex items-center justify-center text-white font-bold text-2xl shadow-sm border border-slate-800">
            T1
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-wider font-mono">THEIAKSHI ONE</h1>
          <p className="text-xs text-blue-600 font-bold">ENTERPRISE HRMS • THEIAKSHI ENTERPRISES</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg mt-4 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
          <div>
            <label className="text-slate-600 font-semibold">Corporate Email</label>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-mono font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-600 font-semibold">Password</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-mono font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Enterprise HRMS'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-500 font-mono">
          <p>Demo Admin: admin@theiakshi.com / admin123</p>
          <p className="mt-1 text-emerald-700 font-bold">PostgreSQL Engine Active</p>
        </div>
      </div>
    </div>
  );
};
