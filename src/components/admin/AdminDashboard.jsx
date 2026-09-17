import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  FolderTree, 
  LogOut, 
  ExternalLink, 
  ShoppingBag, 
  ShieldCheck, 
  Plus, 
  AlertTriangle,
  RefreshCw,
  Banknote,
  ShoppingCart,
  Users,
  Bolt
} from 'lucide-react';
import { adminInventoryService } from '../../services/adminInventoryService';
import { supabase } from '../../services/supabaseStore';
import { ProductInventoryTable } from './ProductInventoryTable';
import { CategoryManager } from './CategoryManager';
import { ProductFormModal } from './ProductFormModal';
import { AdminSettingsModal } from './AdminSettingsModal';

export function AdminDashboard({ session, onLogout, onVisitStore }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'categories'
  // ⚡ 0ms SWR Instant Paint: initialize immediately from cached snapshot
  const [products, setProducts] = useState(() => adminInventoryService.getCachedProducts() || []);
  const [categories, setCategories] = useState(() => adminInventoryService.getCategories() || []);
  const [isLoading, setIsLoading] = useState(() => {
    const cached = adminInventoryService.getCachedProducts();
    return !cached || cached.length === 0;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const loadData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const prods = await adminInventoryService.getAllProducts();
      const cats = adminInventoryService.getCategories();
      if (Array.isArray(prods) && prods.length > 0) {
        setProducts(prods);
      }
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories([...cats]);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
      if (!silent) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Background revalidation on mount (non-blocking)
    loadData(true);

    // Subscribe to real-time changes on products table across all admin devices
    let channel;
    try {
      let debounceTimer = null;
      channel = supabase
        .channel('realtime:admin:products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            loadData(true);
          }, 250);
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime admin subscription notice:', e);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Compute clean metrics for summary
  const totalProductsCount = products.length;
  const inStockCount = products.filter(p => p.in_stock !== false && (p.stock > 0 || p.stock === undefined)).length;
  const outOfStockCount = totalProductsCount - inStockCount;

  // Product CRUD Handlers (0ms Optimistic UI)
  const handleSaveProduct = async (productData) => {
    if (productData.id) {
      setProducts(prev => prev.map(p => p.id === productData.id ? { ...p, ...productData } : p));
      adminInventoryService.updateProduct(productData.id, productData).catch(console.error);
    } else {
      const tempId = productData.id || `prod_${Date.now()}`;
      const optimisticProd = { ...productData, id: tempId };
      setProducts(prev => [optimisticProd, ...prev]);
      adminInventoryService.addProduct(productData).then(created => {
        if (created) {
          setProducts(prev => prev.map(p => p.id === tempId ? created : p));
        }
      }).catch(console.error);
    }
  };

  const handleDeleteProduct = async (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    adminInventoryService.deleteProduct(id).catch(console.error);
  };

  const handleToggleInStock = async (id) => {
    // 1. Instant optimistic state update (0ms switch slide animation)
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextInStock = !p.in_stock;
          return {
            ...p,
            in_stock: nextInStock,
            stock: nextInStock ? (p.stock > 0 ? p.stock : 50) : 0,
            stock_quantity: nextInStock ? (p.stock_quantity > 0 ? p.stock_quantity : 50) : 0
          };
        }
        return p;
      })
    );

    // 2. Background database sync
    try {
      await adminInventoryService.toggleInStock(id);
    } catch (err) {
      console.warn('Failed to sync stock toggle to database:', err);
    }
  };

  const handleToggleStatus = async (id) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, status: p.status === 'draft' ? 'active' : 'draft' };
        }
        return p;
      })
    );
    await adminInventoryService.toggleStatus(id);
  };

  const handleTogglePinProduct = async (id) => {
    // Optimistically toggle in local React state
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextPinned = !p.is_pinned;
          return { ...p, is_pinned: nextPinned, is_starred: nextPinned, sub_category: nextPinned ? 'pinned' : '' };
        }
        return p;
      })
    );
    const updated = await adminInventoryService.togglePinProduct(id);
    if (updated) {
      showToast(
        updated.is_pinned 
          ? `⭐ "${updated.title}" pinned to top of store!` 
          : `"${updated.title}" unstarred`,
        'info'
      );
    }
  };

  // Category Handlers (Instant optimistic state + Supabase Database Sync)
  const handleAddCategory = async (cat) => {
    const newCat = { ...cat, id: cat.id || `cat_${Date.now()}` };
    setCategories((prev) => [...prev, newCat]);
    await adminInventoryService.addCategory(cat);
    setCategories([...adminInventoryService.getCategories()]);
  };

  const handleUpdateCategory = async (id, updates) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    await adminInventoryService.updateCategory(id, updates);
    setCategories([...adminInventoryService.getCategories()]);
  };

  const handleDeleteCategory = async (id, targetCategoryName) => {
    if (targetCategoryName) {
      const oldCat = categories.find((c) => c.id === id);
      const oldName = oldCat?.name;

      // Optimistically shift products in local React state
      if (oldName) {
        setProducts((prev) =>
          prev.map((p) => (p.category === oldName ? { ...p, category: targetCategoryName } : p))
        );
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));

      await adminInventoryService.deleteCategoryAndReassign(id, targetCategoryName);
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      adminInventoryService.deleteCategory(id);
    }
  };

  const handleOpenAddModal = () => {
    setProductToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setProductToEdit(prod);
    setIsFormModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-slate-900 pb-16 md:pb-8">
      
      {/* 📱 Tablet & Desktop App Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-[10px] flex items-center justify-between shadow-xs">
        <div>
          <h1 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">Ganapati Admin</h1>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Settings / Bolt Icon Button (Icon Only) */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors flex items-center justify-center text-xs font-semibold cursor-pointer shadow-2xs"
            title="Store Settings & WhatsApp"
          >
            <Bolt className="w-3.5 h-3.5 text-slate-600 hover:text-slate-900" />
          </button>

          {/* Refresh / Sync */}
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Add Product Button (Tablet Header) */}
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>

          {/* Visit Store */}
          <button
            onClick={onVisitStore}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Visit Store</span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 space-y-4">
        
        {/* 👋 Welcome Greeting Header */}
        <div className="pt-1 pb-0.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome Back, Amit
          </h1>
        </div>

        {/* 🎨 Modern Abstract Geometric Hero Cards (3 Side-by-Side Widgets with 5px Gap on Mobile) */}
        <div className="grid grid-cols-3 gap-[5px] sm:gap-3 md:gap-4">
          {/* Card 1: Total Products (Dark Onyx & Cobalt Blue) */}
          <div className="bg-[#181920] text-white p-2 sm:p-5 sm:p-6 rounded-xl sm:rounded-2xl relative overflow-hidden shadow-md flex flex-col justify-between border border-slate-800 min-h-[105px] sm:min-h-[148px] group hover:shadow-xl transition-all">
            {/* Concentric rings graphic overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="90%" cy="20%" r="40" stroke="white" strokeWidth="1" fill="none" />
              <circle cx="90%" cy="20%" r="80" stroke="white" strokeWidth="1" fill="none" />
              <circle cx="90%" cy="20%" r="120" stroke="white" strokeWidth="1" fill="none" />
            </svg>
            {/* Top-right cobalt blue abstract disc */}
            <div className="absolute -top-7 -right-7 w-20 sm:w-32 h-20 sm:h-32 rounded-full bg-[#2563eb] pointer-events-none opacity-80" />

            {/* Top Icon Badge & Mini Pill */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-xs">
                <Package className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/15">
                Live
              </span>
            </div>

            {/* Content info */}
            <div className="relative z-10 pt-2 sm:pt-4 space-y-0.5 sm:space-y-1">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 tracking-tight sm:tracking-wide block truncate">
                <span className="sm:hidden">Products</span>
                <span className="hidden sm:inline">Total Products</span>
              </span>
              <div className="flex items-baseline gap-1 sm:gap-2.5">
                <span className="text-base sm:text-2xl md:text-3xl font-black font-mono tracking-tight text-white leading-none">
                  {totalProductsCount}
                </span>
                <span className="text-[10px] sm:text-lg font-bold text-slate-400 font-sans">
                  Items
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: In-Stock / Available Products (Royal Purple & Sunburst Yellow) */}
          <div className="bg-[#7c3aed] text-white p-2 sm:p-5 sm:p-6 rounded-xl sm:rounded-2xl relative overflow-hidden shadow-md flex flex-col justify-between border border-purple-600/60 min-h-[105px] sm:min-h-[148px] group hover:shadow-xl transition-all">
            {/* Concentric rings graphic overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="90%" cy="80%" r="40" stroke="white" strokeWidth="1" fill="none" />
              <circle cx="90%" cy="80%" r="80" stroke="white" strokeWidth="1" fill="none" />
              <circle cx="90%" cy="80%" r="120" stroke="white" strokeWidth="1" fill="none" />
            </svg>
            {/* Bottom-right sunburst yellow abstract cutout */}
            <div className="absolute -bottom-6 -right-6 w-20 sm:w-32 h-20 sm:h-32 rounded-full bg-[#fbbf24] pointer-events-none opacity-80" />

            {/* Top Icon Badge & Mini Pill */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xs">
                <ShoppingCart className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20 truncate max-w-[55px] sm:max-w-none">
                {outOfStockCount > 0 ? `${outOfStockCount} Out` : 'Active'}
              </span>
            </div>

            {/* Content info */}
            <div className="relative z-10 pt-2 sm:pt-4 space-y-0.5 sm:space-y-1">
              <span className="text-[10px] sm:text-xs font-semibold text-purple-200 tracking-tight sm:tracking-wide block truncate">
                <span className="sm:hidden">In Stock</span>
                <span className="hidden sm:inline">Available in Store</span>
              </span>
              <div className="flex items-baseline gap-1 sm:gap-2.5">
                <span className="text-base sm:text-2xl md:text-3xl font-black font-mono tracking-tight text-white leading-none">
                  {inStockCount}
                </span>
                <span className="text-[10px] sm:text-lg font-bold text-purple-200 font-sans">
                  Stock
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Active Categories (Azure Electric Blue & Emerald Mint) */}
          <div className="bg-[#2563eb] text-white p-2 sm:p-5 sm:p-6 rounded-xl sm:rounded-2xl relative overflow-hidden shadow-md flex flex-col justify-between border border-blue-500/60 min-h-[105px] sm:min-h-[148px] group hover:shadow-xl transition-all">
            {/* Concentric rings graphic overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="90%" cy="20%" r="40" stroke="white" strokeWidth="1" fill="none" />
              <circle cx="90%" cy="20%" r="80" stroke="white" strokeWidth="1" fill="none" />
              <circle cx="90%" cy="20%" r="120" stroke="white" strokeWidth="1" fill="none" />
            </svg>
            {/* Top-right emerald mint abstract cutout */}
            <div className="absolute -top-6 -right-6 w-20 sm:w-32 h-20 sm:h-32 rounded-full bg-[#10b981] pointer-events-none opacity-80" />

            {/* Top Icon Badge & Mini Pill */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xs">
                <FolderTree className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                Organized
              </span>
            </div>

            {/* Content info */}
            <div className="relative z-10 pt-2 sm:pt-4 space-y-0.5 sm:space-y-1">
              <span className="text-[10px] sm:text-xs font-semibold text-blue-200 tracking-tight sm:tracking-wide block truncate">
                <span className="sm:hidden">Categories</span>
                <span className="hidden sm:inline">Active Categories</span>
              </span>
              <div className="flex items-baseline gap-1 sm:gap-2.5">
                <span className="text-base sm:text-2xl md:text-3xl font-black font-mono tracking-tight text-white leading-none">
                  {categories.length}
                </span>
                <span className="text-[10px] sm:text-lg font-bold text-blue-200 font-sans">
                  Sect.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Products vs Categories) */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 pt-1">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Products ({totalProductsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Categories ({categories.length})</span>
            </button>
          </div>
        </div>

        {/* Main Content Router */}
        {activeTab === 'categories' ? (
          <CategoryManager
            categories={categories}
            products={products}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        ) : (
          <ProductInventoryTable
            products={products}
            categories={categories}
            onEditProduct={handleOpenEditModal}
            onAddProduct={handleOpenAddModal}
            onDeleteProduct={handleDeleteProduct}
            onToggleInStock={handleToggleInStock}
            onToggleStatus={handleToggleStatus}
            onTogglePinProduct={handleTogglePinProduct}
            onRefresh={loadData}
            isRefreshing={isRefreshing}
          />
        )}
      </main>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        categories={categories}
      />

      {/* Store Settings Popup Modal */}
      <AdminSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}
