
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
  History,
  Wallet
} from 'lucide-react';
import { Page, Product, Sale, Customer, ScrapGold, Expense, AppSettings, SystemLog } from '@/types';
import SalesModule from '@/modules/Sales';
import StockModule from '@/modules/Stock';
import CustomersModule from '@/modules/Customers';
import SoldProductsModule from '@/modules/SoldProducts';
import ReturnsModule from '@/modules/Returns';
import ScrapModule from '@/modules/Scrap';
import ExpensesModule from '@/modules/Expenses';
import SettingsModule from '@/modules/Settings';
import ReportsModule from '@/modules/Reports';
import DebtModule from '@/modules/Debt';
import LogsModule from '@/modules/Logs';
import Login from '@/modules/Login';
import { LogOut } from 'lucide-react';

import { createPortal } from 'react-dom';
import { LabelPrint } from '@/components/LabelPrint';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(Page.Sales);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [scraps, setScraps] = useState<ScrapGold[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [remotePrintQueue, setRemotePrintQueue] = useState<any[]>([]);
  const [currentRemoteJob, setCurrentRemoteJob] = useState<any | null>(null);
  const lastSyncTimeRef = React.useRef<string>(new Date().toISOString());

  // Refs to track last synced data to avoid redundant syncs
  const lastSyncedProducts = React.useRef<string>('');
  const lastSyncedSales = React.useRef<string>('');
  const lastSyncedCustomers = React.useRef<string>('');
  const lastSyncedScraps = React.useRef<string>('');
  const lastSyncedExpenses = React.useRef<string>('');
  const lastSyncedLogs = React.useRef<string>('');
  const lastSyncedSettings = React.useRef<string>('');
  const [settings, setSettings] = useState<AppSettings>({
    deleteCode: '1234',
    adminPassword: 'admin',
    printerName: 'Epson POS-80',
    shopName: 'NEKO GOLD',
    productGroups: [
      { name: 'Bilərzik', prefix: 'BK' },
      { name: 'Üzük', prefix: 'UK' },
      { name: 'Boyunbağı', prefix: 'BB' },
      { name: 'Sırğa', prefix: 'SK' },
      { name: 'Qolbaq', prefix: 'QK' },
      { name: 'Dəst', prefix: 'DK' },
      { name: 'Zəncir', prefix: 'ZK' },
      { name: 'Saat', prefix: 'ST' },
      { name: 'Sep', prefix: 'SP' },
      { name: 'Külçə', prefix: 'KL' },
      { name: 'Digər', prefix: 'DG' },
    ],
    productTypes: ['Üzük', 'Sırğa', 'Boyunbağı', 'Qolbaq', 'Dəst', 'Zəncir', 'Set', 'Saat', 'Sep', 'Külçə', 'Digər'],
    suppliers: ['Tədərükçü A', 'Tədərükçü B', 'Atelye X'],
    carats: ['14', '18', '22', '24'],
    pricePerGram: 400,
    pricePerGram750: 650,
    pricePerBrilliant: 1000,
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
    labelFontWeight: '600',
    isPrintStation: false,
    remotePrintEnabled: false
  });

  // Central Heartbeat / Pulse for real-time updates
  useEffect(() => {
    if (!isAuthenticated || !isLoaded) return;

    let active = true;
    let timeoutId: NodeJS.Timeout;

    const pulse = async () => {
      if (!active) return;

      try {
        const query = new URLSearchParams({
          lastSync: lastSyncTimeRef.current,
          printStation: settings.isPrintStation ? 'true' : 'false',
          _t: Date.now().toString()
        }).toString();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for pulse

        let res;
        try {
          res = await fetch(`/api/pulse?${query}`, { signal: controller.signal });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!res.ok) {
          const text = await res.text();
          console.warn(`Heartbeat pulse returned non-OK status (${res.status}):`, text.substring(0, 100));
          return;
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          console.warn(`Heartbeat pulse returned non-JSON response:`, text.substring(0, 100));
          return;
        }

        const data = await res.json();
        
        // Update last sync time immediately to avoid overlaps
        lastSyncTimeRef.current = data.timestamp;

        // 1. Update Products
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(prev => {
            const updatedNext = [...prev];
            data.products.forEach((updatedItem: Product) => {
              const index = updatedNext.findIndex(p => p.id === updatedItem.id);
              if (index !== -1) {
                // Merge carefully - keep images if they aren't in the pulse (which removed logs)
                updatedNext[index] = { ...updatedNext[index], ...updatedItem };
              } else {
                updatedNext.push(updatedItem);
              }
            });
            lastSyncedProducts.current = JSON.stringify(updatedNext);
            return updatedNext;
          });
        }

        // 2. Update Sales
        if (Array.isArray(data.sales) && data.sales.length > 0) {
          setSales(prev => {
            const updatedNext = [...prev];
            data.sales.forEach((updatedItem: Sale) => {
              const index = updatedNext.findIndex(s => s.id === updatedItem.id);
              if (index !== -1) {
                updatedNext[index] = updatedItem;
              } else {
                updatedNext.push(updatedItem);
              }
            });
            lastSyncedSales.current = JSON.stringify(updatedNext);
            return updatedNext;
          });
        }

        // 2.1 Update Customers
        if (Array.isArray(data.customers) && data.customers.length > 0) {
          setCustomers(prev => {
            const updatedNext = [...prev];
            data.customers.forEach((updatedItem: Customer) => {
              const index = updatedNext.findIndex(c => c.id === updatedItem.id);
              if (index !== -1) {
                updatedNext[index] = updatedItem;
              } else {
                updatedNext.push(updatedItem);
              }
            });
            lastSyncedCustomers.current = JSON.stringify(updatedNext);
            return updatedNext;
          });
        }

        // 2.2 Update Scraps
        if (Array.isArray(data.scraps) && data.scraps.length > 0) {
          setScraps(prev => {
            const updatedNext = [...prev];
            data.scraps.forEach((updatedItem: any) => {
              const index = updatedNext.findIndex((s: any) => s.id === updatedItem.id);
              if (index !== -1) {
                updatedNext[index] = updatedItem;
              } else {
                updatedNext.push(updatedItem);
              }
            });
            lastSyncedScraps.current = JSON.stringify(updatedNext);
            return updatedNext;
          });
        }

        // 2.3 Update Expenses
        if (Array.isArray(data.expenses) && data.expenses.length > 0) {
          setExpenses(prev => {
            const updatedNext = [...prev];
            data.expenses.forEach((updatedItem: any) => {
              const index = updatedNext.findIndex((e: any) => e.id === updatedItem.id);
              if (index !== -1) {
                updatedNext[index] = updatedItem;
              } else {
                updatedNext.push(updatedItem);
              }
            });
            lastSyncedExpenses.current = JSON.stringify(updatedNext);
            return updatedNext;
          });
        }

        // 3. Handle Print Queue
        if (settings.isPrintStation && Array.isArray(data.printQueue) && data.printQueue.length > 0) {
          for (const job of data.printQueue) {
            if (!active) break;
            try {
              const productData = JSON.parse(job.product_data);
              setCurrentRemoteJob({ ...job, product: productData });
              
              // Wait for print interaction
              await new Promise(resolve => setTimeout(resolve, 8000));
              
              await fetch(`/api/print-queue/complete/${encodeURIComponent(job.id)}`, { method: 'POST' });
              setCurrentRemoteJob(null);
            } catch (e) {
              console.error('Job processing failed:', e);
            }
          }
        }
      } catch (err: any) {
        if (!active) return;
        if (err.name === 'AbortError') {
          console.warn('Heartbeat pulse timed out (15s). This can happen during heavy server load.');
        } else if (err.message === 'Failed to fetch') {
          // Normal during dev server restarts or transient network issues
          console.debug('Heartbeat pulse connection lost (server may be restarting). Retrying...');
        } else {
          console.warn('Heartbeat pulse connection issue:', err.message || err);
        }
      }

      if (active) {
        // Add jitter (5-10s) for more responsive real-time feel
        const jitter = Math.floor(Math.random() * 5000);
        timeoutId = setTimeout(pulse, 5000 + jitter);
      }
    };

    // Initial pulse delay reduced for faster startup update
    timeoutId = setTimeout(pulse, 3000);

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthenticated, isLoaded, settings.isPrintStation]);

  // Session check
  useEffect(() => {
    const token = localStorage.getItem('nekogold_token');
    const username = localStorage.getItem('nekogold_username');
    
    if (token && username) {
      setIsAuthenticated(true);
      setUser({ username });
    }
  }, []);

  useEffect(() => {
    const fetchData = async (retries = 10) => {
      try {
        const fetchWithType = async (type: string, params: Record<string, string> = {}, timeout = 60000) => {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeout);
          
          try {
            const queryParams = new URLSearchParams(params);
            queryParams.append('_t', Date.now().toString());
            const query = queryParams.toString();
            const res = await fetch(`/api/data/${type}${query ? `?${query}` : ''}`, {
              signal: controller.signal
            });
            clearTimeout(id);
            
            if (!res.ok) {
              const text = await res.text().catch(() => '');
              let errorData: any = {};
              try {
                errorData = JSON.parse(text);
              } catch (e) {
                console.error(`Non-JSON error response for ${type}:`, text.substring(0, 200));
              }
              throw new Error(errorData.details || errorData.error || `Failed to fetch ${type} (Status: ${res.status})`);
            }
            const text = await res.text();
            try {
              return JSON.parse(text);
            } catch (e) {
              console.error(`Failed to parse JSON for ${type}. Response:`, text.substring(0, 200));
              throw new Error(`Invalid JSON response for ${type}`);
            }
          } catch (err: any) {
            clearTimeout(id);
            if (err.name === 'AbortError') {
              throw new Error(`Fetch ${type} timed out after ${timeout}ms`);
            }
            throw err;
          }
        };

        // Use the new consolidated endpoint to reduce requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for initial load

        let res;
        try {
          res = await fetch(`/api/init-data?_t=${Date.now()}`, { signal: controller.signal });
        } catch (err: any) {
          if (err.name === 'AbortError') throw new Error('Initial data load timed out');
          throw err;
        } finally {
          clearTimeout(timeoutId);
        }

        if (!res.ok) throw new Error(`Initial sync failed (Status: ${res.status})`);
        const data = await res.json();
        
        const { products: p, sales: s, customers: c, scraps: sc, settings: st, expenses: ex, logs: l } = data;

        setProducts(Array.isArray(p) ? p : []);
        lastSyncedProducts.current = JSON.stringify(Array.isArray(p) ? p : []);

        setSales(Array.isArray(s) ? s : []);
        lastSyncedSales.current = JSON.stringify(Array.isArray(s) ? s : []);

        setCustomers(Array.isArray(c) ? c : []);
        lastSyncedCustomers.current = JSON.stringify(Array.isArray(c) ? c : []);

        setScraps(Array.isArray(sc) ? sc : []);
        lastSyncedScraps.current = JSON.stringify(Array.isArray(sc) ? sc : []);

        setExpenses(Array.isArray(ex) ? ex : []);
        lastSyncedExpenses.current = JSON.stringify(Array.isArray(ex) ? ex : []);

        setLogs(Array.isArray(l) ? l : []);
        lastSyncedLogs.current = JSON.stringify(Array.isArray(l) ? l : []);
 
        if (st && !st.error) {
          // Ensure new price fields exist for backward compatibility
          const mergedSettings = {
            ...st,
            pricePerGram750: st.pricePerGram750 || 650,
            pricePerBrilliant: st.pricePerBrilliant || 1000,
            productGroups: st.productGroups || [
              { name: 'Bilərzik', prefix: 'BK' },
              { name: 'Üzük', prefix: 'UK' },
              { name: 'Boyunbağı', prefix: 'BB' },
              { name: 'Sırğa', prefix: 'SK' },
              { name: 'Qolbaq', prefix: 'QK' },
              { name: 'Dəst', prefix: 'DK' },
              { name: 'Zəncir', prefix: 'ZK' },
              { name: 'Saat', prefix: 'ST' },
              { name: 'Sep', prefix: 'SP' },
              { name: 'Külçə', prefix: 'KL' },
              { name: 'Digər', prefix: 'DG' },
            ]
          };
          setSettings(mergedSettings);
          lastSyncedSettings.current = JSON.stringify(mergedSettings);
        } else {
          const defaultSettings: AppSettings = {
            deleteCode: '1234',
            adminPassword: 'admin',
            printerName: 'Epson POS-80',
            shopName: 'NEKO GOLD',
            productGroups: [
              { name: 'Bilərzik', prefix: 'BK' },
              { name: 'Üzük', prefix: 'UK' },
              { name: 'Boyunbağı', prefix: 'BB' },
              { name: 'Sırğa', prefix: 'SK' },
              { name: 'Qolbaq', prefix: 'QK' },
              { name: 'Dəst', prefix: 'DK' },
              { name: 'Zəncir', prefix: 'ZK' },
              { name: 'Saat', prefix: 'ST' },
              { name: 'Sep', prefix: 'SP' },
              { name: 'Külçə', prefix: 'KL' },
              { name: 'Digər', prefix: 'DG' },
            ],
            productTypes: ['Üzük', 'Sırğa', 'Boyunbağı', 'Qolbaq', 'Dəst', 'Zəncir', 'Set', 'Saat', 'Sep', 'Külçə', 'Digər'],
            suppliers: ['Tədərükçü A', 'Tədərükçü B', 'Atelye X'],
            carats: ['14', '18', '22', '24'],
            pricePerGram: 400,
            pricePerGram750: 650,
            pricePerBrilliant: 1000,
            labelConfig: {
              width: 80,
              height: 25,
              elements: [
                { id: '1', field: 'shopName' as const, x: 5, y: 5, fontSize: 10, visible: true, bold: true },
                { id: '2', field: 'code' as const, x: 5, y: 35, fontSize: 24, visible: true, bold: true },
                { id: '3', field: 'weight' as const, x: 25, y: 75, fontSize: 12, visible: true, bold: true },
                { id: '4', field: 'supplier' as const, x: 55, y: 5, fontSize: 10, visible: true, bold: true },
                { id: '5', field: 'carat' as const, x: 75, y: 5, fontSize: 10, visible: true, bold: true },
                { id: '6', field: 'brilliant' as const, x: 55, y: 25, fontSize: 8, visible: true, bold: true },
                { id: '7', field: 'price' as const, x: 45, y: 55, fontSize: 24, visible: true, bold: true },
                { id: '8', field: 'currency' as const, x: 85, y: 75, fontSize: 10, visible: true, bold: true },
              ]
            },
            silentPrinting: false,
            receiptPrinterPath: '',
            labelPrinterPath: '',
            receiptFontWeight: '600',
            labelFontWeight: '600',
            isPrintStation: false,
            remotePrintEnabled: false
          };
          setSettings(defaultSettings);
          lastSyncedSettings.current = JSON.stringify(defaultSettings);
        }
        
        setIsLoaded(true);
        console.log('Initial lightweight data load complete');

        // Background fetch for full product data (including images and logs)
        const fetchFullProducts = async (attempt = 1) => {
          try {
            setIsBackgroundLoading(true);
            console.log(`Starting background fetch for full product data (Attempt ${attempt})...`);
            const fullProducts = await fetchWithType('products', {}, 60000); // 60s timeout for full products
            if (Array.isArray(fullProducts)) {
              setProducts(fullProducts);
              lastSyncedProducts.current = JSON.stringify(fullProducts);
              console.log('Full product data loaded in background');
            }
          } catch (err) {
            console.error(`Background product fetch failed (Attempt ${attempt}):`, err);
            if (attempt < 3) {
              const delay = attempt * 5000;
              console.log(`Retrying full product fetch in ${delay/1000}s...`);
              setTimeout(() => fetchFullProducts(attempt + 1), delay);
            }
          } finally {
            setIsBackgroundLoading(false);
          }
        };
        setTimeout(fetchFullProducts, 5000);

        // Background fetch for more logs
        const fetchExtendedLogs = async (attempt = 1) => {
          try {
            console.log(`Starting background fetch for more logs (Attempt ${attempt})...`);
            // Reduced from 1000 to 300 for stability on shared hosting
            const fullLogs = await fetchWithType('logs', { limit: '300' }, 45000);
            if (Array.isArray(fullLogs)) {
              setLogs(fullLogs);
              lastSyncedLogs.current = JSON.stringify(fullLogs);
              console.log('Extended logs loaded in background');
            }
          } catch (err) {
            console.error(`Background logs fetch failed (Attempt ${attempt}):`, err);
            if (attempt < 3) {
              const delay = attempt * 5000;
              console.log(`Retrying extended logs fetch in ${delay/1000}s...`);
              setTimeout(() => fetchExtendedLogs(attempt + 1), delay);
            }
          }
        };
        setTimeout(fetchExtendedLogs, 10000);

        // Background fetch for more sales
        const fetchExtendedSales = async (attempt = 1) => {
          try {
            console.log(`Starting background fetch for full sales (Attempt ${attempt})...`);
            const fullSales = await fetchWithType('sales', {}, 60000);
            if (Array.isArray(fullSales)) {
              setSales(fullSales);
              lastSyncedSales.current = JSON.stringify(fullSales);
              console.log('Full sales loaded in background');
            }
          } catch (err) {
            console.error(`Background sales fetch failed (Attempt ${attempt}):`, err);
            if (attempt < 3) {
              const delay = attempt * 5000;
              setTimeout(() => fetchExtendedSales(attempt + 1), delay);
            }
          }
        };
        setTimeout(fetchExtendedSales, 15000);

        // Background fetch for more customers
        const fetchExtendedCustomers = async (attempt = 1) => {
          try {
            console.log(`Starting background fetch for full customers (Attempt ${attempt})...`);
            const fullCustomers = await fetchWithType('customers', {}, 60000);
            if (Array.isArray(fullCustomers)) {
              setCustomers(fullCustomers);
              lastSyncedCustomers.current = JSON.stringify(fullCustomers);
              console.log('Full customers loaded in background');
            }
          } catch (err) {
            console.error(`Background customers fetch failed (Attempt ${attempt}):`, err);
            if (attempt < 3) {
              setTimeout(() => fetchExtendedCustomers(attempt + 1), 10000);
            }
          }
        };
        setTimeout(fetchExtendedCustomers, 20000);

        // Background fetch for more scraps
        const fetchExtendedScraps = async (attempt = 1) => {
          try {
            console.log(`Starting background fetch for full scraps (Attempt ${attempt})...`);
            const fullScraps = await fetchWithType('scraps', {}, 60000);
            if (Array.isArray(fullScraps)) {
              setScraps(fullScraps);
              lastSyncedScraps.current = JSON.stringify(fullScraps);
              console.log('Full scraps loaded in background');
            }
          } catch (err) {
            console.error(`Background scraps fetch failed (Attempt ${attempt}):`, err);
            if (attempt < 3) setTimeout(() => fetchExtendedScraps(attempt + 1), 10000);
          }
        };
        setTimeout(fetchExtendedScraps, 25000);

        // Background fetch for more expenses
        const fetchExtendedExpenses = async (attempt = 1) => {
          try {
            console.log(`Starting background fetch for full expenses (Attempt ${attempt})...`);
            const fullExpenses = await fetchWithType('expenses', {}, 60000);
            if (Array.isArray(fullExpenses)) {
              setExpenses(fullExpenses);
              lastSyncedExpenses.current = JSON.stringify(fullExpenses);
              console.log('Full expenses loaded in background');
            }
          } catch (err) {
            console.error(`Background expenses fetch failed (Attempt ${attempt}):`, err);
            if (attempt < 3) setTimeout(() => fetchExtendedExpenses(attempt + 1), 10000);
          }
        };
        setTimeout(fetchExtendedExpenses, 30000);

      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Failed to fetch data (retries left: ${retries}). Error: ${errorMsg}`);
        
        if (retries > 0) {
          const backoff = (4 - retries) * 3000;
          console.log(`Retrying initial fetch in ${backoff/1000}s...`);
          setTimeout(() => fetchData(retries - 1), backoff);
        } else {
          setError(errorMsg || 'Məlumatları yükləmək mümkün olmadı. İnternet bağlantısını və ya server statusunu yoxlayın.');
        }
      }
    };

    fetchData();
  }, []);

  const handleLogin = (token: string, username: string) => {
    localStorage.setItem('nekogold_token', token);
    localStorage.setItem('nekogold_username', username);
    setIsAuthenticated(true);
    setUser({ username });
  };

  const handleLogout = () => {
    localStorage.removeItem('nekogold_token');
    localStorage.removeItem('nekogold_username');
    setIsAuthenticated(false);
    setUser(null);
  };

  // Remote Print Queue Polling (REMOVED - Consolidated into Pulse)

  // Trigger print when currentRemoteJob is set
  useEffect(() => {
    if (currentRemoteJob) {
      document.body.classList.add('printing');
      const timer = setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.body.classList.remove('printing');
        }, 1000);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentRemoteJob]);

  // Sync data to backend on changes - ONLY after initial load is complete
  // NOTE: Products are now handled individually in modules (Stock, Sales, Returns) 
  // to avoid performance issues with large Base64 images in a single massive payload.
  
  useEffect(() => {
    if (!isLoaded || settings === null) return;

    const currentData = JSON.stringify(settings);
    if (currentData === lastSyncedSettings.current) return;

    const syncData = async () => {
      setIsSyncing(true);
      try {
        const res = await fetch('/api/data/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: settings })
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'Sync failed');
        }
        lastSyncedSettings.current = currentData;
        setSyncError(null);
      } catch (err: any) {
        console.error('Failed to sync settings:', err);
        setSyncError(`Məlumatlar yadda saxlanılmadı: ${err.message}`);
      } finally {
        setIsSyncing(false);
      }
    };

    const timeoutId = setTimeout(syncData, 1000);
    return () => clearTimeout(timeoutId);
  }, [settings, isLoaded]);

  const addLog = async (action: string, category: SystemLog['category'], details?: string) => {
    const newLog: SystemLog = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      date: new Date().toISOString(),
      user: user?.username || 'Sistem',
      action,
      category,
      details
    };
    
    setLogs(prev => [newLog, ...(prev || [])]);
    
    try {
      await fetch('/api/logs/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: newLog })
      });
    } catch (err) {
      console.error('Failed to save log:', err);
    }
  };

  const navItems = [
    { id: Page.Sales, icon: <ShoppingBag size={24} />, label: 'Satış' },
    { id: Page.Stock, icon: <Package size={24} />, label: 'Stok' },
    { id: Page.Customers, icon: <UserSquare2 size={24} />, label: 'Müştərilər' },
    { id: Page.SoldProducts, icon: <History size={24} />, label: 'Satılan Mallar' },
    { id: Page.Return, icon: <RotateCcw size={24} />, label: 'Qaytarma' },
    { id: Page.Scrap, icon: <Flame size={24} />, label: 'Lom' },
    { id: Page.Expenses, icon: <Wallet size={24} />, label: 'Xərclər' },
    { id: Page.Debt, icon: <Wallet size={24} />, label: 'Borclar' },
    { id: Page.Reports, icon: <BarChart3 size={24} />, label: 'Hesabat' },
    { id: Page.Logs, icon: <History size={24} />, label: 'Loglar' },
    { id: Page.Settings, icon: <SettingsIcon size={24} />, label: 'Ayarlar' },
  ];

  const renderModule = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="bg-red-50 border-2 border-red-200 p-8 rounded-3xl max-w-md text-center shadow-xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flame size={32} />
            </div>
            <h2 className="text-xl font-black text-red-800 mb-2">Bağlantı Xətası</h2>
            <p className="text-red-600 font-medium mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg shadow-red-900/20"
            >
              Yenidən Cəhd Et
            </button>
          </div>
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div className="fixed inset-0 bg-stone-950 flex flex-col items-center justify-center z-[9999]">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-amber-500/20 rounded-full"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-amber-500 font-black text-xl tracking-tighter">NG</span>
            </div>
          </div>
          <div className="mt-8 text-center px-6">
            <h2 className="text-white font-black text-2xl tracking-tighter uppercase mb-2">NEKO GOLD</h2>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
            </div>
            <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em] mt-4">Sistem Yüklənir</p>
            
            {/* Yükləmə çox çəkərsə bərpa düyməsi */}
            <div className="mt-12 animate-in fade-in duration-1000 [animation-delay:15s]">
              <button 
                onClick={() => window.location.reload()}
                className="text-[11px] font-black text-amber-500/50 hover:text-amber-500 uppercase tracking-widest border border-amber-500/20 px-6 py-3 rounded-xl transition-all"
              >
                Gözləmə vaxtı aşılıb? Yenidən Yüklə
              </button>
              <p className="text-stone-600 text-[9px] mt-4 uppercase tracking-widest max-w-[200px] mx-auto italic">
                Shared hosting (Hostinger) istifadə edirsinizsə ilk yükləmə bir az vaxt ala bilər.
              </p>
            </div>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case Page.Sales: return <SalesModule products={products} setProducts={setProducts} sales={sales} setSales={setSales} customers={customers} setCustomers={setCustomers} settings={settings} cart={cart} setCart={setCart} addLog={addLog} user={user} />;
      case Page.Stock: return <StockModule products={products} setProducts={setProducts} settings={settings} sales={sales} cart={cart} setCart={setCart} setCurrentPage={setCurrentPage} addLog={addLog} user={user} isBackgroundLoading={isBackgroundLoading} />;
      case Page.Customers: return <CustomersModule customers={customers} setCustomers={setCustomers} sales={sales} addLog={addLog} />;
      case Page.SoldProducts: return <SoldProductsModule sales={sales} setSales={setSales} products={products} setProducts={setProducts} addLog={addLog} settings={settings} />;
      case Page.Return: return <ReturnsModule sales={sales} setSales={setSales} products={products} setProducts={setProducts} addLog={addLog} />;
      case Page.Scrap: return <ScrapModule scraps={scraps} setScraps={setScraps} settings={settings} addLog={addLog} />;
      case Page.Expenses: return <ExpensesModule expenses={expenses} setExpenses={setExpenses} sales={sales} addLog={addLog} />;
      case Page.Debt: return <DebtModule customers={customers} setCustomers={setCustomers} addLog={addLog} />;
      case Page.Reports: return <ReportsModule sales={sales} products={products} scraps={scraps} customers={customers} expenses={expenses} />;
      case Page.Logs: return <LogsModule logs={logs} setLogs={setLogs} />;
      case Page.Settings: return <SettingsModule 
        settings={settings} 
        setSettings={setSettings} 
        products={products}
        setProducts={setProducts}
        sales={sales}
        setSales={setSales}
        customers={customers}
        setCustomers={setCustomers}
        scraps={scraps}
        setScraps={setScraps}
        addLog={addLog}
      />;
      default: return <SalesModule products={products} setProducts={setProducts} sales={sales} setSales={setSales} customers={customers} setCustomers={setCustomers} settings={settings} cart={cart} setCart={setCart} addLog={addLog} user={user} />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-stone-100 font-sans overflow-hidden no-print">
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

        <div className="w-full px-3 mt-auto mb-6">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-2xl transition-all hover:bg-red-500/10 text-red-500 ${isSidebarOpen ? 'px-4 py-3.5 space-x-4' : 'p-3.5 justify-center'}`}
          >
            <LogOut size={24} />
            {isSidebarOpen && <span className="text-sm font-bold truncate">Çıxış</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-stone-900 border-t border-white/10 z-50 flex justify-around items-center py-2 px-1 no-print">
        {navItems.filter(item => [Page.Sales, Page.Stock, Page.Return, Page.Reports].includes(item.id)).map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${currentPage === item.id ? 'text-amber-500 bg-white/5' : 'text-stone-50'}`}
          >
            {React.cloneElement(item.icon as any, { size: 20 })}
            <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(Page.Settings)}
          className={`flex flex-col items-center p-2 rounded-xl ${currentPage === Page.Settings ? 'text-amber-500 bg-white/5' : 'text-stone-50'}`}
        >
          <LayoutGrid size={20} />
          <span className="text-[9px] font-black mt-1 uppercase tracking-tighter">Menyu</span>
        </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-y-auto bg-stone-50 scrollbar-hide pb-24 md:pb-0 no-print">
        {syncError && (
          <div className="bg-red-600 text-white p-2 text-center text-[10px] font-black uppercase tracking-widest animate-pulse sticky top-0 z-50">
            {syncError}
          </div>
        )}
        {isSyncing && !syncError && (
          <div className="bg-amber-500 text-amber-950 p-1 text-center text-[8px] font-black uppercase tracking-widest sticky top-0 z-50 opacity-50">
            Məlumatlar sinxronizasiya edilir...
          </div>
        )}
        {error && (
          <div className="bg-red-50 border-b border-red-100 p-4 flex items-center justify-between animate-in slide-in-from-top duration-500">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <p className="text-xs font-black text-red-800 uppercase tracking-tighter">
                Sistem Xətası: {error}
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="text-[10px] font-black text-red-600 hover:text-red-800 uppercase underline tracking-widest"
            >
              Yenidən Yoxla
            </button>
          </div>
        )}
        <div className="p-4 md:p-8">
          {renderModule()}
        </div>
      </main>

      {/* Hidden Remote Print Area (Portal to body for CSS visibility) */}
      {currentRemoteJob && createPortal(
        <div id="label-print">
          <div className="label-page-break">
            <LabelPrint product={currentRemoteJob.product} settings={settings} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default App;
