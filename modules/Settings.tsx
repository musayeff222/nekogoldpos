import React, { useState } from 'react';
import { Shield, Key, Save, List, Star, Calculator, Plus, X, User } from 'lucide-react';
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
    setLocalSettings({ ...localSettings, productTypes: [...localSettings.productTypes, newType.trim()] });
    setNewType('');
  };

  const addSupplier = () => {
    if (!newSupplier.trim()) return;
    if (localSettings.suppliers.includes(newSupplier.trim())) return;
    setLocalSettings({ ...localSettings, suppliers: [...localSettings.suppliers, newSupplier.trim()] });
    setNewSupplier('');
  };

  const addCarat = () => {
    const val = Number(newCarat);
    if (!newCarat.trim() || isNaN(val)) return;
    if (localSettings.carats.includes(val)) return;
    setLocalSettings({ ...localSettings, carats: [...localSettings.carats, val].sort((a, b) => a - b) });
    setNewCarat('');
  };

  const removeItem = (list: 'productTypes' | 'suppliers' | 'carats', item: any) => {
    setLocalSettings({ ...localSettings, [list]: localSettings[list].filter(i => i !== item) });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-10 pb-24 md:pb-10 animate-in fade-in">
      <div className="bg-white rounded-3xl md:rounded-[3rem] border border-stone-100 shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-5/12 p-8 bg-amber-50/30 border-b md:border-b-0 md:border-r border-stone-100">
          <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-amber-200">
            <Calculator size={24} />
          </div>
          <h3 className="text-xl font-black text-stone-900 tracking-tighter uppercase">Avtomatik Qiymət</h3>
          <p className="text-xs text-stone-400 font-bold mt-2">1 qramın qiymətinə görə avtomatik yuvarlaqlaşdırma.</p>
        </div>
        <div className="flex-1 p-8 space-y-4">
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">1 Qram Qiyməti (₼)</label>
          <div className="relative group">
            <Star className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500 opacity-30" />
            <input 
              type="number" 
              value={localSettings.pricePerGram}
              onChange={(e) => setLocalSettings({...localSettings, pricePerGram: Number(e.target.value)})}
              className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl py-4 pl-14 pr-6 font-black text-2xl text-amber-900 focus:bg-white focus:border-amber-400 outline-none"
            />
          </div>
          <p className="text-[10px] text-stone-400 font-bold italic ml-4 leading-normal">
            * Məhsul qiyməti ən yaxın onluğa yuvarlaşdırılacaq (Məs: 408 &rarr; 410).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* NÖVLƏR */}
        <div className="bg-white rounded-[2rem] border border-stone-100 shadow-xl overflow-hidden flex flex-col min-h-[300px]">
          <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <h3 className="font-black text-stone-800 text-xs uppercase tracking-widest flex items-center"><List size={18} className="mr-2 text-amber-500"/> NÖVLƏR</h3>
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">{localSettings.productTypes.length}</span>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex space-x-2">
              <input type="text" placeholder="Yeni..." value={newType} onChange={(e) => setNewType(e.target.value)} className="flex-1 bg-stone-50 border-2 border-stone-100 rounded-xl px-4 py-2.5 text-xs font-bold" />
              <button onClick={addType} className="bg-stone-900 text-amber-500 p-2.5 rounded-xl"><Plus size={20} /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {localSettings.productTypes.map(t => (
                <div key={t} className="bg-amber-50/50 text-stone-700 px-3 py-1.5 rounded-lg text-[10px] font-black border border-amber-100 flex items-center">
                  {t}
                  <button onClick={() => removeItem('productTypes', t)} className="ml-2 text-stone-300 hover:text-red-500"><X size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TƏDARÜKÇÜLƏR */}
        <div className="bg-white rounded-[2rem] border border-stone-100 shadow-xl overflow-hidden flex flex-col min-h-[300px]">
          <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <h3 className="font-black text-stone-800 text-xs uppercase tracking-widest flex items-center"><User size={18} className="mr-2 text-amber-500"/> TƏDARÜKÇÜLƏR</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex space-x-2">
              <input type="text" placeholder="Yeni..." value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} className="flex-1 bg-stone-50 border-2 border-stone-100 rounded-xl px-4 py-2.5 text-xs font-bold" />
              <button onClick={addSupplier} className="bg-stone-900 text-amber-500 p-2.5 rounded-xl"><Plus size={20} /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {localSettings.suppliers.map(s => (
                <div key={s} className="bg-stone-50 text-stone-700 px-3 py-1.5 rounded-lg text-[10px] font-black border border-stone-100 flex items-center">
                  {s}
                  <button onClick={() => removeItem('suppliers', s)} className="ml-2 text-stone-300 hover:text-red-500"><X size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ƏYARLAR */}
        <div className="bg-white rounded-[2rem] border border-stone-100 shadow-xl overflow-hidden flex flex-col min-h-[300px]">
          <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <h3 className="font-black text-stone-800 text-xs uppercase tracking-widest flex items-center"><Star size={18} className="mr-2 text-amber-500"/> ƏYARLAR</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex space-x-2">
              <input type="number" placeholder="Məs: 21" value={newCarat} onChange={(e) => setNewCarat(e.target.value)} className="flex-1 bg-stone-50 border-2 border-stone-100 rounded-xl px-4 py-2.5 text-xs font-bold" />
              <button onClick={addCarat} className="bg-stone-900 text-amber-500 p-2.5 rounded-xl"><Plus size={20} /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {localSettings.carats.map(c => (
                <div key={c} className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-[10px] font-black border border-amber-200 flex items-center">
                  {c}K
                  <button onClick={() => removeItem('carats', c)} className="ml-2 text-amber-300 hover:text-red-500"><X size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-stone-100 shadow-2xl overflow-hidden p-8 md:p-12 space-y-8">
        <div className="flex items-center space-x-4">
          <Shield className="text-amber-500" size={32} />
          <h3 className="text-xl font-black text-stone-900 uppercase">Təhlükəsizlik</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Silmə Təsdiq Kodu</label>
            <input 
              type="text" 
              value={localSettings.deleteCode}
              onChange={(e) => setLocalSettings({...localSettings, deleteCode: e.target.value})}
              className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl py-4 px-6 font-mono font-black text-xl tracking-widest"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Admin Şifrəsi</label>
            <input 
              type="password" 
              value={localSettings.adminPassword}
              onChange={(e) => setLocalSettings({...localSettings, adminPassword: e.target.value})}
              className="w-full bg-stone-50 border-2 border-stone-100 rounded-2xl py-4 px-6 font-black text-xl"
            />
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="w-full bg-amber-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-amber-700 shadow-2xl active:scale-95 transition-all">
        AYARLARI YADDA SAXLA
      </button>
    </div>
  );
};

export default SettingsModule;