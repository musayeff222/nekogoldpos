
import React, { useState } from 'react';
import { 
  Search, 
  RotateCcw, 
  AlertTriangle, 
  ArrowRightLeft, 
  Package, 
  Gem, 
  X,
  Barcode,
  CheckCircle2,
  Settings,
  RefreshCw,
  Save,
  Tag,
  User
} from 'lucide-react';
import { Sale, Product, SystemLog } from '@/types';

interface ReturnsProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addLog: (action: string, category: SystemLog['category'], details?: string) => void;
}

const ReturnsModule: React.FC<ReturnsProps> = ({ sales, setSales, products, setProducts, addLog }) => {
  const [activeTab, setActiveTab] = useState<'process' | 'list'>('process');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  // Refund Option States
  const [showRefundOptions, setShowRefundOptions] = useState(false);
  const [returnCodeOption, setReturnCodeOption] = useState<'same' | 'new'>('same');
  const [newCodeInput, setNewCodeInput] = useState('');

  const filtered = (Array.isArray(sales) ? sales : []).filter(s => 
    s.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartRefund = () => {
    setReturnCodeOption('same');
    setNewCodeInput(selectedSale?.productCode || '');
    setShowRefundOptions(true);
  };

  const finalizeReturn = (isExchange: boolean) => {
    if (!selectedSale) return;

    let finalCode = selectedSale.productCode;
    let note = isExchange 
      ? "Bu mal başqa mal ilə dəyişdirilmişdir" 
      : "Bu kod geri qaytarıldı öz kodu ilə";

    if (!isExchange && returnCodeOption === 'new') {
        if (!newCodeInput.trim()) {
            alert("Yeni kodu daxil edin!");
            return;
        }
        finalCode = newCodeInput.trim();
        note = `Bu kod geri qaytarıldı və yeni kodu budur: ${finalCode}`;
    }

    const actionText = isExchange ? 'DƏYİŞİLMƏ' : 'GERİ QAYTARMA';
    const finalStatus = isExchange ? 'exchanged' : 'returned';

    addLog(`${actionText}: ${selectedSale.productCode}`, 'SALE', `Müştəri: ${selectedSale.customerName}, Məbləğ: ${selectedSale.total} AZN, Səbəb: ${note}`);

    // 1. Satış tarixçəsini yenilə
    setSales((prev: Sale[]) => prev.map((s: Sale) => 
      s.id === selectedSale.id ? { ...s, status: finalStatus, returnNote: note } : s
    ));
    
    // 2. Məhsulu stoka əlavə et (Amma 'isReturned' olaraq işarələ və stockCount-u 0 et ki, əsas stokda görünməsin)
    setProducts((prev: Product[]) => prev.map((p: Product) => {
        if (p.id === selectedSale.productId) {
            const updatedProduct = { 
                ...p, 
                stockCount: 0, 
                isReturned: true,
                returnReason: note,
                code: finalCode,
                logs: [{ date: new Date().toISOString(), action: `${actionText} prosesi ilə geri qayıtdı. ${note}` }, ...(p.logs || [])]
            };
            
            // Save to server immediately
            fetch(`/api/products/${updatedProduct.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ product: updatedProduct })
            }).catch(err => console.error('Failed to update product in database during return:', err));

            return updatedProduct;
        }
        return p;
    }));

    alert(`${actionText} tamamlandı. Məhsul "İadələr" siyahısına əlavə edildi.`);
    setShowRefundOptions(false);
    setSelectedSale(null);
    setSearchTerm('');
  };

  const handleRestoreToStock = (product: Product) => {
    if (!confirm(`"${product.name}" məhsulunu yenidən əsas stoka qaytarmaq istəyirsiniz?`)) return;

    const updatedProduct = {
      ...product,
      isReturned: false,
      stockCount: 1,
      logs: [{ date: new Date().toISOString(), action: "İadələr siyahısından əsas stoka qaytarıldı." }, ...(product.logs || [])]
    };

    setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));

    fetch(`/api/products/${updatedProduct.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: updatedProduct })
    }).catch(err => console.error('Failed to restore product to stock:', err));

    alert("Məhsul əsas stoka qaytarıldı.");
  };

  const returnedProducts = products.filter(p => p.isReturned);

  return (
    <div className="flex flex-col space-y-6 pb-24 md:pb-10 animate-in fade-in duration-500">
      {/* TABS */}
      <div className="flex space-x-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm self-start">
        <button 
          onClick={() => setActiveTab('process')}
          className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'process' ? 'bg-slate-900 text-indigo-500 shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          İadə Et
        </button>
        <button 
          onClick={() => setActiveTab('list')}
          className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-slate-900 text-indigo-500 shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          İadələr Siyahısı
        </button>
      </div>

      {activeTab === 'process' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 relative">
          {/* SOL TƏRƏF: KODLA AXTARIŞ VƏ SİYAHI */}
          <div className="space-y-4 md:space-y-6 flex flex-col h-full">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Məhsul Kodu ilə Axtarış</h3>
                <span className="text-[9px] font-bold text-slate-300 uppercase">{(Array.isArray(sales) ? sales : []).length} Satış Mövcuddur</span>
            </div>
            
            <div className="relative group">
              <Barcode className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Malın kodunu daxil edin (məs: YZ-101)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl md:rounded-[2rem] py-5 md:py-6 pl-16 pr-6 focus:ring-8 focus:ring-indigo-50 outline-none shadow-xl text-base font-black tracking-tight placeholder:text-slate-300 placeholder:font-medium"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                    <X size={24}/>
                </button>
              )}
            </div>

            <div className="bg-white rounded-3xl md:rounded-[3rem] border border-slate-100 shadow-2xl flex-1 overflow-hidden flex flex-col min-h-[500px]">
              <div className="divide-y divide-slate-50 overflow-y-auto scrollbar-hide">
                {filtered.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSale(s)}
                    className={`w-full flex items-center justify-between p-6 md:p-8 hover:bg-indigo-50/50 transition-all text-left border-l-[8px] ${selectedSale?.id === s.id ? 'bg-indigo-50 border-indigo-500' : 'border-transparent'}`}
                  >
                    <div className="flex items-center space-x-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${s.status === 'returned' || s.status === 'exchanged' ? 'bg-indigo-50 border-indigo-100 text-indigo-500' : 'bg-slate-50 border-slate-100 text-slate-300 group-hover:text-indigo-500'}`}>
                        {s.status === 'returned' ? <RotateCcw size={24} /> : s.status === 'exchanged' ? <ArrowRightLeft size={24} /> : <Gem size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1.5">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest">{s.productCode}</span>
                          {s.status === 'returned' && (
                            <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded uppercase border border-red-100 tracking-tighter">QAYTARILIB</span>
                          )}
                          {s.status === 'exchanged' && (
                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase border border-indigo-100 tracking-tighter">DƏYİŞDİRİLİB</span>
                          )}
                        </div>
                        <p className="font-black text-slate-800 uppercase text-sm md:text-lg leading-none">{s.productName}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest flex items-center">
                            <User size={12} className="mr-1.5" /> {s.customerName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 tracking-tighter text-lg md:text-2xl">{s.total.toLocaleString()} ₼</p>
                      <p className="text-[10px] text-slate-300 font-bold uppercase mt-1">{new Date(s.date).toLocaleDateString('az-AZ')}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SAĞ TƏRƏF: SEÇİLMİŞ MAL ÜÇÜN ƏMƏLİYYAT PANELİ */}
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">İadə və ya Dəyişmə Əməliyyatı</h3>
            
            {selectedSale ? (
              <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-2xl p-8 md:p-12 space-y-10 animate-in slide-in-from-right duration-300">
                
                {/* Məhsul Kartı */}
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-[2rem] relative group">
                  <button 
                    onClick={() => setSelectedSale(null)} 
                    className="absolute top-6 right-6 p-3 bg-white text-slate-300 hover:text-red-500 rounded-xl shadow-sm transition-all hover:rotate-90"
                  >
                    <X size={20}/>
                  </button>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center space-x-6">
                       <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-indigo-500 border border-slate-100 overflow-hidden p-2">
                          {selectedSale.imageUrl ? (
                            <img 
                              src={selectedSale.imageUrl} 
                              referrerPolicy="no-referrer" 
                              className="w-full h-full object-contain" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-indigo-500"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gem"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg></div>';
                              }}
                            />
                          ) : (
                            <Gem size={40} strokeWidth={1.5} />
                          )}
                       </div>
                       <div>
                          <h4 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight uppercase tracking-tighter">{selectedSale.productName}</h4>
                          <div className="flex items-center space-x-3 mt-2">
                             <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">{selectedSale.productCode}</span>
                             <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                             <span className="text-[11px] font-bold text-slate-400 uppercase">{selectedSale.weight} gr</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <div className="bg-slate-900 text-indigo-500 px-8 py-4 rounded-2xl text-3xl font-black tracking-tighter shadow-2xl border border-slate-800">
                          {selectedSale.total.toLocaleString()} ₼
                       </div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 px-2 flex items-center">
                         <CheckCircle2 size={12} className="mr-1.5 text-green-500" /> Sənəd: #{selectedSale.id.toUpperCase()}
                       </p>
                    </div>
                  </div>
                </div>

                {/* Əsas Düymələr */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={handleStartRefund}
                    disabled={selectedSale.status !== 'completed'}
                    className={`flex flex-col items-center justify-center py-10 md:py-14 rounded-[2.5rem] font-black text-xs md:text-sm transition-all active:scale-95 group relative overflow-hidden ${selectedSale.status !== 'completed' ? 'bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed shadow-none' : 'bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-500 hover:text-white hover:border-red-500 shadow-xl'}`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-100 opacity-20 rounded-full -mr-12 -mt-12"></div>
                    <RotateCcw className="w-12 h-12 mb-4 group-hover:rotate-[-45deg] transition-transform duration-500" />
                    <span className="uppercase tracking-[0.2em]">GERİ QAYTARILMA</span>
                    <span className="text-[9px] font-bold opacity-60 mt-2">(Pulu Geri Verilir)</span>
                  </button>
                  
                  <button 
                    onClick={() => finalizeReturn(true)}
                    disabled={selectedSale.status !== 'completed'}
                    className={`flex flex-col items-center justify-center py-10 md:py-14 rounded-[2.5rem] font-black text-xs md:text-sm transition-all active:scale-95 group relative overflow-hidden ${selectedSale.status !== 'completed' ? 'bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed shadow-none' : 'bg-slate-900 text-indigo-500 border-2 border-slate-800 hover:bg-black hover:scale-[1.02] shadow-2xl shadow-indigo-900/10'}`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 opacity-5 rounded-full -mr-12 -mt-12"></div>
                    <ArrowRightLeft className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform duration-500" />
                    <span className="uppercase tracking-[0.2em]">MALIN DƏYİŞİLMƏSİ</span>
                    <span className="text-[9px] font-bold opacity-60 mt-2">(Başqa Malla Dəyiş)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100/30 rounded-[3rem] border-4 border-dashed border-slate-100 h-full min-h-[400px] flex flex-col items-center justify-center text-slate-300 p-12 text-center shadow-inner group">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl border border-slate-50 group-hover:scale-110 transition-transform duration-700">
                    <RotateCcw className="w-12 h-12 text-slate-200" />
                </div>
                <p className="text-sm md:text-base font-black uppercase tracking-[0.4em] text-slate-400">Mal Seçilməyib</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* İADƏLƏR SİYAHISI TABI */
        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 md:p-12 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">İadələr Siyahısı</h3>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Geri qaytarılmış və stoka hələ əlavə edilməmiş məhsullar</p>
            </div>
            <div className="bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-lg shadow-lg">
              {returnedProducts.length} <span className="text-[10px] uppercase tracking-widest ml-1">Məhsul</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Məhsul</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kod</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Çəki</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Səbəb / Qeyd</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {returnedProducts.length > 0 ? returnedProducts.map(p => (
                  <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-500 border border-slate-100 overflow-hidden">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <Gem size={20} />
                          )}
                        </div>
                        <span className="font-black text-slate-800 uppercase text-sm">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase tracking-widest">{p.code}</span>
                    </td>
                    <td className="px-8 py-6 font-bold text-slate-500 text-sm">{p.weight} gr</td>
                    <td className="px-8 py-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed max-w-xs">{p.returnReason || 'Qeyd yoxdur'}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleRestoreToStock(p)}
                        className="bg-slate-900 text-indigo-500 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-md flex items-center space-x-2 ml-auto"
                      >
                        <RefreshCw size={14} />
                        <span>Stoka Qaytar</span>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-300">
                        <RotateCcw size={48} className="mb-4 opacity-20" />
                        <p className="font-black uppercase tracking-[0.3em]">İadə edilmiş məhsul yoxdur</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GERİ QAYTARMA OPSİYALARI MODALI */}
      {showRefundOptions && selectedSale && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95">
              <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center space-x-3 text-red-600">
                    <AlertTriangle size={24} />
                    <h3 className="text-lg font-black uppercase tracking-tighter">İadə Seçimləri</h3>
                 </div>
                 <button onClick={() => setShowRefundOptions(false)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                    <X size={24} />
                 </button>
              </header>

              <main className="p-8 space-y-8">
                 <p className="text-xs font-bold text-slate-500 uppercase text-center leading-relaxed">
                   Məhsul stoka geri əlavə edilərkən kodunun necə saxlanılacağını seçin:
                 </p>

                 <div className="grid grid-cols-1 gap-4">
                    <button 
                        onClick={() => setReturnCodeOption('same')}
                        className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${returnCodeOption === 'same' ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                    >
                        <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-xl ${returnCodeOption === 'same' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}`}><RefreshCw size={20}/></div>
                            <div className="text-left">
                                <p className="font-black text-xs uppercase tracking-widest">Köhnə Kodla Qalsın</p>
                                <p className="text-[10px] font-bold opacity-60">Stoka {selectedSale.productCode} kodu ilə qayıdır</p>
                            </div>
                        </div>
                        {returnCodeOption === 'same' && <CheckCircle2 className="text-indigo-500" />}
                    </button>

                    <button 
                        onClick={() => setReturnCodeOption('new')}
                        className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${returnCodeOption === 'new' ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                    >
                        <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-xl ${returnCodeOption === 'new' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'}`}><Settings size={20}/></div>
                            <div className="text-left">
                                <p className="font-black text-xs uppercase tracking-widest">Yeni Kod Təyin Et</p>
                                <p className="text-[10px] font-bold opacity-60">Stoka fərqli kodla əlavə olunacaq</p>
                            </div>
                        </div>
                        {returnCodeOption === 'new' && <CheckCircle2 className="text-indigo-500" />}
                    </button>
                 </div>

                 {returnCodeOption === 'new' && (
                    <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">YENİ KODU DAXİL EDİN</label>
                        <div className="relative">
                            <Barcode className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input 
                                type="text" 
                                value={newCodeInput}
                                onChange={(e) => setNewCodeInput(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-4 pl-14 pr-4 font-black text-slate-800 outline-none focus:border-indigo-500 transition-all"
                                placeholder="Məs: YZ-101-R"
                            />
                        </div>
                    </div>
                 )}
              </main>

              <footer className="p-8 bg-slate-50/50 border-t border-slate-100 flex space-x-4">
                 <button 
                    onClick={() => setShowRefundOptions(false)}
                    className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest border border-slate-200 rounded-xl hover:bg-white"
                 >
                    Ləğv Et
                 </button>
                 <button 
                    onClick={() => finalizeReturn(false)}
                    className="flex-[2] py-4 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl hover:bg-red-600 transition-all flex items-center justify-center border-b-4 border-red-700"
                 >
                    <Save size={16} className="mr-2" /> TƏSDİQLƏ VƏ İADƏ ET
                 </button>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsModule;
