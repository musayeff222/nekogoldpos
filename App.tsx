import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Package, 
  Users, 
  UserSquare2,
  RotateCcw, 
  Flame, 
  Settings as SettingsIcon, 
  BarChart3,
  LogOut,
  Menu,
  ChevronLeft,
  LayoutGrid
} from 'lucide-react';
import { Page, Product, Sale, Customer, ScrapGold, AppSettings } from './types';
import SalesModule from './modules/Sales';
import StockModule from './modules/Stock';
import CustomersModule from './modules/Customers';
import DebtModule from './modules/Debt';
import ReturnsModule from './modules/Returns';
import ScrapModule from './modules/Scrap';
import SettingsModule from './modules/Settings';
import ReportsModule from './modules/Reports';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Sales);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [scraps, setScraps] = useState<ScrapGold[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    deleteCode: '1234',
    adminPassword: 'admin',
    printerName: 'Epson POS-80',
    shopName: 'NEKO GOLD',
    productTypes: ['Üzük', 'Sırğa', 'Boyunbağı', 'Qolbaq', 'Dəst', 'Zəncir', 'Set', 'Saat', 'Külçə', 'Digər'],
    suppliers: ['Tədərükçü A', 'Tədərükçü B', 'Atelye X'],
    carats: [14, 18, 22, 24],
    pricePerGram: 400
  });

  useEffect(() => {
    const initialProducts: Product[] = [
      { id: '1', code: 'YZ-001', name: 'Sadə Qaşlı Üzük', carat: 22, type: 'Üzük', weight: 4.2, supplier: 'Tədərükçü A', supplierPrice: 8500, price: 10500, stockCount: 5 },
      { id: '2', code: 'KP-023', name: 'Brilliant Sırğa', carat: 18, type: 'Sırğa', weight: 2.1, supplier: 'Tədərükçü B', supplierPrice: 15000, price: 19500, stockCount: 2, brilliant: '0.25ct VS1' },
      { id: '3', code: 'BL-112', name: 'Burma Qolbaq', carat: 22, type: 'Qolbaq', weight: 20.0, supplier: 'Atelye X', supplierPrice: 42000, price: 46500, stockCount: 12 },
    ];
    setProducts(initialProducts);

    const initialCustomers: Customer[] = [
      { id: 'c1', fullName: 'Əhməd Yılmaz', phone: '05321234567', cashDebt: 1500, goldDebt: 2.5, address: 'Bakı ş. Nəsimi ray.' },
      { id: 'c2', fullName: 'Fatma Dəmir', phone: '05449876543', cashDebt: 0, goldDebt: 0, address: 'Gəncə ş. Atatürk pr.' },
      { id: 'c3', fullName: 'Vüqar Məmmədov', phone: '0505556677', cashDebt: 3400, goldDebt: 10.5, address: 'Sumqayıt 3-cü mkr.' },
    ];
    setCustomers(initialCustomers);

    const initialSales: Sale[] = [
      { id: 'S101', productId: '1', productName: 'Sadə Qaşlı Üzük', productCode: 'YZ-001', type: 'Üzük', customerName: 'Əhməd Yılmaz', price: 10500, discount: 500, total: 10000, date: new Date().toISOString(), status: 'completed' },
      { id: 'S102', productId: '3', productName: 'Burma Qolbaq', productCode: 'BL-112', type: 'Qolbaq', customerName: 'Əhməd Yılmaz', price: 46500, discount: 1500, total: 45000, date: new Date(Date.now() - 86400000).toISOString(), status: 'completed' },
    ];
    setSales(initialSales);
  }, []);

  const navItems = [
    { id: Page.Sales, icon: <ShoppingBag size={24} />, label: 'Satış' },
    { id: Page.Stock, icon: <Package size={24} />, label: 'Stok' },
    { id: Page.Customers, icon: <UserSquare2 size={24} />, label: 'Müştərilər' },
    { id: Page.Debt, icon: <Users size={24} />, label: 'Borclar' },
    { id: Page.Return, icon: <RotateCcw size={24} />, label: 'Qaytarma' },
    { id: Page.Scrap, icon: <Flame size={24} />, label: 'Lom' },
    { id: Page.Reports, icon: <BarChart3 size={24} />, label: 'Hesabat' },
    { id: Page.Settings, icon: <SettingsIcon size={24} />, label: 'Ayarlar' },
  ];

  const renderModule = () => {
    switch (currentPage) {
      case Page.Sales: return <SalesModule products={products} setProducts={setProducts} sales={sales} setSales={setSales} customers={customers} setCustomers={setCustomers} settings={settings} />;
      case Page.Stock: return <StockModule products={products} setProducts={setProducts} settings={settings} />;
      case Page.Customers: return <CustomersModule customers={customers} setCustomers={setCustomers} sales={sales} />;
      case Page.Debt: return <DebtModule customers={customers} setCustomers={setCustomers} />;
      case Page.Return: return <ReturnsModule sales={sales} setSales={setSales} products={products} setProducts={setProducts} />;
      case Page.Scrap: return <ScrapModule scraps={scraps} setScraps={setScraps} />;
      case Page.Reports: return <ReportsModule sales={sales} products={products} scraps={scraps} customers={customers} />;
      case Page.Settings: return <SettingsModule settings={settings} setSettings={setSettings} />;
      default: return <SalesModule products={products} setProducts={setProducts} sales={sales} setSales={setSales} customers={customers} setCustomers={setCustomers} settings={settings} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-stone-100 font-sans overflow-hidden">
      {/* SIDEBAR - DESKTOP ONLY */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-stone-900 hidden md:flex flex-col items-center py-6 text-stone-400 transition-all duration-300 ease-in-out relative border-r border-white/5 shadow-2xl no-print`}
      >
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 bg-amber-500 text-amber-950 w-6 h-6 rounded-full flex items-center justify-center shadow-lg hover:bg-amber-400 transition-colors z-20"
        >
          {isSidebarOpen ? <ChevronLeft size={14} strokeWidth={3} /> : <Menu size={14} strokeWidth={3} />}
        </button>

        <div className={`mb-10 px-4 text-center transition-all ${isSidebarOpen ? 'opacity-100' : 'opacity-0 scale-50 overflow-hidden h-0'}`}>
          <h1 className="text-amber-500 font-black text-2xl tracking-tighter whitespace-nowrap">NEKO GOLD</h1>
          <p className="text-[10px] text-stone-500 uppercase tracking-widest">Jewelry POS System</p>
        </div>

        {!isSidebarOpen && (
          <div className="mb-10 text-amber-500 font-black text-2xl">N</div>
        )}

        <nav className="flex-1 w-full space-y-2 px-3 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center rounded-2xl transition-all duration-200 group relative ${
                currentPage === item.id 
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' 
                  : 'hover:bg-stone-800/50 hover:text-white text-stone-500'
              } ${isSidebarOpen ? 'px-4 py-3.5 space-x-4' : 'p-3.5 justify-center'}`}
            >
              <span className={`shrink-0 ${currentPage === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              {isSidebarOpen && <span className="text-sm font-bold tracking-tight whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* BOTTOM NAV - MOBILE ONLY */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-stone-900 border-t border-white/10 z-50 flex items-center justify-around py-3 px-2 no-print">
        {navItems.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`flex flex-col items-center space-y-1 ${currentPage === item.id ? 'text-amber-500' : 'text-stone-500'}`}
          >
            {item.icon}
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(Page.Settings)}
          className={`flex flex-col items-center space-y-1 ${currentPage === Page.Settings ? 'text-amber-500' : 'text-stone-500'}`}
        >
          <LayoutGrid size={24} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Digər</span>
        </button>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-full overflow-y-auto bg-stone-50 scrollbar-hide pb-20 md:pb-0">
        <header className="h-16 md:h-20 border-b border-stone-200 flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-40 no-print">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg md:text-xl font-black text-stone-800 tracking-tight">
              {navItems.find(i => i.id === currentPage)?.label}
            </h2>
          </div>
          <div className="flex items-center space-x-3 md:space-x-6">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-black text-stone-900">Admin</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl gold-gradient flex items-center justify-center text-amber-950 font-black shadow-lg shadow-amber-200">
              NG
            </div>
          </div>
        </header>

        <div className="p-3 md:p-8">
          {renderModule()}
        </div>
      </main>
    </div>
  );
};

export default App;