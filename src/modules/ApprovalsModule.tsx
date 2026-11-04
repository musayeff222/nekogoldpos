import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  Tags, 
  RotateCcw as ReturnIcon,
  Clock, 
  Check, 
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Maximize2
} from 'lucide-react';
import { Page, ApprovalRequest, AuthUser } from '../types';

interface ApprovalsModuleProps {
  setCurrentPage: (page: Page) => void;
  pendingApprovals: ApprovalRequest[];
  onRefreshApprovals: () => void;
  user?: AuthUser | null;
}

export const ApprovalsModule: React.FC<ApprovalsModuleProps> = ({
  setCurrentPage,
  pendingApprovals,
  onRefreshApprovals,
  user
}) => {
  const [approvalsList, setApprovalsList] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'delete_product' | 'edit_product' | 'change_group' | 'return'>('all');
  const [decisionLoading, setDecisionLoading] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<ApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // TƏK EKRAN MODU: Seçilmiş bildiriş kartı ID-si
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/approvals');
      if (res.ok) {
        const data = await res.json();
        setApprovalsList(data);
      }
    } catch (e) {
      console.error('Failed to load approvals:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleDecision = async (id: string, decision: 'approved' | 'rejected', reason: string = '') => {
    setDecisionLoading(id);
    try {
      const res = await fetch(`/api/approvals/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          decidedBy: user?.fullName || user?.username || 'Müdir',
          rejectionReason: reason
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Xəta baş verdi');
      }

      setRejectionModal(null);
      setRejectionReason('');
      await fetchApprovals();
      onRefreshApprovals();
    } catch (err: any) {
      alert(`Xəta: ${err.message}`);
    } finally {
      setDecisionLoading(null);
    }
  };

  const pendingCount = approvalsList.filter(a => a.status === 'pending').length;
  const approvedCount = approvalsList.filter(a => a.status === 'approved').length;
  const rejectedCount = approvalsList.filter(a => a.status === 'rejected').length;

  const filteredApprovals = approvalsList.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    return true;
  });

  // Tək ekran modunda aktiv olan kart
  const currentApproval = selectedApprovalId 
    ? (approvalsList.find(a => a.id === selectedApprovalId) || null)
    : null;

  const currentIndex = currentApproval 
    ? filteredApprovals.findIndex(a => a.id === currentApproval.id)
    : -1;

  // =========================================================================
  // 1. TƏK EKRAN MODU (HƏR BİR KART ÜÇÜN FULL EKRAN REJİMİ)
  // =========================================================================
  if (currentApproval) {
    const isPending = currentApproval.status === 'pending';
    const isApproved = currentApproval.status === 'approved';
    const isRejected = currentApproval.status === 'rejected';

    let payload: any = {};
    try {
      payload = typeof currentApproval.payload === 'string' ? JSON.parse(currentApproval.payload) : (currentApproval.payload || {});
    } catch (e) {}

    let questionText = '';
    let typeLabel = '';
    let TypeIcon = Edit3;

    if (currentApproval.type === 'delete_product') {
      typeLabel = 'Məhsul Silinməsi';
      TypeIcon = Trash2;
      questionText = `${currentApproval.employee_name} bu məhsulu bazadan silmək istəyir. İcazə verirsiniz?`;
    } else if (currentApproval.type === 'edit_product') {
      typeLabel = 'Məhsul Dəyişikliyi';
      TypeIcon = Edit3;
      questionText = `${currentApproval.employee_name} bu məhsula dəyişiklik etmək istəyir. İcazə verirsiniz?`;
    } else if (currentApproval.type === 'change_group') {
      typeLabel = 'Qrup Dəyişimi';
      TypeIcon = Tags;
      questionText = `${currentApproval.employee_name} məhsulun qrupunu dəyişmək istəyir. İcazə verirsiniz?`;
    } else if (currentApproval.type === 'return') {
      typeLabel = 'Vazvirat (Qaytarma)';
      TypeIcon = ReturnIcon;
      questionText = `${currentApproval.employee_name} bu məhsul üçün geri qaytarma (vazvirat) edir. İcazə verirsiniz?`;
    } else {
      typeLabel = 'Əməliyyat Sorğusu';
      questionText = `${currentApproval.employee_name} bu əməliyyat üçün icazə istəyir. İcazə verirsiniz?`;
    }

    return (
      <div className="px-3 py-3 sm:px-6 md:px-8 space-y-4 max-w-4xl mx-auto bg-white min-h-[calc(100vh-4.5rem)] sm:rounded-3xl sm:border sm:border-stone-200 shadow-xs text-stone-900 animate-in fade-in duration-150">
        
        {/* TƏK EKRAN BAŞLIĞI: GERİ QAYITMA VƏ NAVİQASİYA */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200">
          <button
            type="button"
            onClick={() => setSelectedApprovalId(null)}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 border border-stone-200 cursor-pointer shadow-2xs shrink-0"
          >
            <ArrowLeft size={15} />
            <span>Siyahıya Qayıt</span>
          </button>

          {/* ƏVVƏLKİ / NÖVBƏTİ KART KEÇİDİ */}
          {filteredApprovals.length > 1 && currentIndex !== -1 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={currentIndex <= 0}
                onClick={() => setSelectedApprovalId(filteredApprovals[currentIndex - 1].id)}
                className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                  currentIndex > 0
                    ? 'bg-stone-100 hover:bg-stone-200 text-stone-900 border-stone-200 cursor-pointer'
                    : 'bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed'
                }`}
                title="Əvvəlki bildiriş"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Əvvəlki</span>
              </button>

              <span className="text-xs font-mono font-bold text-stone-600 bg-stone-100 px-2 py-1 rounded-lg border border-stone-200">
                {currentIndex + 1} / {filteredApprovals.length}
              </span>

              <button
                type="button"
                disabled={currentIndex >= filteredApprovals.length - 1}
                onClick={() => setSelectedApprovalId(filteredApprovals[currentIndex + 1].id)}
                className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                  currentIndex < filteredApprovals.length - 1
                    ? 'bg-stone-100 hover:bg-stone-200 text-stone-900 border-stone-200 cursor-pointer'
                    : 'bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed'
                }`}
                title="Növbəti bildiriş"
              >
                <span className="hidden sm:inline">Növbəti</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* TƏK EKRAN KARTI DETALLARI */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-200 shadow-sm space-y-4">
          
          {/* NÖV + STATUS + TARİX */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-stone-900 text-white text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-2xs">
                <TypeIcon size={14} className="text-stone-300" />
                {typeLabel}
              </span>

              <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${
                isPending
                  ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                  : isApproved
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}>
                {isPending ? '⏳ Qərar Gözləyir' : isApproved ? '✅ Təsdiqlənib' : '❌ İmtina Edilib'}
              </span>
            </div>

            <span className="text-xs text-stone-500 font-mono font-bold">
              {new Date(currentApproval.created_at).toLocaleDateString('az-AZ')} {new Date(currentApproval.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* ƏSAS TƏSDİQ SUALI (İRİ VƏ AYDIN) */}
          <div className="py-2">
            <h2 className="text-base sm:text-xl font-black text-stone-950 flex items-center gap-2.5 leading-snug">
              {isPending && <span className="w-2.5 h-2.5 rounded-full bg-stone-900 shrink-0" />}
              <span>{questionText}</span>
            </h2>
          </div>

          {/* MƏLUMAT CƏDVƏLİ / BLOKU */}
          <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3.5 text-xs sm:text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-0.5">
                  Məhsul Adı:
                </span>
                <span className="font-bold text-stone-950 text-sm">
                  {currentApproval.product_name || '-'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-0.5">
                  Barkod / Kod:
                </span>
                <span className="font-mono font-black text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs">
                  {currentApproval.product_code || '-'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-0.5">
                  Çəki / Dəyişiklik:
                </span>
                <span className="font-bold text-stone-900">
                  {currentApproval.product_quantity || '-'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-0.5">
                  Sorğunu Göndərən:
                </span>
                <span className="font-bold text-stone-950">
                  {currentApproval.employee_name} <span className="text-stone-400 text-xs">(@{currentApproval.employee_username})</span>
                </span>
              </div>
            </div>

            {/* QRUP VƏ YA DƏYİŞİKLİK DETALLARI */}
            {payload?.oldGroup && payload?.newGroup && (
              <div className="pt-3 border-t border-stone-200/80 flex items-center gap-2">
                <span className="text-xs font-bold text-stone-500">Qrup dəyişimi:</span>
                <span className="bg-stone-200 text-stone-800 px-2.5 py-0.5 rounded-lg text-xs font-bold">{payload.oldGroup}</span>
                <span className="text-stone-400">➔</span>
                <span className="bg-stone-900 text-white px-2.5 py-0.5 rounded-lg text-xs font-bold">{payload.newGroup}</span>
              </div>
            )}

            {/* PERSONALIN QEYD ETDİYİ SƏBƏB */}
            <div className="pt-3 border-t border-stone-200/80">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-1">
                Personalın qeyd etdiyi səbəb:
              </span>
              <p className="bg-white p-3 rounded-xl border border-stone-200 text-stone-900 italic font-medium text-xs sm:text-sm">
                «{currentApproval.reason}»
              </p>
            </div>
          </div>

          {/* VERİLMİŞ QƏRAR STATUSU */}
          {isApproved && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs sm:text-sm text-emerald-950">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>Bu əməliyyata Müdir tərəfindən icazə verilmiş və bazada tətbiq edilmişdir.</span>
              </div>
              {currentApproval.decided_at && (
                <span className="text-xs text-stone-500 font-mono shrink-0">
                  {new Date(currentApproval.decided_at).toLocaleString('az-AZ')}
                </span>
              )}
            </div>
          )}

          {isRejected && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs sm:text-sm text-rose-950">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <XCircle size={18} className="text-rose-600 shrink-0" />
                <span>Bu əməliyyat Müdir tərəfindən rədd edilmişdir.</span>
              </div>
              {currentApproval.rejection_reason && (
                <p className="text-xs text-rose-700 pl-6">
                  İmtina səbəbi: <strong>{currentApproval.rejection_reason}</strong>
                </p>
              )}
            </div>
          )}

          {/* QƏRAR DÜYMƏLƏRİ (TƏK EKRANDA İRİ VƏ RAHAT) */}
          {isPending && (
            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={decisionLoading === currentApproval.id}
                onClick={() => setRejectionModal(currentApproval)}
                className="px-6 py-3 bg-white hover:bg-rose-50 border border-stone-300 hover:border-rose-300 text-stone-700 hover:text-rose-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-2xs"
              >
                <X size={16} />
                <span>İmtina Et (Xeyr)</span>
              </button>

              <button
                type="button"
                disabled={decisionLoading === currentApproval.id}
                onClick={() => handleDecision(currentApproval.id, 'approved')}
                className="px-8 py-3 bg-stone-900 hover:bg-black text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Check size={18} />
                <span>{decisionLoading === currentApproval.id ? 'İcra edilir...' : 'İcazə Ver (Bəli)'}</span>
              </button>
            </div>
          )}
        </div>

        {/* İMTİNA MODALI */}
        {rejectionModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-stone-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h3 className="text-sm font-black text-stone-900">
                  Sorğuya İmtina Et
                </h3>
                <button
                  type="button"
                  onClick={() => setRejectionModal(null)}
                  className="w-7 h-7 rounded-lg bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-stone-600">
                <strong>{rejectionModal.employee_name}</strong> tərəfindən göndərilmiş{' '}
                <strong>{rejectionModal.product_name || rejectionModal.product_code || 'məhsul'}</strong> əməliyyatına imtina edirsiniz.
              </p>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  İmtina səbəbi (istəyə bağlı):
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Məsələn: Bu məhsulun silinməsi qaydalara uyğun deyil..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-900 bg-stone-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectionModal(null)}
                  className="px-3.5 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Geri
                </button>
                <button
                  type="button"
                  disabled={decisionLoading === rejectionModal.id}
                  onClick={() => handleDecision(rejectionModal.id, 'rejected', rejectionReason)}
                  className="px-4 py-2 text-xs font-bold bg-stone-900 hover:bg-black text-white rounded-xl shadow-xs"
                >
                  {decisionLoading === rejectionModal.id ? 'İmtina edilir...' : 'İmtinanı Təsdiqlə'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. BÜTÜN BİLDİRİŞLƏR SİYAHISI (SİYAHIDAN İSTƏNİLƏN KARTA VURDUQDA TƏK EKRAN MODUNDA AÇILIR)
  // =========================================================================
  return (
    <div className="px-3 py-3 sm:px-6 md:px-8 space-y-4 max-w-6xl mx-auto bg-white min-h-[calc(100vh-4.5rem)] sm:rounded-3xl sm:border sm:border-stone-200 shadow-xs text-stone-900 animate-in fade-in duration-150">
      
      {/* BAŞLIQ: TƏMİZ AĞ-QARA CRM ÜSLUBU */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
            <Bell size={18} className={pendingCount > 0 ? "animate-bounce" : ""} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-stone-950">
                Bildirişlər
              </h1>
              {pendingCount > 0 && (
                <span className="bg-stone-900 text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                  {pendingCount} gözləyən
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(Page.PatronDashboard)}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 border border-stone-200/80 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Müdir Paneli</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fetchApprovals();
              onRefreshApprovals();
            }}
            disabled={loading}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer"
          >
            <RotateCcw size={13} className={loading ? "animate-spin" : ""} />
            <span className="hidden xs:inline">Yenilə</span>
          </button>
        </div>
      </div>

      {/* STATUS FİLTRİ (GÖZLƏYƏNLƏR / TƏSDİQLƏNMİŞ / İMTİNA EDİLMİŞ / HAMISI) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-2.5 rounded-xl text-left border transition-all text-xs font-bold flex items-center justify-between cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
              : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Clock size={14} className={statusFilter === 'pending' ? 'text-amber-400' : 'text-stone-400'} />
            <span>Gözləyən</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            statusFilter === 'pending'
              ? 'bg-white/20 text-white'
              : pendingCount > 0
              ? 'bg-rose-100 text-rose-700'
              : 'bg-stone-100 text-stone-600'
          }`}>
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('approved')}
          className={`px-3 py-2.5 rounded-xl text-left border transition-all text-xs font-bold flex items-center justify-between cursor-pointer ${
            statusFilter === 'approved'
              ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
              : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className={statusFilter === 'approved' ? 'text-emerald-400' : 'text-stone-400'} />
            <span>Təsdiqlənmiş</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            statusFilter === 'approved' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
          }`}>
            {approvedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('rejected')}
          className={`px-3 py-2.5 rounded-xl text-left border transition-all text-xs font-bold flex items-center justify-between cursor-pointer ${
            statusFilter === 'rejected'
              ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
              : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-700'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <XCircle size={14} className={statusFilter === 'rejected' ? 'text-rose-400' : 'text-stone-400'} />
            <span>İmtina Edilmiş</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            statusFilter === 'rejected' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
          }`}>
            {rejectedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-2.5 rounded-xl text-left border transition-all text-xs font-bold flex items-center justify-between cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
              : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-700'
          }`}
        >
          <span>Hamısı</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
          }`}>
            {approvalsList.length}
          </span>
        </button>
      </div>

      {/* ƏMƏLİYYAT NÖVÜ SEÇİMİ */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 border-b border-stone-100">
        {[
          { id: 'all', label: 'Bütün Növlər' },
          { id: 'edit_product', label: 'Məhsul Dəyişikliyi' },
          { id: 'delete_product', label: 'Məhsul Silinməsi' },
          { id: 'change_group', label: 'Qrup Dəyişimi' },
          { id: 'return', label: 'Vazvirat (Qaytarma)' },
        ].map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTypeFilter(item.id as any)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              typeFilter === item.id
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* SORĞULAR SİYAHISI (HƏR BİR KARTA VURDUQDA TƏK EKRAN MODUNDA AÇILIR) */}
      <div className="space-y-2.5 pt-1">
        {filteredApprovals.length === 0 ? (
          <div className="bg-stone-50 rounded-2xl p-10 text-center border border-stone-200">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2.5 text-stone-400 border border-stone-200 shadow-2xs">
              <CheckCircle2 size={20} className="text-stone-400" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-stone-700">
              {statusFilter === 'pending'
                ? 'Hazırda təsdiq gözləyən heç bir sorğu yoxdur'
                : 'Bu filtr üzrə heç bir qeyd tapılmadı'}
            </p>
          </div>
        ) : (
          filteredApprovals.map(item => {
            const isPending = item.status === 'pending';
            const isApproved = item.status === 'approved';
            const isRejected = item.status === 'rejected';

            let typeLabel = '';
            let TypeIcon = Edit3;

            if (item.type === 'delete_product') {
              typeLabel = 'Məhsul Silinməsi';
              TypeIcon = Trash2;
            } else if (item.type === 'edit_product') {
              typeLabel = 'Məhsul Dəyişikliyi';
              TypeIcon = Edit3;
            } else if (item.type === 'change_group') {
              typeLabel = 'Qrup Dəyişimi';
              TypeIcon = Tags;
            } else if (item.type === 'return') {
              typeLabel = 'Vazvirat (Qaytarma)';
              TypeIcon = ReturnIcon;
            } else {
              typeLabel = 'Əməliyyat Sorğusu';
            }

            return (
              <div
                key={item.id}
                onClick={() => setSelectedApprovalId(item.id)}
                className={`bg-white rounded-2xl p-4 border-2 transition-all cursor-pointer group shadow-xs hover:shadow-md hover:border-stone-900 ${
                  isPending
                    ? 'border-stone-900/80 bg-stone-50/20'
                    : 'border-stone-200/90 hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 group-hover:bg-stone-900 group-hover:text-white transition-colors flex items-center justify-center shrink-0 shadow-2xs">
                      <TypeIcon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-black text-stone-950 truncate">
                          {item.product_name || item.product_code || 'Məhsul'}
                        </span>
                        {item.product_code && (
                          <span className="font-mono font-black text-xs text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs shrink-0">
                            {item.product_code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 font-medium truncate mt-0.5">
                        <strong className="text-stone-900 font-bold">{item.employee_name}</strong> • {typeLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border ${
                      isPending
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : isApproved
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-rose-50 text-rose-900 border-rose-300'
                    }`}>
                      {isPending ? '⏳ Gözləyir' : isApproved ? '✅ Təsdiqlənib' : '❌ İmtina'}
                    </span>

                    <span className="px-3 py-1.5 bg-stone-900 group-hover:bg-black text-white text-xs font-black rounded-xl flex items-center gap-1 transition-all shadow-2xs">
                      <span>Bax</span>
                      <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* İMTİNA MODALI */}
      {rejectionModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-stone-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-sm font-black text-stone-900">
                Sorğuya İmtina Et
              </h3>
              <button
                type="button"
                onClick={() => setRejectionModal(null)}
                className="w-7 h-7 rounded-lg bg-stone-100 text-stone-500 hover:text-stone-900 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              <strong>{rejectionModal.employee_name}</strong> tərəfindən göndərilmiş{' '}
              <strong>{rejectionModal.product_name || rejectionModal.product_code || 'məhsul'}</strong> əməliyyatına imtina edirsiniz.
            </p>

            <div>
              <label className="text-[11px] font-bold text-stone-700 block mb-1">
                İmtina səbəbi (istəyə bağlı):
              </label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Məsələn: Bu məhsulun silinməsi qaydalara uyğun deyil..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-stone-900 bg-stone-50"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModal(null)}
                className="px-3.5 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Geri
              </button>
              <button
                type="button"
                disabled={decisionLoading === rejectionModal.id}
                onClick={() => handleDecision(rejectionModal.id, 'rejected', rejectionReason)}
                className="px-4 py-2 text-xs font-bold bg-stone-900 hover:bg-black text-white rounded-xl shadow-xs"
              >
                {decisionLoading === rejectionModal.id ? 'İmtina edilir...' : 'İmtinanı Təsdiqlə'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
