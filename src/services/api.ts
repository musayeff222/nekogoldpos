
import { Product, Sale, Customer, ScrapGold, AppSettings } from '../../types';

const API_BASE = '/api';

export const api = {
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/products`);
    return res.json();
  },
  async saveProduct(product: Product): Promise<void> {
    await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
  },
  async getCustomers(): Promise<Customer[]> {
    const res = await fetch(`${API_BASE}/customers`);
    return res.json();
  },
  async saveCustomer(customer: Customer): Promise<void> {
    await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
  },
  async getSales(): Promise<Sale[]> {
    const res = await fetch(`${API_BASE}/sales`);
    return res.json();
  },
  async saveSales(sales: Sale[]): Promise<void> {
    await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sales),
    });
  },
  async getSettings(): Promise<AppSettings | null> {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },
  async saveSettings(settings: AppSettings): Promise<void> {
    await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  },
};
