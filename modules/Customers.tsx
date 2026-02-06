import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Phone, 
  MapPin, 
  CreditCard, 
  Coins, 
  X, 
  Edit2, 
  Trash2, 
  ArrowLeft, 
  History, 
  Calendar, 
  Gem, 
  Tag, 
  Info, 
  User, 
  Scale, 
  Barcode, 
  DollarSign, 
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Customer, Sale } from '../types';

interface CustomersProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  sales: Sale[];
}

const CustomersModule: React.FC<CustomersProps> = ({ customers, setCustomers, sales }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [selectedSaleInfo, setSelectedSaleInfo] = useState<Sale | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'debtor'>('all');
  const [newCustomer, setNewCustomer] = useState({
    fullName: '',
    phone: '',
    address: '',
    title: ''
  });

  const filtered = customers.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.phone.includes(searchTerm);
    const matchesFilter = selectedFilter === 'debtor' ? (c.cashDebt > 0 || c.goldDebt > 0) : true;
    return matchesSearch && matchesFilter;
  });

  const customerHistory = viewingCustomer 
    ? sales.filter(s => {
        const matchesCustomer = s.customerName === viewingCustomer.fullName;
        if (!matchesCustomer) return false;
        
        const term = historySearchTerm.toLowerCase();
        return (
          s.productName.toLowerCase().includes(term) ||
          s.productCode.toLowerCase().includes(term) ||
          s.weight?.toString().includes(term)
        );
      })
    : [];

  const totalSpent = viewingCustomer 
    ? sales.filter(s => s.customerName === viewingCustomer.fullName && s.status !== 'returned').reduce((acc, s) => acc + s.total, 0)
    : 0;

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.fullName || !newCustomer.phone) return;

    const customerToAdd: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      fullName: newCustomer.fullName,
      phone: newCustomer.phone,
      address: newCustomer.address,
      title: newCustomer.title,
      cashDebt: 0,
      goldDebt: 0
    };

    setCustomers(prev => [customerToAdd, ...prev]);
    setShowAddModal(false);
    setNewCustomer({ fullName: '', phone: '', address: '', title: '' });
  };

  const deleteCustomer = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    if (confirm('Bu müştərini silmək istədiyinizə əminsiniz?')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  if (viewingCustomer) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-20">
        <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-xl border border-stone-100">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => { setViewingCustomer(null); setHistorySearchTerm(''); }}
              className="p-4 bg-stone-50 hover:bg-stone-100 rounded-2xl text-stone-400 transition-all active:scale-90"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center text-amber-950 font-black text-2xl shadow-xl">
                {viewingCustomer.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tighter uppercase leading-none mb-1">{viewingCustomer.fullName}</h2>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">{viewingCustomer.phone}</span>
                  <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                  <span className="text-xs font-medium text-stone-400">{viewingCustomer.address || 'Ünvan yoxdur'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Cəmi Alış</p>
              <p className="text-2xl font-black text-stone-900 leading-none">{totalSpent.toLocaleString()} ₼</p>
            </div>
            <div className="w-px h-10 bg-stone-100"></div>
            <div className="text-right">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Əməliyyat</p>
              <p className="text-2xl font-black text-amber-500 leading-none">{customerHistory.length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[3rem] shadow-2xl border border-stone-100 overflow-hidden flex flex-col min-h-[500px]">
               <div className="p-8 border-b border-stone-100 bg-stone-50/50 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <h3 className="text-lg font-black text-stone-800 tracking-tighter flex items-center uppercase">
                    <History className="w-5 h-5 mr-3 text-amber-500" /> Alış Tarixçəsi
                  </h3>
                  <div className="relative group max-w-sm w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 group-focus-within:text-amber-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Məhsul adı, kodu və ya çəkisi..." 
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                      className="w-full bg-white border-stone-200 border rounded-2xl py-2.5 pl-10 pr-4 focus:ring-4 focus:ring-amber-100 focus:outline-none shadow-sm text-xs font-bold"
                    />
                  </div>
               </div>
               <div className="overflow-x-auto flex-1">
                 <table className="w-full text-left">
                    <thead>
                      <tr className="bg-stone-50/30">
                        <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Məhsul</th>
                        <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Tarix</th>
                        <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] text-right">Məbləğ</th>
                        <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] text-center">Bilgi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {customerHistory.map((s) => (
                        <tr key={s.id} className="hover:bg-amber-50/20 transition-all group">
                          <td className="px-8 py-5">
                            <div className="flex items-center space-x-4">
                               <div className="w-12 h-12 bg-white border border-stone-100 rounded-xl flex items-center justify-center text-amber-500 shadow-sm overflow-hidden p-1">
                                  {s.imageUrl ? (
                                    <img src={s.imageUrl} alt={s.productName} className="w-full h-full object-cover rounded-md" />
                                  ) : (
                                    <Gem className="w-6 h-6" />
                                  )}
                               </div>
                               <div>
                                  <p className="text-sm font-black text-stone-800 uppercase tracking-tight">{s.productName}</p>
                                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest flex items-center">
                                    <Barcode size={10} className="mr-1 opacity-60" /> KOD: {s.productCode} 
                                    <span className="mx-2 opacity-20">|</span> 
                                    <Scale size={10} className="mr-1 opacity-60" /> {s.weight} qr
                                  </p>
                               </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex items-center text-stone-500 text-xs font-bold">
                               <Calendar className="w-3.5 h-3.5 mr-2 text-stone-300" />
                               {new Date(s.date).toLocaleDateString('az-AZ')}
                             </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <p className="text-lg font-black text-stone-900 tracking-tighter">{s.total.toLocaleString()} ₼</p>
                          </td>
                          <td className="px-8 py-5 text-center">
                             <button 
                               onClick={() => setSelectedSaleInfo(s)}
                               className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all active:scale-90"
                               title="Ətraflı Məlumat"
                             >
                               <Info size={18} />
                             </button>
                          </td>
                        </tr>
                      ))}
                      {customerHistory.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-8 py-20 text-center text-stone-400 italic">Heç bir alış tapılmadı.</td>
                        </tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-stone-900 text-white rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 gold-gradient rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-all"></div>
               <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.4em] mb-6 font-bold">Maliyyə Vəziyyəti</h3>
               <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6">
                     <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Nəqd Borc</p>
                     <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-black text-red-400 tracking-tighter">{viewingCustomer.cashDebt.toLocaleString()}</span>
                        <span className="text-lg font-bold text-stone-600 uppercase">₼</span>
                     </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6">
                     <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Qızıl Borcu</p>
                     <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-black text-amber-500 tracking-tighter">{viewingCustomer.goldDebt}</span>
                        <span className="text-lg font-bold text-stone-600 uppercase">qr</span>
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-xl space-y-4">
               <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Müştəri Haqqında</h3>
               <div className="flex items-center p-4 bg-stone-50 rounded-2xl">
                  <Tag className="w-5 h-5 text-amber-500 mr-3" />
                  <p className="text-xs font-bold text-stone-700">{viewingCustomer.title || 'Məlumat daxil edilməyib'}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Product Detailed Info Modal - HORIZONTAL REDESIGN */}
        {selectedSaleInfo && (
          <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-lg z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 border border-stone-100 relative flex flex-col md:flex-row">
               
               {/* LEFT SIDE: Image Container */}
               <div className="w-full md:w-5/12 bg-stone-50/50 flex flex-col items-center justify-center overflow-hidden relative border-b md:border-b-0 md:border-r border-stone-100 min-h-[350px]">
                  {selectedSaleInfo.imageUrl ? (
                    <img 
                      src={selectedSaleInfo.imageUrl} 
                      alt={selectedSaleInfo.productName} 
                      className="w-full h-full object-contain p-12"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-stone-200">
                       <ImageIcon size={100} strokeWidth={0.5} />
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] mt-6">Şəkil yoxdur</span>
                    </div>
                  )}
                  
                  {/* Floating Badges */}
                  <div className="absolute top-8 left-8 flex items-center space-x-2">
                    <div className="bg-amber-500 text-white rounded-xl px-4 py-1.5 text-[10px] font-black tracking-widest uppercase shadow-lg shadow-amber-200">
                       {selectedSaleInfo.carat}K Ayar
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedSaleInfo(null)} 
                    className="absolute top-8 right-8 p-3 bg-white/90 hover:bg-white rounded-2xl text-stone-400 transition-all active:scale-90 shadow-xl border border-stone-100 z-20"
                  >
                    <X size={20} />
                  </button>
               </div>

               {/* RIGHT SIDE: Content */}
               <div className="flex-1 flex flex-col p-8 md:p-12 space-y-10 bg-white">
                  
                  {/* Title Area */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-5 p-6 rounded-[2rem] bg-amber-50/30 border-2 border-amber-200/40 shadow-sm">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center text-amber-500 border border-amber-50">
                          <Gem size={28} />
                      </div>
                      <div>
                          <h4 className="text-2xl font-black text-stone-900 leading-tight uppercase tracking-tighter">{selectedSaleInfo.productName}</h4>
                          <div className="flex items-center space-x-3 mt-1">
                             <div className="flex items-center bg-white px-2.5 py-1 rounded-lg text-[9px] font-black text-stone-500 border border-stone-100 shadow-sm uppercase tracking-widest">
                               <Scale size={10} className="mr-1.5 text-amber-500" /> {selectedSaleInfo.weight} gr
                             </div>
                             <div className="flex items-center bg-white px-2.5 py-1 rounded-lg text-[9px] font-black text-stone-500 border border-stone-100 shadow-sm uppercase tracking-widest">
                               <Tag size={10} className="mr-1.5 text-amber-500" /> {selectedSaleInfo.type}
                             </div>
                          </div>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid - 2 columns */}
                  <div className="grid grid-cols-2 gap-5">
                     <div className="p-5 bg-stone-50/50 rounded-2xl border border-stone-100/50 flex items-start space-x-4">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-stone-100"><Clock size={16} className="text-stone-300" /></div>
                        <div>
                           <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Satış Tarixi</p>
                           <p className="text-xs font-bold text-stone-800">
                             {new Date(selectedSaleInfo.date).toLocaleString('az-AZ', {
                               year: 'numeric', month: '2-digit', day: '2-digit',
                               hour: '2-digit', minute: '2-digit'
                             })}
                           </p>
                        </div>
                     </div>
                     <div className="p-5 bg-stone-50/50 rounded-2xl border border-stone-100/50 flex items-start space-x-4">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-stone-100"><User size={16} className="text-stone-300" /></div>
                        <div>
                           <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Tədarükçü</p>
                           <p className="text-xs font-bold text-stone-800">{selectedSaleInfo.supplier || 'Tədarükçü A'}</p>
                        </div>
                     </div>
                     <div className="p-5 bg-stone-50/50 rounded-2xl border border-stone-100/50 flex items-start space-x-4">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-stone-100"><Barcode size={16} className="text-stone-300" /></div>
                        <div>
                           <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Məhsul Kodu</p>
                           <p className="text-xs font-bold text-stone-800 tracking-widest">{selectedSaleInfo.productCode || 'KODSUZ'}</p>
                        </div>
                     </div>
                     <div className="p-5 bg-stone-50/50 rounded-2xl border border-stone-100/50 flex items-start space-x-4">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-stone-100"><DollarSign size={16} className="text-stone-300" /></div>
                        <div>
                           <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Satış Qiyməti</p>
                           <p className="text-xs font-bold text-stone-800">{selectedSaleInfo.price.toLocaleString()} ₼</p>
                        </div>
                     </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="mt-auto bg-stone-900 text-white p-7 rounded-[2.5rem] flex justify-between items-center shadow-2xl relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-r from-stone-900 to-stone-800 opacity-50"></div>
                     <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-700"></div>
                     
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] mb-2">ÖDƏNİLƏN YEKUN MƏBLƏĞ</p>
                        <div className="flex items-baseline space-x-2">
                           <h4 className="text-4xl font-black tracking-tighter text-amber-500 leading-none">{selectedSaleInfo.total.toLocaleString()}</h4>
                           <span className="text-xl font-bold text-stone-600 uppercase">₼</span>
                        </div>
                     </div>
                     
                     <div className="text-right relative z-10 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">Tətbiq Edilən Endirim</p>
                        <p className="text-2xl font-black text-red-400 tracking-tighter">-{selectedSaleInfo.discount.toLocaleString()} ₼</p>
                     </div>
                  </div>

                  <button 
                    onClick={() => setSelectedSaleInfo(null)}
                    className="w-full py-4 text-stone-400 font-bold text-xs uppercase tracking-[0.3em] hover:text-stone-600 transition-colors"
                  >
                    Məlumat pəncərəsini bağla
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5 group-focus-within:text-amber-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Ad və ya nömrə ilə axtar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-stone-200 border rounded-2xl py-3.5 pl-12 pr-4 focus:ring-4 focus:ring-amber-100 focus:outline-none shadow-sm font-medium"
            />
          </div>
          <div className="flex bg-white rounded-2xl p-1 border border-stone-200 shadow-sm">
             <button 
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedFilter === 'all' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
             >
               Hamısı
             </button>
             <button 
              onClick={() => setSelectedFilter('debtor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedFilter === 'debtor' ? 'bg-amber-500 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
             >
               Borclular
             </button>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-amber-500 text-amber-950 px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-amber-400 transition-all flex items-center shadow-lg shadow-amber-200/50 active:scale-95"
        >
          <UserPlus className="w-5 h-5 mr-2" /> YENİ MÜŞTƏRİ
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((customer) => (
          <div 
            key={customer.id} 
            onClick={() => setViewingCustomer(customer)}
            className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/20 hover:shadow-amber-200/20 hover:border-amber-200 transition-all group overflow-hidden flex flex-col cursor-pointer active:scale-95 transform duration-300"
          >
            <div className="p-6 pb-4">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center text-amber-950 font-black text-xl shadow-lg group-hover:rotate-6 transition-transform">
                  {customer.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-2 text-stone-300 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all" onClick={(e) => e.stopPropagation()}><Edit2 size={16} /></button>
                  <button onClick={(e) => deleteCustomer(e, customer.id)} className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="text-xl font-black text-stone-800 tracking-tight leading-none mb-2">{customer.fullName}</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-stone-500 group-hover:text-stone-800 transition-colors">
                  <Phone size={14} className="mr-3 text-stone-300" />
                  <span className="text-xs font-bold">{customer.phone}</span>
                </div>
              </div>
            </div>
            <div className="mt-auto bg-stone-50 p-6 flex justify-between items-center border-t border-stone-100 group-hover:bg-amber-50 transition-colors">
               <div className="space-y-1">
                 <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Nəqd Borc</p>
                 <div className="flex items-center">
                    <CreditCard size={12} className="mr-1.5 text-red-400" />
                    <span className={`text-sm font-black ${customer.cashDebt > 0 ? 'text-red-600' : 'text-stone-400'}`}>
                      {customer.cashDebt.toLocaleString()} ₼
                    </span>
                 </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-stone-100">
            <div className="p-8 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-stone-800 tracking-tighter uppercase">Yeni Müştəri</h3>
              <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-stone-200 rounded-2xl text-stone-400 transition-all active:scale-90"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase ml-4">Tam Adı Soyadı</label>
                  <input autoFocus required type="text" value={newCustomer.fullName} onChange={(e) => setNewCustomer({...newCustomer, fullName: e.target.value})} placeholder="Məs: Əli Məmmədov" className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl py-4 px-6 font-bold text-stone-800 focus:ring-4 focus:ring-amber-50 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase ml-4">Telefon Nömrəsi</label>
                  <input required type="text" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})} placeholder="Məs: 050 555 55 55" className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl py-4 px-6 font-bold text-stone-800 focus:ring-4 focus:ring-amber-50 outline-none transition-all" />
                </div>
              </div>
              <button type="submit" className="w-full bg-stone-900 text-white py-6 rounded-[2rem] font-black text-lg hover:bg-black transition-all shadow-2xl flex items-center justify-center uppercase tracking-widest">
                Müştərini Yadda Saxla <CheckCircle2 className="ml-3 w-6 h-6 text-amber-500" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersModule;