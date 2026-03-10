
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
  ChevronRight,
  Info,
  Layers,
  ShoppingBag,
  Zap,
  Printer,
  Box,
  Maximize2,
  AlertCircle,
  User,
  Truck,
  Archive,
  ArrowDownToLine
} from 'lucide-react';
import { Product, ProductType, AppSettings, ProductLog, Sale } from '@/types';
import { LabelPrint } from '@/components/LabelPrint';

interface StockProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  settings: AppSettings;
  sales: Sale[];
}

const StockModule: React.FC<StockProps> = ({ products, setProducts, settings, sales }) => {
  const [activeFolder, setActiveFolder] = useState<ProductType | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showMoveToArchiveModal, setShowMoveToArchiveModal] = useState(false);
  const [selectedForArchive, setSelectedForArchive] = useState<string[]>([]);
  
  // Təkrarlanan kod üçün xəta halları
  const [duplicateInStock, setDuplicateInStock] = useState<Product | null>(null);
  const [duplicateInSales, setDuplicateInSales] = useState<Sale | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    carat: 583,
    type: settings.productGroups[0]?.name || '',
    supplier: settings.suppliers[0] || '',
    brilliant: '',
    weight: '' as string | number,
    price: '' as string | number,
    imageUrl: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const [autoPrint, setAutoPrint] = useState(true);
  const [bulkPricePerGram, setBulkPricePerGram] = useState<number | ''>('');
  const [bulkPrintList, setBulkPrintList] = useState<Product[]>([]);

  const [viewMode, setViewMode] = useState<'folders' | 'printList'>('folders');
  const [stockPrintList, setStockPrintList] = useState<Product[]>([]);
  const [printSupplier, setPrintSupplier] = useState<string>('all');
  const [printCategory, setPrintCategory] = useState<string>('all');

  const [editForm, setEditForm] = useState<Partial<Product>>({});

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
    const productsInFolder = activeProducts.filter(p => p.type === activeFolder && !p.isArchived);
    
    // Update products in state
    const updatedProducts = products.map(p => {
      if (p.type === activeFolder && !p.isArchived) {
        const newPrice = Math.round((Number(p.weight) * pricePerGram) / 10) * 10;
        return { ...p, price: newPrice };
      }
      return p;
    });
    
    setProducts(updatedProducts);
    
    // Prepare for printing
    const printList = productsInFolder.map(p => {
      const newPrice = Math.round((Number(p.weight) * pricePerGram) / 10) * 10;
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
      }, 2000);
    }, 1000);
  };

  const getPrefix = (type: string) => {
    const group = settings.productGroups.find(g => g.name === type);
    return group ? group.prefix : '';
  };

  const getNextCode = (prefix: string) => {
    return prefix || '';
  };

  useEffect(() => {
    if (isAddingNew && !newProduct.code) {
      const prefix = getPrefix(newProduct.type);
      setNewProduct(prev => ({ ...prev, code: getNextCode(prefix) }));
    }
  }, [newProduct.type, isAddingNew]);

  // Stokda olan məhsulları süzgəcdən keçiririk
  const activeProducts = products.filter(p => (Number(p.stockCount) || 0) > 0);

  // Unique suppliers and categories for filters
  const suppliers = Array.from(new Set(activeProducts.map(p => p.supplier).filter(Boolean)));
  const categories = settings.productGroups.map(g => g.name);

  useEffect(() => {
    if (newProduct.weight !== '' && !isNaN(Number(newProduct.weight))) {
      const rawPrice = Number(newProduct.weight) * settings.pricePerGram;
      const roundedPrice = Math.round(rawPrice / 10) * 10; 
      setNewProduct(prev => ({ ...prev, price: roundedPrice }));
    } else {
      setNewProduct(prev => ({ ...prev, price: '' }));
    }
  }, [newProduct.weight, settings.pricePerGram]);

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
      carat: Number(newProduct.carat),
      type: newProduct.type,
      supplier: newProduct.supplier,
      brilliant: newProduct.brilliant || undefined,
      weight: newProduct.weight === '' ? 0 : Number(newProduct.weight),
      price: newProduct.price === '' ? 0 : Number(newProduct.price),
      imageUrl: newProduct.imageUrl,
      supplierPrice: 0, 
      stockCount: 1, 
      purchaseDate: newProduct.purchaseDate,
      logs: [{ date: new Date().toISOString(), action: 'Sistemə əlavə edildi' }]
    };

    setProducts((prev: Product[]) => [productToAdd, ...prev]);
    setLastAddedProduct(productToAdd);
    
    // Trigger print if autoPrint is enabled
    if (autoPrint) {
      setTimeout(() => {
          window.print();
          // Clear after print dialog
          setTimeout(() => setLastAddedProduct(null), 2000);
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
        purchaseDate: new Date().toISOString().split('T')[0]
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

  const capturePhoto = async (isEdit: boolean = false) => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Resize to max 800px for persistent storage
      const maxDim = 800;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
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
        ctx.drawImage(video, 0, 0, width, height);
        
        // Convert canvas to base64 for persistent storage
        const base64Image = canvas.toDataURL('image/jpeg', 0.7);
        if (isEdit) setEditForm(prev => ({ ...prev, imageUrl: base64Image }));
        else setNewProduct(prev => ({ ...prev, imageUrl: base64Image }));
        
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
        if (isEdit) setEditForm(prev => ({ ...prev, imageUrl: resized }));
        else setNewProduct(prev => ({ ...prev, imageUrl: resized }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openDetailModal = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({ ...product });
    setShowDetailModal(true);
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !editForm.code || !editForm.name) return;

    const updatedProduct: Product = { ...selectedProduct, ...editForm } as Product;
    setProducts((prev: Product[]) => prev.map((p: Product) => p.id === selectedProduct.id ? updatedProduct : p));
    setSelectedProduct(updatedProduct);
    alert("Məhsul məlumatları uğurla yeniləndi.");
  };

  const handleMoveToArchive = () => {
    if (selectedForArchive.length === 0) return;
    
    setProducts(prev => prev.map(p => 
      selectedForArchive.includes(p.id) ? { ...p, isArchived: true } : p
    ));
    
    setSelectedForArchive([]);
    setShowMoveToArchiveModal(false);
    alert(`${selectedForArchive.length} məhsul arxivə daşındı.`);
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
                       <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                       <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-3 px-4">
                          <button type="button" onClick={() => capturePhoto(false)} className="bg-amber-500 text-stone-950 px-5 py-3 rounded-xl shadow-xl font-black text-[10px] uppercase flex items-center space-x-2"><Camera size={14} /> <span>FOTO ÇƏK</span></button>
                          <button type="button" onClick={stopCamera} className="bg-white/20 backdrop-blur-md text-white p-3 rounded-xl"><X size={14} /></button>
                       </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4" onClick={startCamera}>
                      {newProduct.imageUrl ? (
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
                       {[583, '14K', 750, 22].map(c => (
                          <button key={c} type="button" onClick={() => setNewProduct({...newProduct, carat: typeof c === 'string' ? 14 : c})} className={`flex-1 py-3 rounded-xl font-black text-[11px] border transition-all ${ (typeof c === 'string' && newProduct.carat === 14) || newProduct.carat === c ? 'bg-amber-500 border-amber-500 text-stone-950 shadow-md' : 'bg-stone-50 border-stone-100 text-stone-400'}`}>{c}{typeof c === 'number' && c < 100 ? 'K' : ''}</button>
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
                        carat: Number(newProduct.carat),
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
                        setTimeout(() => setLastAddedProduct(null), 2000);
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
                                <td>{item.brilliant ? '*' : ''}</td>
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
      <div className="flex justify-center no-print">
        <div className="bg-white p-2 rounded-[2rem] shadow-xl border border-stone-200 flex space-x-2">
          <button 
            onClick={() => setViewMode('folders')}
            className={`px-8 md:px-12 py-3 md:py-4 rounded-[1.5rem] font-black text-xs md:text-sm uppercase tracking-widest transition-all flex items-center space-x-3 ${viewMode === 'folders' ? 'bg-stone-900 text-amber-500 shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            <Box size={20} />
            <span>STOKDA OLANLAR</span>
          </button>
          <button 
            onClick={() => setViewMode('printList')}
            className={`px-8 md:px-12 py-3 md:py-4 rounded-[1.5rem] font-black text-xs md:text-sm uppercase tracking-widest transition-all flex items-center space-x-3 ${viewMode === 'printList' ? 'bg-stone-900 text-amber-500 shadow-lg' : 'text-stone-500 hover:bg-stone-50'}`}
          >
            <Printer size={20} />
            <span>SİYAHI ÇAPI (80MM)</span>
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
                      <button 
                        onClick={() => setShowMoveToArchiveModal(true)}
                        className="px-8 py-4 bg-amber-500 text-stone-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl flex items-center space-x-3"
                      >
                        <ArrowDownToLine size={20} />
                        <span>Buraya Daşı</span>
                      </button>
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
                      
                      <div className="flex flex-1 max-w-md items-center space-x-3">
                        <div className="relative flex-1">
                          <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                          <input 
                            type="number" 
                            placeholder="1 qr Qiyməti (₼)" 
                            value={bulkPricePerGram}
                            onChange={(e) => setBulkPricePerGram(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-3 pl-10 pr-4 font-black text-sm outline-none focus:border-amber-400 transition-all"
                          />
                        </div>
                        <button 
                          onClick={handleBulkPrint}
                          disabled={!bulkPricePerGram}
                          className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center space-x-2 ${bulkPricePerGram ? 'bg-stone-900 text-amber-500 hover:bg-black' : 'bg-stone-100 text-stone-300 cursor-not-allowed'}`}
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
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100">
                      <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Şəkil</th>
                      <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Kod</th>
                      <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Məhsul Adı</th>
                      <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Çəki</th>
                      <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Say</th>
                      <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Qiymət</th>
                      <th className="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Əməliyyat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} onClick={() => openDetailModal(p)} className="hover:bg-amber-50/20 transition-all group cursor-pointer">
                        <td className="px-8 py-5">
                          <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-stone-100 shadow-sm bg-stone-50 flex items-center justify-center">
                            {p.imageUrl ? (
                              <img 
                                src={p.imageUrl} 
                                referrerPolicy="no-referrer" 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-stone-200"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                                }}
                              />
                            ) : (
                              <div className="text-stone-200"><ImageIcon size={24} /></div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 font-black text-stone-500 text-xs uppercase tracking-widest">{p.code}</td>
                        <td className="px-8 py-5"><p className="font-black text-stone-800 text-sm uppercase leading-none">{p.name}</p>{p.brilliant && <p className="text-[10px] text-amber-600 font-bold mt-1.5 flex items-center"><Gem size={12} className="mr-1.5"/> {p.brilliant}</p>}</td>
                        <td className="px-8 py-5 font-black text-stone-900 text-sm text-center">{p.weight} gr</td>
                        <td className="px-8 py-5 font-black text-stone-900 text-sm text-center">{p.stockCount}</td>
                        <td className="px-8 py-5 text-stone-900 font-black text-right text-xl tracking-tighter">{(Number(p.price) || 0).toLocaleString()} ₼</td>
                        <td className="px-8 py-5 text-center"><button onClick={(e) => { e.stopPropagation(); openDetailModal(p); }} className="p-4 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-2xl transition-all shadow-sm"><Edit2 size={20} /></button></td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && <tr><td colSpan={7} className="px-10 py-20 text-center"><p className="text-stone-300 font-black uppercase text-xs tracking-widest">Məlumat tapılmadı</p></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </>
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
                                    <span className="text-[10px] font-black text-amber-600">{item.weight} gr | {item.carat}K</span>
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
            <header className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter">Redaktə: {selectedProduct.code}</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 text-stone-300 hover:text-stone-900 transition-colors"><X size={24} /></button>
            </header>
            <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
               <form id="fullEditForm" onSubmit={handleUpdateProduct} className="space-y-8">
                  <div className="flex flex-col items-center space-y-4">
                    <div 
                      onClick={() => (editForm.imageUrl || selectedProduct.imageUrl) && !isCameraOpen && setZoomedImage(editForm.imageUrl || selectedProduct.imageUrl || null)} 
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
                        <>
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
                        </>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button type="button" onClick={startCamera} className="bg-stone-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black hover:bg-black transition-all uppercase flex items-center space-x-2"><Camera size={14} /> <span>KAMERA</span></button>
                      <button type="button" onClick={() => editFileInputRef.current?.click()} className="bg-stone-100 px-6 py-2.5 rounded-xl text-[10px] font-black text-stone-600 hover:bg-amber-100 transition-all uppercase flex items-center space-x-2"><Upload size={14} /> <span>YÜKLƏ</span></button>
                    </div>
                    <input type="file" ref={editFileInputRef} onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase ml-2">Məhsul Kodu</label><input type="text" value={editForm.code || ''} onChange={(e) => setEditForm({...editForm, code: e.target.value})} className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-5 font-black text-stone-800 outline-none" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase ml-2">Ad</label><input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-5 font-black text-stone-800 outline-none" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase ml-2">Çəki (gr)</label><input type="number" step="0.001" value={editForm.weight || ''} onChange={(e) => setEditForm({...editForm, weight: Number(e.target.value)})} className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-5 font-black text-stone-800 outline-none" /></div>
                       <div className="space-y-1.5"><label className="text-[10px] font-black text-stone-400 uppercase ml-2">Tədarükçü</label><select value={editForm.supplier || ''} onChange={(e) => setEditForm({...editForm, supplier: e.target.value})} className="w-full bg-stone-50 border-2 border-stone-100 rounded-xl py-4 px-5 font-black text-stone-800 outline-none cursor-pointer">{settings.suppliers.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                       <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-amber-600 uppercase ml-2">Qiymət (₼)</label><input type="number" value={editForm.price || ''} onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})} className="w-full bg-amber-50 border-2 border-amber-200 rounded-xl py-6 px-6 font-black text-4xl text-amber-900 text-center outline-none" /></div>
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
                    setTimeout(() => setLastAddedProduct(null), 2000);
                  }, 1000);
                }} 
                className="px-6 py-4 bg-white border border-stone-200 rounded-xl font-black text-stone-600 hover:bg-stone-50 transition-all uppercase text-[10px] flex items-center"
              >
                <Tag className="mr-2 w-4 h-4" /> ETİKET ÇAP ET
              </button>
              <button type="button" onClick={() => setShowDetailModal(false)} className="flex-1 px-8 py-4 rounded-xl font-black text-stone-400 uppercase tracking-widest text-[11px] border border-stone-200 hover:bg-white transition-all">Ləğv Et</button>
              <button form="fullEditForm" type="submit" className="flex-[2] px-8 py-4 bg-amber-500 text-stone-950 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl">Yadda Saxla</button>
            </footer>
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
