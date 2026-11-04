import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FirstTimePasswordModalProps {
  username: string;
  fullName: string;
  onSuccess: () => void;
}

export const FirstTimePasswordModal: React.FC<FirstTimePasswordModalProps> = ({
  username,
  fullName,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 4) {
      setError('Şifrə ən azı 4 simvoldan ibarət olmalıdır');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Şifrələr bir-biri ilə uyğun gəlmir');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/first-time-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Şifrə yenilənmədi');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-stone-900 border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Yeni Şifrə Təyin Et</h2>
          <p className="text-xs text-stone-400 mt-2 font-medium">
            Hörmətli <span className="text-amber-400 font-bold">{fullName || username}</span>, təhlükəsizlik qaydalarına əsasən ilk girişdə şəxsi şifrənizi təyin etməlisiniz.
          </p>
          <div className="mt-2 text-[11px] bg-amber-500/10 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-500/20 inline-block">
            🔒 Bu şifrəni yalnız siz biləcəksiniz. Hesabı yaradan şəxs və ya menecer onu görə bilməz.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
              Yeni Şəxsi Şifrə
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yeni şifrənizi daxil edin"
                required
                className="w-full bg-stone-950 border border-stone-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
              Yeni Şifrənin Təkrarı
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Şifrəni yenidən təsdiq edin"
                required
                className="w-full bg-stone-950 border border-stone-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 text-sm uppercase tracking-wider"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Şifrəni Təsdiq Et və Sistemə Keç
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
