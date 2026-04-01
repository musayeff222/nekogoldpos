
import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  PlusCircle, 
  Trash2, 
  Calendar, 
  Tag, 
  FileText, 
  TrendingDown, 
  TrendingUp,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import { Expense, Sale, SystemLog } from '@/types';

interface ExpensesProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  sales: Sale[];
  addLog: (action: string, category: SystemLog['category'], details?: string) => void;
}

const ExpensesModule: React.FC<ExpensesProps> = ({ expenses, setExpenses, sales, addLog }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    description: '',
    category: 'Digər',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = ['Maaş', 'İcarə', 'Kommunal', 'Təmir', 'Reklam', 'Nəqliyyat', 'Digər'];

  const totalIncome = useMemo(() => {
    return sales.reduce((sum, sale) => sum + (sale.status === 'completed' ? sale.total : 0), 0);
  }, [sales]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const balance = totalIncome - totalExpenses;

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(exp => 
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchTerm]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.description) return;

    const expense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      amount: parseFloat(newExpense.amount),
      description: newExpense.description,
      category: newExpense.category,
      date: newExpense.date
    };

    setExpenses(prev => [...prev, expense]);
    
    // Save to server immediately
    fetch('/api/data/expenses/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: expense })
    }).catch(err => console.error('Failed to save expense to database:', err));
    
    addLog(`Yeni xərc əlavə edildi: ${expense.description}`, 'EXPENSE', `Məbləğ: ${expense.amount} AZN, Kateqoriya: ${expense.category}`);
    setShowAddModal(false);
    setNewExpense({
      amount: '',
      description: '',
      category: 'Digər',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Bu xərci silmək istədiyinizə əminsiniz?')) {
      const expenseToDelete = expenses.find(exp => exp.id === id);
      
      // Delete from server immediately
      fetch(`/api/data/expenses/${id}`, {
        method: 'DELETE'
      }).catch(err => console.error('Failed to delete expense from database:', err));
      
      setExpenses(prev => prev.filter(exp => exp.id !== id));
      if (expenseToDelete) {
        addLog(`Xərc silindi: ${expenseToDelete.description}`, 'EXPENSE', `Məbləğ: ${expenseToDelete.amount} AZN`);
      }
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-10">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ümumi Gəlir</span>
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tighter">
            {totalIncome.toLocaleString()} <span className="text-sm font-bold text-slate-400">₼</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Ümumi Xərc</span>
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tighter">
            {totalExpenses.toLocaleString()} <span className="text-sm font-bold text-slate-400">₼</span>
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-indigo-500 text-white rounded-2xl flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Kassa Balansı</span>
          </div>
          <p className="text-2xl font-black text-white tracking-tighter">
            {balance.toLocaleString()} <span className="text-sm font-bold text-slate-500">₼</span>
          </p>
        </div>
      </div>

      {/* Actions & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Xərclərdə axtar..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-slate-200 border rounded-2xl py-3 pl-10 pr-4 focus:ring-4 focus:ring-indigo-100 outline-none shadow-sm text-sm font-medium"
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-400 transition-all flex items-center justify-center shadow-lg shadow-indigo-200"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> Yeni Xərc
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarix</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kateqoriya</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Təsvir</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Məbləğ</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center text-slate-500 font-bold text-xs">
                      <Calendar size={14} className="mr-2 opacity-50" />
                      {exp.date}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-800 font-bold text-sm">{exp.description}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-red-600 font-black text-sm">-{exp.amount.toLocaleString()} ₼</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <FileText size={48} className="mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest">Heç bir xərc tapılmadı</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Yeni Xərc</h3>
                <p className="text-xs text-slate-400 font-bold">Xərc məlumatlarını daxil edin</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleAddExpense} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Məbləğ (₼)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                  <input 
                    type="number" 
                    required
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    className="w-full bg-slate-50 border-slate-200 border-2 rounded-2xl py-4 pl-12 pr-4 focus:border-indigo-500 outline-none transition-all font-black text-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tarix</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                  <input 
                    type="date" 
                    required
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                    className="w-full bg-slate-50 border-slate-200 border-2 rounded-2xl py-4 pl-12 pr-4 focus:border-indigo-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kateqoriya</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                  <select 
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                    className="w-full bg-slate-50 border-slate-200 border-2 rounded-2xl py-4 pl-12 pr-4 focus:border-indigo-500 outline-none transition-all font-bold appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Təsvir</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-slate-300 w-4 h-4" />
                  <textarea 
                    required
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    className="w-full bg-slate-50 border-slate-200 border-2 rounded-2xl py-4 pl-12 pr-4 focus:border-indigo-500 outline-none transition-all font-bold min-h-[100px]"
                    placeholder="Xərc haqqında qısa məlumat..."
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-200"
              >
                XƏRCİ ƏLAVƏ ET
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const X = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);

export default ExpensesModule;
