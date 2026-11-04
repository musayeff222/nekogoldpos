
export type ProductType = string;

export interface ProductLog {
  date: string;
  action: string;
  details?: string;
  isAddition?: boolean;
}

export interface ProductGroup {
  name: string;
  prefix: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  carat: string; // Əyar
  type: ProductType;
  supplier: string; // Tədərükçü
  brilliant?: string; // Brilliant məlumatı
  weight: number | ''; // Çəki
  supplierPrice: number;
  price: number | '';
  stockCount: number;
  isArchived?: boolean;
  isReturned?: boolean;
  returnReason?: string;
  imageUrl?: string;
  purchaseDate: string; // Alış tarixi
  logs: ProductLog[]; // Dəyişiklik tarixçəsi
  allowPartialSale?: boolean;
  soldWeight?: number; // Hissəli satışda satılan ümumi çəki
  saleType?: 'weight' | 'count';
  soldCount?: number; 
  receiptName?: string; // Çekdə çıxacaq ad
  customSalePrice?: number; // Müştərinin aldığı / razılaşdırılmış qiymət
  originalPrice?: number; // İlkin baza qiyməti
  addedBy?: string; // Əlavə edən əməkdaş
  addedAt?: string; // Bazaya əlavə olunma vaxtı (ISO string)
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
  receiptName?: string; // Çekdəki fərdi ad
  originalProductName?: string;
  productCode: string;
  type: ProductType;
  customerName: string;
  price: number;
  originalPrice?: number; // Orijinal ilkin qiymət
  discount: number;
  total: number;
  date: string;
  status: 'completed' | 'returned' | 'exchanged';
  returnNote?: string; // Geri qaytarılma və ya dəyişdirilmə detalları
  isPartial?: boolean;
  partialName?: string;
  soldWeight?: number; // Bu satışda satılan çəki
  // Snapshot fields for history
  weight?: number;
  carat?: string;
  supplier?: string;
  brilliant?: string; // Brilliant məlumatı (tarixçə üçün)
  imageUrl?: string;
  sellerName?: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: string;
}

export interface ScrapItem {
  name: string;
  weight: number;
  carat: string;
  image: string;
}

export interface ScrapPhone {
  number: string;
  owner: string;
}

export interface ScrapGold {
  id: string;
  customerName: string;
  idCardFin: string;
  phones: ScrapPhone[];
  items: ScrapItem[];
  pricePerGram: number;
  totalPrice: number;
  personImage?: string;
  idCardImage?: string;
  isMelted: boolean;
  date: string;
}

export interface LabelElement {
  id: string;
  field: 'shopName' | 'code' | 'weight' | 'price' | 'carat' | 'supplier' | 'brilliant' | 'currency';
  x: number; // percentage
  y: number; // percentage
  fontSize: number; // px
  visible: boolean;
  bold: boolean;
}

export interface LabelConfig {
  width: number; // mm
  height: number; // mm
  elements: LabelElement[];
}

export interface AppSettings {
  deleteCode: string;
  adminPassword: string;
  printerName: string;
  shopName: string;
  productGroups: ProductGroup[];
  productTypes: string[]; // Keep for compatibility or simple lists
  suppliers: string[];
  carats: string[];
  pricePerGram: number; // 1 Qramın qiyməti (585)
  pricePerGram750: number; // 1 Qramın qiyməti (750)
  pricePerBrilliant: number; // 1 Karat Brilliantın qiyməti
  labelConfig: LabelConfig;
  silentPrinting: boolean;
  receiptPrinterPath: string;
  labelPrinterPath: string;
  receiptFontWeight: string;
  labelFontWeight: string;
  isPrintStation?: boolean;
  remotePrintEnabled?: boolean;
  telegramChatIds?: string[];
  telegramSalesChatIds?: string[];
  telegramProductChatIds?: string[];
}

export interface SystemLog {
  id: string;
  date: string;
  user: string;
  action: string;
  details?: string;
  category: 'PRODUCT' | 'SALE' | 'SCRAP' | 'SETTINGS' | 'EXPENSE' | 'CUSTOMER' | 'SYSTEM';
}

export enum Page {
  Sales = 'SALES',
  Stock = 'STOCK',
  Customers = 'CUSTOMERS',
  SoldProducts = 'SOLD_PRODUCTS',
  Return = 'RETURN',
  Scrap = 'SCRAP',
  Settings = 'SETTINGS',
  Reports = 'REPORTS',
  Debt = 'DEBT',
  Expenses = 'EXPENSES',
  Logs = 'LOGS',
  Reminders = 'REMINDERS',
  PatronDashboard = 'PATRON_DASHBOARD',
  ManagerDashboard = 'MANAGER_DASHBOARD',
  Approvals = 'APPROVALS'
}

export interface Reminder {
  id: string;
  title: string;
  note?: string;
  productId?: string;
  productName?: string;
  productCode?: string;
  customerId?: string;
  customerName?: string;
  category: 'Zərgərdə' | 'Müştəridə' | 'Sifariş' | 'Təcili' | 'Digər';
  dueDate?: string;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
}

export type UserRole = 'mudir' | 'patron' | 'staff' | 'shop' | 'admin' | 'manager';

export interface AuthUser {
  id?: number;
  username: string;
  fullName: string;
  role: UserRole;
  mustChangePassword?: boolean;
}

export interface UserAccount {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  must_change_password: number | boolean;
  created_by?: string;
  created_at?: string;
}

export interface ApprovalRequest {
  id: string;
  type: 'return' | 'delete_product' | 'edit_product' | 'change_group' | 'other';
  employee_name: string;
  employee_username: string;
  product_id?: string;
  product_name?: string;
  product_code?: string;
  product_quantity?: string;
  reason: string;
  payload?: any;
  status: 'pending' | 'approved' | 'rejected';
  decided_by?: string;
  decided_at?: string;
  rejection_reason?: string;
  created_at: string;
}

