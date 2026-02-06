
import React, { useState } from 'react';
import { UserPlus, Search, Wallet, Coins, History, ChevronRight } from 'lucide-react';
import { Customer } from '../types';

interface DebtProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

const DebtModule: React.FC<DebtProps> = ({ customers, setCustomers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filtered = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Müştəri axtar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-stone-200 border rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm"
          />
        </div>
        <button className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-amber-600 transition-all flex items-center shadow-lg shadow-amber-200">
          <UserPlus className="w-5 h-5 mr-2" /> Yeni Müştəri
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Müştəri Siyahısı */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Borclu Müştərilər</h3>
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-stone-100">
              {filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className={`w-full flex items-center justify-between p-6 hover:bg-stone-50 transition-all text-left ${selectedCustomer?.id === c.id ? 'bg-amber-50 border-l-4 border-l-amber-500' : ''}`}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600 font-bold mr-4">
                      {c.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-stone-800">{c.fullName}</p>
                      <p className="text-xs text-stone-400">{c.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-400 font-medium uppercase mb-1">Toplam Borc</p>
                    <div className="flex space-x-4">
                      <div className="flex items-center text-red-600 font-bold">
                        <Wallet className="w-4 h-4 mr-1 opacity-50" /> {c.cashDebt.toLocaleString('az-AZ')} ₼
                      </div>
                      <div className="flex items-center text-amber-600 font-bold">
                        <Coins className="w-4 h-4 mr-1 opacity-50" /> {c.goldDebt} qr
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Seçilmiş Detallar */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Borc Detalı</h3>
          {selectedCustomer ? (
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-6">
              <div className="text-center pb-6 border-b border-stone-100">
                 <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center text-2xl font-bold text-amber-900 mx-auto mb-4">
                    {selectedCustomer.fullName[0]}
                 </div>
                 <h4 className="text-xl font-bold text-stone-800">{selectedCustomer.fullName}</h4>
                 <p className="text-sm text-stone-500">{selectedCustomer.phone}</p>
              </div>

              <div className="space-y-4">
                <div className="bg-stone-50 p-4 rounded-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-stone-400 uppercase">Naxçıvan (Nakit) Borc</span>
                    <Wallet className="w-4 h-4 text-stone-300" />
                  </div>
                  <p className="text-2xl font-black text-stone-900">{selectedCustomer.cashDebt.toLocaleString('az-AZ')} ₼</p>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-stone-400 uppercase">Qızıl Borcu</span>
                    <Coins className="w-4 h-4 text-stone-300" />
                  </div>
                  <p className="text-2xl font-black text-amber-600">{selectedCustomer.goldDebt} qr</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button className="bg-stone-800 text-white py-3 rounded-xl font-bold hover:bg-stone-900 transition-all text-sm">
                  Ödəniş Qəbul Et
                </button>
                <button className="bg-white border-2 border-stone-200 text-stone-600 py-3 rounded-xl font-bold hover:bg-stone-50 transition-all text-sm flex items-center justify-center">
                  <History className="w-4 h-4 mr-1" /> Tarixçə
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-stone-100 rounded-3xl border-2 border-dashed border-stone-200 h-64 flex flex-col items-center justify-center text-stone-400 p-8 text-center">
              <UserPlus className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">Detalları görmək üçün siyahıdan müştəri seçin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebtModule;
