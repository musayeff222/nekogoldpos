import React, { useState, useRef, useEffect } from 'react';
import { Folder, MoreVertical, Trash2, Wrench, Undo2, X, AlertCircle, ChevronRight, Plus, Save, Tag, Barcode, Scale, DollarSign, Image as ImageIcon, Upload, Star, User, Sparkles } from 'lucide-react';
import { Product, ProductType, AppSettings } from '../types';

interface StockProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  settings: AppSettings;
}

const StockModule: React.FC<StockProps> = ({ products, setProducts, settings }) => {
  const [activeFolder, setActiveFolder] = useState<ProductType | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [duplicateError, setDuplicateError] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    carat: settings.carats[0] || 22,
    type: settings.productTypes[0] || '',
    supplier: settings.suppliers[0] || '',
    brilliant: '',
    weight: '' as string | number,
    price: '' as string | number,
    imageUrl: ''
  });

  useEffect(() => {
    if (newProduct.weight !== '' && !isNaN(Number(newProduct.weight))) {
      const rawPrice = Number(newProduct.weight) * settings.pricePerGram;
      const roundedPrice = Math.round(rawPrice / 10) * 10; 
      setNewProduct(prev => ({ ...prev, price: roundedPrice }));
    } else {
      setNewProduct(prev => ({ ...prev, price: '' }));
    }
  }, [newProduct.weight, settings.pricePerGram]);

  useEffect(() => {
    const existing = products.find(p => p.code.trim().toLowerCase() === newProduct.code.trim().toLowerCase());
    if (existing) {
      setDuplicateError(existing);
    } else {
      setDuplicateError(null);
    }
  }, [newProduct.code, products]);

  const filteredProducts = activeFolder 
    ? products.filter(p => p.type === activeFolder)
    : products;

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.code || !newProduct.name || duplicateError) return;

    const productToAdd: Product = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      code: newProduct.code.trim(),
      name: newProduct.name.trim(),
      carat: newProduct.carat,
      type: newProduct.type,
      supplier: newProduct.supplier,
      brilliant: newProduct.brilliant || undefined,
      weight: newProduct.weight === '' ? 0 : Number(newProduct.weight),
      price: newProduct.price === '' ? 0 : Number(newProduct.price),
      imageUrl: newProduct.imageUrl,
      supplierPrice: 0, 
      stockCount: 1 
    };

    setProducts(prev => [productToAdd, ...prev]);
    setShowAddModal(false);
    setNewProduct({
      code: '', name: '', carat: settings.carats[0] || 22,
      type: settings.productTypes[0] || '', supplier: settings.suppliers[0] || '',
      brilliant: '', weight: '', price: '', imageUrl: ''
    });
    setActiveFolder(productToAdd.type);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewProduct(prev => ({ ...prev, imageUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-sm">
          <button onClick={() => setActiveFolder(null)} className={`font-semibold ${!activeFolder ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'}`}>
            Məhsullar
          </button>
          {activeFolder && <><span className="text-stone-300">/</span><span className="text-stone-800 font-bold">{activeFolder}</span></>}
        </div>
        <button onClick={() => { setDuplicateError(null); setShowAddModal(true); }} className="w-full sm:w-auto bg-amber-500 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-amber-600 transition-all flex items-center justify-center shadow-lg shadow-amber-200">
          <Plus className="w-5 h-5 mr-2" /> Yeni Məhsul
        </button>
      </div>

      {!activeFolder ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
          {settings.productTypes.map((type) => (
            <button key={type} onClick={() => setActiveFolder(type)} className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-stone-200 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all flex flex-col items-center group text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-amber-50 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-600 mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                <Folder className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h4 className="font-bold text-stone-800 text-sm md:text-base">{type}</h4>
              <p className="text-[10px] md:text-xs text-stone-400 mt-1 font-medium">{products.filter(p => p.type === type).length} Ədəd</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl md:rounded-3xl border border-stone-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px] md:min-w-0">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-stone-400 uppercase">Sıra</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-stone-400 uppercase">Şəkil</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-stone-400 uppercase">Kod</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-stone-400 uppercase">Ad</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-stone-400 uppercase">Əyar</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-stone-400 uppercase">Çəki</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-stone-400 uppercase text-right">Qiymət</th>
                  <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-bold text-stone-400 uppercase text-center">İşləm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-4 md:px-6 py-4 text-stone-500 font-medium text-sm">{idx + 1}</td>
                    <td className="px-4 md:px-6 py-4">
                      {p.imageUrl ? <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover border" /> : <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-300"><ImageIcon className="w-5 h-5" /></div>}
                    </td>
                    <td className="px-4 md:px-6 py-4 font-bold text-stone-600 text-sm">{p.code}</td>
                    <td className="px-4 md:px-6 py-4 font-semibold text-stone-800 text-sm">{p.name}</td>
                    <td className="px-4 md:px-6 py-4 font-bold text-amber-700 text-sm">{p.carat}K</td>
                    <td className="px-4 md:px-6 py-4 font-black text-amber-900 text-sm">{p.weight} gr</td>
                    <td className="px-4 md:px-6 py-4 text-stone-900 font-bold text-right text-sm">{(Number(p.price) || 0).toLocaleString()} ₼</td>
                    <td className="px-4 md:px-6 py-4 text-center">
                      <button onClick={() => { setSelectedProduct(p); setShowDetailModal(true); }} className="p-2 text-amber-600 hover:bg-amber-100 rounded-full">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Yeni Məhsul Modalı (Mobil üçün optimallaşdırılmış) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl max-w-5xl w-full h-[90vh] md:h-auto overflow-y-auto scrollbar-hide animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300">
            <div className="p-4 md:p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50 sticky top-0 z-20">
              <div className="flex items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-500 text-white rounded-lg md:rounded-xl flex items-center justify-center mr-3 md:mr-4">
                   <Plus className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-stone-800 uppercase tracking-tighter">Yeni Məhsul</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-stone-200 rounded-full text-stone-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-4 md:p-8">
              <div className="grid grid-cols-12 gap-4 md:gap-8">
                
                <div className="col-span-12 lg:col-span-4 space-y-4 md:space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase mb-2 tracking-widest">Şəkil</label>
                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 md:h-64 border-2 border-dashed border-stone-200 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all overflow-hidden">
                      {newProduct.imageUrl ? (
                        <img src={newProduct.imageUrl} className="w-full h-full object-contain p-2" />
                      ) : (
                        <>
                          <ImageIcon className="w-12 h-12 text-stone-200 mb-2" />
                          <span className="text-[10px] font-bold text-stone-400 uppercase">Seç</span>
                        </>
                      )}
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Kod</label>
                      <input type="text" required value={newProduct.code} onChange={(e) => setNewProduct({...newProduct, code: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl py-4 px-4 font-bold text-stone-800 focus:ring-4 focus:ring-amber-50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Ad</label>
                      <input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl py-4 px-4 font-bold text-stone-800" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Növ</label>
                      <select value={newProduct.type} onChange={(e) => setNewProduct({...newProduct, type: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl py-4 px-4 font-bold text-stone-800">
                        {settings.productTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Tədarükçü</label>
                      <select value={newProduct.supplier} onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl py-4 px-4 font-bold text-stone-800">
                        {settings.suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Çəki (gr)</label>
                      <input type="number" step="0.001" required value={newProduct.weight} onChange={(e) => setNewProduct({...newProduct, weight: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl py-4 px-4 font-black text-xl text-stone-800" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Qiymət</label>
                      <input type="number" required value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-amber-50 border border-amber-200 rounded-xl py-4 px-4 font-black text-xl text-amber-900" />
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <button type="button" onClick={() => setShowAddModal(false)} className="bg-stone-100 text-stone-600 py-4 rounded-xl font-bold">Ləğv Et</button>
                    <button type="submit" className="bg-amber-600 text-white py-4 rounded-xl font-black shadow-lg">YADDA SAXLA</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockModule;