import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Store, 
  ShoppingBag, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  X,
  PlusCircle,
  Eye,
  Check,
  Scale,
  DollarSign,
  ChevronRight,
  Filter,
  Trash2,
  KeyRound,
  Crown,
  Search,
  Bell,
  RotateCcw,
  ArrowLeft,
  Wallet,
  Flame,
  Image as ImageIcon,
  ZoomIn,
  History,
  Activity,
  FileText,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import { Product, Sale, UserAccount, ApprovalRequest, Page, SystemLog, AuthUser } from '@/types';

interface PatronDashboardProps {
  products: Product[];
  sales: Sale[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  setSales?: React.Dispatch<React.SetStateAction<Sale[]>>;
  addLog?: (action: string, category: SystemLog['category'], details?: string) => void;
  user?: AuthUser | null;
  setCurrentPage: (page: Page) => void;
  onSelectProductForDetails?: (product: Product) => void;
  pendingApprovals: ApprovalRequest[];
  onRefreshApprovals: () => void;
  initialTab?: 'overview' | 'staff' | 'shop' | 'sold' | 'added' | 'approvals';
  onTabChange?: (tab: 'overview' | 'staff' | 'shop' | 'sold' | 'added' | 'approvals') => void;
  logs?: SystemLog[];
}

export const PatronDashboard: React.FC<PatronDashboardProps> = ({
  products,
  sales,
  setProducts,
  setSales,
  addLog,
  user,
  setCurrentPage,
  pendingApprovals,
  onRefreshApprovals,
  initialTab,
  onTabChange,
  logs
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'shop' | 'sold' | 'added' | 'approvals'>(initialTab || 'overview');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<UserAccount | null>(null);
  const [staffDateFilter, setStaffDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Personnel Past Activity & Movements History states
  const [staffTimeMode, setStaffTimeMode] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'>('today');
  const [staffStartDate, setStaffStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [staffEndDate, setStaffEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [staffActiveView, setStaffActiveView] = useState<'timeline' | 'sales' | 'added' | 'logs'>('timeline');
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');
  const [staffLoadedLogs, setStaffLoadedLogs] = useState<SystemLog[]>([]);
  const [staffLogsLoading, setStaffLogsLoading] = useState<boolean>(false);

  const fetchStaffActivity = async (username: string) => {
    if (!username) return;
    setStaffLogsLoading(true);
    try {
      const res = await fetch(`/api/staff/${encodeURIComponent(username)}/activity`);
      if (res.ok) {
        const data = await res.json();
        setStaffLoadedLogs(Array.isArray(data.logs) ? data.logs : []);
      }
    } catch (e) {
      console.error('Failed to load staff activity:', e);
    } finally {
      setStaffLogsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStaff?.username) {
      fetchStaffActivity(selectedStaff.username);
    } else {
      setStaffLoadedLogs([]);
    }
  }, [selectedStaff?.username]);

  const [approvalsList, setApprovalsList] = useState<ApprovalRequest[]>([]);
  const [approvalDecisionLoading, setApprovalDecisionLoading] = useState<string | null>(null);

  const [soldFilterDate, setSoldFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [soldSellerFilter, setSoldSellerFilter] = useState<string>('all');
  const [soldSearchQuery, setSoldSearchQuery] = useState<string>('');
  const [addedFilterDate, setAddedFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [addedFilterStaff, setAddedFilterStaff] = useState<string>('all');
  const [addedSearchQuery, setAddedSearchQuery] = useState<string>('');

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: 'overview' | 'staff' | 'shop' | 'sold' | 'added' | 'approvals') => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // Staff creation, deletion & password reset states for Müdir
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newInitialPassword, setNewInitialPassword] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState<UserAccount | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  
  // In-app deletion modal state (to replace blocked window.confirm)
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // In-app feedback toast (to replace blocked window.alert)
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sale details view modal & image zoom states
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const [zoomedSaleImage, setZoomedSaleImage] = useState<string | null>(null);

  // Added product details view modal & image zoom states
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [zoomedProductImage, setZoomedProductImage] = useState<string | null>(null);

  // Return sale modal states and handler for Patron
  const [returnConfirmModalSale, setReturnConfirmModalSale] = useState<Sale | null>(null);
  const [returnReasonInput, setReturnReasonInput] = useState<string>('Müdir tərəfindən geri qaytarıldı');
  const [isReturningSale, setIsReturningSale] = useState<boolean>(false);

  const executeReturnSale = async () => {
    if (!returnConfirmModalSale) return;
    const saleToReturn = returnConfirmModalSale;
    setIsReturningSale(true);
    try {
      const reasonText = returnReasonInput.trim() || 'Müdir tərəfindən geri qaytarıldı';

      // 1. Məhsulu bazada tap və stoka qaytar
      const targetProduct = products.find(p => p.id === saleToReturn.productId || p.code === saleToReturn.productCode);
      if (targetProduct) {
        const currentCount = typeof targetProduct.stockCount === 'number' ? targetProduct.stockCount : 0;
        const updatedProduct: Product = {
          ...targetProduct,
          stockCount: currentCount + 1,
          isReturned: true,
          returnReason: reasonText,
          logs: [
            {
              date: new Date().toISOString(),
              action: `Müdir tərəfindən satışdan geri qaytarıldı və stoka bərpa edildi. Səbəb: ${reasonText}`
            },
            ...(targetProduct.logs || [])
          ]
        };

        try {
          await fetch(`/api/products/${updatedProduct.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product: updatedProduct })
          });
        } catch (e) {
          console.error('Failed to update product on server:', e);
        }

        if (setProducts) {
          setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        }
      }

      // 2. Satış qeydini returned et və serverdə yenilə
      const updatedSale: Sale = {
        ...saleToReturn,
        status: 'returned',
        returnNote: reasonText
      };

      try {
        await fetch(`/api/data/sales/${saleToReturn.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: updatedSale })
        });
      } catch (e) {
        console.error('Failed to update sale on server:', e);
      }

      if (setSales) {
        setSales(prev => prev.map(s => s.id === saleToReturn.id ? updatedSale : s));
      }

      // 3. Jurnal qeydi
      if (addLog) {
        addLog(
          `GERİ QAYTARMA: ${saleToReturn.productCode}`,
          'SALE',
          `Müdir tərəfindən qaytarıldı. Məhsul: ${saleToReturn.productName}, Məbləğ: ${saleToReturn.total} AZN, Müştəri: ${saleToReturn.customerName || 'Ümumi'}`
        );
      }

      // 4. Cari baxılan modal varsa yenilə
      if (viewingSale?.id === saleToReturn.id) {
        setViewingSale(updatedSale);
      }

      setReturnConfirmModalSale(null);
      showNotification(`"${saleToReturn.productName}" uğurla geri qaytarıldı və stoka əlavə edildi!`, 'success');
    } catch (err) {
      console.error('Return error:', err);
      showNotification('Geri qaytarılma zamanı xəta baş verdi', 'error');
    } finally {
      setIsReturningSale(false);
    }
  };

  const getSaleDetails = (s: Sale) => {
    const match = products.find(p => p.id === s.productId || p.code === s.productCode);
    return {
      imageUrl: s.imageUrl || match?.imageUrl,
      carat: s.carat || match?.carat,
      weight: s.soldWeight || s.weight || match?.weight,
      supplier: s.supplier || match?.supplier,
      category: s.type || match?.type || '—',
      productName: s.productName || match?.name || 'Məhsul',
      productCode: s.productCode || match?.code || '-'
    };
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setActionFeedback({ message, type });
    setTimeout(() => {
      setActionFeedback(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Load users list
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
          createdBy: 'Etibar Nuriyev (Müdir)'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'İstifadəçi yaradıla bilmədi');
      }

      showNotification(`Personal hesabı uğurla yaradıldı: ${data.user.full_name} (@${data.user.username})`, 'success');
      setShowCreateStaffModal(false);
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
    const cleanU = (userToDelete.username || '').toLowerCase().trim().replace(/^@/, '');
    if (cleanU === 'admin' || cleanU === 'magaza' || userToDelete.role === 'shop') {
      showNotification('Bu hesabı (@admin və ya @magaza) heç bir zaman silmək olmaz!', 'error');
      setUserToDelete(null);
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'İstifadəçi hesabı silinmədi');
      }
      showNotification(`"${userToDelete.full_name || userToDelete.username}" (@${userToDelete.username}) adlı əməkdaş hesabı silindi.`, 'success');
      if (selectedStaff?.id === userToDelete.id) {
        setSelectedStaff(null);
      }
      setUserToDelete(null);
      fetchUsers();
    } catch (e: any) {
      setDeleteError(e.message || 'Silinərkən xəta baş verdi');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Load approvals list
  const fetchApprovals = async () => {
    try {
      const res = await fetch('/api/approvals');
      if (res.ok) {
        const data = await res.json();
        setApprovalsList(data);
      }
    } catch (e) {
      console.error('Failed to load approvals:', e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchApprovals();
  }, []);

  // Today calculations
  const todayStr = new Date().toISOString().split('T')[0];

  const todaySales = (Array.isArray(sales) ? sales : []).filter(s => {
    const saleDateStr = new Date(s.date).toISOString().split('T')[0];
    return saleDateStr === todayStr;
  });

  const todayRevenue = todaySales
    .filter(s => s.status !== 'returned')
    .reduce((acc, s) => acc + (Number(s.total) || 0), 0);

  // Helper to reliably get product timestamp prioritizing actual time with hours & minutes
  const getProductTimestamp = (p: Product): string | undefined => {
    if (p.addedAt && p.addedAt.includes('T')) return p.addedAt;
    if (p.logs && p.logs.length > 0) {
      const logWithTime = p.logs.find(l => l.date && l.date.includes('T'));
      if (logWithTime?.date) return logWithTime.date;
    }
    if (p.addedAt) return p.addedAt;
    if (p.purchaseDate) return p.purchaseDate;
    return undefined;
  };

  const getProductDateStr = (p: Product): string => {
    const ts = getProductTimestamp(p);
    if (!ts) return '';
    return new Date(ts).toISOString().split('T')[0];
  };

  const formatProductTime = (p: Product): string => {
    const ts = getProductTimestamp(p);
    if (!ts) return '-';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '-';
    const dateStr = d.toLocaleDateString('az-AZ');
    if (!ts.includes('T') && !ts.includes(':')) {
      return dateStr;
    }
    const timeStr = d.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${dateStr} ${timeStr}`;
  };

  const formatProductTimeOnly = (p: Product): string => {
    const ts = getProductTimestamp(p);
    if (!ts) return '-';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '-';
    if (!ts.includes('T') && !ts.includes(':')) {
      return '-';
    }
    return d.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
  };

  const todayAddedProducts = (Array.isArray(products) ? products : []).filter(p => {
    const pDate = getProductDateStr(p);
    return pDate === todayStr;
  });

  const todayAddedWeight = todayAddedProducts.reduce((acc, p) => acc + (Number(p.weight) || 0), 0);
  const todayAddedRevenue = todayAddedProducts.reduce((acc, p) => acc + (Number(p.price) || 0), 0);

  // Filter store staff employees (excluding root admin, patron/müdir, manager, and accounts belonging to Etibar Nuriyev)
  const staffMembers = users.filter(u => {
    const role = (u.role || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const fullName = (u.full_name || '').toLowerCase();
    if (role === 'patron' || role === 'mudir' || role === 'manager' || role === 'admin') return false;
    if (username === 'admin' || username === 'patron' || username === 'mudir' || username === 'mudur' || username === 'menecer') return false;
    if (fullName.includes('etibar') || username.includes('etibar')) return false;
    return true;
  });

  // Approvals decision handler
  const handleDecision = async (id: string, decision: 'approved' | 'rejected', reason: string = '') => {
    setApprovalDecisionLoading(id);
    try {
      const res = await fetch(`/api/approvals/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          decidedBy: 'Patron',
          rejectionReason: reason
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Xəta baş verdi');
      }

      alert(data.message || (decision === 'approved' ? 'Əməliyyat təsdiqləndi' : 'Əməliyyat ləğv edildi'));
      fetchApprovals();
      onRefreshApprovals();
    } catch (err: any) {
      alert(`Xəta: ${err.message}`);
    } finally {
      setApprovalDecisionLoading(null);
    }
  };

  // Helper to reliably determine who added the product (Staff employee vs Admin vs Müdir vs Mağaza)
  const getStaffAdder = (p: Product): string => {
    // 1. Direct addedBy property on product
    if (p.addedBy && p.addedBy.trim()) {
      const clean = p.addedBy.trim();
      const lower = clean.toLowerCase().replace(/^@/, '');
      if (lower === 'magaza' || lower.includes('mağaza')) {
        return '@magaza';
      }
      if (lower === 'admin' || lower === 'sistem admini' || lower === 'sistem' || lower === 'root') {
        return 'Admin';
      }
      if (lower === 'patron' || lower === 'mudir' || lower === 'mudur' || lower === 'menecer' || lower.includes('etibar')) {
        return 'Müdir';
      }
      const matched = users.find(u => 
        u.username.toLowerCase().replace(/^@/, '') === lower || 
        (u.full_name && u.full_name.toLowerCase() === clean.toLowerCase())
      );
      if (matched) {
        if (matched.username.toLowerCase().replace(/^@/, '') === 'magaza' || matched.role === 'shop') return '@magaza';
        if (matched.username === 'admin') return 'Admin';
        if (matched.full_name?.toLowerCase().includes('etibar') || matched.role === 'patron' || matched.role === 'mudir' || matched.role === 'manager') {
          return 'Müdir';
        }
        return matched.full_name || `@${matched.username}`;
      }
      return clean.startsWith('@') ? clean : `@${clean}`;
    }

    // 2. Check logs for magaza
    if (Array.isArray(p.logs)) {
      for (const log of p.logs) {
        const actionStr = (log.action || '').toLowerCase();
        if (actionStr.includes('magaza') || actionStr.includes('mağaza')) {
          return '@magaza';
        }
      }
    }

    // Default: Admin (never attribute to staff unless explicitly added by them)
    return 'Admin';
  };

  // Formatter for seller badges to display @magaza clearly instead of Admin
  const formatSellerDisplay = (sellerName?: string) => {
    if (!sellerName) return 'Admin';
    const clean = sellerName.trim();
    const lower = clean.toLowerCase().replace(/^@/, '');
    if (lower === 'magaza' || lower.includes('mağaza')) return '@magaza';
    if (lower === 'admin' || lower === 'sistem') return 'Admin';
    if (lower.includes('etibar') || lower === 'mudir' || lower === 'patron') return 'Etibar Nuriyev';
    return clean.startsWith('@') ? clean : `@${clean}`;
  };

  // Helper for staff daily stats
  const getStaffStats = (staff: UserAccount, targetDate: string) => {
    const staffUser = staff.username.toLowerCase().trim().replace(/^@/, '');
    const staffName = (staff.full_name || '').toLowerCase().trim();
    const isShop = staffUser === 'magaza' || staff.role === 'shop';

    const staffSales = (Array.isArray(sales) ? sales : []).filter(s => {
      const sDateStr = new Date(s.date).toISOString().split('T')[0];
      if (sDateStr !== targetDate) return false;
      const sSeller = (s.sellerName || '').toLowerCase().trim().replace(/^@/, '');
      if (!sSeller || sSeller === 'admin' || sSeller === 'sistem' || sSeller.includes('etibar') || sSeller.includes('patron') || sSeller.includes('mudir')) {
        return false;
      }
      if (isShop) {
        return sSeller === 'magaza' || sSeller.includes('mağaza');
      }
      return sSeller === staffUser || sSeller === staffName;
    });

    const staffAddedProducts = (Array.isArray(products) ? products : []).filter(p => {
      const pDateStr = getProductDateStr(p);
      if (pDateStr !== targetDate) return false;

      const adder = getStaffAdder(p).toLowerCase().trim().replace(/^@/, '');
      if (!adder || adder === 'admin' || adder === 'müdir' || adder.includes('etibar') || adder.includes('patron')) {
        return false;
      }
      if (isShop) {
        return adder === 'magaza' || adder.includes('mağaza');
      }
      return adder === staffUser || adder === staffName;
    });

    const totalSoldAmount = staffSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const totalAddedWeight = staffAddedProducts.reduce((acc, p) => acc + (Number(p.weight) || 0), 0);

    return {
      sales: staffSales,
      addedProducts: staffAddedProducts,
      totalSoldAmount,
      totalAddedWeight
    };
  };

  // Helper to determine if a date falls into the selected staffTimeMode
  const isDateInStaffTimeframe = (dateInput?: string | Date): boolean => {
    if (!dateInput) return false;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return false;
    const dateStr = d.toISOString().split('T')[0];

    if (staffTimeMode === 'all') return true;

    if (staffTimeMode === 'today') {
      return dateStr === todayStr;
    }

    if (staffTimeMode === 'yesterday') {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().split('T')[0];
      return dateStr === yestStr;
    }

    if (staffTimeMode === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      return dateStr >= weekAgoStr && dateStr <= todayStr;
    }

    if (staffTimeMode === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthAgoStr = monthAgo.toISOString().split('T')[0];
      return dateStr >= monthAgoStr && dateStr <= todayStr;
    }

    if (staffTimeMode === 'custom') {
      const start = staffStartDate || '2000-01-01';
      const end = staffEndDate || todayStr;
      return dateStr >= start && dateStr <= end;
    }

    return true;
  };

  const renderSharedModals = () => (
    <>
      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-stone-900 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 border border-rose-100">
              <Trash2 size={22} />
            </div>
            <h3 className="text-base font-black text-center text-stone-900">
              Personal Hesabını Sil
            </h3>
            <p className="text-xs text-stone-500 text-center mt-2 leading-relaxed">
              <span className="font-bold text-stone-900 font-mono">@{userToDelete.username}</span> ({userToDelete.full_name || 'Personal'}) adlı əməkdaşın hesabını sistemdən silmək istədiyinizdən əminsiniz?
            </p>

            {deleteError && (
              <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-2.5 rounded-xl text-center">
                {deleteError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => { setUserToDelete(null); setDeleteError(null); }}
                className="py-2.5 px-4 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Ləğv Et
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={confirmDeleteUser}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black text-white shadow-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
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

      {/* RESET PASSWORD MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white border border-stone-200 rounded-2xl p-5 text-stone-900 shadow-2xl">
            <h3 className="text-sm font-bold text-stone-900 mb-1">
              Şifrə Sıfırla — {showResetModal.full_name || showResetModal.username}
            </h3>
            <p className="text-xs text-stone-500 mb-3">
              Yeni müvəqqəti ilkin şifrə təyin edin:
            </p>
            <input
              type="text"
              value={resetPasswordInput}
              onChange={(e) => setResetPasswordInput(e.target.value)}
              placeholder="Yeni müvəqqəti şifrə"
              className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-base sm:text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 mb-3 font-mono"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowResetModal(null); setResetPasswordInput(''); }}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Geri
              </button>
              <button
                type="button"
                onClick={() => handleResetPassword(showResetModal.id)}
                className="flex-1 bg-stone-900 hover:bg-stone-800 text-white py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Təyin Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW STAFF MODAL */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white border border-stone-200 rounded-2xl p-5 text-stone-900 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-3">
              <div className="flex items-center gap-1.5">
                <Users className="text-stone-700 w-4 h-4" />
                <h3 className="text-sm font-bold text-stone-900">Yeni Personal Hesabı</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowCreateStaffModal(false)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Ad və Soyad
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Məs: Məlahət Əliyeva"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-base sm:text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  İstifadəçi Adı (Login)
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().trim())}
                  placeholder="malahat / huseyn / nisane"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-base sm:text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  İlkin Şifrə
                </label>
                <input
                  type="text"
                  value={newInitialPassword}
                  onChange={(e) => setNewInitialPassword(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-base sm:text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900 font-mono"
                  required
                />
                <p className="text-[10px] text-stone-500 mt-1 font-medium">
                  🔒 Qeyd: İlk girişdə sistem əməkdaşa yeni gizli şifrə təyin etdirəcək.
                </p>
              </div>

              {createError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-2 text-xs text-rose-700">
                  {createError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateStaffModal(false)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-stone-900 hover:bg-stone-800 text-white py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {createLoading ? 'Yaradılır...' : 'Yarat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETALLI SATIŞ BAXIŞI VƏ MƏHSULUN RƏSMİ MODALI */}
      {viewingSale && (() => {
        const details = getSaleDetails(viewingSale);
        return (
          <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 text-stone-900 overflow-hidden my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
              {/* MODAL BAŞLIĞI */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 bg-stone-50/80 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-stone-900 text-white flex items-center justify-center shrink-0">
                    <Eye size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-black text-stone-950 truncate">Satış Detalları</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-xs sm:text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs">
                        {details.productCode}
                      </span>
                      <span className={`text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-lg border shadow-2xs ${
                        viewingSale.status === 'returned'
                          ? 'bg-rose-100 text-rose-700 border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {viewingSale.status === 'returned' ? 'GERİ QAYTARILDI' : 'TAMAMLANIB'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingSale(null)}
                  className="w-8 h-8 rounded-full bg-stone-200/70 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* MODAL MƏZMUNU */}
              <div className="p-5 overflow-y-auto space-y-4">
                {/* 1. MƏHSULUN RƏSMİ (ƏSAS DETAL) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-600 uppercase tracking-wider">
                    <span>Satılan Məhsulun Rəsmi</span>
                    {details.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setZoomedSaleImage(details.imageUrl || null)}
                        className="text-stone-900 hover:underline flex items-center gap-1 text-xs font-bold cursor-pointer"
                      >
                        <ZoomIn size={14} />
                        <span>Tam Ölçüdə Bax</span>
                      </button>
                    )}
                  </div>

                  {details.imageUrl ? (
                    <div 
                      onClick={() => setZoomedSaleImage(details.imageUrl || null)}
                      className="relative bg-gradient-to-b from-stone-100/80 to-stone-200/50 rounded-2xl border border-stone-200/80 overflow-hidden flex items-center justify-center p-4 cursor-pointer group min-h-[180px] max-h-[260px]"
                    >
                      <img
                        src={details.imageUrl}
                        alt={details.productName}
                        referrerPolicy="no-referrer"
                        className="max-h-[220px] w-auto max-w-full object-contain drop-shadow-md rounded-xl transition-transform group-hover:scale-105 duration-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/80 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                          <ZoomIn size={14} />
                          <span>Tam Ölçüdə Bax</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-stone-50 rounded-2xl border border-dashed border-stone-300 p-8 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-2xl bg-stone-200/70 text-stone-400 flex items-center justify-center mb-2">
                        <ImageIcon size={24} />
                      </div>
                      <p className="text-xs font-bold text-stone-700">Bu məhsul üçün şəkil mövcud deyil</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Bazaya daxil edilərkən foto əlavə edilməyib</p>
                    </div>
                  )}
                </div>

                {/* 2. MƏHSUL ADI VƏ ƏSAS GÖSTƏRİCİLƏR */}
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Məhsulun Adı</span>
                    <h4 className="text-base sm:text-lg font-black text-stone-950 mt-0.5">{details.productName}</h4>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-200/80">
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 text-center">
                      <span className="text-[10px] font-bold uppercase text-stone-500 block">Qızıl Əyarı</span>
                      <span className="text-xs sm:text-sm font-black text-stone-900">{details.carat ? `${details.carat} K` : '—'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 text-center">
                      <span className="text-[10px] font-bold uppercase text-stone-500 block">Satılan Çəki</span>
                      <span className="text-xs sm:text-sm font-black text-stone-900">
                        {details.weight ? `${details.weight} gr` : (viewingSale.weight ? `${viewingSale.weight} gr` : '1 əd')}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 text-center">
                      <span className="text-[10px] font-bold uppercase text-stone-500 block">Növ</span>
                      <span className="text-xs sm:text-sm font-black text-stone-900 truncate block">{details.category}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 text-center">
                      <span className="text-[10px] font-bold uppercase text-stone-500 block">Tədarükçü</span>
                      <span className="text-xs sm:text-sm font-black text-stone-900 truncate block">{details.supplier || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. İŞTİRAKÇILAR: ALICI VƏ SATICI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                      Alıcı (Müştəri)
                    </span>
                    <p className="text-sm sm:text-base font-black text-stone-950 truncate">
                      {viewingSale.customerName || 'Ümumi Müştəri'}
                    </p>
                    <span className="text-[11px] text-stone-500 mt-0.5 block">Müştəri adı</span>
                  </div>

                  <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                      Satıcı Personal
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm sm:text-base font-black text-stone-950 truncate">
                        {formatSellerDisplay(viewingSale.sellerName)}
                      </span>
                      <span className="bg-stone-200 text-stone-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        İcraçı
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 mt-0.5 block">Satışı qeydə alan əməkdaş</span>
                  </div>
                </div>

                {/* 4. MALİYYƏ VƏ TARİX */}
                <div className="bg-stone-900 text-white rounded-2xl p-4 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block">
                        Yekun Satış Məbləği
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                        {Number(viewingSale.total).toLocaleString()} ₼
                      </div>
                    </div>
                    {viewingSale.discount > 0 && (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2 py-1 rounded-lg">
                        {Number(viewingSale.discount).toLocaleString()} ₼ Endirim
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs text-stone-300 font-mono">
                    <span>Tarix: {new Date(viewingSale.date).toLocaleDateString('az-AZ')}</span>
                    <span>Saat: {new Date(viewingSale.date).toLocaleTimeString('az-AZ')}</span>
                  </div>
                </div>

                {/* QEYD (VARSA) */}
                {viewingSale.returnNote && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                    <span className="font-bold block mb-0.5">Qeyd / Detal:</span>
                    {viewingSale.returnNote}
                  </div>
                )}

                {/* GERİ QAYTARMA STATUSU VƏ YA MƏHSULU GERİ QAYTAR BUTONU */}
                {viewingSale.status === 'returned' ? (
                  <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-center gap-3 text-rose-900 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0 text-rose-600">
                      <RotateCcw size={20} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-black text-xs sm:text-sm block text-rose-800">
                        Bu məhsul geri qaytarılıb
                      </span>
                      <span className="text-[11px] text-rose-700 block">
                        Məhsul təkrar stoka/bazaya bərpa edilib. {viewingSale.returnNote ? `(${viewingSale.returnNote})` : ''}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setReturnReasonInput('Müdir tərəfindən geri qaytarıldı');
                        setReturnConfirmModalSale(viewingSale);
                      }}
                      className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-black rounded-2xl transition-all active:scale-[0.98] cursor-pointer shadow-md flex items-center justify-center gap-2 border border-rose-700"
                    >
                      <RotateCcw size={16} />
                      <span>Məhsulu Geri Qaytar (Stoka Qaytar)</span>
                    </button>
                    <p className="text-[11px] text-stone-500 text-center mt-1.5 font-medium">
                      Bu düyməyə basdıqda məhsul bazaya/stoka geri qaytarılacaq və satış qaytarıldı kimi qeyd olunacaq.
                    </p>
                  </div>
                )}
              </div>

              {/* MODAL AYAĞI */}
              <div className="p-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-2 shrink-0">
                <span className="text-[11px] font-bold text-stone-500">
                  {viewingSale.status === 'returned' ? (
                    <span className="text-rose-600 flex items-center gap-1 font-black">
                      <RotateCcw size={12} /> Status: Geri qaytarılıb
                    </span>
                  ) : (
                    <span className="text-emerald-700 flex items-center gap-1 font-black">
                      <CheckCircle2 size={12} /> Status: Aktiv Satış
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setViewingSale(null)}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  Pəncərəni Bağla
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DETALLI BAZAYA ƏLAVƏ EDİLƏN MƏHSUL VƏ RƏSM MODALI */}
      {viewingProduct && (() => {
        const adder = getStaffAdder(viewingProduct);
        const additionTime = formatProductTime(viewingProduct);
        return (
          <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 text-stone-900 overflow-hidden my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
              {/* MODAL BAŞLIĞI */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 bg-stone-50/80 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Package size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-black text-stone-950 truncate">Bazaya Əlavə Edilən Mal</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-xs sm:text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-lg shadow-2xs">
                        {viewingProduct.code}
                      </span>
                      <span className="text-[10px] font-bold bg-stone-200 text-stone-800 px-2 py-0.5 rounded-md">
                        {viewingProduct.type || 'Qızıl'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingProduct(null)}
                  className="w-8 h-8 rounded-full bg-stone-200/70 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* MODAL MƏZMUNU */}
              <div className="p-5 overflow-y-auto space-y-4">
                {/* 1. MƏHSULUN RƏSMİ */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-600 uppercase tracking-wider">
                    <span>Məhsulun Rəsmi</span>
                    {viewingProduct.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setZoomedProductImage(viewingProduct.imageUrl || null)}
                        className="text-stone-900 hover:underline flex items-center gap-1 text-xs font-bold cursor-pointer"
                      >
                        <ZoomIn size={14} />
                        <span>Tam Ölçüdə Bax</span>
                      </button>
                    )}
                  </div>

                  {viewingProduct.imageUrl ? (
                    <div 
                      onClick={() => setZoomedProductImage(viewingProduct.imageUrl || null)}
                      className="relative bg-gradient-to-b from-stone-100/80 to-stone-200/50 rounded-2xl border border-stone-200/80 overflow-hidden flex items-center justify-center p-4 cursor-pointer group min-h-[180px] max-h-[260px]"
                    >
                      <img
                        src={viewingProduct.imageUrl}
                        alt={viewingProduct.name}
                        referrerPolicy="no-referrer"
                        className="max-h-[220px] w-auto max-w-full object-contain drop-shadow-md rounded-xl transition-transform group-hover:scale-105 duration-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/80 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                          <ZoomIn size={14} />
                          <span>Tam Ölçüdə Bax</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-stone-50 rounded-2xl border border-dashed border-stone-300 p-8 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-2xl bg-stone-200/70 text-stone-400 flex items-center justify-center mb-2">
                        <ImageIcon size={24} />
                      </div>
                      <p className="text-xs font-bold text-stone-700">Bu məhsul üçün foto əlavə edilməyib</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">Bazaya daxil edilərkən şəkil çəkilməyib</p>
                    </div>
                  )}
                </div>

                {/* 2. MƏHSUL ADI VƏ GÖSTƏRİCİLƏR */}
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Məhsulun Adı</span>
                    <h4 className="text-base sm:text-lg font-black text-stone-950 mt-0.5">{viewingProduct.name}</h4>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-200/80">
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 text-center">
                      <span className="text-[10px] font-bold uppercase text-stone-500 block">Qızıl Əyarı</span>
                      <span className="text-xs sm:text-sm font-black text-stone-900">{viewingProduct.carat ? `${viewingProduct.carat} K` : '—'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 text-center">
                      <span className="text-[10px] font-bold uppercase text-stone-500 block">Çəki / Ədəd</span>
                      <span className="text-xs sm:text-sm font-black text-stone-900">
                        {viewingProduct.weight ? `${viewingProduct.weight} gr` : `${viewingProduct.stockCount || 1} ədəd`}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 text-center">
                      <span className="text-[10px] font-bold uppercase text-stone-500 block">Növ</span>
                      <span className="text-xs sm:text-sm font-black text-stone-900 truncate block">{viewingProduct.type || '—'}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 text-center">
                      <span className="text-[10px] font-bold uppercase text-stone-500 block">Tədarükçü</span>
                      <span className="text-xs sm:text-sm font-black text-stone-900 truncate block">{viewingProduct.supplier || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. İŞTİRAKÇI VƏ ƏLAVƏ EDİLMƏ ZAMANI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                      Əlavə Edən Əməkdaş
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-stone-900 text-white font-black text-xs flex items-center justify-center">
                        {adder.replace(/^@/, '').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm sm:text-base font-black text-stone-950 truncate">
                        {adder}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 mt-1 block">Malı bazaya qeyd edən şəxs</span>
                  </div>

                  <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-1">
                      Əlavə Edilmə Zamanı
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-black text-stone-900">
                      <Clock size={15} className="text-emerald-600 shrink-0" />
                      <span>{additionTime}</span>
                    </div>
                    <span className="text-[11px] text-stone-500 mt-1 block">Dəqiq tarix və saat</span>
                  </div>
                </div>

                {/* 4. SATIŞ QİYMƏTİ */}
                <div className="bg-stone-900 text-white rounded-2xl p-4 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400 block">
                    Təyin Edilmiş Satış Qiyməti
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-white">
                    {viewingProduct.price ? `${Number(viewingProduct.price).toLocaleString()} ₼` : 'Təyin edilməyib'}
                  </div>
                </div>
              </div>

              {/* MODAL AYAĞI */}
              <div className="p-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingProduct(null)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  Pəncərəni Bağla
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ŞƏKİL TAM EKRAN BÖYÜTMƏ MODALLARI */}
      {(zoomedSaleImage || zoomedProductImage) && (
        <div 
          onClick={() => {
            setZoomedSaleImage(null);
            setZoomedProductImage(null);
          }}
          className="fixed inset-0 z-[190] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => {
                setZoomedSaleImage(null);
                setZoomedProductImage(null);
              }}
              className="absolute -top-12 right-0 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 cursor-pointer transition-colors"
            >
              <X size={20} />
            </button>
            <img
              src={zoomedSaleImage || zoomedProductImage || ''}
              alt="Məhsulun Tam Ölçülü Şəkli"
              referrerPolicy="no-referrer"
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}

      {/* RETURN CONFIRMATION MODAL */}
      {returnConfirmModalSale && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 text-stone-900 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-2xs">
              <RotateCcw size={24} />
            </div>
            
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-black text-stone-950">
                Məhsulu Geri Qaytarmaq
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Bu məhsul satılanlar siyahısında <strong className="text-rose-600 font-bold">GERİ QAYTARILDI</strong> kimi qeyd ediləcək və təkrar <strong className="text-emerald-700 font-bold">stoka/bazaya əlavə olunacaq</strong>.
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-semibold">Məhsul:</span>
                <span className="font-black text-stone-950 truncate max-w-[200px]">{returnConfirmModalSale.productName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-semibold">Kod:</span>
                <span className="font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md">
                  {returnConfirmModalSale.productCode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-semibold">Müştəri:</span>
                <span className="font-bold text-stone-900">{returnConfirmModalSale.customerName || 'Ümumi Müştəri'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-semibold">Məbləğ:</span>
                <span className="font-black text-stone-950">{Number(returnConfirmModalSale.total).toLocaleString()} ₼</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                Geri Qaytarma Səbəbi / Qeyd:
              </label>
              <input
                type="text"
                value={returnReasonInput}
                onChange={(e) => setReturnReasonInput(e.target.value)}
                placeholder="Səbəbi daxil edin..."
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                disabled={isReturningSale}
                onClick={() => setReturnConfirmModalSale(null)}
                className="py-2.5 px-4 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                İmtina Et
              </button>
              <button
                type="button"
                disabled={isReturningSale}
                onClick={executeReturnSale}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-xs font-black text-white shadow-md flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isReturningSale ? (
                  <span>Qaytarılır...</span>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    <span>Bəli, Geri Qaytar</span>
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
            ? 'bg-stone-900 text-white border-stone-800'
            : 'bg-rose-600 text-white border-rose-700'
        }`}>
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-amber-300 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}
    </>
  );

  const pendingCount = (pendingApprovals && pendingApprovals.length) || approvalsList.filter(a => a.status === 'pending').length;

  if (selectedStaff) {
    const staffUser = (selectedStaff.username || '').toLowerCase().trim().replace(/^@/, '');
    const staffName = (selectedStaff.full_name || '').toLowerCase().trim();
    const isShop = staffUser === 'magaza' || selectedStaff.role === 'shop';

    // 1. All sales strictly by this staff member (never include admin or patron sales)
    const allStaffSales = (Array.isArray(sales) ? sales : []).filter(s => {
      const seller = (s.sellerName || '').toLowerCase().trim().replace(/^@/, '');
      if (!seller || seller === 'admin' || seller === 'sistem' || seller.includes('etibar') || seller.includes('patron') || seller.includes('mudir')) {
        return false;
      }
      if (isShop) {
        return seller === 'magaza' || seller.includes('mağaza');
      }
      return seller === staffUser || seller === staffName;
    });

    // 2. All products strictly added by this staff member
    const allStaffAdded = (Array.isArray(products) ? products : []).filter(p => {
      const adder = getStaffAdder(p).toLowerCase().trim().replace(/^@/, '');
      if (!adder || adder === 'admin' || adder === 'müdir' || adder.includes('etibar') || adder.includes('patron')) {
        return false;
      }
      if (isShop) {
        return adder === 'magaza' || adder.includes('mağaza');
      }
      return adder === staffUser || adder === staffName;
    });

    // 3. All logs strictly performed by this staff member
    const logsMap = new Map<string, SystemLog>();
    [...(logs || []), ...(staffLoadedLogs || [])].forEach(l => {
      if (!l) return;
      const u = (l.user || '').toLowerCase().trim().replace(/^@/, '');
      if (!u || u === 'admin' || u === 'sistem' || u === 'patron' || u === 'mudir' || u === 'mudur' || u === 'menecer' || u.includes('etibar')) {
        return;
      }
      if (isShop) {
        if (u === 'magaza' || u.includes('mağaza')) {
          logsMap.set(l.id || `${l.date}-${l.action}-${l.details}`, l);
        }
        return;
      }
      if (u === staffUser || u === staffName) {
        logsMap.set(l.id || `${l.date}-${l.action}-${l.details}`, l);
      }
    });
    const allStaffLogs = Array.from(logsMap.values());

    // Filter by selected timeframe
    const staffSalesInTimeframe = allStaffSales.filter(s => isDateInStaffTimeframe(s.date));
    const staffAddedInTimeframe = allStaffAdded.filter(p => isDateInStaffTimeframe(getProductTimestamp(p)));
    const staffLogsInTimeframe = allStaffLogs.filter(l => isDateInStaffTimeframe(l.date));

    // Filter by staffSearchQuery
    const q = staffSearchQuery.trim().toLowerCase();
    const filteredSales = staffSalesInTimeframe.filter(s => {
      if (!q) return true;
      return (
        (s.productName && s.productName.toLowerCase().includes(q)) ||
        (s.productCode && s.productCode.toLowerCase().includes(q)) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.sellerName && s.sellerName.toLowerCase().includes(q))
      );
    });

    const filteredAdded = staffAddedInTimeframe.filter(p => {
      if (!q) return true;
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.type && p.type.toLowerCase().includes(q)) ||
        (p.carat && String(p.carat).toLowerCase().includes(q))
      );
    });

    const filteredLogs = staffLogsInTimeframe.filter(l => {
      if (!q) return true;
      return (
        (l.action && l.action.toLowerCase().includes(q)) ||
        (l.details && l.details.toLowerCase().includes(q)) ||
        (l.category && l.category.toLowerCase().includes(q))
      );
    });

    // Summary calculations (excluding returned sales from revenue)
    const activeStaffSales = filteredSales.filter(s => s.status !== 'returned');
    const totalSalesAmount = activeStaffSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const totalSalesWeight = activeStaffSales.reduce((acc, s) => acc + (Number(s.soldWeight || s.weight) || 0), 0);
    const totalAddedWeight = filteredAdded.reduce((acc, p) => acc + (Number(p.weight) || 0), 0);
    const totalAddedRevenue = filteredAdded.reduce((acc, p) => acc + (Number(p.price) || 0), 0);

    // Unified Chronological Timeline Items
    type TimelineItem = {
      id: string;
      kind: 'sale' | 'product_add' | 'log';
      timestamp: string;
      title: string;
      subtitle: string;
      badgeText: string;
      badgeColor: string;
      amount?: number;
      weight?: number;
      sale?: Sale;
      product?: Product;
      log?: SystemLog;
    };

    const timelineItems: TimelineItem[] = [
      ...filteredSales.map(s => ({
        id: `sale-${s.id}`,
        kind: 'sale' as const,
        timestamp: s.date,
        title: `Satış: ${s.productName}`,
        subtitle: `Kod: ${s.productCode} • Müştəri: ${s.customerName || 'Ümumi Müştəri'}`,
        badgeText: 'Satış',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        amount: Number(s.total) || 0,
        weight: Number(s.soldWeight || s.weight) || 0,
        sale: s
      })),
      ...filteredAdded.map(p => ({
        id: `prod-${p.id}`,
        kind: 'product_add' as const,
        timestamp: getProductTimestamp(p) || todayStr,
        title: `Bazaya Əlavə: ${p.name}`,
        subtitle: `Kod: ${p.code} • ${p.carat ? `${p.carat} əyar • ` : ''}${p.weight ? `${p.weight} gr` : ''}`,
        badgeText: 'Bazaya Əlavə',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        amount: Number(p.price) || 0,
        weight: Number(p.weight) || 0,
        product: p
      })),
      ...filteredLogs.map(l => ({
        id: `log-${l.id}`,
        kind: 'log' as const,
        timestamp: l.date,
        title: l.action,
        subtitle: l.details || `Kateqoriya: ${l.category}`,
        badgeText: l.category === 'SALE' ? 'Satış Loqu' : (l.category === 'PRODUCT' ? 'Mal Loqu' : 'Audit Qeydi'),
        badgeColor: 'bg-stone-100 text-stone-800 border-stone-200',
        log: l
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const getTimeModeLabel = () => {
      switch (staffTimeMode) {
        case 'today': return 'Bugün';
        case 'yesterday': return 'Dünən';
        case 'week': return 'Son 7 Gün';
        case 'month': return 'Bu Ay (Son 30 Gün)';
        case 'all': return 'Bütün Keçmiş (Tarixçə)';
        case 'custom': return `${staffStartDate} — ${staffEndDate}`;
        default: return 'Filtir';
      }
    };

    return (
      <div className="px-3 py-3 sm:px-6 md:px-8 space-y-4 max-w-7xl mx-auto bg-white min-h-[calc(100vh-4.5rem)] sm:rounded-3xl sm:border sm:border-stone-200/80 shadow-xs text-stone-900 animate-in fade-in duration-150">
        {/* ÜST BAŞLIQ: PERSONAL KARTI VƏ GERİ DÜYMƏSİ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSelectedStaff(null)}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 border border-stone-200 cursor-pointer shrink-0 shadow-2xs"
            >
              <ArrowLeft size={14} />
              <span>Geri (Personallar)</span>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-stone-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {(selectedStaff.full_name || selectedStaff.username).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm sm:text-base font-black text-stone-950 truncate">
                    {selectedStaff.full_name || selectedStaff.username}
                  </h3>
                  <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md border border-stone-200/80 shrink-0">
                    @{selectedStaff.username}
                  </span>
                  <span className="text-[9px] font-bold uppercase bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded border border-stone-200">
                    {selectedStaff.role === 'shop' ? 'Mağaza' : 'İşçi'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Keçmiş Hərəkətlər və Əməliyyat Tarixçəsi
                </p>
              </div>
            </div>
          </div>

          {/* SAĞ DÜYMƏLƏR: REFRESH, ŞİFRƏ, SİLMƏ */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => fetchStaffActivity(selectedStaff.username)}
              disabled={staffLogsLoading}
              className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors border border-stone-200 cursor-pointer"
              title="Məlumatları Yenilə"
            >
              <RefreshCw size={13} className={staffLogsLoading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={() => { setShowResetModal(selectedStaff); setResetPasswordInput(''); }}
              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors border border-stone-200 cursor-pointer flex items-center gap-1"
              title="Şifrə Sıfırla"
            >
              <KeyRound size={12} />
              <span className="hidden sm:inline">Şifrə</span>
            </button>
            {selectedStaff.username?.toLowerCase().replace(/^@/, '') !== 'admin' && 
             selectedStaff.username?.toLowerCase().replace(/^@/, '') !== 'magaza' && 
             selectedStaff.role !== 'shop' ? (
              <button
                type="button"
                onClick={() => { setUserToDelete(selectedStaff); setDeleteError(null); }}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold transition-colors border border-rose-200 cursor-pointer flex items-center gap-1"
                title="Personalı Sil"
              >
                <Trash2 size={12} />
                <span className="hidden sm:inline">Sil</span>
              </button>
            ) : (
              <span className="px-2.5 py-1.5 bg-amber-50 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 flex items-center gap-1 select-none">
                🔒 Daimi Hesab
              </span>
            )}
          </div>
        </div>

        {/* ZAMAN FİLTRELƏRİ VƏ AXTARIŞ ÇUBUĞU */}
        <div className="bg-stone-50/90 border border-stone-200/90 rounded-2xl p-2.5 sm:p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Tez Filter Düymələri */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mr-1 flex items-center gap-1">
                <Clock size={12} />
                <span>Tarix:</span>
              </span>
              
              <button
                type="button"
                onClick={() => setStaffTimeMode('today')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  staffTimeMode === 'today'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200/80'
                }`}
              >
                Bugün
              </button>
              
              <button
                type="button"
                onClick={() => setStaffTimeMode('yesterday')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  staffTimeMode === 'yesterday'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200/80'
                }`}
              >
                Dünən
              </button>

              <button
                type="button"
                onClick={() => setStaffTimeMode('week')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  staffTimeMode === 'week'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200/80'
                }`}
              >
                Son 7 Gün
              </button>

              <button
                type="button"
                onClick={() => setStaffTimeMode('month')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  staffTimeMode === 'month'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200/80'
                }`}
              >
                Bu Ay (30 Gün)
              </button>

              <button
                type="button"
                onClick={() => setStaffTimeMode('all')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  staffTimeMode === 'all'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200/80'
                }`}
              >
                <History size={12} />
                <span>Bütün Keçmiş (Tarixçə)</span>
              </button>

              <button
                type="button"
                onClick={() => setStaffTimeMode('custom')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  staffTimeMode === 'custom'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-700 hover:bg-stone-200/70 border border-stone-200/80'
                }`}
              >
                Tarix Aralığı
              </button>
            </div>

            {/* Axtarış sahəsi */}
            <div className="relative w-full sm:w-64">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                placeholder="Kod, məhsul, müştəri və ya əməliyyat..."
                className="w-full bg-white border border-stone-300 rounded-xl pl-7 pr-7 py-1 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              {staffSearchQuery && (
                <button
                  type="button"
                  onClick={() => setStaffSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Xüsusi Tarix Aralığı Seçimi (Custom mode) */}
          {staffTimeMode === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-200/70 text-xs">
              <span className="text-stone-500 font-bold text-[11px]">Başlanğıc:</span>
              <input
                type="date"
                value={staffStartDate}
                onChange={(e) => setStaffStartDate(e.target.value)}
                className="bg-white border border-stone-300 rounded-lg px-2 py-0.5 text-xs text-stone-900 font-mono font-bold"
              />
              <span className="text-stone-500 font-bold text-[11px] ml-2">Bitmə:</span>
              <input
                type="date"
                value={staffEndDate}
                onChange={(e) => setStaffEndDate(e.target.value)}
                className="bg-white border border-stone-300 rounded-lg px-2 py-0.5 text-xs text-stone-900 font-mono font-bold"
              />
            </div>
          )}
        </div>

        {/* 4 STATİSTİKA KARTI (SEÇİLMİŞ ZAMAN ARALIĞI ÜÇÜN) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-stone-50 border border-stone-200/90 p-3 sm:p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Cəmi Hərəkət</span>
              <Activity size={14} className="text-stone-400" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-stone-950">
              {timelineItems.length} <span className="text-xs font-normal text-stone-500">əməliyyat</span>
            </p>
            <span className="text-[10px] text-stone-500 font-medium">{getTimeModeLabel()}</span>
          </div>

          <div className="bg-stone-50 border border-stone-200/90 p-3 sm:p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Satış Məbləği</span>
              <Wallet size={14} className="text-stone-400" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-stone-950">
              {totalSalesAmount.toLocaleString()} <span className="text-xs font-normal text-stone-500">₼</span>
            </p>
            <span className="text-[10px] text-stone-500 font-medium">
              {filteredSales.length} satış • {totalSalesWeight.toFixed(2)} gr
            </span>
          </div>

          <div className="bg-stone-50 border border-stone-200/90 p-3 sm:p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Bazaya Əlavə</span>
              <Package size={14} className="text-stone-400" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-stone-950">
              {filteredAdded.length} <span className="text-xs font-normal text-stone-500">ədəd</span>
            </p>
            <span className="text-[10px] text-stone-500 font-medium">
              {totalAddedWeight.toFixed(2)} gr • {totalAddedRevenue.toLocaleString()} ₼
            </span>
          </div>

          <div className="bg-stone-50 border border-stone-200/90 p-3 sm:p-3.5 rounded-2xl">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Audit Loqları</span>
              <FileText size={14} className="text-stone-400" />
            </div>
            <p className="text-lg sm:text-2xl font-black text-stone-950">
              {filteredLogs.length} <span className="text-xs font-normal text-stone-500">qeyd</span>
            </p>
            <span className="text-[10px] text-stone-500 font-medium">Sistem fəaliyyəti</span>
          </div>
        </div>

        {/* GÖRÜNÜŞ SEÇİMİ TABLARI */}
        <div className="flex items-center gap-1.5 border-b border-stone-200 pb-2">
          <button
            type="button"
            onClick={() => setStaffActiveView('timeline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              staffActiveView === 'timeline'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <History size={13} />
            <span>Xronoloji Keçmiş ({timelineItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStaffActiveView('sales')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              staffActiveView === 'sales'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <ShoppingBag size={13} />
            <span>Satışlar ({filteredSales.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStaffActiveView('added')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              staffActiveView === 'added'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Package size={13} />
            <span>Bazaya Əlavələr ({filteredAdded.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStaffActiveView('logs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              staffActiveView === 'logs'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <FileText size={13} />
            <span>Audit Loqları ({filteredLogs.length})</span>
          </button>
        </div>

        {/* 1. XRONOLOJİ TİMELİNE GÖRÜNÜŞÜ */}
        {staffActiveView === 'timeline' && (
          <div className="space-y-2.5">
            {timelineItems.length === 0 ? (
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-10 text-center text-stone-400 text-xs font-semibold">
                Seçilmiş zaman aralığında ({getTimeModeLabel()}) heç bir hərəkət qeydə alınmayıb.
              </div>
            ) : (
              <div className="space-y-2">
                {timelineItems.map((item) => {
                  const itemDate = new Date(item.timestamp);
                  const dateFormatted = !isNaN(itemDate.getTime()) ? itemDate.toLocaleDateString('az-AZ') : '-';
                  const timeFormatted = !isNaN(itemDate.getTime())
                    ? itemDate.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })
                    : '-';

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.kind === 'sale' && item.sale) setViewingSale(item.sale);
                        if (item.kind === 'product_add' && item.product) setViewingProduct(item.product);
                      }}
                      className="bg-white border-2 border-stone-200/90 hover:border-stone-400 rounded-2xl p-4 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        {/* Solda İkon / Baxış Düyməsi */}
                        {item.kind === 'sale' && item.sale ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingSale(item.sale!);
                            }}
                            className="w-10 h-10 rounded-xl bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
                            title="Satışın Detallarına və Rəsminə Bax"
                          >
                            <Eye size={16} />
                          </button>
                        ) : item.kind === 'product_add' && item.product ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingProduct(item.product!);
                            }}
                            className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-300 flex items-center justify-center shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
                            title="Məhsulun Rəsminə və Detallarına Bax"
                          >
                            <Eye size={16} />
                          </button>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center shrink-0">
                            <Activity size={18} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg border ${item.badgeColor}`}>
                              {item.badgeText}
                            </span>
                            <span className="font-black text-stone-950 text-sm sm:text-base truncate">
                              {item.title}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 font-medium truncate mt-1">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Sağda Məbləğ / Çəki və Tarix */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                        <div className="text-left sm:text-right">
                          {item.amount !== undefined && item.amount > 0 && (
                            <span className="font-black text-stone-950 text-sm sm:text-base block">
                              {item.amount.toLocaleString()} ₼
                            </span>
                          )}
                          {item.weight !== undefined && item.weight > 0 && (
                            <span className="text-xs text-stone-600 font-bold block">
                              {item.weight.toFixed(2)} gr
                            </span>
                          )}
                        </div>

                        <div className="text-right font-mono text-xs text-stone-600 bg-stone-50 border border-stone-200/90 rounded-xl px-2.5 py-1">
                          <div className="font-bold text-stone-900">{dateFormatted}</div>
                          <div className="text-[11px] text-stone-500">{timeFormatted}</div>
                        </div>

                        {item.kind === 'sale' && item.sale && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingSale(item.sale!);
                            }}
                            className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-800 rounded-xl text-xs font-bold transition-all cursor-pointer border border-stone-200 shadow-2xs"
                          >
                            <Eye size={13} />
                            <span>Bax</span>
                          </button>
                        )}
                        {item.kind === 'product_add' && item.product && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingProduct(item.product!);
                            }}
                            className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-300 shadow-2xs"
                          >
                            <Eye size={13} />
                            <span>Bax</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. SATIŞLAR CƏDVƏL GÖRÜNÜŞÜ */}
        {staffActiveView === 'sales' && (
          <div className="space-y-2.5">
            {filteredSales.length === 0 ? (
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-10 text-center text-stone-400 text-xs font-semibold">
                Seçilmiş zaman aralığında bu işçi tərəfindən satış qeydə alınmayıb.
              </div>
            ) : (
              <>
                {/* Mobil Görünüş (Genişləndirilmiş və Standart Ölçülü Kartlar) */}
                <div className="block sm:hidden space-y-3">
                  {filteredSales.map((s) => {
                    const details = getSaleDetails(s);
                    const isRet = s.status === 'returned';
                    return (
                      <div 
                        key={s.id} 
                        onClick={() => setViewingSale(s)}
                        className={`border-2 rounded-2xl p-4 shadow-xs space-y-3 transition-all cursor-pointer active:scale-[0.99] group ${
                          isRet
                            ? 'bg-rose-50/40 border-rose-300 hover:border-rose-400'
                            : 'bg-white border-stone-200/90 hover:border-stone-400'
                        }`}
                      >
                        {/* 1. ÜST SƏTİR: ŞƏKİL, AD, KOD VƏ MƏBLƏĞ */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {details.imageUrl ? (
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-200 shrink-0 bg-stone-100 shadow-2xs group-hover:border-stone-400 transition-colors">
                                <img
                                  src={details.imageUrl}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center border border-stone-200 shrink-0">
                                <ImageIcon size={20} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-black text-stone-950 text-sm sm:text-base truncate block">
                                {s.productName}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono font-black text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs">
                                  {s.productCode}
                                </span>
                                <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                                  {s.soldWeight ? `${s.soldWeight} gr` : (s.weight ? `${s.weight} gr` : '1 əd')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {isRet ? (
                              <div className="space-y-1">
                                <span className="text-[10px] sm:text-xs font-black uppercase text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-lg block text-center shadow-2xs">
                                  GERİ QAYTARILDI
                                </span>
                                <span className="font-bold text-rose-600 line-through text-xs sm:text-sm block">
                                  {Number(s.total).toLocaleString()} ₼
                                </span>
                              </div>
                            ) : (
                              <span className="font-black text-stone-950 text-base sm:text-lg block bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200/80">
                                {Number(s.total).toLocaleString()} ₼
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 2. ORTA SƏTİR: ALICI VƏ SATICI MƏLUMATI */}
                        <div className="grid grid-cols-2 gap-2 bg-stone-50/80 rounded-xl p-2.5 border border-stone-200/70 text-xs text-stone-700">
                          <div className="truncate">
                            <span className="text-[10px] uppercase font-bold text-stone-400 block">Alıcı (Müştəri)</span>
                            <strong className="text-stone-950 font-black text-xs sm:text-sm truncate block">
                              {s.customerName || 'Ümumi Müştəri'}
                            </strong>
                          </div>
                          <div className="text-right truncate">
                            <span className="text-[10px] uppercase font-bold text-stone-400 block">Satıcı</span>
                            <span className="inline-block bg-stone-100 text-stone-900 px-2 py-0.5 rounded-lg font-black text-xs border border-stone-200 truncate">
                              {formatSellerDisplay(s.sellerName || selectedStaff.full_name || selectedStaff.username)}
                            </span>
                          </div>
                        </div>

                        {/* 3. ALT SƏTİR: TARİX VƏ SAAT */}
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-600 pt-2 border-t border-stone-100">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-stone-400" />
                            {new Date(s.date).toLocaleDateString('az-AZ')}
                          </span>
                          <span className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-lg">
                            <Clock size={13} className="text-stone-400" />
                            {new Date(s.date).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Masaüstü Cədvəl */}
                <div className="hidden sm:block bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100/70 border-b border-stone-200 text-stone-600 uppercase text-[10px] font-black tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 w-14 text-center">Baxış</th>
                        <th className="py-2.5 px-4">Kod</th>
                        <th className="py-2.5 px-4">Məhsul</th>
                        <th className="py-2.5 px-4">Alıcı (Müştəri)</th>
                        <th className="py-2.5 px-4">Satıcı Personal</th>
                        <th className="py-2.5 px-4">Çəki / Ədəd</th>
                        <th className="py-2.5 px-4">Tarix və Saat</th>
                        <th className="py-2.5 px-4 text-right">Məbləğ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                      {filteredSales.map((s) => {
                        const details = getSaleDetails(s);
                        const isRet = s.status === 'returned';
                        return (
                          <tr key={s.id} className={`transition-colors ${isRet ? 'bg-rose-50/60 hover:bg-rose-100/60' : 'hover:bg-stone-50/80'}`}>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => setViewingSale(s)}
                                className="p-1.5 bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-700 rounded-xl transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1 font-bold text-[11px] active:scale-95"
                                title="Detallı Baxış və Rəsm"
                              >
                                <Eye size={14} />
                                <span className="hidden xl:inline">Bax</span>
                              </button>
                            </td>
                            <td className="py-2.5 px-4 font-mono font-black text-emerald-700 bg-emerald-50/50">{s.productCode}</td>
                            <td className="py-2.5 px-4 font-bold text-stone-950">
                              <div className="flex items-center gap-2">
                                {details.imageUrl ? (
                                  <img
                                    src={details.imageUrl}
                                    alt=""
                                    onClick={() => setViewingSale(s)}
                                    className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-400 flex items-center justify-center border border-stone-200 shrink-0">
                                    <ImageIcon size={14} />
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="truncate max-w-[170px]">{s.productName}</span>
                                  {isRet && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-300 uppercase shrink-0 shadow-2xs">
                                      GERİ QAYTARILDI
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-stone-900 font-bold">{s.customerName || 'Ümumi Müştəri'}</td>
                            <td className="py-2.5 px-4">
                              <span className="bg-stone-100 text-stone-800 font-bold px-2 py-0.5 rounded text-[11px] border border-stone-200">
                                {formatSellerDisplay(s.sellerName || selectedStaff.full_name || selectedStaff.username)}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">{s.soldWeight ? `${s.soldWeight} gr` : (s.weight ? `${s.weight} gr` : '1 əd')}</td>
                            <td className="py-2.5 px-4 font-mono text-stone-600">
                              {new Date(s.date).toLocaleDateString('az-AZ')} {new Date(s.date).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {isRet ? (
                                <div>
                                  <span className="font-bold text-rose-600 line-through text-xs block">
                                    {Number(s.total).toLocaleString()} ₼
                                  </span>
                                  <span className="text-[10px] font-black text-rose-700 block uppercase">
                                    Qaytarılıb
                                  </span>
                                </div>
                              ) : (
                                <span className="font-black text-stone-950">
                                  {Number(s.total).toLocaleString()} ₼
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* 3. BAZAYA ƏLAVƏLƏR GÖRÜNÜŞÜ */}
        {staffActiveView === 'added' && (
          <div className="space-y-2.5">
            {filteredAdded.length === 0 ? (
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-10 text-center text-stone-400 text-xs font-semibold">
                Seçilmiş zaman aralığında bu işçi tərəfindən bazaya yeni məhsul əlavə edilməyib.
              </div>
            ) : (
              <>
                {/* Mobil Görünüş (Genişləndirilmiş və Standart Ölçülü Kartlar) */}
                <div className="block sm:hidden space-y-3">
                  {filteredAdded.map((p) => {
                    const pTimeFormatted = formatProductTime(p);
                    const currentAdder = getStaffAdder(p);
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => setViewingProduct(p)}
                        className="bg-white border-2 border-stone-200/90 hover:border-emerald-500/70 rounded-2xl p-4 shadow-xs space-y-3 transition-all cursor-pointer active:scale-[0.99] group"
                      >
                        {/* 1. ÜST SƏTİR: ŞƏKİL, AD, KOD VƏ QİYMƏT */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {p.imageUrl ? (
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-200 shrink-0 bg-stone-100 shadow-2xs group-hover:border-emerald-400 transition-colors">
                                <img
                                  src={p.imageUrl}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center border border-stone-200 shrink-0">
                                <ImageIcon size={20} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-black text-stone-950 text-sm sm:text-base truncate block">
                                {p.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono font-black text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs">
                                  {p.code}
                                </span>
                                <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                                  {p.type || 'Qızıl'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-black text-stone-950 text-sm sm:text-base block bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200/80">
                              {p.price ? `${Number(p.price).toLocaleString()} ₼` : '—'}
                            </span>
                          </div>
                        </div>

                        {/* 2. ORTA SƏTİR: ƏYAR VƏ ÇƏKİ */}
                        <div className="grid grid-cols-2 gap-2 bg-stone-50/80 rounded-xl p-2.5 border border-stone-200/70 text-xs font-semibold text-stone-800">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-500 block">Qızıl Əyarı</span>
                            <span className="font-black text-stone-900">{p.carat ? `${p.carat} Əyar` : '—'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-stone-500 block">Çəki / Miqdar</span>
                            <span className="font-black text-stone-900">
                              {p.weight ? `${p.weight} gr` : `${p.stockCount || 1} ədəd`}
                            </span>
                          </div>
                        </div>

                        {/* 3. ALT SƏTİR: ƏLAVƏ EDƏN VƏ ƏLAVƏ EDİLMƏ ZAMANI */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] text-stone-500 font-bold shrink-0">Əlavə edən:</span>
                            <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-950 font-black text-xs px-2.5 py-1 rounded-lg border border-stone-200 truncate">
                              <Users size={12} className="text-stone-500 shrink-0" />
                              <span className="truncate">{currentAdder}</span>
                            </span>
                          </div>
                          <div className="font-mono text-emerald-900 bg-emerald-50/70 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold shrink-0 shadow-2xs">
                            <Clock size={13} className="text-emerald-700 shrink-0" />
                            <span>{pTimeFormatted}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Masaüstü Cədvəl */}
                <div className="hidden sm:block bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100/70 border-b border-stone-200 text-stone-600 uppercase text-[10px] font-black tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 w-14 text-center">Baxış</th>
                        <th className="py-2.5 px-4">Kod</th>
                        <th className="py-2.5 px-4">Məhsulun Adı</th>
                        <th className="py-2.5 px-4">Əyar</th>
                        <th className="py-2.5 px-4">Çəki / Miqdar</th>
                        <th className="py-2.5 px-4">Tarix və Saat</th>
                        <th className="py-2.5 px-4 text-right">Qiymət</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                      {filteredAdded.map((p) => {
                        const pTimeFormatted = formatProductTime(p);
                        return (
                          <tr 
                            key={p.id} 
                            onClick={() => setViewingProduct(p)}
                            className="hover:bg-stone-50/80 transition-colors cursor-pointer"
                          >
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingProduct(p);
                                }}
                                className="p-1.5 bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-700 rounded-xl transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1 font-bold text-[11px] active:scale-95"
                                title="Şəklə və Detallara Bax"
                              >
                                <Eye size={14} />
                                <span className="hidden xl:inline">Bax</span>
                              </button>
                            </td>
                            <td className="py-2.5 px-4 font-mono font-black text-emerald-700 bg-emerald-50/50">{p.code}</td>
                            <td className="py-2.5 px-4 font-bold text-stone-950">{p.name}</td>
                            <td className="py-2.5 px-4">{p.carat || '-'}</td>
                            <td className="py-2.5 px-4 font-semibold text-stone-900">{p.weight} {p.saleType === 'count' ? 'əd' : 'gr'}</td>
                            <td className="py-2.5 px-4 font-mono text-stone-600 font-bold">
                              {pTimeFormatted}
                            </td>
                            <td className="py-2.5 px-4 text-right font-black text-stone-950">
                              {p.price ? `${Number(p.price).toLocaleString()} ₼` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* 4. AUDİT LOQLARI GÖRÜNÜŞÜ */}
        {staffActiveView === 'logs' && (
          <div className="space-y-2.5">
            {filteredLogs.length === 0 ? (
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-10 text-center text-stone-400 text-xs font-semibold">
                Seçilmiş zaman aralığında bu işçiyə aid sistem loqu tapılmadı.
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100/70 border-b border-stone-200 text-stone-600 uppercase text-[10px] font-black tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Tarix və Saat</th>
                      <th className="py-2.5 px-4">Kateqoriya</th>
                      <th className="py-2.5 px-4">Əməliyyat (Action)</th>
                      <th className="py-2.5 px-4">Detallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                    {filteredLogs.map((l) => {
                      const logDate = new Date(l.date);
                      const dateStr = !isNaN(logDate.getTime())
                        ? `${logDate.toLocaleDateString('az-AZ')} ${logDate.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}`
                        : l.date;
                      return (
                        <tr key={l.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-stone-600 whitespace-nowrap">{dateStr}</td>
                          <td className="py-2.5 px-4">
                            <span className="bg-stone-100 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded border border-stone-200 uppercase">
                              {l.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-bold text-stone-950">{l.action}</td>
                          <td className="py-2.5 px-4 text-stone-600 text-[11px]">{l.details || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {renderSharedModals()}
      </div>
    );
  }

  // ===================== TAM EKRAN: BUGÜNKÜ SATIŞLAR SƏHİFƏSİ =====================
  if (activeTab === 'sold') {
    const filteredSales = (Array.isArray(sales) ? sales : []).filter(s => {
      if (soldFilterDate) {
        const sDate = new Date(s.date).toISOString().split('T')[0];
        if (sDate !== soldFilterDate) return false;
      }
      if (soldSellerFilter !== 'all') {
        const seller = (s.sellerName || '').toLowerCase();
        if (!seller.includes(soldSellerFilter.toLowerCase())) return false;
      }
      if (soldSearchQuery.trim()) {
        const q = soldSearchQuery.toLowerCase().trim();
        const matchCode = (s.productCode || '').toLowerCase().includes(q);
        const matchName = (s.productName || '').toLowerCase().includes(q);
        const matchCustomer = (s.customerName || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchCustomer) return false;
      }
      return true; // Bütün satışlar, o cümlədən geri qaytarılanlar göstərilir
    });

    const activeSales = filteredSales.filter(s => s.status !== 'returned');
    const returnedSalesCount = filteredSales.filter(s => s.status === 'returned').length;
    const totalSoldAmount = activeSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    const totalSoldWeight = activeSales.reduce((acc, s) => acc + (Number(s.soldWeight || s.weight) || 0), 0);

    return (
      <div className="px-3 py-3 sm:px-6 md:px-8 space-y-4 max-w-7xl mx-auto bg-white min-h-[calc(100vh-4.5rem)] sm:rounded-3xl sm:border sm:border-stone-200/80 shadow-xs text-stone-900 animate-in fade-in duration-150">
        {/* ÜST BAŞLIQ (FUL EKRAN) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => handleTabChange('overview')}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 border border-stone-200 cursor-pointer shrink-0 shadow-2xs"
            >
              <ArrowLeft size={15} />
              <span>Geri (İcmal)</span>
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base sm:text-lg font-black text-stone-950 truncate">
                Satış Əməliyyatları
              </span>
              <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200 shrink-0">
                {filteredSales.length} satış
              </span>
              {returnedSalesCount > 0 && (
                <span className="text-[11px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-300 shrink-0 shadow-2xs">
                  {returnedSalesCount} qaytarılıb
                </span>
              )}
            </div>
          </div>

          {/* FİLTRELƏR */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Kod, ad və ya müştəri..."
                value={soldSearchQuery}
                onChange={(e) => setSoldSearchQuery(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-xl pl-7 pr-2.5 py-1 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-900 w-36 sm:w-44"
              />
            </div>
            <select
              value={soldSellerFilter}
              onChange={(e) => setSoldSellerFilter(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1 text-xs font-semibold text-stone-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-stone-900"
            >
              <option value="all">Bütün Satıcılar</option>
              {staffMembers.map(u => (
                <option key={u.id} value={u.full_name || u.username}>
                  {u.full_name || u.username}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2 py-1 shadow-2xs">
              <Calendar size={13} className="text-stone-500 shrink-0" />
              <input
                type="date"
                value={soldFilterDate}
                onChange={(e) => setSoldFilterDate(e.target.value)}
                className="bg-transparent font-bold text-xs text-stone-900 focus:outline-none cursor-pointer"
              />
            </div>
            {soldFilterDate !== todayStr && (
              <button
                type="button"
                onClick={() => setSoldFilterDate(todayStr)}
                className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Bugün
              </button>
            )}
          </div>
        </div>

        {/* 3 STATİSTİKA ÇİPİ */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-stone-50 border border-stone-200/90 p-3 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">Cəmi Məbləğ</span>
            <p className="text-base sm:text-2xl font-black text-stone-950 mt-0.5">{totalSoldAmount.toLocaleString()} ₼</p>
          </div>
          <div className="bg-stone-50 border border-stone-200/90 p-3 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">Satış Sayı</span>
            <p className="text-base sm:text-2xl font-black text-stone-950 mt-0.5">{filteredSales.length} <span className="text-xs font-normal text-stone-500">ədəd</span></p>
          </div>
          <div className="bg-stone-50 border border-stone-200/90 p-3 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">Satılan Çəki</span>
            <p className="text-base sm:text-2xl font-black text-stone-950 mt-0.5">{totalSoldWeight.toFixed(2)} <span className="text-xs font-normal text-stone-500">gr</span></p>
          </div>
        </div>

        {/* MOBİL GÖRÜNÜŞ (GENİŞLƏNDİRİLMİŞ VƏ STANDART ÖLÇÜLÜ KARTLAR) */}
        <div className="block md:hidden space-y-3">
          {filteredSales.length === 0 ? (
            <div className="bg-stone-50 rounded-2xl p-8 text-center border-2 border-stone-200 text-stone-500 text-xs sm:text-sm font-semibold">
              Seçilmiş tarixdə satış qeydə alınmayıb.
            </div>
          ) : (
            filteredSales.map(s => {
              const details = getSaleDetails(s);
              return (
                <div 
                  key={s.id} 
                  onClick={() => setViewingSale(s)}
                  className={`border-2 rounded-2xl p-4 shadow-xs space-y-3 transition-all cursor-pointer active:scale-[0.99] group ${
                    s.status === 'returned'
                      ? 'bg-rose-50/40 border-rose-300 hover:border-rose-400'
                      : 'bg-white border-stone-200/90 hover:border-stone-400'
                  }`}
                >
                  {/* 1. ÜST SƏTİR: ŞƏKİL, AD, KOD VƏ MƏBLƏĞ */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {details.imageUrl ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-200 shrink-0 bg-stone-100 shadow-2xs group-hover:border-stone-400 transition-colors">
                          <img
                            src={details.imageUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center border border-stone-200 shrink-0">
                          <ImageIcon size={20} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-black text-stone-950 text-sm sm:text-base truncate block">
                          {s.productName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-black text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs">
                            {s.productCode}
                          </span>
                          <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                            {s.soldWeight ? `${s.soldWeight} gr` : (s.weight ? `${s.weight} gr` : '1 əd')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {s.status === 'returned' ? (
                        <div className="space-y-1">
                          <span className="text-[10px] sm:text-xs font-black uppercase text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-lg block text-center shadow-2xs">
                            GERİ QAYTARILDI
                          </span>
                          <span className="font-bold text-rose-600 line-through text-xs sm:text-sm block">
                            {Number(s.total).toLocaleString()} ₼
                          </span>
                        </div>
                      ) : (
                        <span className="font-black text-stone-950 text-base sm:text-lg block bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200/80">
                          {Number(s.total).toLocaleString()} ₼
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. ORTA SƏTİR: ALICI VƏ SATICI MƏLUMATI */}
                  <div className="grid grid-cols-2 gap-2 bg-stone-50/80 rounded-xl p-2.5 border border-stone-200/70 text-xs text-stone-700">
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Alıcı (Müştəri)</span>
                      <strong className="text-stone-950 font-black text-xs sm:text-sm truncate block">
                        {s.customerName || 'Ümumi Müştəri'}
                      </strong>
                    </div>
                    <div className="text-right truncate">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Satıcı Personal</span>
                      <span className="inline-block bg-stone-100 text-stone-900 px-2 py-0.5 rounded-lg font-black text-xs border border-stone-200 truncate">
                        {formatSellerDisplay(s.sellerName)}
                      </span>
                    </div>
                  </div>

                  {/* 3. ALT SƏTİR: TARİX VƏ SAAT */}
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-600 pt-2 border-t border-stone-100">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-stone-400" />
                      {new Date(s.date).toLocaleDateString('az-AZ')}
                    </span>
                    <span className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-lg">
                      <Clock size={13} className="text-stone-400" />
                      {new Date(s.date).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP CƏDVƏL (FUL EKRAN GENİŞLİYİNDƏ) */}
        <div className="hidden md:block bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-14 text-center">Baxış</th>
                  <th className="py-2.5 px-3">Kod</th>
                  <th className="py-2.5 px-3">Məhsul</th>
                  <th className="py-2.5 px-3">Alıcı (Müştəri)</th>
                  <th className="py-2.5 px-3">Satıcı Personal</th>
                  <th className="py-2.5 px-3">Kateqoriya</th>
                  <th className="py-2.5 px-3">Çəki / Ədəd</th>
                  <th className="py-2.5 px-3">Tarix və Saat</th>
                  <th className="py-2.5 px-3 text-right">Məbləğ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                {filteredSales.map(s => {
                  const details = getSaleDetails(s);
                  const isRet = s.status === 'returned';
                  return (
                    <tr key={s.id} className={`transition-colors ${isRet ? 'bg-rose-50/60 hover:bg-rose-100/60' : 'hover:bg-stone-50'}`}>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setViewingSale(s)}
                          className="p-1.5 bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-700 rounded-xl transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1 font-bold text-[11px] active:scale-95"
                          title="Detallı Baxış və Rəsm"
                        >
                          <Eye size={14} />
                          <span className="hidden xl:inline">Bax</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-emerald-700 bg-emerald-50/50">{s.productCode}</td>
                      <td className="py-2.5 px-3 font-bold text-stone-950">
                        <div className="flex items-center gap-2">
                          {details.imageUrl ? (
                            <img
                              src={details.imageUrl}
                              alt=""
                              onClick={() => setViewingSale(s)}
                              className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-400 flex items-center justify-center border border-stone-200 shrink-0">
                              <ImageIcon size={14} />
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="truncate max-w-[170px]">{s.productName}</span>
                            {isRet && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-300 uppercase shrink-0 shadow-2xs">
                                GERİ QAYTARILDI
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-stone-900">{s.customerName || 'Ümumi Müştəri'}</td>
                      <td className="py-2.5 px-3">
                        <span className="bg-stone-100 text-stone-800 font-bold px-2 py-0.5 rounded text-[11px] border border-stone-200">
                          {formatSellerDisplay(s.sellerName)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-stone-500">{s.type || '-'}</td>
                      <td className="py-2.5 px-3">{s.soldWeight ? `${s.soldWeight} gr` : (s.weight ? `${s.weight} gr` : '1 ədəd')}</td>
                      <td className="py-2.5 px-3 font-mono text-stone-600">
                        {new Date(s.date).toLocaleDateString('az-AZ')} {new Date(s.date).toLocaleTimeString('az-AZ')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isRet ? (
                          <div>
                            <span className="font-bold text-rose-600 line-through text-xs block">
                              {Number(s.total).toLocaleString()} ₼
                            </span>
                            <span className="text-[10px] font-black text-rose-700 block uppercase">
                              Qaytarılıb
                            </span>
                          </div>
                        ) : (
                          <span className="font-black text-stone-950">
                            {Number(s.total).toLocaleString()} ₼
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-stone-400 font-semibold text-xs">
                      Seçilmiş tarixdə satış qeydə alınmayıb.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {renderSharedModals()}
      </div>
    );
  }

  // ===================== TAM EKRAN: BAZAYA ƏLAVƏ EDİLƏN MALLAR =====================
  if (activeTab === 'added') {
    const filteredAdded = (Array.isArray(products) ? products : []).filter(p => {
      const pDate = getProductDateStr(p);
      if (!pDate || pDate !== addedFilterDate) return false;

      if (addedSearchQuery.trim()) {
        const q = addedSearchQuery.toLowerCase().trim();
        const matchCode = (p.code || '').toLowerCase().includes(q);
        const matchName = (p.name || '').toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }
      if (addedFilterStaff !== 'all') {
        const adder = getStaffAdder(p).toLowerCase();
        if (!adder.includes(addedFilterStaff.toLowerCase())) return false;
      }
      return true;
    });

    const totalAddedWeight = filteredAdded.reduce((acc, p) => acc + (Number(p.weight) || 0), 0);
    const totalAddedRevenue = filteredAdded.reduce((acc, p) => acc + (Number(p.price) || 0), 0);

    return (
      <div className="px-3 py-3 sm:px-6 md:px-8 space-y-4 max-w-7xl mx-auto bg-white min-h-[calc(100vh-4.5rem)] sm:rounded-3xl sm:border sm:border-stone-200/80 shadow-xs text-stone-900 animate-in fade-in duration-150">
        {/* ÜST BAŞLIQ (FUL EKRAN) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => handleTabChange('overview')}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 border border-stone-200 cursor-pointer shrink-0 shadow-2xs"
            >
              <ArrowLeft size={15} />
              <span>Geri (İcmal)</span>
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base sm:text-lg font-black text-stone-950 truncate">
                Bazaya Əlavə Edilən Mallar
              </span>
              <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200 shrink-0">
                {filteredAdded.length} ədəd
              </span>
            </div>
          </div>

          {/* FİLTRELƏR */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Kod və ya adla axtar..."
                value={addedSearchQuery}
                onChange={(e) => setAddedSearchQuery(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-xl pl-7 pr-2.5 py-1 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-900 w-36 sm:w-44"
              />
            </div>
            <select
              value={addedFilterStaff}
              onChange={(e) => setAddedFilterStaff(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-1 text-xs font-semibold text-stone-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-stone-900 cursor-pointer"
            >
              <option value="all">Bütün Əməkdaşlar</option>
              <option value="Admin">Admin</option>
              {staffMembers.map(u => (
                <option key={u.id} value={u.full_name || u.username}>
                  {u.full_name || u.username}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2 py-1 shadow-2xs">
              <Calendar size={13} className="text-stone-500 shrink-0" />
              <input
                type="date"
                value={addedFilterDate}
                onChange={(e) => setAddedFilterDate(e.target.value)}
                className="bg-transparent font-bold text-xs text-stone-900 focus:outline-none cursor-pointer"
              />
            </div>
            {addedFilterDate !== todayStr && (
              <button
                type="button"
                onClick={() => setAddedFilterDate(todayStr)}
                className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Bugün
              </button>
            )}
          </div>
        </div>

        {/* 3 STATİSTİKA ÇİPİ */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-stone-50 border border-stone-200/90 p-3 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">Məhsul Sayı</span>
            <p className="text-base sm:text-2xl font-black text-stone-950 mt-0.5">{filteredAdded.length} <span className="text-xs font-normal text-stone-500">ədəd</span></p>
          </div>
          <div className="bg-stone-50 border border-stone-200/90 p-3 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">Ümumi Çəki</span>
            <p className="text-base sm:text-2xl font-black text-stone-950 mt-0.5">{totalAddedWeight.toFixed(2)} <span className="text-xs font-normal text-stone-500">gr</span></p>
          </div>
          <div className="bg-stone-50 border border-stone-200/90 p-3 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">Satış Dəyəri</span>
            <p className="text-base sm:text-2xl font-black text-stone-950 mt-0.5">{totalAddedRevenue.toLocaleString()} ₼</p>
          </div>
        </div>

        {/* MOBİL GÖRÜNÜŞ (GENİŞLƏNDİRİLMİŞ VƏ STANDART ÖLÇÜLÜ KARTLAR) */}
        <div className="block md:hidden space-y-3">
          {filteredAdded.length === 0 ? (
            <div className="bg-stone-50 rounded-2xl p-8 text-center border-2 border-stone-200 text-stone-500 text-xs sm:text-sm font-semibold">
              Seçilmiş tarixdə bazaya yeni mal əlavə edilməyib.
            </div>
          ) : (
            filteredAdded.map(p => {
              const fullTimeStr = formatProductTime(p);
              const currentAdder = getStaffAdder(p);
              return (
                <div 
                  key={p.id} 
                  onClick={() => setViewingProduct(p)}
                  className="bg-white border-2 border-stone-200/90 hover:border-emerald-500/70 rounded-2xl p-4 shadow-xs space-y-3 transition-all cursor-pointer active:scale-[0.99] group"
                >
                  {/* 1. ÜST SƏTİR: ŞƏKİL, AD, KOD VƏ QİYMƏT */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {p.imageUrl ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-200 shrink-0 bg-stone-100 shadow-2xs group-hover:border-emerald-400 transition-colors">
                          <img
                            src={p.imageUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center border border-stone-200 shrink-0">
                          <ImageIcon size={20} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-black text-stone-950 text-sm sm:text-base truncate block">
                          {p.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-black text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs">
                            {p.code}
                          </span>
                          <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                            {p.type || 'Qızıl'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-stone-950 text-sm sm:text-base block bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200/80">
                        {p.price ? `${Number(p.price).toLocaleString()} ₼` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* 2. ORTA SƏTİR: ƏYAR VƏ ÇƏKİ */}
                  <div className="grid grid-cols-2 gap-2 bg-stone-50/80 rounded-xl p-2.5 border border-stone-200/70 text-xs font-semibold text-stone-800">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-500 block">Qızıl Əyarı</span>
                      <span className="font-black text-stone-900">{p.carat ? `${p.carat} Əyar` : '—'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-stone-500 block">Çəki / Miqdar</span>
                      <span className="font-black text-stone-900">
                        {p.weight ? `${p.weight} gr` : `${p.stockCount || 1} ədəd`}
                      </span>
                    </div>
                  </div>

                  {/* 3. ALT SƏTİR: ƏLAVƏ EDƏN VƏ ƏLAVƏ EDİLMƏ ZAMANI */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[11px] text-stone-500 font-bold shrink-0">Əlavə edən:</span>
                      <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-950 font-black text-xs px-2.5 py-1 rounded-lg border border-stone-200 truncate">
                        <Users size={12} className="text-stone-500 shrink-0" />
                        <span className="truncate">{currentAdder}</span>
                      </span>
                    </div>
                    <div className="font-mono text-emerald-900 bg-emerald-50/70 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold shrink-0 shadow-2xs">
                      <Clock size={13} className="text-emerald-700 shrink-0" />
                      <span>{fullTimeStr}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP CƏDVƏL (FUL EKRAN) */}
        <div className="hidden md:block bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-14 text-center">Baxış</th>
                  <th className="py-2.5 px-3">Kod</th>
                  <th className="py-2.5 px-3">Məhsul</th>
                  <th className="py-2.5 px-3">Kateqoriya / Əyar</th>
                  <th className="py-2.5 px-3">Çəki / Ədəd</th>
                  <th className="py-2.5 px-3">Əlavə Edən Əməkdaş</th>
                  <th className="py-2.5 px-3">Tarix və Saat</th>
                  <th className="py-2.5 px-3 text-right">Satış Qiyməti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                {filteredAdded.map(p => {
                  const timeStr = formatProductTime(p);
                  const currentAdder = getStaffAdder(p);
                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => setViewingProduct(p)}
                      className="hover:bg-stone-50 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingProduct(p);
                          }}
                          className="p-1.5 bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-700 rounded-xl transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1 font-bold text-[11px] active:scale-95"
                          title="Şəklə və Detallara Bax"
                        >
                          <Eye size={14} />
                          <span className="hidden xl:inline">Bax</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-emerald-700 bg-emerald-50/50">
                        {p.code}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-stone-950">
                        <div className="flex items-center gap-2">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-400 flex items-center justify-center border border-stone-200 shrink-0">
                              <ImageIcon size={14} />
                            </div>
                          )}
                          <span className="truncate max-w-[170px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-stone-500">{p.type} {p.carat ? `(${p.carat})` : ''}</td>
                      <td className="py-2.5 px-3 font-bold text-stone-900">{p.weight ? `${p.weight} gr` : `${p.stockCount || 1} ədəd`}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-900 font-black px-2.5 py-1 rounded-lg text-xs border border-stone-200">
                          <Users size={12} className="text-stone-500" />
                          <span>{currentAdder}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-700 font-bold">{timeStr}</td>
                      <td className="py-2.5 px-3 text-right font-black text-stone-950">
                        {p.price ? `${Number(p.price).toLocaleString()} ₼` : '-'}
                      </td>
                    </tr>
                  );
                })}
                {filteredAdded.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400 font-semibold text-xs">
                      Seçilmiş tarixdə bazaya heç bir yeni mal əlavə edilməyib.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {renderSharedModals()}
      </div>
    );
  }

  // ===================== TAM EKRAN: PERSONALLAR SƏHİFƏSİ =====================
  if (activeTab === 'staff') {
    return (
      <div className="px-3 py-3 sm:px-6 md:px-8 space-y-4 max-w-7xl mx-auto bg-white min-h-[calc(100vh-4.5rem)] sm:rounded-3xl sm:border sm:border-stone-200/80 shadow-xs text-stone-900 animate-in fade-in duration-150">
        {/* ÜST BAŞLIQ (FUL EKRAN) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => handleTabChange('overview')}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 border border-stone-200 cursor-pointer shrink-0 shadow-2xs"
            >
              <ArrowLeft size={15} />
              <span>Geri (İcmal)</span>
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base sm:text-lg font-black text-stone-950 truncate">
                Personal Heyəti və Hesablar
              </span>
              <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200 shrink-0">
                {staffMembers.length} nəfər
              </span>
            </div>
          </div>

          {/* SAĞ TƏRƏF FİLTRELƏR VƏ YENİ İŞÇİ DÜYMƏSİ */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2 py-1 shadow-2xs">
              <Calendar size={13} className="text-stone-500 shrink-0" />
              <input
                type="date"
                value={staffDateFilter}
                onChange={(e) => setStaffDateFilter(e.target.value)}
                className="bg-transparent font-bold text-xs text-stone-900 focus:outline-none cursor-pointer"
              />
            </div>
            {staffDateFilter !== todayStr && (
              <button
                type="button"
                onClick={() => setStaffDateFilter(todayStr)}
                className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Bugün
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCreateStaffModal(true)}
              className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <PlusCircle size={14} />
              <span>+ Yeni İşçi</span>
            </button>
          </div>
        </div>

        {/* PERSONAL KARTLARI (STANDART ÖLÇÜLÜ VƏ OXUNAQLI) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {staffMembers.map((staff) => {
            const stats = getStaffStats(staff, staffDateFilter);
            return (
              <div
                key={staff.id}
                className="bg-white border-2 border-stone-200/90 hover:border-stone-400 rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-stone-900 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {(staff.full_name || staff.username).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-black text-stone-950 truncate">
                        {staff.full_name || staff.username}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200">
                          {staff.role === 'shop' ? 'Mağaza' : 'Personal'}
                        </span>
                        <span className="text-xs text-stone-500 font-mono font-bold truncate">@{staff.username}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 bg-stone-50 rounded-xl p-2.5 border border-stone-200/80 text-center">
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase block font-bold">Satış</span>
                      <span className="font-black text-stone-950 text-xs sm:text-sm">{stats.sales.length}</span>
                    </div>
                    <div className="border-x border-stone-200 px-1">
                      <span className="text-[10px] text-stone-500 uppercase block font-bold">Məbləğ</span>
                      <span className="font-black text-stone-950 text-xs sm:text-sm">{stats.totalSoldAmount.toLocaleString()} ₼</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase block font-bold">Əlavə</span>
                      <span className="font-black text-stone-950 text-xs sm:text-sm">{stats.addedProducts.length}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStaff(staff);
                      setStaffTimeMode('today');
                      setStaffActiveView('timeline');
                    }}
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98 cursor-pointer"
                  >
                    <Eye size={14} />
                    <span>Gündəlik Əməliyyatlar (Bugün)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStaff(staff);
                      setStaffTimeMode('all');
                      setStaffActiveView('timeline');
                    }}
                    className="w-full bg-stone-100 hover:bg-stone-200 text-stone-900 font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all border border-stone-300 shadow-2xs active:scale-98 cursor-pointer"
                  >
                    <History size={14} className="text-stone-700" />
                    <span>🕒 Bütün Keçmiş Hərəkətlər</span>
                  </button>

                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => { setShowResetModal(staff); setResetPasswordInput(''); }}
                      className="flex-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 py-1.5 rounded-lg border border-stone-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <KeyRound size={11} />
                      <span>Şifrə Sıfırla</span>
                    </button>

                    {staff.username?.toLowerCase().replace(/^@/, '') !== 'admin' && 
                     staff.username?.toLowerCase().replace(/^@/, '') !== 'magaza' && 
                     staff.role !== 'shop' ? (
                      <button
                        type="button"
                        onClick={() => { setUserToDelete(staff); setDeleteError(null); }}
                        className="text-[11px] font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Personalı Sil"
                      >
                        <Trash2 size={11} />
                        <span>Sil</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1.5 rounded-lg select-none flex items-center gap-1 shrink-0" title="Bu hesab daimidir və heç vaxt silinə bilməz">
                        🔒 Daimi Hesab
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {renderSharedModals()}
      </div>
    );
  }

  // ===================== TAM EKRAN: MAĞAZA KASSA SATIŞLARI =====================
  if (activeTab === 'shop') {
    return (
      <div className="px-3 py-3 sm:px-6 md:px-8 space-y-4 max-w-7xl mx-auto bg-white min-h-[calc(100vh-4.5rem)] sm:rounded-3xl sm:border sm:border-stone-200/80 shadow-xs text-stone-900 animate-in fade-in duration-150">
        {/* ÜST BAŞLIQ (FUL EKRAN) */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => handleTabChange('overview')}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 border border-stone-200 cursor-pointer shrink-0 shadow-2xs"
            >
              <ArrowLeft size={15} />
              <span>Geri (İcmal)</span>
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base sm:text-lg font-black text-stone-950 truncate">
                Mağaza Kassa Satışları
              </span>
              <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200 shrink-0">
                {todayRevenue.toLocaleString()} ₼
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage(Page.Sales)}
            className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <ShoppingBag size={14} />
            <span>Satışı Aç</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center">
            <span className="text-[10px] font-bold text-stone-500 uppercase">Kassa</span>
            <p className="text-base sm:text-2xl font-black text-stone-900 mt-0.5">{todayRevenue.toLocaleString()} ₼</p>
            <p className="text-[10px] text-stone-500">{todaySales.length} satış</p>
          </div>

          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center">
            <span className="text-[10px] font-bold text-stone-500 uppercase">Ehtiyat</span>
            <p className="text-base sm:text-2xl font-black text-stone-900 mt-0.5">
              {products.filter(p => (Number(p.stockCount) || 0) > 0 && !p.isReturned).length}
            </p>
            <p className="text-[10px] text-stone-500">vitrində</p>
          </div>

          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center">
            <span className="text-[10px] font-bold text-stone-500 uppercase">İadələr</span>
            <p className="text-base sm:text-2xl font-black text-stone-900 mt-0.5">
              {products.filter(p => p.isReturned).length}
            </p>
            <p className="text-[10px] text-stone-500">məhsul</p>
          </div>
        </div>

        {/* MOBİL GÖRÜNÜŞ (GENİŞLƏNDİRİLMİŞ VƏ STANDART ÖLÇÜLÜ KARTLAR) */}
        <div className="block md:hidden space-y-3">
          {todaySales.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-xs sm:text-sm font-semibold bg-stone-50 rounded-2xl border-2 border-stone-200">
              Bu gün hələ satış yoxdur.
            </div>
          ) : (
            todaySales.map(s => {
              const details = getSaleDetails(s);
              const isRet = s.status === 'returned';
              return (
                <div 
                  key={s.id} 
                  onClick={() => setViewingSale(s)}
                  className={`border-2 rounded-2xl p-4 shadow-xs space-y-3 transition-all cursor-pointer active:scale-[0.99] group ${
                    isRet
                      ? 'bg-rose-50/40 border-rose-300 hover:border-rose-400'
                      : 'bg-white border-stone-200/90 hover:border-stone-400'
                  }`}
                >
                  {/* 1. ÜST SƏTİR: ŞƏKİL, AD, KOD VƏ MƏBLƏĞ */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {details.imageUrl ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-200 shrink-0 bg-stone-100 shadow-2xs group-hover:border-stone-400 transition-colors">
                          <img
                            src={details.imageUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center border border-stone-200 shrink-0">
                          <ImageIcon size={20} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-black text-stone-950 text-sm sm:text-base truncate block">
                          {s.productName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-black text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs">
                            {s.productCode}
                          </span>
                          <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                            {s.soldWeight ? `${s.soldWeight} gr` : (s.weight ? `${s.weight} gr` : '1 əd')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {isRet ? (
                        <div className="space-y-1">
                          <span className="text-[10px] sm:text-xs font-black uppercase text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-lg block text-center shadow-2xs">
                            GERİ QAYTARILDI
                          </span>
                          <span className="font-bold text-rose-600 line-through text-xs sm:text-sm block">
                            {Number(s.total).toLocaleString()} ₼
                          </span>
                        </div>
                      ) : (
                        <span className="font-black text-stone-950 text-base sm:text-lg block bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200/80">
                          {Number(s.total).toLocaleString()} ₼
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. ORTA SƏTİR: ALICI VƏ SATICI MƏLUMATI */}
                  <div className="grid grid-cols-2 gap-2 bg-stone-50/80 rounded-xl p-2.5 border border-stone-200/70 text-xs text-stone-700">
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Alıcı (Müştəri)</span>
                      <strong className="text-stone-950 font-black text-xs sm:text-sm truncate block">
                        {s.customerName || 'Ümumi Müştəri'}
                      </strong>
                    </div>
                    <div className="text-right truncate">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Satıcı</span>
                      <span className="inline-block bg-stone-100 text-stone-900 px-2 py-0.5 rounded-lg font-black text-xs border border-stone-200 truncate">
                        {formatSellerDisplay(s.sellerName)}
                      </span>
                    </div>
                  </div>

                  {/* 3. ALT SƏTİR: SAAT */}
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-600 pt-2 border-t border-stone-100">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-stone-400" />
                      Bugün
                    </span>
                    <span className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-lg">
                      <Clock size={13} className="text-stone-400" />
                      {new Date(s.date).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP CƏDVƏL */}
        <div className="hidden md:block bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-14 text-center">Baxış</th>
                  <th className="py-2.5 px-3">Kod</th>
                  <th className="py-2.5 px-3">Məhsul</th>
                  <th className="py-2.5 px-3">Alıcı (Müştəri)</th>
                  <th className="py-2.5 px-3">Satıcı</th>
                  <th className="py-2.5 px-3">Saat</th>
                  <th className="py-2.5 px-3 text-right">Məbləğ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                {todaySales.map(s => {
                  const details = getSaleDetails(s);
                  const isRet = s.status === 'returned';
                  return (
                    <tr key={s.id} className={`transition-colors ${isRet ? 'bg-rose-50/60 hover:bg-rose-100/60' : 'hover:bg-stone-50'}`}>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setViewingSale(s)}
                          className="p-1.5 bg-stone-100 hover:bg-stone-900 hover:text-white text-stone-700 rounded-xl transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1 font-bold text-[11px] active:scale-95"
                          title="Detallı Baxış və Rəsm"
                        >
                          <Eye size={14} />
                          <span className="hidden xl:inline">Bax</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-emerald-700 bg-emerald-50/50">{s.productCode}</td>
                      <td className="py-2.5 px-3 font-bold text-stone-950">
                        <div className="flex items-center gap-2">
                          {details.imageUrl ? (
                            <img
                              src={details.imageUrl}
                              alt=""
                              onClick={() => setViewingSale(s)}
                              className="w-8 h-8 rounded-lg object-cover border border-stone-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-400 flex items-center justify-center border border-stone-200 shrink-0">
                              <ImageIcon size={14} />
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="truncate max-w-[170px]">{s.productName}</span>
                            {isRet && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-300 uppercase shrink-0 shadow-2xs">
                                GERİ QAYTARILDI
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-stone-900">{s.customerName || 'Ümumi Müştəri'}</td>
                      <td className="py-2.5 px-3">
                        <span className="bg-stone-100 text-stone-800 font-bold px-2 py-0.5 rounded text-[11px] border border-stone-200">
                          {formatSellerDisplay(s.sellerName)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-500">
                        {new Date(s.date).toLocaleTimeString('az-AZ')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isRet ? (
                          <div>
                            <span className="font-bold text-rose-600 line-through text-xs block">
                              {Number(s.total).toLocaleString()} ₼
                            </span>
                            <span className="text-[10px] font-black text-rose-700 block uppercase">
                              Qaytarılıb
                            </span>
                          </div>
                        ) : (
                          <span className="font-black text-stone-900">
                            {Number(s.total).toLocaleString()} ₼
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {todaySales.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-400 font-semibold text-xs">
                      Bu gün hələ heç bir satış qeydə alınmayıb.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {renderSharedModals()}
      </div>
    );
  }

  // ===================== ƏSAS İCMAL SƏHİFƏSİ (OVERVIEW: 4 ƏSAS KART) =====================
  return (
    <div className="px-2.5 py-3 sm:px-4 md:px-6 space-y-3 sm:space-y-4 max-w-7xl mx-auto bg-white min-h-[calc(100vh-4.5rem)] sm:rounded-3xl sm:border sm:border-stone-200/80 shadow-sm animate-in fade-in duration-200">
      {/* ÜST BAŞLIQ */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Crown size={16} />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-black text-stone-900 truncate leading-tight">
              Etibar Nuriyev
            </h1>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              Müdir Paneli
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowCreateStaffModal(true)}
            className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <PlusCircle size={13} />
            <span>+ Personal</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(Page.Approvals)}
            className={`relative px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-[11px] sm:text-xs flex items-center gap-1 border transition-all active:scale-95 cursor-pointer ${
              pendingCount > 0 
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse' 
                : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Bell size={13} className={pendingCount > 0 ? "text-amber-500" : ""} />
            <span className="hidden xs:inline">Bildirişlər</span>
            {pendingCount > 0 && (
              <span className="bg-rose-600 text-white px-1.5 py-0.2 rounded-full text-[9px] font-black">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4 ƏSAS KART (STANDART ÖLÇÜLÜ VƏ BÖYÜDÜLMÜŞ OXUNAQLI ŞRİFTLƏR) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* 1. Bugünkü Satış Kartı */}
        <button
          type="button"
          onClick={() => {
            handleTabChange('sold');
            setSoldFilterDate(todayStr);
            setSoldSellerFilter('all');
            setSoldSearchQuery('');
          }}
          className="text-left p-3.5 sm:p-4 rounded-2xl border-2 border-stone-200/90 bg-stone-50/90 hover:bg-stone-100 hover:border-stone-400 transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between group shadow-xs"
        >
          <div className="flex items-center justify-between w-full">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-600 group-hover:text-stone-950">
              Bugünkü Satış
            </p>
            <ArrowRight size={14} className="text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-950" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-stone-950 mt-1.5">
            {todayRevenue.toLocaleString()} ₼
          </p>
          <div className="flex items-center justify-between w-full mt-1">
            <span className="text-xs font-semibold text-stone-500">
              {todaySales.length} əməliyyat
            </span>
            <span className="text-xs font-black underline text-stone-800 group-hover:text-stone-950">
              Bax →
            </span>
          </div>
        </button>

        {/* 2. Bazaya Əlavə Kartı */}
        <button
          type="button"
          onClick={() => {
            handleTabChange('added');
            setAddedFilterDate(todayStr);
            setAddedFilterStaff('all');
            setAddedSearchQuery('');
          }}
          className="text-left p-3.5 sm:p-4 rounded-2xl border-2 border-stone-200/90 bg-stone-50/90 hover:bg-stone-100 hover:border-stone-400 transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between group shadow-xs"
        >
          <div className="flex items-center justify-between w-full">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-600 group-hover:text-stone-950">
              Bazaya Əlavə
            </p>
            <ArrowRight size={14} className="text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-950" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-stone-950 mt-1.5">
            {todayAddedProducts.length} ədəd
          </p>
          <div className="flex items-center justify-between w-full mt-1">
            <span className="text-xs font-semibold text-stone-500">
              Bugün daxil olan
            </span>
            <span className="text-xs font-black underline text-stone-800 group-hover:text-stone-950">
              Bax →
            </span>
          </div>
        </button>

        {/* 3. Personallar Kartı */}
        <button
          type="button"
          onClick={() => handleTabChange('staff')}
          className="text-left p-3.5 sm:p-4 rounded-2xl border-2 border-stone-200/90 bg-stone-50/90 hover:bg-stone-100 hover:border-stone-400 transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between group shadow-xs"
        >
          <div className="flex items-center justify-between w-full">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-600 group-hover:text-stone-950">
              Personallar
            </p>
            <ArrowRight size={14} className="text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-950" />
          </div>
          <p className="text-lg sm:text-2xl font-black text-stone-950 mt-1.5">
            {staffMembers.length} nəfər
          </p>
          <div className="flex items-center justify-between w-full mt-1">
            <span className="text-xs font-semibold text-stone-500">
              Aktiv heyət
            </span>
            <span className="text-xs font-black underline text-stone-800 group-hover:text-stone-950">
              Bax →
            </span>
          </div>
        </button>

        {/* 4. Təsdiq Gözləyən Kartı */}
        <button
          type="button"
          onClick={() => setCurrentPage(Page.Approvals)}
          className={`text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between group shadow-xs ${
            pendingCount > 0
              ? 'bg-rose-50/80 border-rose-400 text-rose-950 hover:bg-rose-100/80'
              : 'bg-stone-50/90 hover:bg-stone-100 hover:border-stone-400 border-stone-200/90 text-stone-900'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <p className={`text-xs font-bold uppercase tracking-wider ${
              pendingCount > 0 ? 'text-rose-700 font-black' : 'text-stone-600 group-hover:text-stone-950'
            }`}>
              Təsdiq Gözləyən
            </p>
            <ArrowRight size={14} className={`transition-transform group-hover:translate-x-0.5 ${
              pendingCount > 0 ? 'text-rose-600' : 'text-stone-400 group-hover:text-stone-950'
            }`} />
          </div>
          <p className={`text-lg sm:text-2xl font-black mt-1.5 ${
            pendingCount > 0 ? 'text-rose-700' : 'text-stone-950'
          }`}>
            {pendingCount} sorğu
          </p>
          <div className="flex items-center justify-between w-full mt-1">
            <span className={`text-xs font-semibold ${
              pendingCount > 0 ? 'text-rose-700' : 'text-stone-500'
            }`}>
              {pendingCount > 0 ? 'Təcili baxış' : 'Qaytarma / silmə'}
            </span>
            <span className={`text-xs font-black underline ${
              pendingCount > 0 ? 'text-rose-800' : 'text-stone-800 group-hover:text-stone-950'
            }`}>
              Bax →
            </span>
          </div>
        </button>
      </div>

      {/* TƏSDİQ BİLDİRİŞİ (YALNIZ SORĞU OLDUQDA XIRDA 1-SƏTİRLİK BANNER) */}
      {pendingCount > 0 && (
        <div 
          onClick={() => setCurrentPage(Page.Approvals)}
          className="bg-amber-50 border border-amber-300 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs text-amber-950 cursor-pointer active:bg-amber-100 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span className="font-bold text-xs sm:text-sm truncate">
              {pendingCount} əməliyyat sizin təsdiqinizi gözləyir
            </span>
          </div>
          <span className="text-xs font-black text-amber-800 underline shrink-0">
            Bax →
          </span>
        </div>
      )}

      {/* İCMAL FƏALİYYƏTLƏRİ: 3 ƏTRAFLI BÖLMƏ KARTI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {/* 1. Bugünkü Satış Detalı */}
        <div 
          onClick={() => {
            handleTabChange('sold');
            setSoldFilterDate(todayStr);
            setSoldSellerFilter('all');
            setSoldSearchQuery('');
          }}
          className="bg-white border-2 border-stone-200/90 hover:border-stone-400 rounded-2xl p-4 shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center border border-stone-200">
                <ShoppingBag size={18} />
              </div>
              <span className="text-xs font-bold text-stone-600 uppercase bg-stone-100 px-2 py-0.5 rounded">
                Bugünkü Satış
              </span>
            </div>
            <h3 className="text-xl font-black text-stone-950">{todayRevenue.toLocaleString()} ₼</h3>
            <p className="text-xs text-stone-500 mt-1">{todaySales.length} əməliyyat qeydə alınıb</p>

            {todaySales.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-stone-100 space-y-1.5">
                {todaySales.slice(0, 3).map(s => (
                  <div 
                    key={s.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingSale(s);
                    }}
                    className="flex items-center justify-between text-xs text-stone-700 hover:text-stone-950 p-1.5 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer"
                    title="Detallara bax"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Eye size={13} className="text-stone-400 shrink-0" />
                      <span className="truncate max-w-[130px] font-bold text-stone-900">{s.productName}</span>
                    </div>
                    <span className="font-black text-stone-950 shrink-0">{Number(s.total).toLocaleString()} ₼</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-2.5 border-t border-stone-100 flex items-center justify-between text-stone-800 font-bold text-xs group-hover:text-stone-950">
            <span>Bütün Satışlara Bax (Ful Ekran)</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 2. Bazaya Əlavə Detalı */}
        <div 
          onClick={() => {
            handleTabChange('added');
            setAddedFilterDate(todayStr);
            setAddedFilterStaff('all');
            setAddedSearchQuery('');
          }}
          className="bg-white border-2 border-stone-200/90 hover:border-stone-400 rounded-2xl p-4 shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center border border-stone-200">
                <Package size={18} />
              </div>
              <span className="text-xs font-bold text-stone-600 uppercase bg-stone-100 px-2 py-0.5 rounded">
                Bazaya Əlavə
              </span>
            </div>
            <h3 className="text-xl font-black text-stone-950">{todayAddedProducts.length} ədəd</h3>
            <p className="text-xs text-stone-500 mt-1">Bugün daxil olan mallar ({todayAddedWeight.toFixed(1)} gr)</p>

            {todayAddedProducts.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-stone-100 space-y-1.5">
                {todayAddedProducts.slice(0, 3).map(p => (
                  <div 
                    key={p.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingProduct(p);
                    }}
                    className="flex justify-between items-center text-xs text-stone-700 hover:text-stone-950 p-1.5 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer"
                    title="Detallara və Şəklə Bax"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Eye size={13} className="text-stone-400 shrink-0" />
                      <span className="truncate max-w-[140px] font-bold text-stone-900">{p.name}</span>
                    </div>
                    <span className="font-mono font-black text-xs text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md shrink-0">
                      {p.code}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-2.5 border-t border-stone-100 flex items-center justify-between text-stone-800 font-bold text-xs group-hover:text-stone-950">
            <span>Bütün Əlavələrə Bax (Ful Ekran)</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* 3. Personallar Detalı */}
        <div 
          onClick={() => handleTabChange('staff')}
          className="bg-white border border-stone-200 hover:border-stone-400 rounded-2xl p-4 shadow-2xs transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center border border-stone-200">
                <Users size={18} />
              </div>
              <span className="text-[10px] font-bold text-stone-500 uppercase bg-stone-100 px-2 py-0.5 rounded">
                Personallar ({staffMembers.length})
              </span>
            </div>
            <h3 className="text-lg font-black text-stone-900">Personal Fəaliyyəti</h3>
            <div className="mt-2 flex flex-wrap gap-1">
              {staffMembers.slice(0, 4).map(u => (
                <span key={u.id} className="text-[10px] font-medium bg-stone-50 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200">
                  {u.full_name || u.username}
                </span>
              ))}
              {staffMembers.length > 4 && (
                <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md">
                  +{staffMembers.length - 4}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-stone-100 flex items-center justify-between text-stone-800 font-bold text-xs group-hover:text-stone-950">
            <span>Bütün Personallara Bax (Ful Ekran)</span>
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* SHARED MODALS & NOTIFICATIONS */}
      {renderSharedModals()}
    </div>
  );
};
