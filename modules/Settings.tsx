import React, { useState } from 'react';
import { Shield, Key, Printer, Save, Database, Trash2, Tag, User, Plus, X, List, Star, Calculator } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const SettingsModule: React.FC<SettingsProps> = ({ settings, setSettings }) => {
  // Fix: Initialize localSettings with settings directly to avoid using the variable before its declaration
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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Qiymət Hesablama Parametri */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-stone-100 bg-amber-50/50">
          <h3 className="text-xl font-bold text-stone-800 flex items-center">
            <Calculator className="w-6 h-6 mr-3 text-amber-600" /> Avtomatik Qiymət Hesablama (Onluğa Yuvarlaşdırma)
          </h3>
          <p className="text-sm text-stone-500 mt-1">Stoka yeni məhsul əlavə edərkən çəkiyə görə qiymətin hesablanması qaydası.</p>
        </div>
        <div className="p-8">
          <div className="max-w-md space-y-2">
            <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">1 Qramın Qiyməti</label>
            <div className="relative">
              <Star className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500 opacity-50" />
              <input 
                type="number" 
                value={localSettings.pricePerGram}
                onChange={(e) => setLocalSettings({...localSettings, pricePerGram: Number(e.target.value)})}
                className="w-full bg-stone-50 border-stone-200 border rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-lg text-amber-900"
              />
            </div>
            <p className="text-[10px] text-stone-400 font-medium italic">* Yeni məhsul əlavə edilərkən çəki x Qiymət hesablanacaq və ən yaxın onluğa yuvarlaşdırılacaq (Məs: 408 &rarr; 410). Qəpiksiz tam rəqəm göstərilir.</p>
          </div>
        </div>
      </div>

      {/* Yönetim Panelleri Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mehsul Novleri */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
             <div className="flex items-center">
                <List className="w-5 h-5 mr-2 text-amber-600" />
                <h3 className="font-bold text-stone-800 text-sm">Məhsul Növləri</h3>
             </div>
             <span className="text-[10px] font-bold text-stone-400 bg-stone-200/50 px-2 py-0.5 rounded-full">{localSettings.productTypes.length}</span>
          </div>
          <div className="p-5 flex-1 space-y-4">
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Yeni növ..."
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addType()}
                className="flex-1 bg-stone-50 border-stone-200 border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button 
                onClick={addType}
                className="bg-stone-800 text-white p-2 rounded-xl hover:bg-stone-900 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto scrollbar-hide pr-1">
              {localSettings.productTypes.map(type => (
                <span key={type} className="bg-amber-50 text-amber-900 px-3 py-1.5 rounded-xl text-[11px] font-bold border border-amber-100 flex items-center group">
                  {type}
                  <button onClick={() => removeItem('productTypes', type)} className="ml-2 text-amber-300 hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tedarukculer */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
             <div className="flex items-center">
                <User className="w-5 h-5 mr-2 text-amber-600" />
                <h3 className="font-bold text-stone-800 text-sm">Tədərükçülər</h3>
             </div>
             <span className="text-[10px] font-bold text-stone-400 bg-stone-200/50 px-2 py-0.5 rounded-full">{localSettings.suppliers.length}</span>
          </div>
          <div className="p-5 flex-1 space-y-4">
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Yeni tədərükçü..."
                value={newSupplier}
                onChange={(e) => setNewSupplier(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSupplier()}
                className="flex-1 bg-stone-50 border-stone-200 border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button 
                onClick={addSupplier}
                className="bg-stone-800 text-white p-2 rounded-xl hover:bg-stone-900 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto scrollbar-hide pr-1">
              {localSettings.suppliers.map(s => (
                <span key={s} className="bg-blue-50 text-blue-900 px-3 py-1.5 rounded-xl text-[11px] font-bold border border-blue-100 flex items-center group">
                  {s}
                  <button onClick={() => removeItem('suppliers', s)} className="ml-2 text-blue-300 hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Eyarlar */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
             <div className="flex items-center">
                <Star className="w-5 h-5 mr-2 text-amber-600" />
                <h3 className="font-bold text-stone-800 text-sm">Əyarlar (K)</h3>
             </div>
             <span className="text-[10px] font-bold text-stone-400 bg-stone-200/50 px-2 py-0.5 rounded-full">{localSettings.carats.length}</span>
          </div>
          <div className="p-5 flex-1 space-y-4">
            <div className="flex space-x-2">
              <input 
                type="number" 
                placeholder="Məs: 21"
                value={newCarat}
                onChange={(e) => setNewCarat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCarat()}
                className="flex-1 bg-stone-50 border-stone-200 border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
              />
              <button 
                onClick={addCarat}
                className="bg-stone-800 text-white p-2 rounded-xl hover:bg-stone-900 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto scrollbar-hide pr-1">
              {localSettings.carats.map(c => (
                <span key={c} className="bg-green-50 text-green-900 px-3 py-1.5 rounded-xl text-[11px] font-black border border-green-100 flex items-center group">
                  {c}K
                  <button onClick={() => removeItem('carats', c)} className="ml-2 text-green-300 hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Guvenlik Bolmesi */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-stone-100 bg-stone-50">
          <h3 className="text-xl font-bold text-stone-800 flex items-center">
            <Shield className="w-6 h-6 mr-3 text-amber-600" /> Təhlükəsizlik və Şifrə
          </h3>
          <p className="text-sm text-stone-500 mt-1">Kritik əməliyyatlar (məsələn: məhsul silmə) üçün istifadə edilən kodlar.</p>
        </div>
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Silmə Təsdiq Kodu</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
                <input 
                  type="text" 
                  value={localSettings.deleteCode}
                  onChange={(e) => setLocalSettings({...localSettings, deleteCode: e.target.value})}
                  className="w-full bg-stone-50 border-stone-200 border rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono tracking-widest"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest">Admin Şifrəsi</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
                <input 
                  type="password" 
                  value={localSettings.adminPassword}
                  onChange={(e) => setLocalSettings({...localSettings, adminPassword: e.target.value})}
                  className="w-full bg-stone-50 border-stone-200 border rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button 
          onClick={handleSave}
          className="flex-1 bg-amber-600 text-white py-5 rounded-3xl font-bold text-lg hover:bg-amber-700 transition-all shadow-xl shadow-amber-200 flex items-center justify-center"
        >
          <Save className="w-6 h-6 mr-3" /> AYARLARI YADDA SAXLA
        </button>
      </div>
    </div>
  );
};

export default SettingsModule;