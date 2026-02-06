import React, { useState } from 'react';
import { Shield, Key, Printer, Save, Database, Trash2, Tag, User, Plus, X, List, Star, Calculator, ChevronRight } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const SettingsModule: React.FC<SettingsProps> = ({ settings, setSettings }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [newType, setNewType] = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [newCarat, setNewCarat] = useState('');

  const handleSave = () => {
    setSettings(localSettings);
    alert("Ayarlar uğurla yadda saxlanıldı.");
  };

  const addType = () => {
    if (!newType.trim()) return;
    if (localSettings.productTypes.includes(newType.trim())) return;
    setLocalSettings({
      ...localSettings,
      productTypes: [...localSettings.productTypes, newType.trim()]
    });
    setNewType('');
  };

  const addSupplier = () => {
    if (!newSupplier.trim()) return;
    if (localSettings.suppliers.includes(newSupplier.trim())) return;
    setLocalSettings({
      ...localSettings,
      suppliers: [...localSettings.suppliers, newSupplier.trim()]
    });
    setNewSupplier('');
  };

  const addCarat = () => {
    const val = Number(newCarat);
    if (!newCarat.trim() || isNaN(val)) return;
    if (localSettings.carats.includes(val)) return;
    setLocalSettings({
      ...localSettings,
      carats: [...localSettings.carats, val].sort((a, b) => a - b)
    });
    setNewCarat('');
  };

  const removeItem = (list: 'productTypes' | 'suppliers' | 'carats', item: any) => {
    setLocalSettings({
      ...localSettings,
      [list]: localSettings[list].filter(i => i !== item)
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-10 pb-24 md:pb-10 animate-in fade-in duration-500">
      
      {/* Qiymət Hesablama Parametri */}
      <div className="bg-white rounded-3xl md:rounded-[3rem] border border-stone-100 shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-5/12 p-8 md:p-12 bg-amber-50/30 border-b md:border-b-0 md:border-r border-stone-100">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-500 text-white rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-amber-200">
            <Calculator size={32} />
          </div>
          <h3 className="text-xl md:text-2xl font-black text-stone-900 tracking-tighter uppercase mb-4">AVTOMATİK QİYMƏT</h3>
          <p className="text-xs md:text-sm text-stone-400 font-bold leading-relaxed">Məhsul əlavə edilərkən çəkiyə görə qiymətin hesablanması parametri.</p>
        </div>
        <div className="flex-1 p-8 md:p-12 space-y-8 flex flex-col justify-center">
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-4">1 Qram Qiyməti (₼)</label>
            <div className="relative group">
              <Star className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-500 opacity-30 group-focus-within:opacity-100 transition-all" />
              <input 
                type="number" 
                value={localSettings.pricePerGram}
                onChange={(e) => setLocalSettings({...localSettings, pricePerGram: Number(e.target.value)})}
                className="w-full bg-stone-50 border-2 border-stone-100 rounded-[1.5rem] py-5 pl-16 pr-8 focus:ring-8 focus:ring-amber-50 focus:bg-white outline-none font-black text-2xl text-amber-900 transition-all shadow-inner"
              />
            </div>
            <p className="text-[9px] md:text-[10px] text-stone-400 font-bold italic ml-4 leading-normal">
              * Məhsul qiyməti ən yaxın onluğa yuvarlaşdırılacaq (Məs: 408 &rarr; 410).
            </p>
          </div>
        </div>
      </div>

      {/* Yönetim Panelleri Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Mehsul Novleri */}
        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 md:p-8 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
             <div className="flex items-center">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-stone-100 mr-4 text-amber-500"><List size={20} /></div>
                <h3 className="font-black text-stone-800 text-xs md:text-sm uppercase tracking-widest">NÖVLƏR</h3>
             </div>
             <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">{localSettings.productTypes.length}</span>
          </div>
          <div className="p-6 md:p-8 flex-1 flex flex-col space-y-6">
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Yeni növ..."
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addType()}
                className="flex-1 bg-stone-50 border-2 border-stone-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-amber-50 outline-none transition-all"
              />
              <button onClick={addType} className="bg-stone-900 text-amber-500 p-3 rounded-xl hover:bg-black transition-all active:scale-90"><Plus size={24} /></button>
            </div>
            <div className="flex flex-wrap gap-2 overflow-y-auto pr-1">
              {localSettings.productTypes.map(type => (
                <div key={type} className="bg-amber-50/50 text-stone-700 px-4 py-2 rounded-xl text-[10px] font-black border border-amber-100 flex items-center animate-in zoom-in-95">
                  {type.toUpperCase()}
                  <button onClick={() => removeItem('productTypes', type)} className="ml-3 text-stone-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tedarukculer */}
        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 md:p-8 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
             <div className="flex items-center">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-stone-100 mr-4 text-amber-500"><User size={20} /></div>
                <h3 className="font-black text-stone-800 text-xs md:text-sm uppercase tracking-widest">TƏDARÜKÇÜLƏR</h3>
             </div>
             <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">{localSettings.suppliers.length}</span>
          </div>
          <div className="p-6 md:p-8 flex-1 flex flex-col space-y-6">
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Yeni..."
                value={newSupplier}
                onChange={(e) => setNewSupplier(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSupplier()}
                className="flex-1 bg-stone-50 border-2 border-stone-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-amber-50 outline-none transition-all"
              />
              <button onClick={addSupplier} className="bg-stone-900 text-amber-500 p-3 rounded-xl hover:bg-black transition-all active:scale-90"><Plus size={24} /></button>
            </div>
            <div className="flex flex-wrap gap-2 overflow-y-auto pr-1">
              {localSettings.suppliers.map(s => (
                <div key={s} className="bg-stone-50 text-stone-700 px-4 py-2 rounded-xl text-[10px] font-black border border-stone-100 flex items-center animate-in zoom-in-95">
                  {s.toUpperCase()}
                  <button onClick={() => removeItem('suppliers', s)} className="ml-3 text-stone-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Eyarlar */}
        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 md:p-8 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
             <div className="flex items-center">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-stone-100 mr-4 text-amber-500"><Star size={20} /></div>
                <h3 className="font-black text-stone-800 text-xs md:text-sm uppercase tracking-widest">ƏYARLAR</h3>
             </div>
             <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">{localSettings.carats.length}</span>
          </div>
          <div className="p-6 md:p-8 flex-1 flex flex-col space-y-6">
            <div className="flex space-x-2">
              <input 
                type="number" 
                placeholder="Məs: 21"
                value={newCarat}
                onChange={(e) => setNewCarat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCarat()}
                className="flex-1 bg-stone-50 border-2 border-stone-100 rounded-xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-amber-50 outline-none transition-all"
              />
              <button onClick={addCarat} className="bg-stone-900 text-amber-500 p-3 rounded-xl hover:bg-black transition-all active:scale-90"><Plus size={24} /></button>
            </div>
            <div className="flex flex-wrap gap-2 overflow-y-auto pr-1">
              {localSettings.carats.map(c => (
                <div key={c} className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-[10px] font-black border border-amber-200 flex items-center animate-in zoom-in-95">
                  {c}K
                  <button onClick={() => removeItem('carats', c)} className="ml-3 text-amber-300 hover:text-red-500 transition-colors"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Guvenlik Bolmesi */}
      <div className="bg-white rounded-3xl md:rounded-[3rem] border border-stone-100 shadow-2xl overflow-hidden">
        <div className="p-8 md:p-12 border-b border-stone-100 bg-stone-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
             <div className="p-4 bg-white rounded-2xl shadow-lg border border-stone-100 mr-6 text-amber-500"><Shield size={32} /></div>
             <div>
                <h3 className="text-xl md:text-2xl font-black text-stone-900 uppercase tracking-tighter leading-none">TƏHLÜKƏSİZLİK</h3>
                <p className="text-[10px] md:text-xs text-stone-400 font-bold uppercase tracking-widest mt-2">Admin şifrəsi və əməliyyat kodları</p>
             </div>
          </div>
        </div>
        <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Silmə Təsdiq Kodu</label>
            <div className="relative">
              <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
              <input 
                type="text" 
                value={localSettings.deleteCode}
                onChange={(e) => setLocalSettings({...localSettings, deleteCode: e.target.value})}
                className="w-full bg-stone-50 border-2 border-stone-100 rounded-[1.5rem] py-4 pl-14 pr-6 font-mono text-xl tracking-[0.3em] font-black focus:ring-8 focus:ring-amber-50 outline-none"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Admin Giriş Şifrəsi</label>
            <div className="relative">
              <Shield className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
              <input 
                type="password" 
                value={localSettings.adminPassword}
                onChange={(e) => setLocalSettings({...localSettings, adminPassword: e.target.value})}
                className="w-full bg-stone-50 border-2 border-stone-100 rounded-[1.5rem] py-4 pl-14 pr-6 font-black text-xl focus:ring-8 focus:ring-amber-50 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <button 
          onClick={handleSave}
          className="flex-1 bg-amber-600 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-amber-700 transition-all shadow-2xl shadow-amber-200 flex items-center justify-center uppercase tracking-widest active:scale-95"
        >
          <Save className="w-8 h-8 mr-4" /> AYARLARI YADDA SAXLA
        </button>
      </div>
    </div>
  );
};

export default SettingsModule;