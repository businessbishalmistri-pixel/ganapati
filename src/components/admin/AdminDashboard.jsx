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
  Users
} from 'lucide-react';
import { adminInventoryService } from '../../services/adminInventoryService';
import { ProductInventoryTable } from './ProductInventoryTable';
import { CategoryManager } from './CategoryManager';
import { ProductFormModal } from './ProductFormModal';

export function AdminDashboard({ session, onLogout, onVisitStore }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'categories'
  const [products, setProducts] = useState(() => adminInventoryService.getCachedProducts() || []);
  const [categories, setCategories] = useState(() => adminInventoryService.getCategories() || []);
  const [isLoading, setIsLoading] = useState(() => (!adminInventoryService.getCachedProducts() || adminInventoryService.getCachedProducts().length === 0));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const carouselRef = useRef(null);

  const handleCarouselScroll = (e) => {
    const el = e.currentTarget;
    if (!el) return;
    const cardWidth = el.scrollWidth / 3;
    const scrollPos = el.scrollLeft + (el.clientWidth / 2);
    const newIndex = Math.min(2, Math.max(0, Math.floor(scrollPos / cardWidth)));
    if (newIndex !== activeCardIndex) {
      setActiveCardIndex(newIndex);
    }
  };

  const scrollToCard = (index) => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const cards = container.children;
      if (cards[index]) {
        cards[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
      setActiveCardIndex(index);
    }
  };

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [prods, cats] = await Promise.all([
        adminInventoryService.getAllProducts(),
        adminInventoryService.getCategories()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute clean metrics for summary
  const totalProductsCount = products.length;
  const inStockCount = products.filter(p => p.in_stock !== false && (p.stock > 0 || p.stock === undefined)).length;
  const outOfStockCount = totalProductsCount - inStockCount;

  // Product CRUD Handlers
  const handleSaveProduct = async (productData) => {
    if (productData.id) {
      await adminInventoryService.updateProduct(productData.id, productData);
    } else {
      await adminInventoryService.addProduct(productData);
    }
    await loadData();
  };

  const handleDeleteProduct = async (id) => {
    await adminInventoryService.deleteProduct(id);
    await loadData();
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

  // Category Handlers
  const handleAddCategory = (cat) => {
    adminInventoryService.addCategory(cat);
    setCategories([...adminInventoryService.getCategories()]);
  };

  const handleUpdateCategory = (id, updates) => {
    adminInventoryService.updateCategory(id, updates);
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
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">Ganapati Admin</h1>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Store & Product Management</span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Refresh */}
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
        <div className="pt-1 pb-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome Back, Admin
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Store product catalog, availability controls, and categories.
          </p>
        </div>

        {/* 🎨 Modern Abstract Geometric Hero Cards (Mobile Carousel / Desktop 3-Column Grid) */}
        <div className="relative">
          <div 
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory no-scrollbar pb-1 -mx-3 px-3 sm:mx-0 sm:px-0"
          >
            {/* Card 1: Total Products (Dark Onyx & Cobalt Blue) */}
            <div className="w-[86vw] sm:w-[75vw] md:w-auto flex-shrink-0 snap-center bg-[#181920] text-white p-5 sm:p-6 rounded-2xl relative overflow-hidden shadow-md flex flex-col justify-between border border-slate-800 min-h-[148px] group hover:shadow-xl transition-all">
              {/* Concentric rings graphic overlay */}
              <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="90%" cy="20%" r="40" stroke="white" strokeWidth="1" fill="none" />
                <circle cx="90%" cy="20%" r="80" stroke="white" strokeWidth="1" fill="none" />
                <circle cx="90%" cy="20%" r="120" stroke="white" strokeWidth="1" fill="none" />
              </svg>
              {/* Top-right cobalt blue abstract disc */}
              <div className="absolute -top-7 -right-7 w-32 h-32 rounded-full bg-[#2563eb] pointer-events-none" />

              {/* Top Icon Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-xs">
                  <Package className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Content info */}
              <div className="relative z-10 pt-4 space-y-1">
                <span className="text-xs font-semibold text-slate-400 tracking-wide block">
                  Total Products
                </span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                    {totalProductsCount} <span className="text-lg font-bold text-slate-400 font-sans">Items</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/15">
                    Live
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: In-Stock / Available Products (Royal Purple & Sunburst Yellow) */}
            <div className="w-[86vw] sm:w-[75vw] md:w-auto flex-shrink-0 snap-center bg-[#7c3aed] text-white p-5 sm:p-6 rounded-2xl relative overflow-hidden shadow-md flex flex-col justify-between border border-purple-600/60 min-h-[148px] group hover:shadow-xl transition-all">
              {/* Concentric rings graphic overlay */}
              <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="90%" cy="80%" r="40" stroke="white" strokeWidth="1" fill="none" />
                <circle cx="90%" cy="80%" r="80" stroke="white" strokeWidth="1" fill="none" />
                <circle cx="90%" cy="80%" r="120" stroke="white" strokeWidth="1" fill="none" />
              </svg>
              {/* Bottom-right sunburst yellow abstract cutout */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-[#fbbf24] pointer-events-none" />

              {/* Top Icon Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xs">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Content info */}
              <div className="relative z-10 pt-4 space-y-1">
                <span className="text-xs font-semibold text-purple-200 tracking-wide block">
                  Available in Store
                </span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                    {inStockCount} <span className="text-lg font-bold text-purple-200 font-sans">In Stock</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                    {outOfStockCount > 0 ? `${outOfStockCount} Out` : 'All Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Active Categories (Azure Electric Blue & Emerald Mint) */}
            <div className="w-[86vw] sm:w-[75vw] md:w-auto flex-shrink-0 snap-center bg-[#2563eb] text-white p-5 sm:p-6 rounded-2xl relative overflow-hidden shadow-md flex flex-col justify-between border border-blue-500/60 min-h-[148px] group hover:shadow-xl transition-all">
              {/* Concentric rings graphic overlay */}
              <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="90%" cy="20%" r="40" stroke="white" strokeWidth="1" fill="none" />
                <circle cx="90%" cy="20%" r="80" stroke="white" strokeWidth="1" fill="none" />
                <circle cx="90%" cy="20%" r="120" stroke="white" strokeWidth="1" fill="none" />
              </svg>
              {/* Top-right emerald mint abstract cutout */}
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-[#10b981] pointer-events-none" />

              {/* Top Icon Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xs">
                  <FolderTree className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Content info */}
              <div className="relative z-10 pt-4 space-y-1">
                <span className="text-xs font-semibold text-blue-200 tracking-wide block">
                  Active Categories
                </span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                    {categories.length} <span className="text-lg font-bold text-blue-200 font-sans">Sections</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                    Organized
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 🔘 Mobile Carousel Pagination Dots */}
          <div className="flex md:hidden items-center justify-center gap-1.5 pt-2 pb-0.5">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToCard(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeCardIndex === idx 
                    ? 'w-6 bg-slate-900' 
                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to card ${idx + 1}`}
              />
            ))}
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
    </div>
  );
}
