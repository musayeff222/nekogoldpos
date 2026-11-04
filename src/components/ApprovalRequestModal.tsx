import React, { useState } from 'react';
import { ShieldAlert, Send, X, AlertTriangle } from 'lucide-react';

interface ApprovalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'return' | 'delete_product' | 'edit_product' | 'other';
  title: string;
  productName?: string;
  productCode?: string;
  productQuantity?: string;
  employeeName: string;
  employeeUsername: string;
  productId?: string;
  payload: any;
  onSubmitted?: () => void;
}

export const ApprovalRequestModal: React.FC<ApprovalRequestModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  productName,
  productCode,
  productQuantity,
  employeeName,
  employeeUsername,
  productId,
  payload,
  onSubmitted
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Zəhmət olmasa əməliyyatın səbəbini mütləq qeyd edin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/approvals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          employee_name: employeeName,
          employee_username: employeeUsername,
          product_id: productId,
          product_name: productName,
          product_code: productCode,
          product_quantity: productQuantity,
          reason: reason.trim(),
          payload
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sorğu göndərilmədi');
      }

      alert('Təsdiq sorğusu uğurla Patrona göndərildi. Patron tərəfindən təsdiq edildikdən sonra əməliyyat icra olunacaq.');
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const getTypeName = () => {
    switch (type) {
      case 'return': return 'Məhsulun Geri Qaytarılması (İadə)';
      case 'delete_product': return 'Məhsulun Bazadan Silinməsi';
      case 'edit_product': return 'Məhsulun Dəyişdirilməsi / Redaktə';
      default: return 'Xüsusi Əməliyyat';
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-stone-900 border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <ShieldAlert size={26} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">{title || 'Patronun Təsdiqi Tələb Olunur'}</h3>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">{getTypeName()}</p>
          </div>
        </div>

        <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 mb-5 space-y-2 text-xs">
          <div className="flex justify-between items-center text-stone-400">
            <span>Sorğu göndərən əməkdaş:</span>
            <span className="font-bold text-white">{employeeName}</span>
          </div>
          {productCode && (
            <div className="flex justify-between items-center text-stone-400">
              <span>Məhsul Kodu:</span>
              <span className="font-mono font-bold text-amber-400">{productCode}</span>
            </div>
          )}
          {productName && (
            <div className="flex justify-between items-center text-stone-400">
              <span>Məhsul Adı:</span>
              <span className="font-bold text-white">{productName}</span>
            </div>
          )}
          {productQuantity && (
            <div className="flex justify-between items-center text-stone-400">
              <span>Miqdar / Çəki:</span>
              <span className="font-bold text-white">{productQuantity}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-stone-400 pt-1 border-t border-stone-800/80">
            <span>Tarix və Saat:</span>
            <span className="text-stone-300 font-mono">{new Date().toLocaleString('az-AZ')}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-2">
              Əməliyyatın Səbəbi <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Zəhmət olmasa bu əməliyyatın niyə aparıldığını ətraflı izah edin (məsələn: Müştəri razı qalmadı, çəki səhv daxil edilmişdi, və s.)..."
              rows={3}
              required
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3.5 text-white placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm resize-none"
            />
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-300 leading-relaxed">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>
              Qaydalara əsasən, bu əməliyyat yalnız <strong>Patron veb-sayt üzərindən "Hə / Təsdiq et"</strong> seçdikdə sistemdə icra ediləcəkdir.
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-3 px-4 rounded-xl transition-colors text-xs uppercase tracking-wider"
            >
              Ləğv Et
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-3 px-4 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={15} />
                  Patrona Sorğu Göndər
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
