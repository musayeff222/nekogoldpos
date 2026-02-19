
import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  Gem, 
  ShoppingBag, 
  TrendingUp, 
  X, 
  Scale, 
  Tag, 
  User, 
  Clock, 
  Image as ImageIcon,
  Truck,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  DollarSign,
  ArrowRightLeft
} from 'lucide-react';
import { Sale } from '../types';

interface SoldProductsProps {
  sales: Sale[];
}

const SoldProductsModule: React.FC<SoldProductsProps> = ({ sales }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const getFilteredSales = () => {
    let filtered = sales;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.productName.toLowerCase().includes(term) ||
        s.productCode.toLowerCase().includes(term) ||
        s.customerName.toLowerCase().includes(term)
      );
    }

    const now = new Date();
    if (dateFilter === 'today') {
      filtered = filtered.filter(s => new Date(s.date).toDateString() === now.toDateString());
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(s => new Date(s.date) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filtered = filtered.filter(s => new Date(s.date) >= monthAgo);
    }

    return filtered;
  };

  const filteredSales = getFilteredSales();
  const totalRevenue = filteredSales.filter(s => s.status === 'completed').reduce((acc, s) => acc + s.total, 0);
  const totalWeight = filteredSales.reduce((acc, s) => acc + (s.weight || 0), 0);

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('az-AZ');
  };

  // FULL SCREEN LANDSCAPE DETAIL PAGE
  if (selectedSale) {
    return (
      <div className="fixed inset-0 bg-stone-50 z-[100] flex flex-col animate-in fade-in duration-500 overflow-hidden">
        {/* Top Header - Compact but Readable */}
        <header className="h-16 bg-white border-b border-stone-200 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSelectedSale(null)}
              className="p-2 hover:bg-stone-100 rounded-xl text-stone-600 transition-all active:scale-90"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-6 w-px bg-stone-200 mx-2"></div>
            <div>
              <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest leading-none">Satış Arxiv №</p>
              <p className="text-sm font-black text-stone-900 uppercase mt-0.5 tracking-tight">#{selectedSale.id}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {selectedSale.status === 'returned' ? (
              <div className="bg-red-50 text-red-700 px-5 py-2 rounded-xl flex items-center space-x-2 border border-red-200 shadow-sm">
                <RotateCcw size={16} strokeWidth={3} />
                <span className="text-[11px] font-black uppercase tracking-widest">QAYTARILIB</span>
              </div>
            ) : selectedSale.status === 'exchanged' ? (
              <div className="bg-amber-50 text-amber-700 px-5 py-2 rounded-xl flex items-center space-x-2 border border-amber-200 shadow-sm">
                <ArrowRightLeft size={16} strokeWidth={3} />
                <span className="text-[11px] font-black uppercase tracking-widest">DƏYİŞDİRİLİB</span>
              </div>
            ) : (
              <div className="bg-green-50 text-green-700 px-5 py-2 rounded-xl flex items-center space-x-2 border border-green-100 shadow-sm">
                <ShieldCheck size={16} strokeWidth={3} />
                <span className="text-[11px] font-black uppercase tracking-widest">TƏSDİQLƏNİB</span>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel - Image & Customer Info */}
          <aside className="w-80 md:w-96 bg-white border-r border-stone-200 flex flex-col overflow-y-auto scrollbar-hide">
            <div className="p-8 space-y-10">
              {/* Product Visual */}
              <div className="aspect-square bg-stone-100/50 rounded-[2.5rem] border-2 border-stone-100 flex items-center justify-center p-8 relative group shadow-inner">
                {selectedSale.imageUrl ? (
                  <img src={selectedSale.imageUrl} className="w-full h-full object-contain drop-shadow-2xl" alt="Product" />
                ) : (
                  <ImageIcon size={80} strokeWidth={0.5} className="text-stone-300" />
                )}
                <div className="absolute top-5 left-5">
                  <span className="bg-stone-900 text-amber-500 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl">
                    {selectedSale.type}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-2">Müştəri Məlumatı</p>
                <div className="bg-stone-50 rounded-[2rem] p-6 flex items-center space-x-5 border border-stone-200">
                  <div className="w-14 h-14 gold-gradient rounded-2xl flex items-center justify-center text-amber-950 font-black text-base shadow-md border-2 border-white/50">
                    {selectedSale.customerName[0]}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-base font-black text-stone-900 uppercase tracking-tighter truncate">{selectedSale.customerName}</h4>
                    <div className="flex items-center space-x-2 mt-1.5 text-stone-500">
                      <Clock size={12} className="shrink-0" />
                      <span className="text-[11px] font-bold uppercase">{formatDate(selectedSale.date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Area - Enhanced Design & Readability */}
          <main className="flex-1 overflow-y-auto bg-stone-50/50 p-8 md:p-12 lg:p-16 flex flex-col">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-10">
              
              {/* Title Section */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tighter uppercase leading-none">{selectedSale.productName}</h2>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-black text-amber-700 uppercase tracking-[0.3em]">{selectedSale.productCode}</span>
                    <span className="w-1.5 h-1.5 bg-stone-300 rounded-full"></span>
                    <span className="text-xs font-black text-stone-500 uppercase tracking-widest bg-stone-200/50 px-3 py-1 rounded-lg">
                      {selectedSale.status === 'returned' || selectedSale.status === 'exchanged' ? 'ARXİV SƏNƏD' : 'AKTİV SATIŞ'}
                    </span>
                  </div>
                </div>

                {selectedSale.status === 'returned' && (
                  <div className="bg-red-50/80 border-l-4 border-red-600 p-7 rounded-r-[2rem] flex items-start space-x-5 shadow-sm">
                    <div className="bg-red-100 p-3 rounded-xl">
                      <RotateCcw className="text-red-700 shrink-0" size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1.5">GERİ QAYTARILMA QEYDİ</p>
                      <p className="text-sm font-bold text-red-900 leading-relaxed uppercase">{selectedSale.returnNote}</p>
                    </div>
                  </div>
                )}

                {selectedSale.status === 'exchanged' && (
                  <div className="bg-amber-50/80 border-l-4 border-amber-600 p-7 rounded-r-[2rem] flex items-start space-x-5 shadow-sm">
                    <div className="bg-amber-100 p-3 rounded-xl">
                      <ArrowRightLeft className="text-amber-700 shrink-0" size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5">MƏHSUL DƏYİŞDİRİLMƏSİ</p>
                      <p className="text-sm font-bold text-amber-900 leading-relaxed uppercase">{selectedSale.returnNote || "Bu mal başqa mal ilə dəyişdirilmişdir"}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Technical Specifications - High Contrast Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                  { label: 'MƏHSUL ÇƏKİSİ', val: `${selectedSale.weight} GR`, icon: Scale },
                  { label: 'QIZIL ƏYARI', val: `${selectedSale.carat} K`, icon: Tag },
                  { label: 'BRİLLİANT / DAŞ', val: selectedSale.brilliant || 'YOXDUR', icon: Sparkles },
                  { label: 'TƏDARÜKÇÜ', val: selectedSale.supplier || 'N/A', icon: Truck },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md flex flex-col justify-between group hover:border-amber-500 transition-all duration-300">
                    <div className="flex justify-between items-center mb-6">
                      <div className="p-3 bg-stone-50 rounded-2xl text-amber-600 group-hover:bg-amber-50 transition-all">
                        <item.icon size={20} strokeWidth={2.5} />
                      </div>
                      <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest leading-none text-right">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-lg font-black text-stone-900 uppercase truncate">{item.val}</p>
                  </div>
                ))}
              </div>

              {/* Price Block - Compacted as requested */}
              <div className="mt-auto bg-stone-900 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden group border border-white/10">
                <div className="absolute top-0 right-0 w-full h-full gold-gradient opacity-[0.03] rounded-full blur-[100px] -mr-1/2 -mt-1/2"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em] mb-2">YEKUN SATIŞ MƏBLƏĞİ</p>
                    <div className="flex items-baseline space-x-2">
                      <h3 className="text-4xl md:text-5xl font-black text-amber-500 tracking-tighter leading-none">
                        {selectedSale.total.toLocaleString()}
                      </h3>
                      <span className="text-2xl font-bold text-amber-700">₼</span>
                    </div>
                    {selectedSale.discount > 0 && (
                      <div className="inline-flex items-center bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 mt-4">
                        <CheckCircle2 size={10} className="mr-2 text-green-500" /> 
                        <span className="text-stone-400 font-bold text-[10px] uppercase tracking-widest">
                          {selectedSale.discount.toLocaleString()} ₼ ENDİRİM
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col md:items-end space-y-2 bg-white/5 p-4 rounded-[1.5rem] border border-white/5">
                     <div className="flex items-center space-x-2 text-[10px] font-black text-stone-300 uppercase tracking-widest">
                        <Calendar size={14} className="text-stone-500" />
                        <span>{formatDate(selectedSale.date)}</span>
                     </div>
                     <div className="flex items-center space-x-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                        <Clock size={14} className="text-stone-500" />
                        <span>{formatTime(selectedSale.date)}</span>
                     </div>
                  </div>
                </div>
              </div>

              {/* Close Button - Raised a bit by reducing top padding */}
              <div className="flex justify-center pt-6">
                 <button 
                  onClick={() => setSelectedSale(null)}
                  className="px-16 py-4 bg-stone-200 text-stone-600 hover:bg-stone-900 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.5em] transition-all shadow-lg active:scale-95"
                 >
                   SƏHİFƏNİ BAĞLA
                 </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-10 animate-in fade-in duration-500">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-stone-900 text-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 gold-gradient opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2 relative z-10">Net Satış Məbləği</p>
          <h4 className="text-3xl md:text-4xl font-black text-amber-500 tracking-tighter relative z-10">{totalRevenue.toLocaleString()} <span className="text-lg text-amber-800">₼</span></h4>
          <TrendingUp className="absolute bottom-6 right-6 text-white/5 w-12 h-12" />
        </div>
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-stone-100 shadow-xl flex items-center justify-between group overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Satılan Mallar</p>
            <h4 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tighter">{filteredSales.length} <span className="text-lg text-stone-300">ƏDƏD</span></h4>
          </div>
          <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner relative z-10">
            <ShoppingBag className="w-8 h-8" />
          </div>
        </div>
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-stone-100 shadow-xl flex items-center justify-between group overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Ümumi Çəki</p>
            <h4 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tighter">{totalWeight.toFixed(2)} <span className="text-lg text-stone-300">gr</span></h4>
          </div>
          <div className="w-14 h-14 md:w-16 md:h-16 bg-stone-50 text-stone-400 rounded-2xl flex items-center justify-center shadow-inner relative z-10">
            <Scale className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5 group-focus-within:text-amber-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Məhsul adı, kodu və ya müştəri..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-stone-100 rounded-2xl md:rounded-[2rem] py-4 md:py-5 pl-16 pr-6 focus:ring-8 focus:ring-amber-50 outline-none shadow-xl text-sm font-bold"
          />
        </div>
        <div className="flex bg-white rounded-2xl p-1.5 border border-stone-200 shadow-sm self-start md:self-stretch">
          {['all', 'today', 'week', 'month'].map(f => (
            <button 
              key={f}
              onClick={() => setDateFilter(f as any)}
              className={`px-6 py-2 md:py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${dateFilter === f ? 'bg-stone-900 text-white' : 'text-stone-400 hover:bg-stone-50'}`}
            >
              {f === 'all' ? 'Hamısı' : f === 'today' ? 'Bugün' : f === 'week' ? 'Həftə' : 'Ay'}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-stone-100 shadow-2xl overflow-hidden flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Məhsul</th>
                <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Tarix</th>
                <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Məbləğ</th>
                <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredSales.map((s) => (
                <tr 
                  key={s.id} 
                  onClick={() => setSelectedSale(s)}
                  className="hover:bg-amber-50/30 transition-all group cursor-pointer"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-stone-100 flex items-center justify-center text-amber-500 shadow-sm overflow-hidden p-1 group-hover:scale-110 transition-transform">
                        {s.imageUrl ? <img src={s.imageUrl} className="w-full h-full object-cover rounded-md" /> : <Gem size={20} />}
                      </div>
                      <div>
                        <p className="font-black text-stone-800 text-sm uppercase leading-none">{s.productName}</p>
                        <p className="text-[10px] text-stone-400 font-bold mt-1.5 uppercase tracking-widest">{s.productCode} | {s.weight} gr</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex flex-col items-center">
                       <div className="inline-flex items-center text-stone-800 text-[11px] font-black"><Calendar size={12} className="mr-1.5 text-stone-300" />{formatDate(s.date)}</div>
                       <div className="inline-flex items-center text-stone-400 text-[10px] font-bold mt-1"><Clock size={10} className="mr-1.5" />{formatTime(s.date)}</div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-stone-900 text-lg tracking-tighter">
                    {s.total.toLocaleString()} ₼
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex flex-col items-center">
                        {s.status === 'returned' ? (
                           <span className="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest bg-red-50 text-red-500 border border-red-100">İADƏ EDİLDİ</span>
                        ) : s.status === 'exchanged' ? (
                           <span className="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">DƏYİŞDİRİLDİ</span>
                        ) : (
                           <span className="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest bg-green-50 text-green-600 border border-green-100">SATILDI</span>
                        )}
                        {s.returnNote && <p className="text-[8px] text-stone-400 font-bold mt-1 uppercase max-w-[120px] truncate">{s.returnNote}</p>}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center space-y-4">
                       <ShoppingBag className="w-12 h-12 text-stone-100" />
                       <p className="text-stone-300 font-black uppercase text-xs tracking-widest">Satış tapılmadı</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SoldProductsModule;
