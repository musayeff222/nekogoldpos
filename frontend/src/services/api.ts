import { Product, Sale, Customer, ScrapGold, AppSettings } from '../types';

const API_BASE = '/api';

export const api = {
  // Products
  getProducts: async (): Promise<Product[]> => {
    const res = await fetch(`${API_BASE}/products`);
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error("Expected array from /api/products, got:", data);
      return [];
    }
    return data.map((p: any) => ({ ...p, logs: typeof p.logs === 'string' ? JSON.parse(p.logs) : p.logs }));
  },
  addProduct: async (product: Product): Promise<Product> => {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return res.json();
  },
  updateProduct: async (product: Product): Promise<Product> => {
    const res = await fetch(`${API_BASE}/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return res.json();
  },
  deleteProduct: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
  },

  // Sales
  getSales: async (): Promise<Sale[]> => {
    const res = await fetch(`${API_BASE}/sales`);
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error("Expected array from /api/sales, got:", data);
      return [];
    }
    return data;
  },
  addSale: async (sale: Sale): Promise<Sale> => {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale)
    });
    return res.json();
  },
  updateSale: async (sale: Sale): Promise<Sale> => {
    const res = await fetch(`${API_BASE}/sales/${sale.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale)
    });
    return res.json();
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    const res = await fetch(`${API_BASE}/customers`);
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error("Expected array from /api/customers, got:", data);
      return [];
    }
    return data;
  },
  addCustomer: async (customer: Customer): Promise<Customer> => {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });
    return res.json();
  },
  updateCustomer: async (customer: Customer): Promise<Customer> => {
    const res = await fetch(`${API_BASE}/customers/${customer.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });
    return res.json();
  },
  deleteCustomer: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' });
  },

  // Scraps
  getScraps: async (): Promise<ScrapGold[]> => {
    const res = await fetch(`${API_BASE}/scraps`);
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error("Expected array from /api/scraps, got:", data);
      return [];
    }
    return data.map((s: any) => ({
      ...s,
      phones: typeof s.phones === 'string' ? JSON.parse(s.phones) : s.phones,
      items: typeof s.items === 'string' ? JSON.parse(s.items) : s.items
    }));
  },
  addScrap: async (scrap: ScrapGold): Promise<ScrapGold> => {
    const res = await fetch(`${API_BASE}/scraps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scrap)
    });
    return res.json();
  },

  // Settings
  getSettings: async (): Promise<AppSettings | null> => {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },
  saveSettings: async (settings: AppSettings): Promise<AppSettings> => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  }
};
