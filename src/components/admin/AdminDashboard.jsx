import React, { useState, useEffect } from 'react';
import { 
  Package, 
  FolderTree, 
  LogOut, 
  ExternalLink, 
  ShoppingBag, 
  ShieldCheck, 
  Plus, 
  AlertTriangle,
  RefreshCw
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
    await adminInventoryService.toggleInStock(id);
    await loadData();
  };

  const handleToggleStatus = async (id) => {
    await adminInventoryService.toggleStatus(id);
    await loadData();
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

  const handleDeleteCategory = (id) => {
    adminInventoryService.deleteCategory(id);
    setCategories([...adminInventoryService.getCategories()]);
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-5 py-[10px] flex items-center justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">Ganapati Admin</h1>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
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

      {/* Main Tablet Layout Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-2.5 sm:p-4 space-y-3">
        
        {/* 📱 Colorful Top Summary Widgets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
          {/* Card 1: Total Products */}
          <div className="bg-[#E0F2FE] p-2.5 sm:p-3 rounded-2xl border border-sky-200/80 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-sky-800 tracking-tight">
              Products
            </span>
            <div className="text-xl sm:text-2xl font-black text-sky-950 mt-0.5 font-mono">
              {totalProductsCount}
            </div>
            <span className="text-[10px] text-sky-700 font-medium">Total Catalog</span>
          </div>

          {/* Card 2: In Stock */}
          <div className="bg-[#FEF3C7] p-2.5 sm:p-3 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-amber-800 tracking-tight">
              In Stock
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-950 mt-0.5 font-mono">
              {inStockCount}
            </div>
            <span className="text-[10px] text-amber-700 font-medium">Available</span>
          </div>

          {/* Card 3: Out of Stock */}
          <div className="bg-[#FFE4E6] p-2.5 sm:p-3 rounded-2xl border border-rose-200/80 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-rose-800 tracking-tight">
              Out of Stock
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-950 mt-0.5 font-mono">
              {outOfStockCount}
            </div>
            <span className="text-[10px] text-rose-700 font-medium">Unavailable</span>
          </div>

          {/* Card 4: Categories */}
          <div className="bg-[#EDE9FE] p-2.5 sm:p-3 rounded-2xl border border-indigo-200/80 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-bold text-indigo-800 tracking-tight">
              Categories
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-950 mt-0.5 font-mono">
              {categories.length}
            </div>
            <span className="text-[10px] text-indigo-700 font-medium">Sections</span>
          </div>
        </div>

        {/* Tab Navigation (Products vs Categories) */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
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
