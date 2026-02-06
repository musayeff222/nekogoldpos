
import React, { useState } from 'react';
import { Flame, Calculator, History, TrendingUp, Save } from 'lucide-react';
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
  };

  const totalScrapWeight = scraps.reduce((acc, s) => acc + s.grams, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Qeydiyyat Formu */}
      <div className="space-y-6">
        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Hurda / Lom Alışı</h3>
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Müştəri</label>
            <input 
              type="text" 
              value={form.customer}
              onChange={(e) => setForm({...form, customer: e.target.value})}
              className="w-full bg-stone-50 border-stone-200 border rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Çəki (gr)</label>
              <input 
                type="number" 
                value={form.gram}
                onChange={(e) => setForm({...form, gram: Number(e.target.value)})}
                className="w-full bg-stone-50 border-stone-200 border rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Əyar (K)</label>
              <select 
                value={form.carat}
                onChange={(e) => setForm({...form, carat: Number(e.target.value)})}
                className="w-full bg-stone-50 border-stone-200 border rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
              >
                <option value={14}>14K</option>
                <option value={18}>18K</option>
                <option value={22}>22K</option>
                <option value={24}>24K</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Vahid Qiymət (₼)</label>
            <input 
              type="number" 
              value={form.price}
              onChange={(e) => setForm({...form, price: Number(e.target.value)})}
              className="w-full bg-stone-50 border-stone-200 border rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold text-amber-600"
            />
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl flex justify-between items-center">
            <span className="text-sm font-bold text-amber-700">Toplam Ödəniləcək:</span>
            <span className="text-xl font-black text-amber-900">{(form.gram * form.price).toLocaleString('az-AZ')} ₼</span>
          </div>
          <button 
            onClick={handleSave}
            className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center shadow-lg"
          >
            <Save className="w-5 h-5 mr-2" /> Qeydiyyatı Tamamla
          </button>
        </div>
      </div>

      {/* Tarixçə və Status */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-lg shadow-blue-100">
             <div className="flex justify-between items-start mb-4">
                <Flame className="w-8 h-8 opacity-50" />
                <button className="text-[10px] font-bold uppercase bg-blue-500/50 px-2 py-1 rounded">Əritmə Gözləyən</button>
             </div>
             <h4 className="text-3xl font-black">{totalScrapWeight} qr</h4>
             <p className="text-xs font-medium opacity-70">Toplam Alınan Hurda Qızıl</p>
          </div>
          <div className="bg-amber-500 text-white p-6 rounded-3xl shadow-lg shadow-amber-100">
             <div className="flex justify-between items-start mb-4">
                <TrendingUp className="w-8 h-8 opacity-50" />
                <button className="text-[10px] font-bold uppercase bg-amber-400/50 px-2 py-1 rounded">Bugünkü Alış</button>
             </div>
             <h4 className="text-3xl font-black">{scraps.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length}</h4>
             <p className="text-xs font-medium opacity-70">Əməliyyat Sayı</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center">
            <h3 className="font-bold text-stone-800">Alış Tarixçəsi</h3>
            <History className="w-5 h-5 text-stone-300" />
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-3 text-[10px] font-bold text-stone-400 uppercase">Tarix</th>
                <th className="px-6 py-3 text-[10px] font-bold text-stone-400 uppercase">Müştəri</th>
                <th className="px-6 py-3 text-[10px] font-bold text-stone-400 uppercase">Çəki</th>
                <th className="px-6 py-3 text-[10px] font-bold text-stone-400 uppercase">Əyar</th>
                <th className="px-6 py-3 text-[10px] font-bold text-stone-400 uppercase text-right">Məbləğ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {scraps.map(s => (
                <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 text-xs text-stone-500">{new Date(s.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-stone-800">{s.customerName}</td>
                  <td className="px-6 py-4 text-sm text-stone-600 font-bold">{s.grams} qr</td>
                  <td className="px-6 py-4"><span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.5 rounded">{s.carat}K</span></td>
                  <td className="px-6 py-4 text-sm font-bold text-stone-900 text-right">{s.totalPrice.toLocaleString('az-AZ')} ₼</td>
                </tr>
              ))}
              {scraps.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400 italic">Hələ hurda alışı yoxdur.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScrapModule;
