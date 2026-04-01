import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  User,
  Tag,
  Info,
  Package,
  ShoppingBag,
  Flame,
  Settings as SettingsIcon,
  Wallet,
  Users as UsersIcon
} from 'lucide-react';
import { SystemLog } from '@/types';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';

interface LogsModuleProps {
  logs: SystemLog[];
  setLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
}

const LogsModule: React.FC<LogsModuleProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: SystemLog['category']) => {
    switch (category) {
      case 'PRODUCT': return <Package size={16} />;
      case 'SALE': return <ShoppingBag size={16} />;
      case 'SCRAP': return <Flame size={16} />;
      case 'SETTINGS': return <SettingsIcon size={16} />;
      case 'EXPENSE': return <Wallet size={16} />;
      case 'CUSTOMER': return <UsersIcon size={16} />;
      default: return <Info size={16} />;
    }
  };

  const getCategoryColor = (category: SystemLog['category']) => {
    switch (category) {
      case 'PRODUCT': return 'bg-blue-100 text-blue-600';
      case 'SALE': return 'bg-green-100 text-green-600';
      case 'SCRAP': return 'bg-orange-100 text-orange-600';
      case 'SETTINGS': return 'bg-purple-100 text-purple-600';
      case 'EXPENSE': return 'bg-red-100 text-red-600';
      case 'CUSTOMER': return 'bg-cyan-100 text-cyan-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Sistem Logları</h2>
          <p className="text-slate-500 font-medium text-sm">Bütün sistem hərəkətlərinin tarixçəsi</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Loglarda axtar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-800 outline-none focus:border-indigo-400 transition-all"
            />
          </div>
          <div className="flex gap-4">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 font-bold text-slate-800 outline-none focus:border-indigo-400 transition-all cursor-pointer"
            >
              <option value="all">Bütün Kateqoriyalar</option>
              <option value="PRODUCT">Məhsullar</option>
              <option value="SALE">Satışlar</option>
              <option value="SCRAP">Lom</option>
              <option value="SETTINGS">Ayarlar</option>
              <option value="EXPENSE">Xərclər</option>
              <option value="CUSTOMER">Müştərilər</option>
              <option value="SYSTEM">Sistem</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div key={log.id} className="group bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 rounded-2xl p-4 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${getCategoryColor(log.category)}`}>
                    {getCategoryIcon(log.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-black text-slate-800 truncate">{log.action}</h4>
                      <span className="text-[10px] font-black text-slate-400 uppercase whitespace-nowrap ml-4">
                        {format(new Date(log.date), 'dd MMM yyyy, HH:mm', { locale: az })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-1">
                        <User size={12} />
                        <span>{log.user}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag size={12} />
                        <span className="uppercase tracking-wider">{log.category}</span>
                      </div>
                    </div>
                    {log.details && (
                      <div className="mt-2 p-3 bg-white/50 rounded-xl border border-slate-100 text-xs text-slate-600 font-medium leading-relaxed">
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <History size={32} />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Heç bir log tapılmadı</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogsModule;
