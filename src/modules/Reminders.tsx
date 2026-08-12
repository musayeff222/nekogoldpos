import React, { useState } from 'react';
import { 
  Bell, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  Package, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  Sparkles, 
  X,
  Tag,
  Check,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { Reminder, Product, Customer, SystemLog } from '@/types';

interface RemindersModuleProps {
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  products: Product[];
  customers: Customer[];
  addLog: (action: string, category: SystemLog['category'], details?: string) => void;
}

export const RemindersModule: React.FC<RemindersModuleProps> = ({
  reminders = [],
  setReminders,
  products = [],
  customers = [],
  addLog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Bütün');
  const [statusTab, setStatusTab] = useState<'active' | 'completed'>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<Reminder['category']>('Zərgərdə');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');

  // Search helpers for dropdowns inside modal
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const openNewModal = () => {
    setEditingReminder(null);
    setTitle('');
    setNote('');
    setCategory('Zərgərdə');
    setSelectedProductId('');
    setSelectedCustomerId('');
    setDueDate('');
    setProductSearch('');
    setCustomerSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = (rem: Reminder) => {
    setEditingReminder(rem);
    setTitle(rem.title);
    setNote(rem.note || '');
    setCategory(rem.category);
    setSelectedProductId(rem.productId || '');
    setSelectedCustomerId(rem.customerId || '');
    setDueDate(rem.dueDate || '');
    setProductSearch('');
    setCustomerSearch('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Zəhmət olmasa xatırlatma mövzusunu yazın!");
      return;
    }

    const linkedProduct = products.find(p => p.id === selectedProductId);
    const linkedCustomer = customers.find(c => c.id === selectedCustomerId);

    if (editingReminder) {
      const updated: Reminder = {
        ...editingReminder,
        title: title.trim(),
        note: note.trim() || undefined,
        category,
        productId: linkedProduct ? linkedProduct.id : undefined,
        productName: linkedProduct ? linkedProduct.name : undefined,
        productCode: linkedProduct ? linkedProduct.code : undefined,
        customerId: linkedCustomer ? linkedCustomer.id : undefined,
        customerName: linkedCustomer ? linkedCustomer.fullName : undefined,
        dueDate: dueDate || undefined
      };

      setReminders(prev => prev.map(r => r.id === updated.id ? updated : r));
      addLog('Xatırlatma Yeniləndi', 'SYSTEM', `Mövzu: ${updated.title}`);
    } else {
      const newRem: Reminder = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        title: title.trim(),
        note: note.trim() || undefined,
        category,
        productId: linkedProduct ? linkedProduct.id : undefined,
        productName: linkedProduct ? linkedProduct.name : undefined,
        productCode: linkedProduct ? linkedProduct.code : undefined,
        customerId: linkedCustomer ? linkedCustomer.id : undefined,
        customerName: linkedCustomer ? linkedCustomer.fullName : undefined,
        dueDate: dueDate || undefined,
        isCompleted: false,
        createdAt: new Date().toISOString()
      };

      setReminders(prev => [newRem, ...prev]);
      addLog('Yeni Xatırlatma Əlavə Edildi', 'SYSTEM', `Mövzu: ${newRem.title}`);
    }

    setIsModalOpen(false);
  };

  const toggleComplete = (id: string) => {
    setReminders(prev => prev.map(r => {
      if (r.id === id) {
        const isComp = !r.isCompleted;
        if (isComp) {
          addLog('Xatırlatma Tamamlandı', 'SYSTEM', `Mövzu: ${r.title}`);
        }
        return {
          ...r,
          isCompleted: isComp,
          completedAt: isComp ? new Date().toISOString() : undefined
        };
      }
      return r;
    }));
  };

  const handleDelete = (id: string, remTitle: string) => {
    if (confirm(`'${remTitle}' xatırlatmasını silmək istədiyinizdən əminsiniz?`)) {
      setReminders(prev => prev.filter(r => r.id !== id));
      addLog('Xatırlatma Silindi', 'SYSTEM', `Mövzu: ${remTitle}`);
    }
  };

  // Filter logic
  const filteredReminders = reminders.filter(r => {
    // Status tab filter
    if (statusTab === 'active' && r.isCompleted) return false;
    if (statusTab === 'completed' && !r.isCompleted) return false;

    // Category filter
    if (selectedCategory !== 'Bütün' && r.category !== selectedCategory) return false;

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchNote = r.note?.toLowerCase().includes(q) || false;
      const matchProdCode = r.productCode?.toLowerCase().includes(q) || false;
      const matchProdName = r.productName?.toLowerCase().includes(q) || false;
      const matchCust = r.customerName?.toLowerCase().includes(q) || false;
      return matchTitle || matchNote || matchProdCode || matchProdName || matchCust;
    }

    return true;
  });

  // Category badge color helper
  const getCategoryBadge = (cat: Reminder['category']) => {
    switch (cat) {
      case 'Zərgərdə':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Müştəridə':
        return 'bg-sky-100 text-sky-900 border-sky-300';
      case 'Sifariş':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Təcili':
        return 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse';
      case 'Digər':
      default:
        return 'bg-stone-200 text-stone-800 border-stone-300';
    }
  };

  // Category list
  const categories: Reminder['category'][] = ['Zərgərdə', 'Müştəridə', 'Sifariş', 'Təcili', 'Digər'];

  // Counts
  const activeCount = reminders.filter(r => !r.isCompleted).length;
  const completedCount = reminders.filter(r => r.isCompleted).length;
  const zergardeCount = reminders.filter(r => !r.isCompleted && r.category === 'Zərgərdə').length;
  const musterideCount = reminders.filter(r => !r.isCompleted && r.category === 'Müştəridə').length;

  // Filter products for select dropdown inside modal
  const filteredProductsSelect = products.filter(p => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
  }).slice(0, 30);

  // Filter customers for select dropdown inside modal
  const filteredCustomersSelect = customers.filter(c => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase();
    return c.fullName.toLowerCase().includes(q) || c.phone.includes(q);
  }).slice(0, 30);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-stone-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-stone-900 uppercase tracking-tight">
                XATIRLATMALAR VƏ QEYDLƏR
              </h1>
              <p className="text-xs md:text-sm font-bold text-stone-500">
                Zərgərdə olan mallar, müştərilərə baxmağa verilənlər və xüsusi tapşırıqlar
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openNewModal}
          className="bg-amber-500 hover:bg-amber-600 text-stone-950 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
        >
          <Plus size={18} strokeWidth={3} />
          <span>YENİ XATIRLATMA ƏLAVƏ ET</span>
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Aktiv Xatırlatmalar</span>
            <Bell size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl md:text-3xl font-black text-stone-900">{activeCount}</p>
        </div>

        <div className="bg-amber-500/10 p-5 rounded-3xl border border-amber-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[10px] font-black uppercase tracking-widest">Zərgərdə Olanlar</span>
            <Tag size={18} className="text-amber-600" />
          </div>
          <p className="text-2xl md:text-3xl font-black text-amber-900">{zergardeCount}</p>
        </div>

        <div className="bg-sky-500/10 p-5 rounded-3xl border border-sky-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-sky-800">
            <span className="text-[10px] font-black uppercase tracking-widest">Müştəridə Olanlar</span>
            <User size={18} className="text-sky-600" />
          </div>
          <p className="text-2xl md:text-3xl font-black text-sky-900">{musterideCount}</p>
        </div>

        <div className="bg-emerald-500/10 p-5 rounded-3xl border border-emerald-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-black uppercase tracking-widest">Həll Olunmuşlar</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl md:text-3xl font-black text-emerald-900">{completedCount}</p>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-4 md:p-6 rounded-3xl border border-stone-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex bg-stone-100 p-1.5 rounded-2xl w-full md:w-auto">
            <button
              onClick={() => setStatusTab('active')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                statusTab === 'active'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Clock size={14} />
              <span>Gözləmədə ({activeCount})</span>
            </button>
            <button
              onClick={() => setStatusTab('completed')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                statusTab === 'completed'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>Tamamlanmış ({completedCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Qeyd, məhsul kodu və ya müştəri adı ilə axtar..."
              className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mr-2">Kateqoriya:</span>
          <button
            onClick={() => setSelectedCategory('Bütün')}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
              selectedCategory === 'Bütün'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Bütün
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* REMINDERS LIST */}
      {filteredReminders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-stone-200/80 text-center space-y-4">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
            <Bell size={32} />
          </div>
          <div>
            <h3 className="text-lg font-black text-stone-800 uppercase">Hec bir xatırlatma tapılmadı</h3>
            <p className="text-xs font-bold text-stone-400 mt-1">
              Axtarış meyarlarını dəyişin və ya yeni xatırlatma əlavə edin.
            </p>
          </div>
          <button
            onClick={openNewModal}
            className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-stone-950 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md"
          >
            <Plus size={16} />
            <span>XATIRLATMA ƏLAVƏ ET</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReminders.map((rem) => {
            const linkedProduct = products.find(p => p.id === rem.productId);
            const isOverdue = rem.dueDate && !rem.isCompleted && new Date(rem.dueDate) < new Date(new Date().setHours(0,0,0,0));

            return (
              <div
                key={rem.id}
                className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                  rem.isCompleted 
                    ? 'border-emerald-200 bg-emerald-50/20 opacity-80' 
                    : isOverdue 
                      ? 'border-rose-300 bg-rose-50/30' 
                      : 'border-stone-200/80'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar: Category badge & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getCategoryBadge(rem.category)}`}>
                      {rem.category}
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(rem)}
                        className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all"
                        title="Redaktə et"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(rem.id, rem.title)}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Note */}
                  <div className="space-y-1.5">
                    <h3 className={`text-base font-black text-stone-900 leading-snug ${rem.isCompleted ? 'line-through text-stone-400' : ''}`}>
                      {rem.title}
                    </h3>
                    {rem.note && (
                      <p className="text-xs font-bold text-stone-600 leading-relaxed whitespace-pre-wrap bg-stone-50 p-3 rounded-2xl border border-stone-100">
                        {rem.note}
                      </p>
                    )}
                  </div>

                  {/* Attached Product Card (if linked) */}
                  {(rem.productCode || rem.productName || linkedProduct) && (
                    <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200/60 flex items-center space-x-3">
                      <div 
                        onClick={() => linkedProduct?.imageUrl && setZoomedImage(linkedProduct.imageUrl)}
                        className={`w-12 h-12 bg-white rounded-xl flex-shrink-0 flex items-center justify-center p-1 border border-amber-200 ${linkedProduct?.imageUrl ? 'cursor-zoom-in' : ''}`}
                      >
                        {linkedProduct?.imageUrl ? (
                          <img 
                            src={linkedProduct.imageUrl} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain" 
                            alt=""
                          />
                        ) : (
                          <Package className="text-amber-500 w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest block">Aiddir Məhsul:</span>
                        <p className="text-xs font-black text-stone-900 truncate">
                          <span className="text-amber-600 mr-1.5">{rem.productCode || linkedProduct?.code}</span>
                          {rem.productName || linkedProduct?.name}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Attached Customer Info (if linked) */}
                  {(rem.customerName) && (
                    <div className="bg-sky-50/60 p-3 rounded-2xl border border-sky-200/60 flex items-center space-x-3">
                      <div className="w-9 h-9 bg-sky-100 text-sky-700 rounded-xl flex items-center justify-center flex-shrink-0">
                        <User size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-black text-sky-800 uppercase tracking-widest block">Müştəri:</span>
                        <p className="text-xs font-black text-stone-900 truncate">{rem.customerName}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Dates & Complete Button */}
                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-stone-400 block">
                      Tarix: {new Date(rem.createdAt).toLocaleDateString('az-AZ')}
                    </span>
                    {rem.dueDate && (
                      <span className={`text-[10px] font-black block flex items-center space-x-1 ${
                        isOverdue ? 'text-rose-600 font-extrabold' : 'text-stone-600'
                      }`}>
                        <Calendar size={12} className="inline mr-1" />
                        <span>Vaxt: {new Date(rem.dueDate).toLocaleDateString('az-AZ')}</span>
                        {isOverdue && <span className="bg-rose-600 text-white text-[8px] px-1.5 py-0.5 rounded-md uppercase ml-1">VAXTI KEÇİB</span>}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleComplete(rem.id)}
                    className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-sm flex items-center space-x-1.5 ${
                      rem.isCompleted
                        ? 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {rem.isCompleted ? (
                      <>
                        <RotateCcw size={12} />
                        <span>QAYTAR</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>TAMAMLA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 max-w-xl w-full border border-stone-200 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-stone-900 uppercase">
                    {editingReminder ? 'XATIRLATMANI REDAKTƏ ET' : 'YENİ XATIRLATMA YARAT'}
                  </h2>
                  <p className="text-xs font-bold text-stone-400">Qeydinizi ətraflı şəkildə yazın</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 bg-stone-100 text-stone-500 rounded-full flex items-center justify-center hover:bg-stone-200 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Category Selector */}
              <div>
                <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">
                  Kateqoriya
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                        category === cat
                          ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">
                  Mövzu / Qısa Qeyd <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Məs: Zərgərdə üzük var Teymur üçün və ya baxmağa aparıb..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  required
                />
              </div>

              {/* Detailed Note */}
              <div>
                <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">
                  Ətraflı Detallar (İxtiyari)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Məsələn: Qiymət 450₼ razılaşdırılıb, cümə gününə qədər cavab veriləcək..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">
                  Xatırlatma Vaxtı / Son Tarix (İxtiyari)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all text-stone-700"
                />
              </div>

              {/* Link Product */}
              <div>
                <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">
                  Məhsul Birləşdir (İxtiyari)
                </label>
                <input
                  type="text"
                  placeholder="Məhsul kodunu və ya adını axtar..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-2.5 text-xs font-bold outline-none mb-1.5"
                />
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                >
                  <option value="">-- Məhsul Seçilməyib --</option>
                  {filteredProductsSelect.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name} ({p.weight}gr)
                    </option>
                  ))}
                </select>
              </div>

              {/* Link Customer */}
              <div>
                <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">
                  Müştəri Birləşdir (İxtiyari)
                </label>
                <input
                  type="text"
                  placeholder="Müştəri adını və ya tel axtar..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-2.5 text-xs font-bold outline-none mb-1.5"
                />
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                >
                  <option value="">-- Müştəri Seçilməyib --</option>
                  {filteredCustomersSelect.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-stone-100 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-stone-100 text-stone-700 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-stone-200 transition-all"
                >
                  LƏĞV ET
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-950 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all"
                >
                  YADDA SAXLA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ZOOM IMAGE MODAL */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-3xl p-2 shadow-2xl">
            <img 
              src={zoomedImage} 
              alt="" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded-2xl max-h-[80vh]" 
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
