import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User, LogIn, AlertCircle, Phone, Crown, Briefcase, Store, Users } from 'lucide-react';
import { AuthUser } from '@/types';

interface LoginProps {
  onLogin: (token: string, user: AuthUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('mudir');
  const [password, setPassword] = useState('mudir123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedStaffUser, setSelectedStaffUser] = useState('malahat');

  const setAccountPreset = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const handleStaffPreset = (u: string) => {
    setSelectedStaffUser(u);
    setAccountPreset(u, `${u}123`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.token, {
          username: data.username,
          fullName: data.fullName || data.username,
          role: data.role || 'staff',
          mustChangePassword: Boolean(data.mustChangePassword)
        });
      } else {
        setError(data.error || 'Giriş uğursuz oldu');
      }
    } catch (err) {
      setError('Server ilə əlaqə kəsildi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-1.5 tracking-tighter">NEKO GOLD</h1>
          <p className="text-amber-500 uppercase text-xs font-black tracking-[0.25em]">Zərgərlik İdarəetmə Sistemi</p>
        </div>

        {/* Quick Account Selector Buttons: MÜDÜR, MAĞAZA, İŞÇİLƏR */}
        <div className="mb-4 bg-zinc-900/80 border border-white/10 rounded-2xl p-2 grid grid-cols-3 gap-2 text-center">
          <button
            type="button"
            onClick={() => setAccountPreset('mudir', 'mudir123')}
            className={`py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${
              username === 'mudir' || username === 'patron'
                ? 'bg-amber-500 text-stone-950 shadow-lg font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Crown size={18} />
            <span>MÜDÜR</span>
            <span className="text-[9px] font-bold opacity-80 lowercase">Etibar Nuriyev</span>
          </button>

          <button
            type="button"
            onClick={() => setAccountPreset('magaza', 'magaza123')}
            className={`py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${
              username === 'magaza' || username === 'admin'
                ? 'bg-emerald-600 text-white shadow-lg font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Store size={18} />
            <span>MAĞAZA</span>
            <span className="text-[9px] font-bold opacity-80 lowercase">Kassa & Satış</span>
          </button>

          <button
            type="button"
            onClick={() => handleStaffPreset(selectedStaffUser || 'malahat')}
            className={`py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${
              username === 'malahat' || username === 'huseyn' || username === 'nisane' || (username !== 'mudir' && username !== 'patron' && username !== 'magaza' && username !== 'admin')
                ? 'bg-rose-600 text-white shadow-lg font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={18} />
            <span>İŞÇİLƏR</span>
            <span className="text-[9px] font-bold opacity-80 lowercase">Personal</span>
          </button>
        </div>

        {/* Staff Quick Pills when Staff is selected or active */}
        {(username === 'malahat' || username === 'huseyn' || username === 'nisane') && (
          <div className="mb-4 bg-zinc-900/60 border border-white/5 rounded-xl p-2 flex items-center justify-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">İşçi Seç:</span>
            {[
              { id: 'malahat', label: 'Məlahət' },
              { id: 'huseyn', label: 'Hüseyn' },
              { id: 'nisane', label: 'Nisanə' }
            ].map(staff => (
              <button
                key={staff.id}
                type="button"
                onClick={() => handleStaffPreset(staff.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  username === staff.id
                    ? 'bg-rose-500 text-white shadow'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                {staff.label}
              </button>
            ))}
          </div>
        )}

        <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Hesab Girişi (İstifadəçi Adı)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm font-medium"
                  placeholder="mudir / magaza / malahat / huseyn / nisane"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Şifrə
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm font-medium"
                  placeholder="••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-wider mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sistemə Daxil Ol
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center space-y-1.5">
            <p className="text-[11px] text-zinc-400 font-medium">
              Proqramı hazırladı: <span className="text-white font-bold">Ələsgər Musazadə</span>
            </p>
            <a 
              href="tel:0504243892" 
              className="inline-flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-semibold"
            >
              <Phone className="w-3 h-3" />
              <span>Əlaqə: 0504243892</span>
            </a>
          </div>
        </div>

        <p className="text-center mt-5 text-zinc-600 text-[11px]">
          &copy; 2026 NEKO GOLD. Bütün hüquqlar qorunur.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
