import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Users, 
  Store, 
  FileText, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  KeyRound, 
  Trash2, 
  Printer, 
  ArrowRight,
  TrendingUp,
  Package,
  Calendar,
  X,
  Search,
  AlertTriangle
} from 'lucide-react';
import { UserAccount, ApprovalRequest, Sale, Product, Page, Customer, Expense } from '@/types';

interface ManagerDashboardProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  expenses: Expense[];
  setCurrentPage: (page: Page) => void;
  pendingApprovals: ApprovalRequest[];
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  sales,
  products,
  customers,
  expenses,
  setCurrentPage,
  pendingApprovals
}) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<UserAccount | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newInitialPassword, setNewInitialPassword] = useState('');
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedStaffReport, setSelectedStaffReport] = useState<UserAccount | null>(null);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Modal and toast states
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setActionFeedback({ message, type });
    setTimeout(() => {
      setActionFeedback(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const managerName = 'Etibar Nuriyev';

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  };

  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/approvals');
      if (res.ok) {
        const data = await res.json();
        setApprovals(data);
      }
    } catch (e) {
      console.error('Failed to load approvals:', e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchApprovals();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          fullName: newFullName.trim(),
          initialPassword: newInitialPassword,
          role: 'staff',
          createdBy: managerName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'İstifadəçi yaradıla bilmədi');
      }

      showNotification(`Personal hesabı uğurla yaradıldı: ${data.user.full_name} (@${data.user.username})`, 'success');
      setShowCreateModal(false);
      setNewUsername('');
      setNewFullName('');
      setNewInitialPassword('');
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.message || 'Xəta baş verdi');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (!resetPasswordInput || resetPasswordInput.length < 4) {
      showNotification('İlkin şifrə ən az 4 simvol olmalıdır', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newInitialPassword: resetPasswordInput })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Şifrə sıfırlanmadı');
      showNotification('İlkin şifrə təyin edildi. Əməkdaş daxil olarkən yenidən yeni şəxsi şifrə təyin etməli olacaq.', 'success');
      setShowResetModal(null);
      setResetPasswordInput('');
      fetchUsers();
    } catch (err: any) {
      showNotification(err.message || 'Xəta baş verdi', 'error');
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'İstifadəçi hesabı silinmədi');
      showNotification(`"${userToDelete.full_name || userToDelete.username}" (@${userToDelete.username}) adlı hesab silindi.`, 'success');
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      setDeleteError(err.message || 'Silinərkən xəta baş verdi');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Staff members under this manager
  const staffList = users.filter(u => u.role === 'staff');

  // Today calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => new Date(s.date).toISOString().split('T')[0] === todayStr && s.status !== 'returned');
  const todayRevenue = todaySales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* MANAGER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-1.5">
              <span>Menecer İdarəetmə Paneli</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              Menecer: {managerName}
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl font-medium">
              Personal heyətinin idarə edilməsi, yeni hesabların açılması, satış və mal əlavələrinə nəzarət.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider px-6 py-4 rounded-2xl shadow-xl shadow-indigo-900/30 flex items-center justify-center gap-2.5 transition-all active:scale-95 shrink-0"
          >
            <UserPlus size={18} />
            <span>Yeni Personal Hesabı Yarat</span>
          </button>
        </div>

        {/* Manager Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Təhkim Olunmuş Personal</span>
            <p className="text-xl font-black text-indigo-400 mt-0.5">{staffList.length} əməkdaş</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Bugünkü Mağaza Satışı</span>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{todayRevenue.toLocaleString()} ₼</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Bugünkü Satış Sayı</span>
            <p className="text-xl font-black text-amber-400 mt-0.5">{todaySales.length} ədəd</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Patronun Təsdiqini Gözləyən</span>
            <p className="text-xl font-black text-rose-400 mt-0.5">
              {approvals.filter(a => a.status === 'pending').length} əməliyyat
            </p>
          </div>
        </div>
      </div>

      {/* STAFF LIST TABLE & MANAGEMENT */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-stone-900 uppercase tracking-tight flex items-center gap-2.5">
              <Users className="text-indigo-600" />
              <span>Personal Heyəti və Hesablar</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5 font-medium">
              Menecer Etibar Nuriyev tərəfindən idarə olunan personal hesabları
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <UserPlus size={16} />
            <span>Əməkdaş Əlavə Et</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-400 uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="py-3 px-4">Ad, Soyad</th>
                <th className="py-3 px-4">Login (İstifadəçi adı)</th>
                <th className="py-3 px-4">Vəzifə</th>
                <th className="py-3 px-4">Şifrə Statusu</th>
                <th className="py-3 px-4">Yaradan</th>
                <th className="py-3 px-4 text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
              {staffList.map(staff => (
                <tr key={staff.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-stone-900">{staff.full_name || staff.username}</td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">@{staff.username}</td>
                  <td className="py-3 px-4">
                    <span className="bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                      Personal
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {staff.must_change_password ? (
                      <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                        İlk şifrə dəyişimi gözləyir
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                        Şəxsi şifrə aktivdir (Gizli)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-stone-500">{staff.created_by || managerName}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedStaffReport(staff)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        Fəaliyyətə Bax
                      </button>
                      <button
                        onClick={() => setShowResetModal(staff)}
                        title="İlkin şifrəni sıfırla"
                        className="bg-stone-100 hover:bg-stone-200 text-stone-700 p-1.5 rounded-lg transition-colors"
                      >
                        <KeyRound size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setUserToDelete(staff); setDeleteError(null); }}
                        title="Hesabı sil"
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* OPERATIONS AWAITING PATRON APPROVAL OVERSIGHT */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
              <ShieldAlert className="text-amber-500" />
              <span>Patronun Təsdiqini Tələb Edən Əməliyyatların İzlənməsi</span>
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              Menecer olaraq mağazada və personal hesablarında göndərilmiş təsdiq sorğularının vəziyyətini izləyin.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-400 uppercase text-[10px] font-black">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Əməliyyat Növü</th>
                <th className="py-3 px-4">Əməkdaş</th>
                <th className="py-3 px-4">Məhsul</th>
                <th className="py-3 px-4">Səbəb</th>
                <th className="py-3 px-4">Tarix və Saat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
              {approvals.slice(0, 10).map(a => (
                <tr key={a.id} className="hover:bg-stone-50 transition-colors">
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      a.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : a.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-200 text-stone-600'
                    }`}>
                      {a.status === 'pending' ? 'Gözləmədə' : a.status === 'approved' ? 'Təsdiqləndi' : 'İmtina Edildi'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-stone-900">
                    {a.type === 'return' ? 'Geri Qaytarma' : a.type === 'delete_product' ? 'Məhsul Silinməsi' : 'Redaktə'}
                  </td>
                  <td className="py-3 px-4 font-bold">{a.employee_name}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-stone-900">{a.product_name || 'Məhsul'}</span>
                      {a.product_code && (
                        <span className="font-mono font-black text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                          {a.product_code}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-stone-500 max-w-xs truncate">{a.reason}</td>
                  <td className="py-3 px-4 font-mono text-stone-500">
                    {new Date(a.created_at).toLocaleString('az-AZ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: YENİ PERSONAL HESABI YARAT */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-stone-900 border border-indigo-500/30 rounded-3xl p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-black text-white mb-1">Yeni Personal Hesabı</h3>
            <p className="text-xs text-indigo-400 font-bold mb-5">
              İdarə edən menecer: {managerName}
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                  Əməkdaşın Adı və Soyadı <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Məsələn: Məlahət Əliyeva"
                  required
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                  Login (İstifadəçi adı) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().trim())}
                  placeholder="Məsələn: malahat"
                  required
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                  İlkin Keçid Şifrəsi <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newInitialPassword}
                  onChange={(e) => setNewInitialPassword(e.target.value)}
                  placeholder="Məsələn: malahat123"
                  required
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="bg-indigo-950/60 border border-indigo-800/40 rounded-xl p-3 text-[11px] text-indigo-300 leading-relaxed">
                ℹ️ <strong>Təhlükəsizlik qaydası:</strong> Əməkdaş bu ilkin şifrə ilə sistemə ilk dəfə daxil olduqda ekranda <strong>"Yeni şifrə təyin et"</strong> pəncərəsi açılacaq və o özünə şəxsi şifrə təyin edəcək. Siz (menecer) onun yeni təyin etdiyi şəxsi şifrəsini görə bilməyəcəksiniz.
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                  {createError}
                </div>
              )}

              <button
                type="submit"
                disabled={createLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-xl transition-all shadow-lg text-xs uppercase tracking-wider disabled:opacity-50 mt-2"
              >
                {createLoading ? 'Yaradılır...' : 'Hesabı Yarat və İlkin Şifrə Təyin Et'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET INITIAL PASSWORD */}
      {showResetModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-6 text-white shadow-2xl">
            <h3 className="text-base font-black text-white mb-2">
              İlkin Şifrəni Sıfırla — {showResetModal.full_name || showResetModal.username}
            </h3>
            <p className="text-xs text-stone-400 mb-4">
              Əməkdaş üçün müvəqqəti ilkin şifrə təyin edin. Giriş etdikdə dərhal yeni şifrə təyin etməsi tələb olunacaq.
            </p>
            <input
              type="text"
              value={resetPasswordInput}
              onChange={(e) => setResetPasswordInput(e.target.value)}
              placeholder="Yeni müvəqqəti şifrə"
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-white mb-4 focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResetModal(null)}
                className="flex-1 bg-stone-800 py-2.5 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Ləğv Et
              </button>
              <button
                type="button"
                onClick={() => handleResetPassword(showResetModal.id)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl text-xs font-black uppercase cursor-pointer"
              >
                Təyin Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PERSONAL HESABINI SİLMƏK */}
      {userToDelete && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-6 text-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
              <Trash2 size={22} />
            </div>
            <h3 className="text-base font-black text-center text-white">
              Personal Hesabını Sil
            </h3>
            <p className="text-xs text-stone-400 text-center mt-2 leading-relaxed">
              <span className="font-bold text-white font-mono">@{userToDelete.username}</span> ({userToDelete.full_name || 'Personal'}) adlı əməkdaşın hesabını silmək istədiyinizdən əminsiniz?
            </p>

            {deleteError && (
              <div className="mt-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold p-2.5 rounded-xl text-center">
                {deleteError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => { setUserToDelete(null); setDeleteError(null); }}
                className="py-2.5 px-4 rounded-xl border border-stone-800 text-xs font-bold text-stone-300 hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Ləğv Et
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={confirmDeleteUser}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? (
                  <span>Silinir...</span>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Bəli, Sil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION NOTIFICATION TOAST */}
      {actionFeedback && (
        <div className={`fixed bottom-5 right-5 z-[200] max-w-md px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-2 duration-200 ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-950/40'
            : 'bg-rose-600 text-white border-rose-500 shadow-rose-950/40'
        }`}>
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 size={16} className="text-white shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-white shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}
    </div>
  );
};
