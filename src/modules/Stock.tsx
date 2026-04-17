
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Folder, 
  Edit2, 
  Trash2, 
  X, 
  Plus, 
  Image as ImageIcon, 
  Upload, 
  Camera,
  Gem,
  Search,
  Scale,
  Sparkles,
  Filter,
  Calendar,
  History,
  Save,
  Tag,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  ShoppingBag,
  Zap,
  Printer,
  Box,
  Maximize2,
  RotateCcw,
  AlertCircle,
  User,
  Truck,
  Archive,
  ArrowDownToLine
} from 'lucide-react';
import { Product, ProductType, AppSettings, ProductLog, Sale, SystemLog } from '@/types';
import { LabelPrint } from '@/components/LabelPrint';

interface StockProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  settings: AppSettings;
  sales: Sale[];
  cart: Product[];
  setCart: React.Dispatch<React.SetStateAction<Product[]>>;
  setCurrentPage: (page: any) => void;
  addLog: (action: string, category: SystemLog['category'], details?: string) => void;
  user: { username: string } | null;
  isBackgroundLoading?: boolean;
}

const StockModule: React.FC<StockProps> = ({ products, setProducts, settings, sales, cart, setCart, setCurrentPage, addLog, user, isBackgroundLoading }) => {
  const [activeFolder, setActiveFolder] = useState<ProductType | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [zoomedProductIndex, setZoomedProductIndex] = useState<number | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showMoveToArchiveModal, setShowMoveToArchiveModal] = useState(false);
  const [showPartialLogModal, setShowPartialLogModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [selectedProductForLog, setSelectedProductForLog] = useState<Product | null>(null);
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logDateFilter, setLogDateFilter] = useState('');
  const [selectedForArchive, setSelectedForArchive] = useState<string[]>([]);
  const [selectedForRestore, setSelectedForRestore] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  
  // Təkrarlanan kod üçün xəta halları
  const [duplicateInStock, setDuplicateInStock] = useState<Product | null>(null);
  const [duplicateInSales, setDuplicateInSales] = useState<Sale | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    carat: settings.carats[0] || '',
    type: settings.productGroups[0]?.name || '',
    supplier: settings.suppliers[0] || '',
    brilliant: '',
    weight: '' as string | number,
    price: '' as string | number,
    imageUrl: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    allowPartialSale: false
  });

  const [autoPrint, setAutoPrint] = useState(true);
  const [bulkPricePerGram, setBulkPricePerGram] = useState<number | ''>('');
  const [bulkPricePerGram750, setBulkPricePerGram750] = useState<number | ''>('');
  const [bulkBrilliantPrice, setBulkBrilliantPrice] = useState<number | ''>('');
  const [bulkKaratFilter, setBulkKaratFilter] = useState<string | 'all'>('all');
  const [bulkPrintList, setBulkPrintList] = useState<Product[]>([]);

  const [viewMode, setViewMode] = useState<'folders' | 'printList' | 'returns' | 'mobile'>('folders');
  const [stockPrintList, setStockPrintList] = useState<Product[]>([]);
  const [printSupplier, setPrintSupplier] = useState<string>('all');
  const [printCategory, setPrintCategory] = useState<string>('all');

  const [editForm, setEditForm] = useState<Partial<Product>>({});

  // Clear selection when switching views
  useEffect(() => {
    setSelectedForRestore([]);
  }, [showArchived, activeFolder]);

  // Update print list when filters change
  useEffect(() => {
    if (viewMode === 'printList') {
      let filtered = activeProducts.filter(p => !p.isArchived);
      
      if (printSupplier !== 'all') {
        filtered = filtered.filter(p => p.supplier === printSupplier);
      }
      
      if (printCategory !== 'all') {
        filtered = filtered.filter(p => p.type === printCategory);
      }
      
      // Sort by code ascending (Kod azdan çoxa doğru)
      filtered.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }));
      
      setStockPrintList(filtered);
    }
  }, [printSupplier, printCategory, products, viewMode]);

  const removeFromPrintList = (id: string) => {
    setStockPrintList(prev => prev.filter(item => item.id !== id));
  };

  const handlePrintStockList = () => {
    window.focus();
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleBulkPrint = () => {
    if (!bulkPricePerGram || !activeFolder) return;
    
    const pricePerGram = Number(bulkPricePerGram);
    const pricePerGram750 = Number(bulkPricePerGram750 || bulkPricePerGram); // Fallback to general if 750 not set
    const brilliantPrice = Number(bulkBrilliantPrice || 0);
    
    const productsInFolder = activeProducts.filter(p => {
      const matchesFolder = p.type === activeFolder && !p.isArchived;
      const matchesKarat = bulkKaratFilter === 'all' || p.carat === bulkKaratFilter;
      return matchesFolder && matchesKarat;
    });
    
    // Update products in state
    const updatedProducts = products.map(p => {
      const matchesFolder = p.type === activeFolder && !p.isArchived;
      const matchesKarat = bulkKaratFilter === 'all' || p.carat === bulkKaratFilter;
      if (matchesFolder && matchesKarat) {
        const rate = p.carat === '750' ? pricePerGram750 : pricePerGram;
        const newPrice = Math.round(((Number(p.weight) * rate) + brilliantPrice) / 10) * 10;
        return { ...p, price: newPrice };
      }
      return p;
    });
    
    setProducts(updatedProducts);
    
    // Save to server immediately (bulk)
    const saveBulkUpdate = async () => {
      try {
        const productsToUpdate = updatedProducts.filter(p => {
          const matchesFolder = p.type === activeFolder && !p.isArchived;
          const matchesKarat = bulkKaratFilter === 'all' || p.carat === bulkKaratFilter;
          return matchesFolder && matchesKarat;
        });
        const res = await fetch('/api/products/bulk-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: productsToUpdate })
        });
        if (!res.ok) throw new Error('Failed to bulk update in database');
        console.log('Bulk products updated successfully in database');
      } catch (err) {
        console.error('Database bulk update error:', err);
        alert('Qiymətlər bazada yenilənmədi. Yenidən cəhd edin.');
      }
    };
    saveBulkUpdate();
    
    // Prepare for printing
    const printList = productsInFolder.map(p => {
      const rate = p.carat === '750' ? pricePerGram750 : pricePerGram;
      const newPrice = Math.round(((Number(p.weight) * rate) + brilliantPrice) / 10) * 10;
      return { ...p, price: newPrice };
    });
    
    setBulkPrintList(printList);
    
    // Trigger print
    setTimeout(() => {
      window.print();
      // Clear list after print dialog closes
      setTimeout(() => {
        setBulkPrintList([]);
        setBulkPricePerGram('');
        setBulkPricePerGram750('');
        setBulkBrilliantPrice('');
        setBulkKaratFilter('all');
      }, 10000);
    }, 1000);
  };

  const getPrefix = (type: string) => {
    const group = settings.productGroups.find(g => g.name === type);
    return group ? group.prefix : '';
  };

  const getNextCode = (prefix: string) => {
    if (!prefix) return '';
    
    // Scan all products (active, archived, returned) and sales to find the global last number for this prefix
    const allCodesInProducts = products.map(p => p.code);
    const allCodesInSales = sales.map(s => s.productCode);
    const allKnownCodes = Array.from(new Set([...allCodesInProducts, ...allCodesInSales]));
    
    let maxNum = 0;
    
    allKnownCodes.forEach(code => {
      if (code && code.startsWith(prefix)) {
        // Extract numbers from the end of the code
        const numPart = code.substring(prefix.length).match(/^\d+/);
        if (numPart) {
          const num = parseInt(numPart[0], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    });
    
    const nextNum = maxNum + 1;
    // Format: Prefix + Number (e.g., BK123)
    // If you want padding: prefix + nextNum.toString().padStart(3, '0')
    return prefix + nextNum;
  };

  useEffect(() => {
    if (isAddingNew && !newProduct.code) {
      const prefix = getPrefix(newProduct.type);
      setNewProduct(prev => ({ ...prev, code: getNextCode(prefix) }));
    }
  }, [newProduct.type, isAddingNew]);

  // Stokda olan məhsulları süzgəcdən keçiririk (Vazvrat edilmişlər bura daxil deyil)
  const activeProducts = products.filter(p => (Number(p.stockCount) || 0) > 0 && !p.isReturned);

  // Unique suppliers and categories for filters
  const suppliers = Array.from(new Set(activeProducts.map(p => p.supplier).filter(Boolean)));
  const categories = settings.productGroups.map(g => g.name);

  const calculatePrice = (weight: number | '', carat: string, brilliant: string) => {
    if (weight === '' || isNaN(Number(weight))) return '';
    
    let gramPrice = settings.pricePerGram;
    if (carat === '750' || carat === '18') {
      gramPrice = settings.pricePerGram750 || 650;
    }
    
    let total = Number(weight) * gramPrice;
    
    // Parse brilliant carat if present
    if (brilliant) {
      const match = brilliant.match(/(\d+(\.\d+)?)/);
      if (match) {
        const ct = parseFloat(match[1]);
        total += ct * (settings.pricePerBrilliant || 1000);
      }
    }
    
    return Math.round(total / 10) * 10;
  };

  useEffect(() => {
    const calculated = calculatePrice(newProduct.weight as number | '', newProduct.carat, newProduct.brilliant);
    setNewProduct(prev => ({ ...prev, price: calculated }));
  }, [newProduct.weight, newProduct.carat, newProduct.brilliant, settings.pricePerGram, settings.pricePerGram750, settings.pricePerBrilliant]);

  useEffect(() => {
    if (Object.keys(editForm).length === 0 || !selectedProduct) return;
    
    const weight = editForm.weight !== undefined ? editForm.weight : (selectedProduct.weight as number | '');
    const carat = editForm.carat !== undefined ? editForm.carat : selectedProduct.carat;
    const brilliant = editForm.brilliant !== undefined ? editForm.brilliant : (selectedProduct.brilliant || '');
    
    const calculated = calculatePrice(weight, carat, brilliant);
    if (calculated !== '') {
      setEditForm(prev => ({ ...prev, price: calculated }));
    }
  }, [editForm.weight, editForm.carat, editForm.brilliant, settings.pricePerGram, settings.pricePerGram750, settings.pricePerBrilliant]);

  useEffect(() => {
    const code = newProduct.code.trim().toLowerCase();
    if (!code) {
      setDuplicateInStock(null);
      setDuplicateInSales(null);
      return;
    }

    // 1. Aktiv stokda yoxla
    const inStock = activeProducts.find(p => p.code.trim().toLowerCase() === code);
    setDuplicateInStock(inStock || null);

    // 2. Satış tarixçəsində yoxla (Əgər stokda yoxdursa)
    if (!inStock) {
      const inSales = (Array.isArray(sales) ? sales : []).find(s => s.productCode.trim().toLowerCase() === code);
      setDuplicateInSales(inSales || null);
    } else {
      setDuplicateInSales(null);
    }
  }, [newProduct.code, products, sales]);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.code || !newProduct.name || duplicateInStock || duplicateInSales) return;

    const prefix = getPrefix(newProduct.type);
    let finalCode = newProduct.code.trim();
    
    // Əgər istifadəçi prefixi yazmayıbsa, biz əlavə edirik (amma adətən inputda olacaq)
    if (prefix && !finalCode.startsWith(prefix)) {
        finalCode = prefix + finalCode;
    }

    const productToAdd: Product = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      code: finalCode,
      name: newProduct.name.trim(),
      carat: newProduct.carat,
      type: newProduct.type,
      supplier: newProduct.supplier,
      brilliant: newProduct.brilliant || undefined,
      weight: newProduct.weight === '' ? 0 : Number(newProduct.weight),
      price: newProduct.price === '' ? 0 : Number(newProduct.price),
      imageUrl: newProduct.imageUrl,
      supplierPrice: 0, 
      stockCount: 1, 
      purchaseDate: newProduct.purchaseDate,
      logs: [{ date: new Date().toISOString(), action: 'Sistemə əlavə edildi' }],
      allowPartialSale: newProduct.allowPartialSale,
      soldWeight: 0
    };

    // Save to server immediately
    const saveProduct = async () => {
      try {
        const res = await fetch('/api/products/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product: productToAdd })
        });
        if (!res.ok) throw new Error('Failed to save to database');
        console.log('Product saved successfully to database');

        // Remote Print if enabled
        if (settings.remotePrintEnabled) {
          fetch('/api/print-queue/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product: productToAdd })
          }).catch(err => console.error('Remote print failed:', err));
        }
      } catch (err) {
        console.error('Database save error:', err);
        alert('Məhsul bazaya əlavə edilmədi. Yenidən cəhd edin.');
      }
    };
    saveProduct();

    setProducts((prev: Product[]) => [productToAdd, ...prev]);
    addLog(`Yeni məhsul əlavə edildi: ${productToAdd.code}`, 'PRODUCT', `${productToAdd.name}, ${productToAdd.weight}gr, ${productToAdd.carat} əyar`);
    setLastAddedProduct(productToAdd);
    
    // Trigger print if autoPrint is enabled
    if (autoPrint) {
      setTimeout(() => {
          window.print();
          // Clear after print dialog
          setTimeout(() => setLastAddedProduct(null), 10000);
      }, 1000);
    }

    setIsAddingNew(false);
    resetForm();
    setActiveFolder(productToAdd.type);
  };

  const resetForm = () => {
    setNewProduct(prev => {
      const currentGroup = settings.productGroups.find(g => g.name === prev.type) || settings.productGroups[0];
      const prefix = currentGroup?.prefix || '';
      
      return {
        ...prev,
        code: getNextCode(prefix),
        name: '',
        // Keep the previous selections
        carat: prev.carat,
        type: prev.type,
        supplier: prev.supplier,
        brilliant: '',
        weight: '',
        price: '',
        imageUrl: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        allowPartialSale: false
      };
    });
    setDuplicateInStock(null);
    setDuplicateInSales(null);
    stopCamera();
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setIsCameraOpen(true);
      setZoomLevel(1); // Reset zoom when opening camera
    } catch (err) {
      alert("Kameraya giriş icazəsi verilmədi.");
    }
  };

  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
    setIsCameraOpen(false);
  };

  const resizeImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const uploadImage = async (base64: string): Promise<string> => {
    if (!base64 || !base64.startsWith('data:')) return base64;
    
    try {
      // Convert base64 to blob
      const res = await fetch(base64);
      const blob = await res.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'product.jpg');
      
      const uploadRes = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Upload failed');
      
      const data = await uploadRes.json();
      return data.imageUrl;
    } catch (err) {
      console.error('Image upload error:', err);
      return base64; // Fallback to base64 if upload fails
    }
  };

  const capturePhoto = async (isEdit: boolean = false) => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      // Calculate source rectangle for digital zoom
      const sw = videoWidth / zoomLevel;
      const sh = videoHeight / zoomLevel;
      const sx = (videoWidth - sw) / 2;
      const sy = (videoHeight - sh) / 2;
      
      // Resize to max 800px for persistent storage
      const maxDim = 800;
      let width = sw;
      let height = sh;
      
      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);
        
        // Convert canvas to base64
        const base64Image = canvas.toDataURL('image/jpeg', 0.7);
        
        // Upload to server
        setIsUploading(true);
        const imageUrl = await uploadImage(base64Image);
        setIsUploading(false);
        
        if (isEdit) setEditForm(prev => ({ ...prev, imageUrl }));
        else setNewProduct(prev => ({ ...prev, imageUrl }));
        
        stopCamera();
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        const resized = await resizeImage(base64Image);
        
        // Upload to server
        setIsUploading(true);
        const imageUrl = await uploadImage(resized);
        setIsUploading(false);
        
        if (isEdit) setEditForm(prev => ({ ...prev, imageUrl }));
        else setNewProduct(prev => ({ ...prev, imageUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openDetailModal = async (product: Product) => {
    // If it's a "light" product (no logs), fetch the full data
    if (!product.logs || product.logs.length === 0) {
      setIsDetailLoading(true);
      setShowDetailModal(true);
      try {
        const res = await fetch(`/api/products/${product.id}`);
        if (res.ok) {
          const fullProduct = await res.json();
          setSelectedProduct(fullProduct);
          setEditForm({ ...fullProduct });
          // Update the products list so we don't fetch again
          setProducts(prev => prev.map(p => p.id === product.id ? fullProduct : p));
        } else {
          setSelectedProduct(product);
          setEditForm({ ...product });
        }
      } catch (err) {
        console.error('Failed to fetch full product:', err);
        setSelectedProduct(product);
        setEditForm({ ...product });
      } finally {
        setIsDetailLoading(false);
      }
    } else {
      setSelectedProduct(product);
      setEditForm({ ...product });
      setShowDetailModal(true);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setIdToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    const id = idToDelete;

    try {
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete product from database');

      const productToDelete = products.find(p => p.id === id);
      setProducts(prev => prev.filter(p => p.id !== id));
      if (productToDelete) {
        addLog(`Məhsul silindi: ${productToDelete.code}`, 'PRODUCT', `${productToDelete.name}`);
      }
      showNotification('Məhsul uğurla silindi.');
      setShowDeleteConfirm(false);
      setIdToDelete(null);
    } catch (err) {
      console.error('Delete product error:', err);
      showNotification('Məhsul silinərkən xəta baş verdi.', 'error');
    }
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !editForm.code || !editForm.name) return;

    const updatedProduct: Product = { 
      ...selectedProduct, 
      ...editForm,
      stockCount: editForm.isReturned ? 0 : (editForm.stockCount ?? selectedProduct.stockCount)
    } as Product;
    
    // Save to server immediately
    const saveUpdate = async () => {
      try {
        const res = await fetch(`/api/products/${updatedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product: updatedProduct })
        });
        if (!res.ok) throw new Error('Failed to update in database');
        console.log('Product updated successfully in database');
      } catch (err) {
        console.error('Database update error:', err);
        showNotification('Məhsul bazada yenilənmədi. Yenidən cəhd edin.', 'error');
      }
    };
    saveUpdate();

    setProducts((prev: Product[]) => prev.map((p: Product) => p.id === selectedProduct.id ? updatedProduct : p));
    addLog(`Məhsul redaktə edildi: ${updatedProduct.code}`, 'PRODUCT', `Yeni məlumatlar: ${updatedProduct.name}, ${updatedProduct.weight}gr, ${updatedProduct.carat} əyar`);
    setSelectedProduct(updatedProduct);
    showNotification("Məhsul məlumatları uğurla yeniləndi.");
  };

  const handleMoveToArchive = () => {
    if (selectedForArchive.length === 0) return;
    
    setProducts(prev => prev.map(p => {
      if (selectedForArchive.includes(p.id)) {
        const updatedProduct = { ...p, isArchived: true };
        addLog(`Məhsul arxivə göndərildi: ${updatedProduct.code}`, 'PRODUCT', `${updatedProduct.name}`);
        
        // Save to server immediately
        fetch(`/api/products/${updatedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product: updatedProduct })
        }).catch(err => console.error('Failed to update product in database during archive:', err));

        return updatedProduct;
      }
      return p;
    }));
    
    setSelectedForArchive([]);
    setShowMoveToArchiveModal(false);
    alert(`${selectedForArchive.length} məhsul arxivə daşındı.`);
  };

  const handleRestoreFromArchive = async () => {
    if (selectedForRestore.length === 0) return;

    const productsToRestore = products.filter(p => selectedForRestore.includes(p.id)).map(p => ({
      ...p,
      isArchived: false
    }));

    try {
      const res = await fetch('/api/products/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: productsToRestore })
      });

      if (!res.ok) throw new Error('Failed to bulk update in database');

      setProducts(prev => prev.map(p => {
        if (selectedForRestore.includes(p.id)) {
          return { ...p, isArchived: false };
        }
        return p;
      }));

      setSelectedForRestore([]);
      alert(`${productsToRestore.length} məhsul əsas səhifəyə qaytarıldı.`);
    } catch (err) {
      console.error('Restore from archive error:', err);
      alert('Məhsullar qaytarılarkən xəta baş verdi.');
    }
  };

  const getFilteredProducts = () => {
    let list = activeFolder ? activeProducts.filter(p => p.type === activeFolder) : activeProducts;
    
    // Filter by archive status
    list = list.filter(p => !!p.isArchived === showArchived);

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p => 
        p.code.toLowerCase().includes(term) || p.name.toLowerCase().includes(term) || p.weight?.toString().includes(term)
      );
    }
    // Sort by code ascending (Kod azdan çoxa doğru)
    list.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }));
    return list;
  };

  const filteredProducts = getFilteredProducts();

  const openGallery = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setZoomedProductIndex(index);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomedProductIndex !== null) {
      setZoomedProductIndex((zoomedProductIndex + 1) % filteredProducts.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomedProductIndex !== null) {
      setZoomedProductIndex((zoomedProductIndex - 1 + filteredProducts.length) % filteredProducts.length);
    }
  };

  useEffect(() => {
    if (zoomedProductIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [zoomedProductIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (zoomedProductIndex !== null) {
        if (e.key === 'ArrowRight') {
          setZoomedProductIndex((zoomedProductIndex + 1) % filteredProducts.length);
        } else if (e.key === 'ArrowLeft') {
          setZoomedProductIndex((zoomedProductIndex - 1 + filteredProducts.length) % filteredProducts.length);
        } else if (e.key === 'Escape') {
          setZoomedProductIndex(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedProductIndex, filteredProducts.length]);

  if (isAddingNew) {
    return (
      <div className="flex flex-col animate-in slide-in-from-right duration-300 min-h-full">
        <div className="bg-white rounded-3xl shadow-2xl border border-stone-100 flex flex-col overflow-hidden max-h-[calc(100vh-48px)]">
            <div className="flex items-center justify-between p-4 border-b border-stone-50 bg-stone-50/30">
              <div className="flex items-center space-x-4">
                  <button onClick={() => { setIsAddingNew(false); resetForm(); }} className="p-2.5 bg-white border border-stone-200 rounded-xl text-stone-400 hover:text-stone-900 transition-all shadow-sm active:scale-95"><ArrowLeft size={18} /></button>
                  <h2 className="text-lg font-black text-stone-900 uppercase tracking-tighter leading-none">Yeni Məhsul</h2>
              </div>
            </div>

            <form id="ultraCompactForm" onSubmit={handleAddProduct} className="flex-1 p-4 md:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto scrollbar-hide">
              <div className="lg:col-span-5 space-y-3">
                <div className="relative aspect-square md:aspect-auto md:h-72 border-2 border-dashed border-stone-100 rounded-2xl bg-stone-50/50 flex items-center justify-center overflow-hidden shadow-inner">
                  {isCameraOpen ? (
                    <div className="absolute inset-0 bg-black flex flex-col">
                       <div className="flex-1 relative overflow-hidden">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover transition-transform duration-300" 
                            style={{ transform: `scale(${zoomLevel})` }}
                          />
                          
                          {/* Zoom Controls */}
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col space-y-4">
                             <button 
                               type="button" 
                               onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}
                               className="w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/30 active:scale-90 transition-all"
                             >
                               <Plus size={24} />
                             </button>
                             <div className="bg-white/20 backdrop-blur-md text-white py-1 px-2 rounded-lg text-[10px] font-black text-center border border-white/30">
                                {zoomLevel.toFixed(1)}x
                             </div>
                             <button 
                               type="button" 
                               onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 1))}
                               className="w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/30 active:scale-90 transition-all"
                             >
                               <X size={24} className="rotate-45" />
                             </button>
                          </div>
                       </div>
                       <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-3 px-4">
                          <button type="button" onClick={() => capturePhoto(false)} className="bg-amber-500 text-stone-950 px-5 py-3 rounded-xl shadow-xl font-black text-[10px] uppercase flex items-center space-x-2"><Camera size={14} /> <span>FOTO ÇƏK</span></button>
                          <button type="button" onClick={stopCamera} className="bg-white/20 backdrop-blur-md text-white p-3 rounded-xl"><X size={14} /></button>
                       </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4" onClick={startCamera}>
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center space-y-3 animate-pulse">
                          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">YÜKLƏNİR...</p>
                        </div>
                      ) : newProduct.imageUrl ? (
                        <img 
                          src={newProduct.imageUrl} 
                          className="max-w-full max-h-full object-contain" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-stone-200 flex flex-col items-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><p class="text-[9px] font-black uppercase mt-2 opacity-50">Şəkil tapılmadı</p></div>';
                          }}
                        />
                      ) : (
                        <div className="text-center text-stone-200"><Camera size={48} strokeWidth={1} className="mx-auto mb-2 opacity-20" /><p className="text-[9px] font-black uppercase tracking-widest text-stone-300">Kameranı Aç</p></div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                   <button type="button" onClick={startCamera} className="flex-1 bg-stone-900 text-white py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center space-x-2"><Camera size={14} /> <span>KAMERA</span></button>
                   <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 bg-white text-stone-600 py-3.5 rounded-xl font-black text-[9px] uppercase tracking-widest border border-stone-100 flex items-center justify-center space-x-2"><Upload size={14} /> <span>YÜKLƏ</span></button>
                </div>
                <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, false)} accept="image/*" className="hidden" />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="lg:col-span-7 space-y-4">
                {/* TƏKRAR KOD XƏTASI (SATIŞDA OLAN) */}
                {duplicateInSales && (
                  <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-5 space-y-4 animate-in fade-in zoom-in-95">
                     <div className="flex items-start space-x-4">
                        <div className="bg-red-500 text-white p-2 rounded-xl"><AlertCircle size={20}/></div>
                        <div>
                           <h4 className="font-black text-red-600 text-sm uppercase tracking-tighter">BU KOD ARTIQ SATILIB!</h4>
                           <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">Bu kod tarixçədə başqa bir satışa məxsusdur.</p>
                        </div>
                     </div>
                     <div className="flex items-center space-x-4 bg-white/50 p-3 rounded-2xl border border-red-50">
                        <div className="w-16 h-16 bg-white rounded-xl border border-red-100 flex items-center justify-center overflow-hidden">
                           {duplicateInSales.imageUrl ? (
                             <img 
                               src={duplicateInSales.imageUrl} 
                               className="w-full h-full object-cover" 
                               onError={(e) => {
                                 (e.target as HTMLImageElement).style.display = 'none';
                                 (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-red-100"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                               }}
                             />
                           ) : (
                             <ImageIcon className="text-red-100"/>
                           )}
                        </div>
                        <div className="flex-1">
                           <p className="text-[10px] font-black text-stone-900 uppercase">{duplicateInSales.productName}</p>
                           <div className="flex flex-wrap gap-2 mt-1">
                              <span className="flex items-center text-[8px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded uppercase"><User size={8} className="mr-1"/> {duplicateInSales.customerName}</span>
                              <span className="flex items-center text-[8px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded uppercase"><Calendar size={8} className="mr-1"/> {new Date(duplicateInSales.date).toLocaleDateString()}</span>
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* TƏKRAR KOD XƏTASI (STOKDA OLAN) */}
                {duplicateInStock && (
                  <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-5 space-y-4 animate-in fade-in zoom-in-95">
                     <div className="flex items-start space-x-4">
                        <div className="bg-amber-500 text-white p-2 rounded-xl"><AlertCircle size={20}/></div>
                        <div>
                           <h4 className="font-black text-amber-600 text-sm uppercase tracking-tighter">BU KOD STOKDA VAR!</h4>
                           <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-1">Eyni kodu təkrar istifadə etmək mümkün deyil.</p>
                        </div>
                     </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1"><label className="text-[9px] font-black text-stone-400 uppercase ml-2">Məhsul Kodu</label><input type="text" required value={newProduct.code} onChange={(e) => setNewProduct({...newProduct, code: e.target.value})} className={`w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 font-bold text-base text-stone-800 focus:border-amber-400 outline-none ${(duplicateInStock || duplicateInSales) ? 'border-red-300 bg-red-50' : ''}`} placeholder="YZ-101" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-stone-400 uppercase ml-2">Məhsul Adı</label><input type="text" required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 font-bold text-base text-stone-800 focus:border-amber-400 outline-none" placeholder="Üzük" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-stone-400 uppercase ml-2">Kateqoriya</label><select value={newProduct.type} onChange={(e) => {
                    const newType = e.target.value;
                    const newPrefix = getPrefix(newType);
                    setNewProduct({...newProduct, type: newType, code: getNextCode(newPrefix)});
                  }} className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 font-bold text-base text-stone-800 outline-none cursor-pointer">{(settings.productGroups || []).map(g => <option key={g.name} value={g.name}>{g.name}</option>)}</select></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-stone-400 uppercase ml-2">Tədarükçü</label><select value={newProduct.supplier} onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 font-bold text-base text-stone-800 outline-none cursor-pointer">{settings.suppliers.map(s => <option key={s}>{s}</option>)}</select></div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[9px] font-black text-stone-400 uppercase ml-2">Əyar</label>
                    <div className="flex gap-2">
                       {settings.carats.map(c => (
                          <button key={c} type="button" onClick={() => setNewProduct({...newProduct, carat: c})} className={`flex-1 py-3 rounded-xl font-black text-[11px] border transition-all ${ newProduct.carat === c ? 'bg-amber-500 border-amber-500 text-stone-950 shadow-md' : 'bg-stone-50 border-stone-100 text-stone-400'}`}>{c}</button>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[9px] font-black text-amber-600 uppercase ml-2">Çəki (gr)</label><div className="relative"><Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" /><input type="number" step="0.001" required value={newProduct.weight} onChange={(e) => setNewProduct({...newProduct, weight: e.target.value})} className="w-full bg-stone-900 border-none rounded-2xl py-4 pl-12 pr-4 font-black text-2xl text-white outline-none" placeholder="0.00" /></div></div>
                  <div className="space-y-1"><label className="text-[9px] font-black text-amber-600 uppercase ml-2">Daş</label><div className="relative"><Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" /><input type="text" value={newProduct.brilliant} onChange={(e) => setNewProduct({...newProduct, brilliant: e.target.value})} className="w-full bg-stone-900 border-none rounded-2xl py-4 pl-12 pr-4 font-black text-lg text-white outline-none" placeholder="ct VS" /></div></div>
                </div>

                <div className="space-y-1 bg-amber-50/50 p-3 rounded-2xl border border-amber-100">
                  <label className="text-[9px] font-black text-amber-500 uppercase text-center block tracking-[0.2em] mb-1">QİYMƏT</label>
                  <div className="flex items-center justify-center space-x-2"><input type="number" required value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full max-w-[200px] bg-white border-2 border-amber-200 rounded-xl py-2 px-4 font-black text-2xl text-amber-900 outline-none text-center shadow-sm" /><span className="text-lg font-black text-amber-300">₼</span></div>
                </div>

                <div className="flex items-center space-x-2 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                  <input 
                    type="checkbox" 
                    id="allowPartialSale" 
                    checked={newProduct.allowPartialSale} 
                    onChange={(e) => setNewProduct({...newProduct, allowPartialSale: e.target.checked})} 
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                  <label htmlFor="allowPartialSale" className="text-[10px] font-black text-stone-600 uppercase cursor-pointer select-none">Hissəli satışa icazə ver</label>
                </div>

                <div className="flex items-center space-x-2 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                  <input 
                    type="checkbox" 
                    id="autoPrint" 
                    checked={autoPrint} 
                    onChange={(e) => setAutoPrint(e.target.checked)} 
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                  <label htmlFor="autoPrint" className="text-[10px] font-black text-stone-600 uppercase cursor-pointer select-none">Avtomatik Etiket Çapı</label>
                </div>

                <div className="flex space-x-4 pt-1">
                   <button type="button" onClick={() => { setIsAddingNew(false); resetForm(); }} className="flex-1 py-4 rounded-xl font-black text-stone-400 uppercase text-[10px] border border-stone-200 hover:bg-stone-50 transition-all tracking-widest">İMTİNA</button>
                   <button 
                    type="button"
                    onClick={() => {
                      // We need to construct a temporary product object to print
                      const tempProduct: Product = {
                        id: 'temp',
                        code: newProduct.code,
                        name: newProduct.name,
                        carat: newProduct.carat,
                        type: newProduct.type,
                        supplier: newProduct.supplier,
                        brilliant: newProduct.brilliant || undefined,
                        weight: newProduct.weight === '' ? 0 : Number(newProduct.weight),
                        price: newProduct.price === '' ? 0 : Number(newProduct.price),
                        imageUrl: newProduct.imageUrl,
                        supplierPrice: 0,
                        stockCount: 1,
                        purchaseDate: newProduct.purchaseDate,
                        logs: []
                      };
                      setLastAddedProduct(tempProduct);
                      setTimeout(() => {
                        window.print();
                        setTimeout(() => setLastAddedProduct(null), 10000);
                      }, 1000);
                    }}
                    className="flex-1 py-4 rounded-xl font-black text-amber-600 uppercase text-[10px] border border-amber-200 hover:bg-amber-50 transition-all tracking-widest flex items-center justify-center"
                   >
                     <Tag className="mr-2 w-4 h-4" /> ÇAP ET
                   </button>
                   <button 
                    form="ultraCompactForm" 
                    type="submit" 
                    disabled={!!duplicateInStock || !!duplicateInSales}
                    className={`flex-[2] py-4 rounded-xl font-black uppercase text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center border-b-4 tracking-widest ${ (duplicateInStock || duplicateInSales) ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed' : 'bg-amber-500 text-stone-950 border-amber-700 hover:bg-amber-400'}`}
                   >
                     <Save className="mr-2 w-4 h-4" /> YADDA SAXLA
                   </button>
                </div>
              </div>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500">
      
      {/* ÇAP KONTEYNERİ (80MM Receipt Design) - PORTAL */}
      {viewMode === 'printList' && createPortal(
        <div id="receipt-print" className="bg-white text-black">
            <header className="text-center mb-6">
                <h1 className="brand-font text-3xl font-black mb-1">{settings.shopName || 'NEKO GOLD'}</h1>
                <h2 className="text-sm font-bold tracking-widest mb-4">STOKDA OLAN MALLAR</h2>
                <div className="text-left text-xs border-b border-black pb-1 mb-4">
                    <span>TARİX: {new Date().toLocaleDateString('az-AZ')} {printCategory !== 'all' ? `| KAT: ${printCategory}` : ''} {printSupplier !== 'all' ? `| TƏD: ${printSupplier}` : ''}</span>
                </div>
            </header>

            <section className="mb-4">
                <table className="receipt-table">
                    <thead>
                        <tr>
                            <th style={{ width: '15%' }}>KOD</th>
                            <th style={{ width: '30%' }}>MƏHSUL ADI</th>
                            <th style={{ width: '8%' }}>ƏYAR</th>
                            <th style={{ width: '15%' }}>ÇƏKİ</th>
                            <th style={{ width: '10%' }}>SAY</th>
                            <th style={{ width: '10%' }}>BR</th>
                            <th style={{ width: '12%' }}>V</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stockPrintList.map((item, idx) => (
                            <tr key={idx}>
                                <td>{item.code}</td>
                                <td style={{ textAlign: 'left', fontWeight: 'bold' }}>{item.name}</td>
                                <td>{item.carat}</td>
                                <td style={{ fontWeight: 'bold' }}>{item.weight}g</td>
                                <td style={{ fontWeight: 'bold' }}>{item.stockCount}</td>
                                <td>{item.brilliant || ''}</td>
                                <td>
                                    <div style={{ width: '15px', height: '15px', border: '1px solid #ccc', margin: 'auto' }}></div>
                                </td>
                            </tr>
                        ))}
                        {stockPrintList.length < 3 && Array.from({ length: 3 - stockPrintList.length }).map((_, i) => (
                          <tr key={`empty-${i}`} style={{ height: '25px' }}>
                            <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                          </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="mb-8">
                <div className="flex justify-between items-center text-xs border-b border-black pb-2">
                    <div className="flex flex-col">
                        <span className="uppercase text-[9px]">CƏMİ SAY:</span>
                        <span className="text-sm font-bold">{stockPrintList.reduce((acc, i) => acc + (Number(i.stockCount) || 0), 0)} ədəd</span>
                    </div>
                    <div className="flex flex-row items-end gap-2">
                        <span className="uppercase text-[9px]">CƏMİ ÇƏKİ:</span>
                        <span className="text-sm font-bold">{stockPrintList.reduce((acc, i) => acc + (Number(i.weight) || 0), 0).toFixed(2)} gr</span>
                    </div>
                </div>
            </section>

            <footer className="mt-12 flex justify-between px-2 text-[10px] font-bold uppercase">
                <div className="flex flex-col items-center">
                    <div className="w-24 border-b border-black mb-1"></div>
                    <span>HAZIRLAYAN</span>
                </div>
                <div className="flex flex-col items-center">
                    <div className="w-24 border-b border-black mb-1"></div>
                    <span>TƏSDİQLƏYƏN</span>
                </div>
            </footer>
        </div>,
        document.body
      )}

      {/* ÜST TABLAR (NO-PRINT) */}
      <div className="flex justify-center no-print overflow-x-auto scrollbar-hide py-2">
        <div className="bg-white p-1.5 md:p-2 rounded-[1.5rem] md:rounded-[2rem] shadow-xl border border-stone-200 flex space-x-1 md:space-x-2 min-w-max mx-auto">
          <button 
            onClick={() => setViewMode('folders')}
            className={`px-4 md:px-10 py-2.5 md:py-4 rounded-[1rem] md:rounded-[1.5rem] font-black text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center space-x-2 md:space-x-3 ${viewMode === 'folders' ? 'bg-stone-900 text-amber-500 shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            <Box size={18} />
            <span>STOK</span>
          </button>
          <button 
            onClick={() => setViewMode('returns')}
            className={`px-4 md:px-10 py-2.5 md:py-4 rounded-[1rem] md:rounded-[1.5rem] font-black text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center space-x-2 md:space-x-3 ${viewMode === 'returns' ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            <RotateCcw size={18} />
            <span>VAZVİRAT</span>
          </button>
          <button 
            onClick={() => setViewMode('printList')}
            className={`px-4 md:px-10 py-2.5 md:py-4 rounded-[1rem] md:rounded-[1.5rem] font-black text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center space-x-2 md:space-x-3 ${viewMode === 'printList' ? 'bg-stone-900 text-amber-500 shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            <Printer size={18} />
            <span>ÇAP</span>
          </button>
          <button 
            onClick={() => setViewMode('mobile')}
            className={`px-4 md:px-10 py-2.5 md:py-4 rounded-[1rem] md:rounded-[1.5rem] font-black text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center space-x-2 md:space-x-3 ${viewMode === 'mobile' ? 'bg-stone-900 text-amber-500 shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            <Camera size={18} />
            <span>TELEFON</span>
          </button>
        </div>
      </div>

      {viewMode === 'folders' ? (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <div className="flex items-center space-x-2 text-sm">
              <button onClick={() => {setActiveFolder(null); setSearchTerm(''); setShowArchived(false);}} className={`font-black uppercase tracking-tighter ${!activeFolder ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'}`}>Stok</button>
              {activeFolder && <><span className="text-stone-300">/</span><span className="text-stone-800 font-black uppercase tracking-tighter">{activeFolder}</span></>}
            </div>
            <div className="flex items-center space-x-3">
              {activeFolder && (
                <div className="bg-white p-1 rounded-xl border border-stone-200 flex">
                  <button 
                    onClick={() => setShowArchived(false)}
                    className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${!showArchived ? 'bg-stone-900 text-amber-500 shadow-md' : 'text-stone-400 hover:bg-stone-50'}`}
                  >
                    Əsas
                  </button>
                  <button 
                    onClick={() => setShowArchived(true)}
                    className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${showArchived ? 'bg-stone-900 text-amber-500 shadow-md' : 'text-stone-400 hover:bg-stone-50'}`}
                  >
                    Arxiv
                  </button>
                </div>
              )}
              <button onClick={() => { setDuplicateInStock(null); setDuplicateInSales(null); setIsAddingNew(true); }} className="w-full sm:w-auto bg-stone-900 text-amber-500 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all flex items-center justify-center shadow-xl"><Plus className="w-5 h-5 mr-2" /> Yeni Məhsul</button>
            </div>
          </div>

          <div className="relative group no-print">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5 group-focus-within:text-amber-500 transition-colors" />
            <input type="text" placeholder="Kod və ya çəki ilə axtarış..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border-2 border-stone-100 rounded-2xl md:rounded-[2.5rem] py-5 md:py-6 pl-16 pr-6 focus:ring-8 focus:ring-amber-50 outline-none shadow-xl text-sm font-bold" />
          </div>

          {!activeFolder && !searchTerm ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 no-print">
              {(settings.productGroups || []).map((group) => {
                const groupProducts = activeProducts.filter(p => p.type === group.name);
                const activeCount = groupProducts.filter(p => !p.isArchived).length;
                const archivedCount = groupProducts.filter(p => p.isArchived).length;
                return (
                  <button key={group.name} onClick={() => setActiveFolder(group.name)} className="bg-white p-6 rounded-[2.5rem] border border-stone-200 shadow-sm hover:shadow-2xl hover:border-amber-300 transition-all flex flex-col items-center group relative overflow-hidden">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-stone-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 group-hover:bg-amber-50 transition-all"><Folder className="w-8 h-8 md:w-10 md:h-10" /></div>
                    <h4 className="font-black text-stone-800 text-xs md:text-sm uppercase tracking-tighter">{group.name}</h4>
                    <div className="flex flex-col items-center mt-1">
                      <p className={`text-[10px] font-bold ${activeCount > 0 ? 'text-amber-600' : 'text-stone-300'}`}>{activeCount} Aktiv</p>
                      {archivedCount > 0 && <p className="text-[9px] font-bold text-stone-400">{archivedCount} Arxiv</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 no-print">
              {activeFolder && (
                <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4">
                  {showArchived ? (
                    <>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-stone-900 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <Archive size={24} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">Arxiv İdarəetməsi</h3>
                          <p className="text-[10px] font-bold text-stone-400 uppercase mt-1">"{activeFolder}" kateqoriyasındakı arxivlər</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {selectedForRestore.length > 0 && (
                          <button 
                            onClick={handleRestoreFromArchive}
                            className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl flex items-center space-x-3 animate-in zoom-in"
                          >
                            <ArrowLeft size={20} />
                            <span>Seçilənləri Qaytar ({selectedForRestore.length})</span>
                          </button>
                        )}
                        <button 
                          onClick={() => setShowMoveToArchiveModal(true)}
                          className="px-8 py-4 bg-amber-500 text-stone-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl flex items-center space-x-3"
                        >
                          <ArrowDownToLine size={20} />
                          <span>Buraya Daşı</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                          <Printer size={24} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">Toplu Qiymət & Çap</h3>
                          <p className="text-[10px] font-bold text-stone-400 uppercase mt-1">Bütün "{activeFolder}" kateqoriyası üçün</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-1 max-w-3xl items-end space-x-3">
                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-black text-stone-400 uppercase ml-2">Ümumi (1qr)</label>
                          <div className="relative">
                            <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <input 
                              type="number" 
                              placeholder="₼" 
                              value={bulkPricePerGram}
                              onChange={(e) => setBulkPricePerGram(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-3 pl-10 pr-4 font-black text-sm outline-none focus:border-amber-400 transition-all"
                            />
                          </div>
                        </div>

                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-black text-stone-400 uppercase ml-2">750 Əyar (1qr)</label>
                          <div className="relative">
                            <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <input 
                              type="number" 
                              placeholder="₼" 
                              value={bulkPricePerGram750}
                              onChange={(e) => setBulkPricePerGram750(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-3 pl-10 pr-4 font-black text-sm outline-none focus:border-amber-400 transition-all"
                            />
                          </div>
                        </div>

                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-black text-stone-400 uppercase ml-2">Brilliant</label>
                          <div className="relative">
                            <Gem className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <input 
                              type="number" 
                              placeholder="₼" 
                              value={bulkBrilliantPrice}
                              onChange={(e) => setBulkBrilliantPrice(e.target.value === '' ? '' : Number(e.target.value))}
                              className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-3 pl-10 pr-4 font-black text-sm outline-none focus:border-amber-400 transition-all"
                            />
                          </div>
                        </div>

                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-black text-stone-400 uppercase ml-2">Əyar</label>
                          <select 
                            value={bulkKaratFilter}
                            onChange={(e) => setBulkKaratFilter(e.target.value)}
                            className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-3 px-4 font-black text-sm outline-none focus:border-amber-400 transition-all cursor-pointer"
                          >
                            <option value="all">Hamısı</option>
                            {settings.carats.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <button 
                          onClick={handleBulkPrint}
                          disabled={!bulkPricePerGram}
                          className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center space-x-2 h-[48px] ${bulkPricePerGram ? 'bg-stone-900 text-amber-500 hover:bg-black' : 'bg-stone-100 text-stone-300 cursor-not-allowed'}`}
                        >
                          <Zap size={16} />
                          <span>Toplu Çap Et</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
                {/* DESKTOP TABLE VIEW */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-100">
                        {showArchived && (
                          <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                              checked={filteredProducts.length > 0 && selectedForRestore.length === filteredProducts.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedForRestore(filteredProducts.map(p => p.id));
                                } else {
                                  setSelectedForRestore([]);
                                }
                              }}
                            />
                          </th>
                        )}
                      <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Şəkil</th>
                      <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Kod</th>
                      <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Məhsul Adı</th>
                      <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Çəki</th>
                      <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Əyar</th>
                      <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Qiymət</th>
                      <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Çap</th>
                      <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Əməliyyat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} onClick={() => openDetailModal(p)} className="hover:bg-amber-50/20 transition-all group cursor-pointer">
                          {showArchived && (
                            <td className="px-8 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                                checked={selectedForRestore.includes(p.id)}
                                onChange={() => {
                                  setSelectedForRestore(prev => 
                                    prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                                  );
                                }}
                              />
                            </td>
                          )}
                          <td className="px-8 py-5">
                            <div 
                              onClick={(e) => { e.stopPropagation(); if (p.imageUrl) openGallery(e, filteredProducts.indexOf(p)); }}
                              className={`w-14 h-14 rounded-xl overflow-hidden border-2 border-stone-100 shadow-sm bg-stone-50 flex items-center justify-center relative group/img ${p.imageUrl ? 'cursor-zoom-in hover:border-amber-400 transition-all' : ''}`}
                            >
                              {p.imageUrl ? (
                                <>
                                  <img 
                                    src={p.imageUrl} 
                                    referrerPolicy="no-referrer" 
                                    loading="lazy"
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-stone-200"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-amber-500/0 group-hover/img:bg-amber-500/20 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all">
                                    <Maximize2 size={16} className="text-amber-600" />
                                  </div>
                                </>
                              ) : isBackgroundLoading ? (
                                <div className="flex flex-col items-center justify-center">
                                  <div className="w-4 h-4 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                                  <span className="text-[6px] font-black text-amber-600 mt-1 uppercase">Yüklənir</span>
                                </div>
                              ) : (
                                <div className="text-stone-200"><ImageIcon size={24} /></div>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5 font-black text-stone-500 text-xs uppercase tracking-widest">{p.code}</td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <p className="font-black text-stone-800 text-sm uppercase leading-none">{p.name}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                {p.brilliant && <p className="text-[10px] text-amber-600 font-bold flex items-center"><Gem size={10} className="mr-1.5"/> {p.brilliant}</p>}
                                {p.allowPartialSale && (
                                  <div className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center">
                                    <Zap size={8} className="mr-1" /> HİSSƏLİ
                                  </div>
                                )}
                                {p.isReturned && (
                                  <div className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center">
                                    <AlertCircle size={8} className="mr-1" /> VAZVİRAT
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <div className="flex flex-col items-center">
                               <span className="font-black text-stone-900 text-sm">{p.weight} gr</span>
                               {p.allowPartialSale && (Number(p.soldWeight) || 0) > 0 && (
                                 <div className="flex flex-col items-center mt-1">
                                   <span className="text-[8px] font-bold text-amber-600 uppercase">Bu məhsuldan {p.soldWeight} gr hissəli satılıb</span>
                                   <span className="text-[8px] font-bold text-stone-400 uppercase">Qalan: {(Number(p.weight) - (Number(p.soldWeight) || 0)).toFixed(2)} gr</span>
                                 </div>
                               )}
                            </div>
                          </td>
                          <td className="px-8 py-5 font-black text-stone-900 text-sm text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-amber-600">{p.carat}</span>
                              {p.brilliant && <span className="text-[9px] text-stone-400 font-bold uppercase mt-0.5">{p.brilliant}</span>}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-stone-900 font-black text-right text-xl tracking-tighter">{(Number(p.price) || 0).toLocaleString()} ₼</td>
                          <td className="px-8 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => {
                                setLastAddedProduct(p);
                                setTimeout(() => {
                                  window.print();
                                  setTimeout(() => setLastAddedProduct(null), 10000);
                                }, 500);
                              }}
                              className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm mx-auto"
                              title="Etiket Çap Et"
                            >
                              <Printer size={16} />
                            </button>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {p.allowPartialSale && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedProductForLog(p); setShowPartialLogModal(true); }} 
                                  className="p-4 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-2xl transition-all shadow-sm"
                                  title="Satış Logları"
                                >
                                  <History size={20} />
                                </button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); openDetailModal(p); }} className="p-4 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-2xl transition-all shadow-sm"><Edit2 size={20} /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id); }} className="p-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl transition-all shadow-sm"><Trash2 size={20} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && <tr><td colSpan={showArchived ? 8 : 7} className="px-10 py-20 text-center"><p className="text-stone-300 font-black uppercase text-xs tracking-widest">Məlumat tapılmadı</p></td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARD VIEW */}
                <div className="md:hidden divide-y divide-stone-100">
                  {filteredProducts.map((p) => (
                    <div key={p.id} onClick={() => openDetailModal(p)} className="p-4 flex items-center space-x-4 active:bg-stone-50 transition-colors">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-stone-100 flex-shrink-0 bg-stone-50 flex items-center justify-center">
                        {p.imageUrl ? (
                          <img 
                            src={p.imageUrl} 
                            referrerPolicy="no-referrer" 
                            loading="lazy"
                            className="w-full h-full object-cover" 
                          />
                        ) : isBackgroundLoading ? (
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-5 h-5 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                            <span className="text-[8px] font-black text-amber-600 mt-1 uppercase">Yüklənir</span>
                          </div>
                        ) : (
                          <ImageIcon size={24} className="text-stone-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-black text-stone-900 text-sm truncate uppercase leading-tight">{p.name}</p>
                          <p className="font-black text-amber-600 text-sm ml-2 whitespace-nowrap">{(Number(p.price) || 0).toLocaleString()} ₼</p>
                        </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{p.code}</span>
                            <span className="text-[10px] font-bold text-stone-300">•</span>
                            <span className="text-[10px] font-black text-stone-600 uppercase">
                              {p.allowPartialSale && (Number(p.soldWeight) || 0) > 0 
                                ? `${(Number(p.weight) - (Number(p.soldWeight) || 0)).toFixed(2)} / ${p.weight} gr`
                                : `${p.weight} gr`
                              }
                            </span>
                            <span className="text-[10px] font-bold text-stone-300">•</span>
                            <span className="text-[10px] font-black text-amber-500 uppercase">{p.carat}</span>
                            {p.allowPartialSale && (
                              <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">HİSSƏLİ</span>
                            )}
                            {p.isReturned && (
                              <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">VAZVİRAT</span>
                            )}
                          </div>
                      </div>
                      <ChevronRight size={16} className="text-stone-300 flex-shrink-0" />
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="p-10 text-center">
                      <p className="text-stone-300 font-black uppercase text-xs tracking-widest">Məlumat tapılmadı</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : viewMode === 'returns' ? (
        <div className="flex-1 bg-white rounded-3xl md:rounded-[3rem] p-4 md:p-8 shadow-xl border border-stone-100 flex flex-col animate-in slide-in-from-bottom-12 duration-500">
          <div className="flex items-center justify-between mb-6 md:mb-10 pb-4 md:pb-6 border-b border-stone-100">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="p-3 md:p-4 bg-red-50 rounded-xl md:rounded-2xl text-red-500">
                <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="text-base md:text-xl font-black text-stone-900 uppercase leading-none">Vazvirat Məhsullar</h3>
                <p className="text-[9px] md:text-[10px] text-stone-400 font-bold uppercase tracking-widest">Geri qaytarılmış məhsulların siyahısı</p>
              </div>
            </div>
            <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Cəmi: {products.filter(p => p.isReturned).length}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 md:space-y-4 scrollbar-hide">
            {/* DESKTOP VIEW */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Şəkil</th>
                    <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Kod</th>
                    <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Məhsul</th>
                    <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Çəki</th>
                    <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Qiymət</th>
                    <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {products.filter(p => p.isReturned).map((p) => (
                    <tr key={p.id} className="hover:bg-red-50/20 transition-all group">
                      <td className="px-8 py-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-stone-100 shadow-sm bg-stone-50 flex items-center justify-center">
                          {p.imageUrl ? <img src={p.imageUrl} referrerPolicy="no-referrer" loading="lazy" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-stone-200" />}
                        </div>
                      </td>
                      <td className="px-8 py-4 font-black text-stone-500 text-xs uppercase tracking-widest">{p.code}</td>
                      <td className="px-8 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-black text-stone-800 text-sm uppercase leading-none">{p.name}</p>
                            {(Number(p.stockCount) || 0) === 0 ? (
                              <span className="bg-red-100 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border border-red-200">VAZVİRAT</span>
                            ) : (
                              <span className="bg-amber-100 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border border-amber-200">GERİ QAYTARILMA</span>
                            )}
                          </div>
                          <p className="text-[9px] font-bold text-red-400 uppercase mt-1 italic">Səbəb: {p.returnReason || 'Qeyd olunmayıb'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-4 font-black text-stone-900 text-sm text-center">{p.weight} gr</td>
                      <td className="px-8 py-4 text-stone-900 font-black text-right text-xl tracking-tighter">{(Number(p.price) || 0).toLocaleString()} ₼</td>
                      <td className="px-8 py-4 text-center">
                        <button 
                          onClick={() => {
                            const updatedProduct = { ...p, isReturned: false, stockCount: 1, returnReason: undefined };
                            const updatedProducts = products.map(prod => prod.id === p.id ? updatedProduct : prod);
                            setProducts(updatedProducts);
                            
                            // Sync to server
                            fetch(`/api/products/${p.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ product: updatedProduct })
                            }).catch(err => console.error('Failed to return product to stock:', err));
                            
                            addLog(`${p.code} kodlu məhsul vazviratdan stoka qaytarıldı`, 'PRODUCT');
                          }}
                          className="px-4 py-2 bg-amber-500 text-stone-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-md"
                        >
                          QAYTAR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE VIEW */}
            <div className="md:hidden divide-y divide-stone-100">
              {products.filter(p => p.isReturned).map((p) => (
                <div key={p.id} className="py-4 flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-stone-100 flex-shrink-0 bg-stone-50 flex items-center justify-center">
                    {p.imageUrl ? <img src={p.imageUrl} referrerPolicy="no-referrer" loading="lazy" className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-stone-200" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <p className="font-black text-stone-900 text-sm truncate uppercase leading-tight">{p.name}</p>
                        <div className="mt-1">
                          {(Number(p.stockCount) || 0) === 0 ? (
                            <span className="bg-red-100 text-red-600 text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-widest border border-red-200">VAZVİRAT</span>
                          ) : (
                            <span className="bg-amber-100 text-amber-600 text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-widest border border-amber-200">GERİ QAYTARILMA</span>
                          )}
                        </div>
                      </div>
                      <p className="font-black text-red-600 text-sm ml-2 whitespace-nowrap">{(Number(p.price) || 0).toLocaleString()} ₼</p>
                    </div>
                    <p className="text-[9px] font-bold text-red-400 uppercase mt-1 italic truncate">Səbəb: {p.returnReason || 'Qeyd olunmayıb'}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{p.code}</span>
                      <span className="text-[10px] font-bold text-stone-300">•</span>
                      <span className="text-[10px] font-black text-stone-600 uppercase">{p.weight} gr</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const updatedProduct = { ...p, isReturned: false, stockCount: 1, returnReason: undefined };
                      const updatedProducts = products.map(prod => prod.id === p.id ? updatedProduct : prod);
                      setProducts(updatedProducts);
                      
                      // Sync to server
                      fetch(`/api/products/${p.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ product: updatedProduct })
                      }).catch(err => console.error('Failed to return product to stock:', err));
                      
                      addLog(`${p.code} kodlu məhsul vazviratdan stoka qaytarıldı`, 'PRODUCT');
                    }}
                    className="p-3 bg-amber-500 text-stone-950 rounded-xl shadow-md active:scale-95 transition-all"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              ))}
            </div>

            {products.filter(p => p.isReturned).length === 0 && (
              <div className="py-20 text-center">
                <p className="text-stone-300 font-black uppercase text-xs tracking-widest">Vazvirat məhsul yoxdur</p>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'mobile' ? (
        /* MOBİL REJİM / TELEFON BÖLMƏSİ (Şəkil çək və Çap et) */
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 no-print">
           <div className="bg-stone-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-stone-800 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
               <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-2">
                     <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">MOBİL <span className="text-amber-500">ÇAP STANSİYASI</span></h2>
                     <p className="text-stone-400 font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs">Sürətli məhsul əlavə et və etiket çap et</p>
                  </div>
                  <button 
                    onClick={() => { setDuplicateInStock(null); setDuplicateInSales(null); setIsAddingNew(true); }}
                    className="bg-amber-500 text-stone-950 px-10 py-6 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center space-x-4"
                  >
                    <div className="bg-stone-950/10 p-2 rounded-xl"><Plus size={24} /></div>
                    <span>YENİ MƏHSUL ƏLAVƏ ET</span>
                  </button>
               </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SON ƏLAVƏ EDİLƏNLƏR */}
              <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl p-6 md:p-10 space-y-6 flex flex-col h-full">
                 <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest flex items-center">
                       <Clock size={18} className="mr-2 text-amber-500" /> SON ƏLAVƏLƏR
                    </h3>
                    <span className="bg-stone-100 text-stone-400 text-[8px] px-2 py-1 rounded-full font-black uppercase tracking-widest">REAL-TIME</span>
                 </div>
                 
                 <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-2 scrollbar-hide">
                    {[...products].sort((a, b) => new Date(b.purchaseDate || 0).getTime() - new Date(a.purchaseDate || 0).getTime()).slice(0, 15).map(p => (
                       <div key={p.id} className="bg-stone-50 p-4 rounded-2xl flex items-center justify-between border border-stone-100 group hover:border-amber-300 transition-all">
                          <div className="flex items-center space-x-4 min-w-0 flex-1">
                             <div className="w-16 h-16 rounded-xl bg-white border border-stone-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {p.imageUrl ? (
                                   <img src={p.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                                ) : (
                                   <ImageIcon size={20} className="text-stone-200" />
                                )}
                             </div>
                             <div className="min-w-0">
                                <p className="font-black text-stone-900 text-sm uppercase leading-none truncate">{p.name}</p>
                                <p className="text-[10px] font-black text-amber-600 uppercase mt-1.5 tracking-widest">{p.code}</p>
                                <p className="text-[9px] font-bold text-stone-400 uppercase mt-1 truncate">{p.weight} gr • {p.carat} əyar</p>
                             </div>
                          </div>
                          <button 
                             onClick={() => {
                                setLastAddedProduct(p);
                                setTimeout(() => {
                                  window.print();
                                  setTimeout(() => setLastAddedProduct(null), 10000);
                                }, 500);
                             }}
                             className="w-12 h-12 bg-white text-stone-900 rounded-xl flex items-center justify-center shadow-md border border-stone-100 hover:bg-stone-900 hover:text-amber-500 active:scale-95 transition-all flex-shrink-0 ml-4"
                             title="Çap Et"
                          >
                             <Printer size={20} />
                          </button>
                       </div>
                    ))}
                 </div>
              </div>

              {/* SÜRƏTLİ AXTARIŞ VƏ ÇAP */}
              <div className="bg-amber-500 rounded-[2.5rem] shadow-2xl shadow-amber-200 p-6 md:p-10 space-y-6 flex flex-col h-full relative overflow-hidden group">
                 <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full -mb-24 -mr-24 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                 <h3 className="text-sm font-black text-stone-950 uppercase tracking-widest flex items-center">
                    <Search size={18} className="mr-2" /> SÜRƏTLİ ÇAP AXTARIŞI
                 </h3>
                 
                 <div className="relative group/input">
                    <Box size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within/input:text-stone-900 transition-colors" />
                    <input 
                       type="text" 
                       placeholder="Kod daxil edin..." 
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full bg-white border-none rounded-3xl py-6 pl-16 pr-6 font-black text-xl text-stone-900 shadow-xl focus:ring-8 focus:ring-amber-400 outline-none placeholder:text-stone-300"
                    />
                 </div>

                 <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-2 scrollbar-hide pt-2">
                    {searchTerm && products.filter(p => !p.isReturned && !p.isArchived && p.code.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                       <button 
                          key={p.id}
                          onClick={() => {
                             setLastAddedProduct(p);
                             setTimeout(() => {
                               window.print();
                               setTimeout(() => setLastAddedProduct(null), 10000);
                             }, 500);
                          }}
                          className="w-full bg-white/20 backdrop-blur-md p-5 rounded-3xl flex items-center justify-between border border-white/30 hover:bg-white/40 transition-all text-left group/item"
                       >
                          <div className="flex items-center space-x-4">
                             <div className="w-12 h-12 rounded-xl bg-white/50 backdrop-blur-md flex items-center justify-center font-black text-stone-950 text-xs">
                                {p.code.substring(0, 2)}
                             </div>
                             <div>
                                <p className="font-black text-stone-950 text-sm uppercase leading-none">{p.name}</p>
                                <p className="text-[10px] font-bold text-stone-800 uppercase mt-1">{p.code}</p>
                             </div>
                          </div>
                          <Printer size={24} className="text-stone-950 group-hover/item:scale-125 transition-transform" />
                       </button>
                    ))}
                    {!searchTerm && (
                       <div className="flex flex-col items-center justify-center h-full py-20 opacity-30 text-stone-950">
                          <Printer size={80} strokeWidth={1} />
                          <p className="font-black uppercase tracking-[0.2em] text-[10px] mt-6 bg-stone-950 text-white px-4 py-2 rounded-full">Birbaşa çap üçün kod axtarın</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      ) : (
        /* SİFARİŞ ÜÇÜN ÇAP BÖLMƏSİ (NO-PRINT) */
        <div className="max-w-6xl mx-auto w-full animate-in slide-in-from-bottom-8 duration-500 no-print space-y-8">
            <div className="bg-white rounded-[2.5rem] border-2 border-stone-200 shadow-2xl p-6 md:p-10 space-y-10">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-amber-500 text-stone-950 rounded-2xl flex items-center justify-center shadow-lg"><Printer size={28}/></div>
                      <div>
                        <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter">Stok Siyahısı Çapı</h3>
                        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">80mm qəbz formatında siyahı hazırlayın</p>
                      </div>
                   </div>
                   <button onClick={handlePrintStockList} className="bg-stone-900 text-amber-500 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl flex items-center justify-center border-b-4 border-stone-800">
                      <Printer size={20} className="mr-3"/> SİYAHINI ÇAP ET
                   </button>
                </header>

                {/* FİLTRLƏR */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-stone-50 p-6 rounded-[2rem] border-2 border-stone-100">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-600 uppercase ml-4">Kateqoriya</label>
                      <div className="relative group">
                        <Folder className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
                        <select value={printCategory} onChange={(e) => setPrintCategory(e.target.value)} className="w-full bg-white border-2 border-stone-200 rounded-2xl py-4 pl-14 pr-6 font-black text-stone-900 outline-none focus:border-amber-500 transition-all appearance-none">
                           <option value="all">Bütün Kateqoriyalar</option>
                           {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-600 uppercase ml-4">Tədarükçü (Topdançı)</label>
                      <div className="relative group">
                        <Truck className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-amber-600 transition-colors" />
                        <select value={printSupplier} onChange={(e) => setPrintSupplier(e.target.value)} className="w-full bg-white border-2 border-stone-200 rounded-2xl py-4 pl-14 pr-6 font-black text-stone-900 outline-none focus:border-amber-500 transition-all appearance-none">
                           <option value="all">Bütün Tədarükçülər</option>
                           {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                   </div>
                </div>

                {/* SİYAHI */}
                <div className="space-y-4">
                   <div className="flex justify-between items-center px-4">
                      <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Seçilmiş Mallar ({stockPrintList.length})</h4>
                      <p className="text-[10px] font-black text-amber-600 uppercase">Cəmi Çəki: {stockPrintList.reduce((a,i)=>a+(Number(i.weight)||0), 0).toFixed(2)} gr</p>
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                      {stockPrintList.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-white border-2 border-stone-100 rounded-[1.5rem] hover:border-amber-200 transition-all group shadow-sm">
                           <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-amber-500 font-black text-[10px] uppercase border border-stone-200">{item.code.slice(0,2)}</div>
                              <div>
                                 <p className="text-sm font-black text-stone-900 uppercase leading-none">{item.name}</p>
                                 <div className="flex items-center space-x-2 mt-1.5">
                                    <span className="text-[10px] font-black text-stone-500">{item.code}</span>
                                    <span className="w-1 h-1 bg-stone-200 rounded-full"></span>
                                    <span className="text-[10px] font-black text-amber-600">{item.weight} gr | {item.carat}</span>
                                    {item.brilliant && (
                                       <>
                                         <span className="w-1 h-1 bg-stone-200 rounded-full"></span>
                                         <span className="text-[9px] font-bold text-amber-500 uppercase">{item.brilliant}</span>
                                       </>
                                    )}
                                    {item.supplier && (
                                       <span className="text-[9px] font-bold bg-stone-100 text-stone-400 px-2 py-0.5 rounded uppercase tracking-tighter ml-2">{item.supplier}</span>
                                    )}
                                 </div>
                              </div>
                           </div>
                           <button onClick={() => removeFromPrintList(item.id)} className="p-3 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20}/></button>
                        </div>
                      ))}
                      {stockPrintList.length === 0 && (
                        <div className="p-20 text-center bg-stone-50 rounded-[2rem] border-4 border-dashed border-stone-100 opacity-40">
                           <Printer size={48} className="mx-auto text-stone-200 mb-4" />
                           <p className="text-sm font-black text-stone-400 uppercase tracking-widest">Bu kriteriyalara uyğun mal tapılmadı</p>
                        </div>
                      )}
                   </div>
                </div>
            </div>
        </div>
      )}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95">
            {isDetailLoading ? (
              <div className="flex flex-col items-center justify-center p-20">
                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                <p className="text-stone-500 font-black uppercase tracking-widest text-xs">Məlumatlar Yüklənir...</p>
              </div>
            ) : (
              <>
                <header className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                  <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter">Redaktə: {editForm.code || selectedProduct.code}</h3>
                  <button onClick={() => setShowDetailModal(false)} className="p-2 text-stone-300 hover:text-stone-900 transition-colors"><X size={24} /></button>
                </header>
            <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
               <form id="fullEditForm" onSubmit={handleUpdateProduct} className="space-y-8">
                  <div className="flex flex-col items-center space-y-4">
                    <div 
                      onClick={() => {
                        if ((editForm.imageUrl || selectedProduct.imageUrl) && !isCameraOpen) {
                          const index = filteredProducts.findIndex(p => p.id === selectedProduct.id);
                          if (index !== -1) {
                            setZoomedProductIndex(index);
                          } else {
                            setZoomedImage(editForm.imageUrl || selectedProduct.imageUrl || null);
                          }
                        }
                      }} 
                      className="relative w-48 h-48 border-4 border-dashed border-stone-100 rounded-[2rem] bg-stone-50 flex items-center justify-center overflow-hidden cursor-zoom-in group shadow-inner"
                    >
                      {isCameraOpen ? (
                        <div className="absolute inset-0 bg-black flex flex-col">
                           <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                           <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-3 px-4">
                              <button type="button" onClick={() => capturePhoto(true)} className="bg-amber-500 text-stone-950 px-4 py-2 rounded-xl shadow-xl font-black text-[9px] uppercase flex items-center space-x-2"><Camera size={12} /> <span>ÇƏK</span></button>
                              <button type="button" onClick={stopCamera} className="bg-white/20 backdrop-blur-md text-white p-2 rounded-xl"><X size={12} /></button>
                           </div>
                        </div>
                      ) : (
                        <div className="w-full h-full relative flex items-center justify-center">
                          {isUploading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-3">
                              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">YÜKLƏNİR...</p>
                            </div>
                          )}
                          {editForm.imageUrl || selectedProduct.imageUrl ? (
                            <img 
                              src={editForm.imageUrl || selectedProduct.imageUrl} 
                              referrerPolicy="no-referrer" 
                              className="w-full h-full object-contain p-4" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-stone-200 flex flex-col items-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><p class="text-[10px] font-black uppercase mt-2 opacity-50">Şəkil tapılmadı</p></div>';
                              }}
                            />
                          ) : (
                            <ImageIcon size={48} className="text-stone-200" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button type="button" onClick={startCamera} className="bg-stone-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black hover:bg-black transition-all uppercase flex items-center space-x-2"><Camera size={14} /> <span>KAMERA</span></button>
                      <button type="button" onClick={() => editFileInputRef.current?.click()} className="bg-stone-100 px-6 py-2.5 rounded-xl text-[10px] font-black text-stone-600 hover:bg-amber-100 transition-all uppercase flex items-center space-x-2"><Upload size={14} /> <span>YÜKLƏ</span></button>
                    </div>
                    <input type="file" ref={editFileInputRef} onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Kateqoriya (Qovluq)</label>
                         <select 
                           value={editForm.type || selectedProduct.type} 
                           onChange={(e) => {
                             const newType = e.target.value;
                             const oldType = editForm.type || selectedProduct.type;
                             const currentCode = editForm.code || selectedProduct.code;
                             
                             const oldPrefix = getPrefix(oldType);
                             const newPrefix = getPrefix(newType);
                             
                             let newCode = currentCode;
                             if (oldPrefix && currentCode.startsWith(oldPrefix)) {
                               newCode = newPrefix + currentCode.substring(oldPrefix.length);
                             } else if (newPrefix && !currentCode.startsWith(newPrefix)) {
                               newCode = newPrefix + currentCode;
                             }
                             
                             setEditForm({...editForm, type: newType, code: newCode});
                           }} 
                           className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-5 font-black text-stone-800 outline-none cursor-pointer"
                         >
                           {settings.productGroups.map(g => <option key={g.name} value={g.name}>{g.name}</option>)}
                         </select>
                       </div>
                       <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase ml-2">Məhsul Kodu</label><input type="text" value={editForm.code || ''} onChange={(e) => setEditForm({...editForm, code: e.target.value})} className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-5 font-black text-stone-800 outline-none" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase ml-2">Ad</label><input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-5 font-black text-stone-800 outline-none" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase ml-2">Çəki (gr)</label><input type="number" step="0.001" value={editForm.weight || ''} onChange={(e) => setEditForm({...editForm, weight: Number(e.target.value)})} className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-5 font-black text-stone-800 outline-none" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase ml-2">Daş (Brilliant)</label><input type="text" value={editForm.brilliant || ''} onChange={(e) => setEditForm({...editForm, brilliant: e.target.value})} className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-5 font-black text-stone-800 outline-none" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase ml-2">Tədarükçü</label><select value={editForm.supplier || ''} onChange={(e) => setEditForm({...editForm, supplier: e.target.value})} className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-5 font-black text-stone-800 outline-none cursor-pointer">{settings.suppliers.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                       <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-stone-400 uppercase ml-2">Əyar</label>
                         <div className="flex gap-2 h-[58px]">
                           {settings.carats.map(c => (
                             <button 
                               key={c} 
                               type="button" 
                               onClick={() => setEditForm({...editForm, carat: c})} 
                               className={`flex-1 rounded-xl font-black text-[11px] border transition-all ${editForm.carat === c ? 'bg-amber-500 border-amber-500 text-stone-950 shadow-md' : 'bg-stone-50 border-stone-100 text-stone-400'}`}
                             >
                               {c}
                             </button>
                           ))}
                         </div>
                       </div>
                       <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-amber-600 uppercase ml-2">Qiymət (₼)</label><input type="number" value={editForm.price || ''} onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})} className="w-full bg-amber-50 border-2 border-amber-200 rounded-xl py-6 px-6 font-black text-4xl text-amber-900 text-center outline-none" /></div>
                       <div className="md:col-span-2 flex items-center space-x-3 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                          <input 
                            type="checkbox" 
                            id="editAllowPartialSale" 
                            checked={!!editForm.allowPartialSale} 
                            onChange={(e) => setEditForm({...editForm, allowPartialSale: e.target.checked})} 
                            className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                          />
                          <label htmlFor="editAllowPartialSale" className="text-xs font-black text-stone-600 uppercase cursor-pointer select-none">Hissəli satışa icazə ver</label>
                        </div>
                        <div className="md:col-span-2 flex items-center space-x-3 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                          <input 
                            type="checkbox" 
                            id="isArchived" 
                            checked={!!editForm.isArchived} 
                            onChange={(e) => setEditForm({...editForm, isArchived: e.target.checked})} 
                            className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                          />
                          <label htmlFor="isArchived" className="text-xs font-black text-stone-600 uppercase cursor-pointer select-none">Bu məhsulu arxivə daşı (Toplu çapda görünməyəcək)</label>
                       </div>
                       <div className="md:col-span-2 flex flex-col space-y-3 bg-red-50 p-4 rounded-2xl border border-red-100">
                          <div className="flex items-center space-x-3">
                             <input 
                               type="checkbox" 
                               id="isReturned" 
                               checked={!!editForm.isReturned} 
                               onChange={(e) => setEditForm({...editForm, isReturned: e.target.checked})} 
                               className="w-5 h-5 accent-red-500 rounded cursor-pointer"
                             />
                             <label htmlFor="isReturned" className="text-xs font-black text-red-600 uppercase cursor-pointer select-none">Topdançıya Qaytar (Vazvrat)</label>
                          </div>
                          {editForm.isReturned && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-2">
                              <label className="text-[9px] font-black text-red-400 uppercase ml-2">Vazvrat Səbəbi</label>
                              <textarea 
                                value={editForm.returnReason || ''} 
                                onChange={(e) => setEditForm({...editForm, returnReason: e.target.value})} 
                                placeholder="Səbəbi bura yazın..."
                                className="w-full bg-white border-2 border-red-100 rounded-xl py-3 px-4 font-bold text-stone-800 outline-none focus:border-red-300 transition-all text-xs h-20 resize-none"
                              />
                            </div>
                          )}
                       </div>
                  </div>
               </form>
            </main>
            <footer className="px-8 py-6 border-t border-stone-100 bg-stone-50/50 flex space-x-4">
              <button 
                type="button" 
                onClick={() => {
                  setLastAddedProduct(selectedProduct);
                  setTimeout(() => {
                    window.print();
                    setTimeout(() => setLastAddedProduct(null), 10000);
                  }, 1000);
                }} 
                className="px-6 py-4 bg-white border border-stone-200 rounded-xl font-black text-stone-600 hover:bg-stone-50 transition-all uppercase text-[10px] flex items-center"
              >
                <Tag className="mr-2 w-4 h-4" /> ETİKET ÇAP ET
              </button>
              <button type="button" onClick={() => setShowDetailModal(false)} className="flex-1 px-8 py-4 rounded-xl font-black text-stone-400 uppercase tracking-widest text-[11px] border border-stone-200 hover:bg-white transition-all">Ləğv Et</button>
              <button form="fullEditForm" type="submit" className="flex-[2] px-8 py-4 bg-amber-500 text-stone-950 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl">Yadda Saxla</button>
            </footer>
              </>
            )}
          </div>
        </div>
      )}

      {showMoveToArchiveModal && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <header className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <div>
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter">Arxivə Daşı</h3>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">"{activeFolder}" kateqoriyasındakı aktiv məhsullar</p>
              </div>
              <button onClick={() => { setShowMoveToArchiveModal(false); setSelectedForArchive([]); }} className="p-2 text-stone-300 hover:text-stone-900 transition-colors"><X size={24} /></button>
            </header>
            
            <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProducts
                  .filter(p => p.type === activeFolder && !p.isArchived)
                  .map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => {
                        setSelectedForArchive(prev => 
                          prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                        );
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center space-x-4 ${selectedForArchive.includes(p.id) ? 'border-amber-500 bg-amber-50/50 shadow-md' : 'border-stone-100 bg-white hover:border-stone-200'}`}
                    >
                      <div className="w-12 h-12 rounded-xl border border-stone-100 overflow-hidden bg-stone-50 flex-shrink-0">
                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-3 text-stone-200" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-stone-900 uppercase truncate">{p.name}</p>
                        <p className="text-[10px] font-bold text-stone-400 uppercase">{p.code} | {p.weight} gr</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedForArchive.includes(p.id) ? 'bg-amber-500 border-amber-500' : 'border-stone-200'}`}>
                        {selectedForArchive.includes(p.id) && <Zap size={12} className="text-stone-950" />}
                      </div>
                    </div>
                  ))}
              </div>
              {activeProducts.filter(p => p.type === activeFolder && !p.isArchived).length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-stone-300 font-black uppercase text-xs tracking-widest">Aktiv məhsul tapılmadı</p>
                </div>
              )}
            </main>
            
            <footer className="px-8 py-6 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <p className="text-xs font-black text-stone-500 uppercase tracking-widest">Seçilib: <span className="text-amber-600">{selectedForArchive.length}</span> məhsul</p>
              <div className="flex space-x-4">
                <button onClick={() => { setShowMoveToArchiveModal(false); setSelectedForArchive([]); }} className="px-8 py-4 rounded-xl font-black text-stone-400 uppercase tracking-widest text-[11px] border border-stone-200 hover:bg-white transition-all">Ləğv Et</button>
                <button 
                  onClick={handleMoveToArchive}
                  disabled={selectedForArchive.length === 0}
                  className={`px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl transition-all ${selectedForArchive.length > 0 ? 'bg-stone-900 text-amber-500 hover:bg-black' : 'bg-stone-100 text-stone-300 cursor-not-allowed'}`}
                >
                  Arxivə Daşı
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top duration-300">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border ${notification.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-red-500 border-red-400 text-white'}`}>
            {notification.type === 'success' ? <Zap size={18} /> : <AlertCircle size={18} />}
            <span className="font-black uppercase tracking-widest text-[10px]">{notification.message}</span>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl border border-stone-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-50 rounded-2xl text-red-500 mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black text-stone-900 mb-2 uppercase tracking-tight">Məhsulu Sil?</h3>
              <p className="text-stone-500 font-medium mb-8">Bu məhsulu silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.</p>
              
              <div className="flex space-x-3 w-full">
                <button 
                  onClick={() => { setShowDeleteConfirm(false); setIdToDelete(null); }}
                  className="flex-1 py-4 bg-stone-100 text-stone-600 font-black rounded-2xl hover:bg-stone-200 transition-all uppercase tracking-widest text-xs"
                >
                  Ləğv et
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-200 uppercase tracking-widest text-xs"
                >
                  Bəli, Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPartialLogModal && selectedProductForLog && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <header className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-amber-500 text-amber-950 rounded-2xl flex items-center justify-center shadow-lg">
                  <History size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter">Hissəli Satış Tarixçəsi</h3>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{selectedProductForLog.name} ({selectedProductForLog.code})</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowPartialLogModal(false); setSelectedProductForLog(null); }}
                className="p-3 hover:bg-white rounded-2xl text-stone-400 hover:text-stone-900 transition-all shadow-sm border border-transparent hover:border-stone-100"
              >
                <X size={20} />
              </button>
            </header>
            
            <div className="p-6 border-b border-stone-100 bg-stone-50/30 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-amber-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Hissə adı və ya satıcı..." 
                  value={logSearchTerm}
                  onChange={(e) => setLogSearchTerm(e.target.value)}
                  className="w-full bg-white border-2 border-stone-100 rounded-2xl py-3 pl-12 pr-6 font-bold text-stone-800 outline-none focus:border-amber-400 transition-all text-sm"
                />
              </div>
              <div className="flex gap-4">
                <input 
                  type="date" 
                  value={logDateFilter}
                  onChange={(e) => setLogDateFilter(e.target.value)}
                  className="bg-white border-2 border-stone-100 rounded-2xl py-3 px-6 font-bold text-stone-800 outline-none focus:border-amber-400 transition-all cursor-pointer text-sm"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <div className="bg-stone-50 rounded-3xl border border-stone-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-100/50 border-b border-stone-100">
                      <th className="px-6 py-4 text-[9px] font-black text-stone-500 uppercase tracking-widest">Hissə Adı</th>
                      <th className="px-6 py-4 text-[9px] font-black text-stone-500 uppercase tracking-widest text-center">Çəki</th>
                      <th className="px-6 py-4 text-[9px] font-black text-stone-500 uppercase tracking-widest text-center">Tarix</th>
                      <th className="px-6 py-4 text-[9px] font-black text-stone-500 uppercase tracking-widest text-center">Satıcı</th>
                      <th className="px-6 py-4 text-[9px] font-black text-stone-500 uppercase tracking-widest text-center">Müştəri</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {sales
                      .filter(s => {
                        const matchesProduct = s.productId === selectedProductForLog.id && s.isPartial;
                        const matchesSearch = s.partialName?.toLowerCase().includes(logSearchTerm.toLowerCase()) || 
                                            s.sellerName?.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                                            s.customerName?.toLowerCase().includes(logSearchTerm.toLowerCase());
                        const matchesDate = !logDateFilter || s.date.startsWith(logDateFilter);
                        return matchesProduct && matchesSearch && matchesDate;
                      })
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-white transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-black text-stone-900 text-sm uppercase">{s.partialName}</p>
                          </td>
                          <td className="px-6 py-4 text-center font-black text-amber-600 text-sm">{s.soldWeight} gr</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-[11px] font-black text-stone-900">{new Date(s.date).toLocaleDateString('az-AZ')}</span>
                              <span className="text-[9px] font-bold text-stone-400">{new Date(s.date).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-[10px] font-black text-stone-600 uppercase bg-stone-100 px-2 py-1 rounded-lg">{s.sellerName || 'Sistem'}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-[10px] font-black text-stone-600 uppercase">{s.customerName}</span>
                          </td>
                        </tr>
                      ))}
                    {sales.filter(s => s.productId === selectedProductForLog.id && s.isPartial).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center opacity-40">
                          <History size={48} className="mx-auto text-stone-200 mb-4" />
                          <p className="text-xs font-black text-stone-400 uppercase tracking-widest">Hələ ki, hissəli satış edilməyib</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <footer className="p-6 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
               <div className="flex space-x-6">
                  <div>
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none">Ümumi Çəki</p>
                    <p className="text-lg font-black text-stone-900 mt-1">{selectedProductForLog.weight} gr</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none">Satılan</p>
                    <p className="text-lg font-black text-amber-600 mt-1">{selectedProductForLog.soldWeight || 0} gr</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none">Qalan</p>
                    <p className="text-lg font-black text-stone-900 mt-1">{(Number(selectedProductForLog.weight) - (Number(selectedProductForLog.soldWeight) || 0)).toFixed(2)} gr</p>
                  </div>
               </div>
               <button 
                 onClick={() => { setShowPartialLogModal(false); setSelectedProductForLog(null); }}
                 className="px-8 py-3 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
               >
                 BAĞLA
               </button>
            </footer>
          </div>
        </div>
      )}

      {zoomedProductIndex !== null && (
        <div className="fixed inset-0 bg-stone-950/95 z-[110] flex items-center justify-center p-4" onClick={() => setZoomedProductIndex(null)}>
          <button 
            onClick={(e) => { e.stopPropagation(); setZoomedProductIndex(null); }} 
            className="absolute top-8 right-8 p-4 text-white/50 hover:text-white transition-all z-50 bg-white/10 rounded-full backdrop-blur-md"
          >
            <X size={32} />
          </button>

          <button 
            onClick={prevImage}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-all z-50 bg-white/10 rounded-full backdrop-blur-md hover:scale-110 active:scale-95"
          >
            <ChevronLeft size={48} />
          </button>

          <div className="relative max-w-full max-h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={filteredProducts[zoomedProductIndex].imageUrl} 
              referrerPolicy="no-referrer" 
              className="max-w-[90vw] max-h-[80vh] object-contain drop-shadow-2xl animate-in zoom-in-95 duration-300" 
              alt={filteredProducts[zoomedProductIndex].name} 
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-white flex flex-col items-center"><svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><p class="text-xl font-black uppercase mt-6 opacity-50 tracking-widest">Şəkil tapılmadı</p></div>';
              }}
            />
            <div className="mt-8 text-center bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/10">
              <p className="text-white font-black text-xl uppercase tracking-tighter">{filteredProducts[zoomedProductIndex].name}</p>
              <div className="flex items-center justify-center space-x-4 mt-2">
                <span className="text-amber-500 font-black text-sm uppercase tracking-widest">{filteredProducts[zoomedProductIndex].code}</span>
                <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                <span className="text-white/70 font-bold text-sm">{filteredProducts[zoomedProductIndex].weight} gr</span>
                <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                <span className="text-white/70 font-bold text-sm">{filteredProducts[zoomedProductIndex].carat} Əyar</span>
              </div>
              <p className="text-amber-400 font-black text-2xl mt-3 tracking-tighter">{(Number(filteredProducts[zoomedProductIndex].price) || 0).toLocaleString()} ₼</p>
            </div>
          </div>

          <button 
            onClick={nextImage}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-all z-50 bg-white/10 rounded-full backdrop-blur-md hover:scale-110 active:scale-95"
          >
            <ChevronRight size={48} />
          </button>

          <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-2 px-4 overflow-x-auto py-4 scrollbar-hide">
            {filteredProducts.map((p, idx) => (
              p.imageUrl && (
                <button 
                  key={p.id}
                  onClick={(e) => { e.stopPropagation(); setZoomedProductIndex(idx); }}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${zoomedProductIndex === idx ? 'border-amber-500 scale-110 shadow-lg shadow-amber-500/20' : 'border-white/10 opacity-50 hover:opacity-100'}`}
                >
                  <img src={p.imageUrl} className="w-full h-full object-cover" />
                </button>
              )
            ))}
          </div>
        </div>
      )}

      {zoomedImage && (
        <div className="fixed inset-0 bg-stone-950/95 z-[110] flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoomedImage(null)}>
          <img 
            src={zoomedImage} 
            referrerPolicy="no-referrer" 
            className="max-w-full max-h-full object-contain drop-shadow-2xl animate-in zoom-in-95" 
            alt="Zoomed product" 
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-white flex flex-col items-center"><svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><p class="text-xl font-black uppercase mt-6 opacity-50 tracking-widest">Şəkil tapılmadı</p></div>';
            }}
          />
        </div>
      )}
      
      {/* LABEL PRINT CONTAINER (PORTAL) */}
      {(lastAddedProduct || bulkPrintList.length > 0) && createPortal(
        <div id="label-print">
          {bulkPrintList.length > 0 ? (
            bulkPrintList.map((p) => (
              <div key={p.id} className="label-page-break">
                <LabelPrint product={p} settings={settings} />
              </div>
            ))
          ) : (
            lastAddedProduct && (
              <div className="label-page-break">
                <LabelPrint product={lastAddedProduct} settings={settings} />
              </div>
            )
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default StockModule;
