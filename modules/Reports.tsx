
import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Calendar, 
  Printer, 
  Download,
  FileText
} from 'lucide-react';
import { Sale, Product, ScrapGold, Customer } from '../types';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  scraps: ScrapGold[];
  customers: Customer[];
}

const ReportsModule: React.FC<ReportsProps> = ({ sales, products, scraps, customers }) => {
  const totalRevenue = sales.filter(s => s.status !== 'returned').reduce((acc, s) => acc + s.total, 0);
  const dailySales = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString() && s.status !== 'returned');
  const dailyRevenue = dailySales.reduce((acc, s) => acc + s.total, 0);
  
  const totalScrapPay = scraps.reduce((acc, s) => acc + s.totalPrice, 0);
  const totalReceivables = customers.reduce((acc, c) => acc + c.cashDebt, 0);

  const stats = [
    { label: 'Bugünkü Satış', value: `${dailyRevenue.toLocaleString('az-AZ')} ₼`, icon: <TrendingUp className="text-green-500" />, sub: `${dailySales.length} Əməliyyat` },
    { label: 'Aylıq Dövriyyə', value: `${totalRevenue.toLocaleString('az-AZ')} ₼`, icon: <DollarSign className="text-amber-500" />, sub: 'Ümumi Brüt' },
    { label: 'Alacaqlar', value: `${totalReceivables.toLocaleString('az-AZ')} ₼`, icon: <PieChart className="text-blue-500" />, sub: 'Veresiye Toplamı' },
    { label: 'Hurda Ödənişləri', value: `${totalScrapPay.toLocaleString('az-AZ')} ₼`, icon: <TrendingDown className="text-red-500" />, sub: 'Alınan Lom Məbləği' },
  ];

  return (
    <div className="space-y-8">
      {/* Sürətli Statistika */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-stone-50 rounded-2xl">{stat.icon}</div>
              <button className="text-stone-300 hover:text-stone-500"><Download className="w-4 h-4" /></button>
            </div>
            <p className="text-sm font-medium text-stone-400 uppercase tracking-wider">{stat.label}</p>
            <h4 className="text-2xl font-black text-stone-900 mt-1">{stat.value}</h4>
            <p className="text-xs text-stone-500 mt-2 flex items-center">
              <span className="w-2 h-2 bg-stone-200 rounded-full mr-2"></span>
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Z Hesabatı Bölməsi */}
        <div className="bg-stone-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
           <div className="relative z-10">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-xl font-bold flex items-center">
                    <Calendar className="mr-3 text-amber-500" /> Gün Sonu (Z Hesabatı)
                 </h3>
                 <span className="text-xs text-stone-400 font-bold px-3 py-1 bg-white/5 rounded-full uppercase tracking-widest">
                    {new Date().toLocaleDateString('az-AZ')}
                 </span>
              </div>

              <div className="space-y-4 mb-10">
                 <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-stone-400">Naxçıvan (Nakit) Satışlar</span>
                    <span className="text-lg font-bold">{(dailyRevenue * 0.7).toLocaleString('az-AZ')} ₼</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-stone-400">Bank Kartı</span>
                    <span className="text-lg font-bold">{(dailyRevenue * 0.3).toLocaleString('az-AZ')} ₼</span>
                 </div>
                 <div className="flex justify-between items-center pb-4 pt-2">
                    <span className="text-amber-500 font-bold">ÜMUMİ CƏM</span>
                    <span className="text-3xl font-black text-amber-500">{dailyRevenue.toLocaleString('az-AZ')} ₼</span>
                 </div>
              </div>

              <button className="w-full bg-amber-500 text-amber-950 py-4 rounded-2xl font-black text-lg hover:bg-amber-400 transition-all flex items-center justify-center">
                 <Printer className="w-6 h-6 mr-3" /> Z HESABATI ÇAP ET
              </button>
           </div>
        </div>

        {/* Son İşləmlər Cədvəli */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-stone-100 flex justify-between items-center">
             <h3 className="font-bold text-stone-800 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-amber-600" /> Son Əməliyyatlar
             </h3>
             <button className="text-xs font-bold text-amber-600 hover:underline">Bütün Arxiv</button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] scrollbar-hide">
            <table className="w-full text-left">
              <thead className="bg-stone-50 sticky top-0 z-10">
                <tr className="border-b border-stone-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase">Məhsul</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase text-right">Məbləğ</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {sales.slice(0, 10).map(s => (
                  <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-stone-800">{s.productName}</p>
                      <p className="text-[10px] text-stone-400">{s.customerName}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-stone-900 text-right">{s.total.toLocaleString('az-AZ')} ₼</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${s.status === 'returned' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {s.status === 'returned' ? 'İADƏ' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModule;
