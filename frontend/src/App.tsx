
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
  Menu,
  ChevronLeft,
  LayoutGrid,
  History
} from 'lucide-react';
import { Page, Product, Sale, Customer, ScrapGold, AppSettings } from './types';
import { api } from './services/api';
import SalesModule from './modules/Sales';
import StockModule from './modules/Stock';
import CustomersModule from './modules/Customers';
import SoldProductsModule from './modules/SoldProducts';
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
  const [cart, setCart] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    deleteCode: '1234',
    adminPassword: 'admin',
    printerName: 'Epson POS-80',
    shopName: 'NEKO GOLD',
    productTypes: ['Üzük', 'Sırğa', 'Boyunbağı', 'Qolbaq', 'Dəst', 'Zəncir', 'Set', 'Saat', 'Sep', 'Külçə', 'Digər'],
    suppliers: ['Tədərükçü A', 'Tədərükçü B', 'Atelye X'],
    carats: [14, 18, 22, 24],
    pricePerGram: 400,
    labelConfig: {
      width: 80,
      height: 25,
      elements: [
        { id: '1', field: 'shopName', x: 5, y: 5, fontSize: 10, visible: true, bold: true },
        { id: '2', field: 'code', x: 5, y: 35, fontSize: 24, visible: true, bold: true },
        { id: '3', field: 'weight', x: 25, y: 75, fontSize: 12, visible: true, bold: true },
        { id: '4', field: 'supplier', x: 55, y: 5, fontSize: 10, visible: true, bold: true },
        { id: '5', field: 'carat', x: 75, y: 5, fontSize: 10, visible: true, bold: true },
        { id: '6', field: 'brilliant', x: 55, y: 25, fontSize: 8, visible: true, bold: true },
        { id: '7', field: 'price', x: 45, y: 55, fontSize: 24, visible: true, bold: true },
        { id: '8', field: 'currency', x: 85, y: 75, fontSize: 10, visible: true, bold: true },
      ]
    },
    silentPrinting: false,
    receiptPrinterPath: '',
    labelPrinterPath: '',
    receiptFontWeight: '600',
    labelFontWeight: '600'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, s, c, sc, set] = await Promise.all([
          api.getProducts(),
          api.getSales(),
          api.getCustomers(),
          api.getScraps(),
          api.getSettings()
        ]);
        setProducts(p);
        setSales(s);
        setCustomers(c);
        setScraps(sc);
        if (set) setSettings(set);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    loadData();
  }, []);

  const navItems = [
    { id: Page.Sales, icon: <ShoppingBag size={24} />, label: 'Satış' },
    { id: Page.Stock, icon: <Package size={24} />, label: 'Stok' },
    { id: Page.Customers, icon: <UserSquare2 size={24} />, label: 'Müştərilər' },
    { id: Page.SoldProducts, icon: <History size={24} />, label: 'Satılan Mallar' },
    { id: Page.Return, icon: <RotateCcw size={24} />, label: 'Qaytarma' },
    { id: Page.Scrap, icon: <Flame size={24} />, label: 'Lom' },
    { id: Page.Reports, icon: <BarChart3 size={24} />, label: 'Hesabat' },
    { id: Page.Settings, icon: <SettingsIcon size={24} />, label: 'Ayarlar' },
  ];

  const renderModule = () => {
    switch (currentPage) {
      case Page.Sales: return <SalesModule products={products} setProducts={setProducts} sales={sales} setSales={setSales} customers={customers} setCustomers={setCustomers} settings={settings} cart={cart} setCart={setCart} />;
      case Page.Stock: return <StockModule products={products} setProducts={setProducts} settings={settings} sales={sales} />;
      case Page.Customers: return <CustomersModule customers={customers} setCustomers={setCustomers} sales={sales} />;
      case Page.SoldProducts: return <SoldProductsModule sales={sales} />;
      case Page.Return: return <ReturnsModule sales={sales} setSales={setSales} products={products} setProducts={setProducts} />;
      case Page.Scrap: return <ScrapModule scraps={scraps} setScraps={setScraps} />;
      case Page.Reports: return <ReportsModule sales={sales} products={products} scraps={scraps} customers={customers} />;
      case Page.Settings: return <SettingsModule settings={settings} setSettings={setSettings} />;
      default: return <SalesModule products={products} setProducts={setProducts} sales={sales} setSales={setSales} customers={customers} setCustomers={setCustomers} settings={settings} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-stone-100 font-sans overflow-hidden">
      {/* DESKTOP SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-stone-900 hidden md:flex flex-col items-center py-6 text-stone-400 transition-all duration-300 relative no-print shadow-2xl`}>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute -right-3 top-20 bg-amber-500 text-amber-950 w-6 h-6 rounded-full flex items-center justify-center shadow-lg hover:bg-amber-400 z-20">
          {isSidebarOpen ? <ChevronLeft size={14} strokeWidth={3} /> : <Menu size={14} strokeWidth={3} />}
        </button>
        <div className={`mb-10 px-4 text-center transition-all duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-100'}`}>
          {isSidebarOpen ? (
            <h1 className="text-amber-500 font-black text-2xl tracking-tighter">NEKO GOLD</h1>
          ) : (
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center text-amber-950 font-black shadow-lg mx-auto">NG</div>
          )}
        </div>
        <nav className="flex-1 w-full px-3 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center rounded-2xl transition-all ${currentPage === item.id ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' : 'hover:bg-stone-800 text-stone-500'} ${isSidebarOpen ? 'px-4 py-3.5 space-x-4' : 'p-3.5 justify-center'}`}
            >
              {item.icon}
              {isSidebarOpen && <span className="text-sm font-bold truncate">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-stone-900 border-t border-white/10 z-50 flex justify-around items-center py-2 px-1 no-print">
        {navItems.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${currentPage === item.id ? 'text-amber-500 bg-white/5' : 'text-stone-500'}`}
          >
            {item.icon}
            <span className="text-[10px] font-black mt-1 uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(Page.Settings)}
          className={`flex flex-col items-center p-2 rounded-xl ${currentPage === Page.Settings ? 'text-amber-500 bg-white/5' : 'text-stone-500'}`}
        >
          <LayoutGrid size={24} />
          <span className="text-[10px] font-black mt-1 uppercase tracking-tighter">Menyu</span>
        </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-y-auto bg-stone-50 scrollbar-hide pb-20 md:pb-0">
        <div className="p-4 md:p-8">
          {renderModule()}
        </div>
      </main>
    </div>
  );
};

export default App;
