import React, { useState } from 'react';
import { Search, RotateCcw, AlertTriangle, ArrowRightLeft, Package, Clock, User, Gem, ChevronRight, X } from 'lucide-react';
import { Sale, Product } from '../types';

interface ReturnsProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const ReturnsModule: React.FC<ReturnsProps> = ({ sales, setSales, products, setProducts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const filtered = sales.filter(s => 
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProcessReturn = (isExchange: boolean) => {
    if (!selectedSale) return;

    if (confirm(`${selectedSale.productName} üçün ${isExchange ? 'DƏYİŞİLMƏ' : 'GERİ QAYTARMA'} əməliyyatı başlasın?`)) {
      setSales(sales.map(s => 
        s.id === selectedSale.id ? { ...s, status: 'returned' } : s
      ));
      
      setProducts(products.map(p => 
        p.id === selectedSale.productId ? { ...p, stockCount: p.stockCount + 1 } : p
      ));

      alert(`${isExchange ? 'Dəyişilmə' : 'Geri qaytarma'} tamamlandı. Məhsul stoka geri əlavə edildi.`);
      setSelectedSale(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 pb-24 md:pb-10 animate-in fade-in duration-500">
      <div className="space-y-4 md:space-y-6 flex flex-col h-full">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">Satiş Arxivində Axtar</h3>
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5 group-focus-within:text-amber-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Satış No, Məhsul və ya Müştəri..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-stone-100 rounded-2xl md:rounded-[2rem] py-4 md:py-5 pl-14 pr-6 focus:ring-8 focus:ring-amber-50 outline-none shadow-xl text-sm font-bold"
          />
        </div>

        <div className="bg-white rounded-3xl md:rounded-[3rem] border border-stone-100 shadow-2xl flex-1 overflow-hidden flex flex-col min-h-[400px]">
          <div className="divide-y divide-stone-50 overflow-y-auto scrollbar-hide">
            {filtered.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSale(s)}
                className={`w-full flex items-center justify-between p-5 md:p-8 hover:bg-amber-50/50 transition-all text-left border-l-[6px] ${selectedSale?.id === s.id ? 'bg-amber-50 border-amber-500' : 'border-transparent'}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${s.status === 'returned' ? 'bg-red-50 border-red-100 text-red-500' : 'bg-stone-50 border-stone-100 text-stone-400'}`}>
                    {s.status === 'returned' ? <RotateCcw size={20} /> : <Gem size={20} />}
                  </div>
                  <div className="max-w-[150px] md:max-w-none">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[9px] font-black text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded uppercase">#{s.id.toUpperCase()}</span>
                      {s.status === 'returned' && <span className="text-[9px] font-black text-red-500 uppercase">QAYTARILDI</span>}
                    </div>
                    <p className="font-black text-stone-800 uppercase text-sm md:text-base leading-none truncate">{s.productName}</p>
                    <p className="text-[10px] text-stone-400 font-bold mt-1 uppercase tracking-widest">{s.customerName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-stone-900 tracking-tighter text-base md:text-lg">{s.total.toLocaleString()} ₼</p>
                  <p className="text-[9px] text-stone-300 font-bold">{new Date(s.date).toLocaleDateString()}</p>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-20 text-center flex flex-col items-center">
                 <Search size={48} className="text-stone-100 mb-4" />
                 <p className="text-stone-300 font-black uppercase text-xs tracking-widest">Qeyd tapılmadı</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">İadə / Dəyişmə Paneli</h3>
        {selectedSale ? (
          <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-stone-100 shadow-2xl p-6 md:p-10 space-y-6 md:space-y-10 animate-in slide-in-from-right duration-300">
            <div className="bg-stone-50/50 border-2 border-dashed border-stone-200 p-6 md:p-8 rounded-3xl relative">
              <button onClick={() => setSelectedSale(null)} className="absolute top-4 right-4 p-2 text-stone-300 hover:text-stone-500"><X size={20}/></button>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                   <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-amber-500 border border-stone-100"><Gem size={32} /></div>
                   <div>
                      <h4 className="text-lg md:text-2xl font-black text-stone-900 leading-tight uppercase tracking-tighter">{selectedSale.productName}</h4>
                      <p className="text-[10px] md:text-xs text-stone-400 font-bold uppercase mt-1 tracking-widest">{selectedSale.type} | {new Date(selectedSale.date).toLocaleDateString()}</p>
                   </div>
                </div>
                <div className="bg-stone-900 text-amber-500 px-6 py-3 rounded-2xl text-xl font-black tracking-tighter shadow-xl">
                   {selectedSale.total.toLocaleString()} ₼
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-5 bg-amber-50/50 rounded-2xl border border-amber-100">
               <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
               <p className="text-[10px] md:text-xs font-bold text-amber-900 leading-relaxed uppercase tracking-widest">Diqqət! Bu əməliyyatdan sonra məhsul avtomatik olaraq stoka (+1) geri əlavə ediləcək və satış rekordu 'returned' statusuna keçəcək.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <button 
                onClick={() => handleProcessReturn(false)}
                className="bg-red-50 text-red-600 border-2 border-red-100 py-6 md:py-8 rounded-3xl font-black text-xs md:text-sm hover:bg-red-100 transition-all flex flex-col items-center justify-center uppercase tracking-widest active:scale-95 group"
              >
                <RotateCcw className="w-10 h-10 mb-3 group-hover:rotate-[-45deg] transition-transform duration-500" />
                GERİ AL (İADƏ)
              </button>
              <button 
                onClick={() => handleProcessReturn(true)}
                className="bg-stone-900 text-amber-500 border-2 border-stone-800 py-6 md:py-8 rounded-3xl font-black text-xs md:text-sm hover:bg-black transition-all flex flex-col items-center justify-center uppercase tracking-widest active:scale-95 group shadow-2xl"
              >
                <ArrowRightLeft className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform duration-500" />
                DƏYİŞMƏ ET
              </button>
            </div>

            <div className="flex items-center justify-center p-4 bg-stone-50 rounded-2xl border border-stone-100">
              <Package className="w-4 h-4 text-stone-300 mr-3" />
              <p className="text-[9px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest">Əməliyyat avtomatik stok uçotuna daxildir</p>
            </div>
          </div>
        ) : (
          <div className="bg-stone-100/50 rounded-[3rem] border-4 border-dashed border-white h-full min-h-[300px] flex flex-col items-center justify-center text-stone-300 p-10 text-center shadow-inner">
            <RotateCcw className="w-16 md:w-24 h-16 md:h-24 mb-6 opacity-20" />
            <p className="text-xs md:text-sm font-black uppercase tracking-[0.4em] max-w-xs leading-relaxed">Arxivdən bir satış seçərək iadə və ya dəyişmə proseduruna başlaya bilərsiniz</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnsModule;