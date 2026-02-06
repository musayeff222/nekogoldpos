import React, { useState } from 'react';
import { Flame, Calculator, History, TrendingUp, Save, User, Scale, Tag, Wallet, CheckCircle2 } from 'lucide-react';
import { ScrapGold } from '../types';

interface ScrapProps {
  scraps: ScrapGold[];
  setScraps: React.Dispatch<React.SetStateAction<ScrapGold[]>>;
}

const ScrapModule: React.FC<ScrapProps> = ({ scraps, setScraps }) => {
  const [form, setForm] = useState({
    customer: '',
    gram: 0,
    carat: 22,
    price: 0
  });

  const handleSave = () => {
    if (form.gram <= 0 || form.price <= 0) {
        alert("Zəhmət olmasa çəki və qiyməti daxil edin.");
        return;
    }
    const newScrap: ScrapGold = {
      id: Math.random().toString(36).substr(2, 9),
      customerName: form.customer || 'Anonim',
      grams: form.gram,
      carat: form.carat,
      pricePerGram: form.price,
      totalPrice: form.gram * form.price,
      isMelted: false,
      date: new Date().toISOString()
    };
    setScraps([newScrap, ...scraps]);
    setForm({ customer: '', gram: 0, carat: 22, price: 0 });
    alert("Hurda alışı uğurla qeydə alındı.");
  };

  const totalScrapWeight = scraps.reduce((acc, s) => acc + s.grams, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 pb-24 md:pb-10 animate-in fade-in duration-500">
      {/* Qeydiyyat Formu */}
      <div className="space-y-4 md:space-y-6">
        <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-2">Hurda / Lom Alışı</h3>
        <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-stone-100 shadow-2xl p-6 md:p-10 space-y-6 md:space-y-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Müştəri</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 w-4 h-4" />
              <input 
                type="text" 
                value={form.customer}
                onChange={(e) => setForm({...form, customer: e.target.value})}
                placeholder="Ad Soyad"
                className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl md:rounded-2xl py-3.5 pl-12 pr-4 font-bold text-stone-800 focus:ring-4 focus:ring-amber-50 outline-none transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Çəki (gr)</label>
              <div className="relative">
                <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 w-4 h-4" />
                <input 
                  type="number" 
                  value={form.gram || ''}
                  onChange={(e) => setForm({...form, gram: Number(e.target.value)})}
                  className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl md:rounded-2xl py-3.5 pl-12 pr-4 font-black text-stone-800 text-lg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Əyar (K)</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 w-4 h-4" />
                <select 
                  value={form.carat}
                  onChange={(e) => setForm({...form, carat: Number(e.target.value)})}
                  className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl md:rounded-2xl py-3.5 pl-12 pr-4 font-black text-stone-800"
                >
                  <option value={14}>14K</option>
                  <option value={18}>18K</option>
                  <option value={22}>22K</option>
                  <option value={24}>24K</option>
                </select>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Qram Qiyməti (₼)</label>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 w-4 h-4" />
              <input 
                type="number" 
                value={form.price || ''}
                onChange={(e) => setForm({...form, price: Number(e.target.value)})}
                className="w-full bg-amber-50 border-2 border-amber-100 rounded-xl md:rounded-2xl py-3.5 pl-12 pr-4 font-black text-amber-900 text-xl"
              />
            </div>
          </div>
          <div className="bg-stone-900 text-white p-6 md:p-8 rounded-[2rem] flex justify-between items-center shadow-xl">
            <div>
              <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">CƏM ÖDƏNİŞ</p>
              <h4 className="text-2xl md:text-3xl font-black text-amber-500 tracking-tighter">{(form.gram * form.price).toLocaleString()} <span className="text-sm font-bold text-stone-600">₼</span></h4>
            </div>
            <CheckCircle2 className="w-8 h-8 text-stone-800" />
          </div>
          <button 
            onClick={handleSave}
            className="w-full bg-amber-500 text-amber-950 py-5 rounded-2xl md:rounded-[2rem] font-black text-sm md:text-base hover:bg-amber-400 transition-all shadow-xl active:scale-95 uppercase tracking-widest flex items-center justify-center"
          >
            <Save className="w-6 h-6 mr-3" /> TƏSDİQLƏ
          </button>
        </div>
      </div>

      {/* Tarixçə və Status */}
      <div className="lg:col-span-2 space-y-4 md:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-stone-100 shadow-xl flex items-center justify-between group overflow-hidden relative">
             <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform"></div>
             <div className="relative z-10">
               <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Ümumi Hurda</p>
               <h4 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tighter">{totalScrapWeight.toLocaleString()} <span className="text-base text-stone-300">qr</span></h4>
             </div>
             <div className="w-14 h-14 md:w-16 md:h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-inner relative z-10">
               <Flame className="w-8 h-8" />
             </div>
          </div>
          <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-stone-100 shadow-xl flex items-center justify-between group overflow-hidden relative">
             <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform"></div>
             <div className="relative z-10">
               <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Bugünkü Alış</p>
               <h4 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tighter">{scraps.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length} <span className="text-base text-stone-300">ƏDƏD</span></h4>
             </div>
             <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner relative z-10">
               <TrendingUp className="w-8 h-8" />
             </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-stone-100 shadow-2xl overflow-hidden flex flex-col">
          <div className="px-6 md:px-10 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
            <h3 className="text-base md:text-lg font-black text-stone-800 tracking-tighter uppercase flex items-center">
              <History className="w-5 h-5 mr-3 text-amber-500" /> Alış Tarixçəsi
            </h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left min-w-[600px] md:min-w-0">
              <thead>
                <tr className="bg-stone-50/30">
                  <th className="px-6 md:px-10 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Tarix</th>
                  <th className="px-6 md:px-10 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Müştəri</th>
                  <th className="px-6 md:px-10 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Çəki / Əyar</th>
                  <th className="px-6 md:px-10 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Ödəniş</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {scraps.map(s => (
                  <tr key={s.id} className="hover:bg-amber-50/20 transition-all">
                    <td className="px-6 md:px-10 py-5 text-xs font-bold text-stone-400">{new Date(s.date).toLocaleDateString('az-AZ')}</td>
                    <td className="px-6 md:px-10 py-5">
                       <p className="text-sm font-black text-stone-800 uppercase leading-none">{s.customerName}</p>
                       <p className="text-[10px] text-stone-400 mt-1 font-bold">POS-{s.id.slice(0,5).toUpperCase()}</p>
                    </td>
                    <td className="px-6 md:px-10 py-5">
                       <div className="flex items-center space-x-2">
                         <span className="text-sm font-black text-stone-900">{s.grams} qr</span>
                         <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded-lg">{s.carat}K</span>
                       </div>
                    </td>
                    <td className="px-6 md:px-10 py-5 text-right font-black text-stone-900 text-base md:text-lg tracking-tighter">
                      {s.totalPrice.toLocaleString()} ₼
                    </td>
                  </tr>
                ))}
                {scraps.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-10 py-20 text-center text-stone-300 italic font-bold uppercase text-xs tracking-[0.2em]">Hurda alışı tapılmadı</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrapModule;