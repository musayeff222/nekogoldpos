import React, { useState, useRef, useEffect } from 'react';
import { Shield, Key, Save, List, Star, Calculator, Plus, X, User, Tag, Move, Type as TypeIcon, Eye, EyeOff, Bold, ChevronUp, ChevronDown } from 'lucide-react';
import { AppSettings, LabelElement } from '../types';

interface SettingsProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const SettingsModule: React.FC<SettingsProps> = ({ settings, setSettings }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [newType, setNewType] = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [newCarat, setNewCarat] = useState('');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const designerRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    setSettings(localSettings);
    alert("Ayarlar uğurla yadda saxlanıldı.");
  };

  const updateLabelElement = (id: string, updates: Partial<LabelElement>) => {
    setLocalSettings(prev => ({
      ...prev,
      labelConfig: {
        ...prev.labelConfig,
        elements: prev.labelConfig.elements.map(el => el.id === id ? { ...el, ...updates } : el)
      }
    }));
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    if (!designerRef.current) return;
    
    const rect = designerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    // Clamp values
    const clampedX = Math.max(0, Math.min(90, x));
    const clampedY = Math.max(0, Math.min(90, y));
    
    updateLabelElement(id, { x: clampedX, y: clampedY });
  };

  const onMouseDown = (id: string) => {
    setSelectedElementId(id);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!designerRef.current) return;
      const rect = designerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const clampedX = Math.max(0, Math.min(95, x));
      const clampedY = Math.max(0, Math.min(95, y));
      updateLabelElement(id, { x: clampedX, y: clampedY });
    };
    
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
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
          <Tag className="text-amber-500" size={32} />
          <h3 className="text-xl font-black text-stone-900 uppercase">Etiket Dizayneri (Zebra Style)</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Visual Designer */}
          <div className="lg:col-span-7 space-y-4">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Vizual Maket (Sürükləyərək yerini dəyiş)</p>
            <div 
              ref={designerRef}
              className="relative bg-white border-2 border-stone-200 rounded-xl shadow-inner overflow-hidden"
              style={{ 
                aspectRatio: `${localSettings.labelConfig.width} / ${localSettings.labelConfig.height}`,
                width: '100%'
              }}
            >
              {/* Zebra Pattern Mockup background */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}></div>
              
              {localSettings.labelConfig.elements.map(el => (
                el.visible && (
                  <div
                    key={el.id}
                    onMouseDown={() => onMouseDown(el.id)}
                    className={`absolute cursor-move select-none p-1 border border-transparent hover:border-amber-400 hover:bg-amber-50/50 rounded transition-colors ${selectedElementId === el.id ? 'border-amber-500 bg-amber-50/80 z-10' : ''}`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      fontSize: `${el.fontSize}px`,
                      fontWeight: el.bold ? 'black' : 'normal',
                      fontFamily: 'Arial, sans-serif'
                    }}
                  >
                    {el.field === 'shopName' ? localSettings.shopName : 
                     el.field === 'code' ? 'U001' : 
                     el.field === 'weight' ? '10.15' : 
                     el.field === 'price' ? '5500' : 
                     el.field === 'carat' ? '750' : 
                     el.field === 'supplier' ? 'ITALIYA' : 
                     el.field === 'brilliant' ? 'Br.0.03ct' : 
                     el.field === 'currency' ? 'AZN' : ''}
                  </div>
                )
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase px-2">
              <span>En: {localSettings.labelConfig.width}mm</span>
              <span>Hündürlük: {localSettings.labelConfig.height}mm</span>
            </div>
          </div>

          {/* Element Controls */}
          <div className="lg:col-span-5 space-y-4">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-2">Elementlərin Ayarları</p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {localSettings.labelConfig.elements.map(el => (
                <div 
                  key={el.id} 
                  onClick={() => setSelectedElementId(el.id)}
                  className={`p-4 rounded-2xl border transition-all ${selectedElementId === el.id ? 'bg-amber-50 border-amber-300 shadow-md' : 'bg-stone-50 border-stone-100 hover:border-stone-200'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${el.visible ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-400'}`}>
                        <TypeIcon size={14} />
                      </div>
                      <span className="text-[10px] font-black text-stone-800 uppercase">{el.field}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateLabelElement(el.id, { visible: !el.visible }); }}
                        className={`p-1.5 rounded-lg transition-colors ${el.visible ? 'text-amber-600 hover:bg-amber-100' : 'text-stone-300 hover:bg-stone-100'}`}
                      >
                        {el.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateLabelElement(el.id, { bold: !el.bold }); }}
                        className={`p-1.5 rounded-lg transition-colors ${el.bold ? 'text-amber-600 bg-amber-100' : 'text-stone-300 hover:bg-stone-100'}`}
                      >
                        <Bold size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {selectedElementId === el.id && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-stone-400 uppercase ml-1">Ölçü (px)</label>
                        <div className="flex items-center space-x-1">
                          <input 
                            type="number" 
                            value={el.fontSize} 
                            onChange={(e) => updateLabelElement(el.id, { fontSize: Number(e.target.value) })}
                            className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-stone-400 uppercase ml-1">Pozisiya (X, Y %)</label>
                        <div className="flex items-center space-x-1">
                          <input 
                            type="number" 
                            value={Math.round(el.x)} 
                            onChange={(e) => updateLabelElement(el.id, { x: Number(e.target.value) })}
                            className="w-1/2 bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                          />
                          <input 
                            type="number" 
                            value={Math.round(el.y)} 
                            onChange={(e) => updateLabelElement(el.id, { y: Number(e.target.value) })}
                            className="w-1/2 bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
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