
import React, { useState } from 'react';
import { Search, RotateCcw, AlertTriangle, ArrowRightLeft, Package } from 'lucide-react';
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
      
      // Stok geri əlavə et
      setProducts(products.map(p => 
        p.id === selectedSale.productId ? { ...p, stockCount: p.stockCount + 1 } : p
      ));

      alert(`${isExchange ? 'Dəyişilmə' : 'Geri qaytarma'} tamamlandı. Məhsul stoka geri əlavə edildi.`);
      setSelectedSale(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Satış Arxivində Axtar</h3>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Satış No, Məhsul və ya Müştəri Axtar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-stone-200 border rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm"
          />
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden h-[500px] overflow-y-auto scrollbar-hide">
          <div className="divide-y divide-stone-100">
            {filtered.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSale(s)}
                className={`w-full flex items-center justify-between p-6 hover:bg-stone-50 transition-all text-left ${selectedSale?.id === s.id ? 'bg-amber-50 border-l-4 border-l-amber-500' : ''}`}
              >
                <div>
                  <div className="flex items-center mb-1">
                    <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded font-bold text-stone-500 mr-2">#{s.id.toUpperCase()}</span>
                    <span className={`text-[10px] font-bold uppercase ${s.status === 'returned' ? 'text-red-500' : 'text-green-500'}`}>
                      {s.status === 'returned' ? 'QAYTARILDI' : 'TAMAMLANDI'}
                    </span>
                  </div>
                  <p className="font-bold text-stone-800">{s.productName}</p>
                  <p className="text-xs text-stone-400">{s.customerName} - {new Date(s.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-stone-900">{s.total.toLocaleString('az-AZ')} ₼</p>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-12 text-center text-stone-400 italic">Qeyd tapılmadı.</div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">İadə / Dəyişmə Əməliyyatı</h3>
        {selectedSale ? (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 space-y-8">
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
              <div className="flex items-start justify-between">
                <div>
                   <h4 className="text-lg font-bold text-amber-900">{selectedSale.productName}</h4>
                   <p className="text-sm text-amber-700">{selectedSale.type} | {new Date(selectedSale.date).toLocaleString()}</p>
                </div>
                <div className="bg-white px-3 py-1 rounded-full text-amber-600 font-bold border border-amber-200 text-sm">
                   {selectedSale.total.toLocaleString('az-AZ')} ₼
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center text-stone-500 text-sm">
                 <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
                 <span>Bu məhsul stoka geri əlavə ediləcək və satış ləğv ediləcək.</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleProcessReturn(false)}
                className="bg-red-50 text-red-600 border border-red-200 py-6 rounded-2xl font-bold hover:bg-red-100 transition-all flex flex-col items-center justify-center group"
              >
                <RotateCcw className="w-8 h-8 mb-2 group-hover:rotate-[-45deg] transition-transform" />
                Geri Al (İadə)
              </button>
              <button 
                onClick={() => handleProcessReturn(true)}
                className="bg-blue-50 text-blue-600 border border-blue-200 py-6 rounded-2xl font-bold hover:bg-blue-100 transition-all flex flex-col items-center justify-center group"
              >
                <ArrowRightLeft className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                Dəyişmə Et
              </button>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center">
              <Package className="w-5 h-5 text-stone-400 mr-3" />
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase">Stok Vəziyyəti</p>
                <p className="text-sm font-medium text-stone-700">Əməliyyatdan sonra stok avtomatik olaraq +1 artacaq.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200 h-96 flex flex-col items-center justify-center text-stone-400 p-8 text-center">
            <RotateCcw className="w-16 h-16 mb-4 opacity-10" />
            <p className="text-lg font-bold">Əməliyyat Seçin</p>
            <p className="text-sm max-w-xs mt-2">Sol tərəfdəki siyahıdan geri qaytarmaq istədiyiniz satışı seçin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnsModule;
