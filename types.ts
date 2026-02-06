
export type ProductType = string;

export interface Product {
  id: string;
  code: string;
  name: string;
  carat: number; // Əyar
  type: ProductType;
  supplier: string; // Tədərükçü
  brilliant?: string; // Brilliant məlumatı
  weight: number | ''; // Çəki (boş ola birər)
  supplierPrice: number;
  price: number | '';
  stockCount: number;
  imageUrl?: string;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  title?: string; // Vəzifə və ya Status
  address?: string; // Ünvan
  cashDebt: number;
  goldDebt: number; // qram ilə
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  type: ProductType;
  customerName: string;
  price: number;
  discount: number;
  total: number;
  date: string;
  status: 'completed' | 'returned';
  // Snapshot fields for history
  weight?: number;
  carat?: number;
  supplier?: string;
  imageUrl?: string;
}

export interface ScrapGold {
  id: string;
  customerName: string;
  grams: number;
  carat: number; // Ayar
  pricePerGram: number;
  totalPrice: number;
  isMelted: boolean;
  date: string;
}

export interface AppSettings {
  deleteCode: string;
  adminPassword: string;
  printerName: string;
  shopName: string;
  productTypes: string[];
  suppliers: string[];
  carats: number[];
  pricePerGram: number; // 1 Qramın qiyməti
}

export enum Page {
  Sales = 'SALES',
  Stock = 'STOCK',
  Customers = 'CUSTOMERS',
  Debt = 'DEBT',
  Return = 'RETURN',
  Scrap = 'SCRAP',
  Settings = 'SETTINGS',
  Reports = 'REPORTS'
}
