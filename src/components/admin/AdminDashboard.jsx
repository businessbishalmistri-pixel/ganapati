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
  RefreshCw,
  Home
} from 'lucide-react';
import { adminInventoryService } from '../../services/adminInventoryService';
import { ProductInventoryTable } from './ProductInventoryTable';
import { CategoryManager } from './CategoryManager';
import { ProductFormModal } from './ProductFormModal';

export function AdminDashboard({ session, onLogout, onVisitStore }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'categories'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900 pb-20 md:pb-6">
      
      {/* 📱 Mobile & Tablet Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 font-bold">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm text-slate-900 leading-tight">Ganapati Admin</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Live Manager</span>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Refresh */}
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Visit Storefront */}
          <button
            onClick={onVisitStore}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200/60 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Store</span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3.5 sm:p-6 space-y-4">
        
        {/* Quick Summary Pill Banner (Mobile Touch Friendly) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Total Products */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/70 shadow-xs text-center">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Total
            </span>
            <div className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5">
              {totalProductsCount}
            </div>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">Items</span>
          </div>

          {/* In Stock */}
          <div className="bg-emerald-50/60 p-3 sm:p-4 rounded-2xl border border-emerald-200/60 shadow-xs text-center">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 block">
              In Stock
            </span>
            <div className="text-lg sm:text-2xl font-black text-emerald-600 mt-0.5">
              {inStockCount}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium hidden sm:inline">Live on store</span>
          </div>

          {/* Out of Stock */}
          <div className="bg-rose-50/60 p-3 sm:p-4 rounded-2xl border border-rose-200/60 shadow-xs text-center">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 block">
              Out of Stock
            </span>
            <div className="text-lg sm:text-2xl font-black text-rose-600 mt-0.5">
              {outOfStockCount}
            </div>
            <span className="text-[10px] text-rose-500 font-medium hidden sm:inline">Unavailable</span>
          </div>
        </div>

        {/* Tab Selector (Tablet & Desktop Top Bar, or accessible pills) */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Products ({totalProductsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Categories ({categories.length})</span>
            </button>
          </div>

          {/* Add Product Button (Desktop/Tablet Top) */}
          <button
            onClick={handleOpenAddModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Main View Router */}
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

      {/* 📱 Mobile Bottom Navigation Bar (Thumb Friendly on Phones & Tablets) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-4 flex items-center justify-around shadow-lg sm:hidden">
        {/* Products Tab */}
        <button
          onClick={() => setActiveTab('all')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'all' ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px]">Products</span>
        </button>

        {/* Center Floating Plus Action Button */}
        <button
          onClick={handleOpenAddModal}
          className="w-12 h-12 -mt-5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 border-2 border-white transition-all cursor-pointer"
          title="Add New Product"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Categories Tab */}
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'categories' ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
          }`}
        >
          <FolderTree className="w-5 h-5" />
          <span className="text-[10px]">Categories</span>
        </button>

        {/* Visit Store */}
        <button
          onClick={onVisitStore}
          className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-slate-500 hover:text-slate-900 font-medium transition-all"
        >
          <ExternalLink className="w-5 h-5" />
          <span className="text-[10px]">Store</span>
        </button>
      </nav>

      {/* Product Form Modal (Mobile Bottom Sheet / Dialog) */}
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
