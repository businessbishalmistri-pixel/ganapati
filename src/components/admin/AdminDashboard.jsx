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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased text-slate-900 pb-16 md:pb-8">
      
      {/* 📱 Tablet & Desktop App Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 md:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">Ganapati Admin</h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Store & Product Management</span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Refresh */}
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Add Product Button (Tablet Header) */}
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>

          {/* Visit Store */}
          <button
            onClick={onVisitStore}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Visit Store</span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Tablet Layout Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-5">
        
        {/* Tablet 4-Card Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Products */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Products
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {totalProductsCount}
              </div>
              <span className="text-[11px] text-slate-500 font-medium mt-0.5 inline-block">Catalog Items</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: In Stock */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200/60 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                In Stock
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                {inStockCount}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium mt-0.5 inline-block">Live to Order</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Out of Stock */}
          <div className="bg-white p-4 rounded-2xl border border-rose-200/60 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                Out of Stock
              </span>
              <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                {outOfStockCount}
              </div>
              <span className="text-[11px] text-rose-500 font-medium mt-0.5 inline-block">Unavailable</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Categories */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Categories
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {categories.length}
              </div>
              <span className="text-[11px] text-slate-500 font-medium mt-0.5 inline-block">Store Sections</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Navigation (Products vs Categories) */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products ({totalProductsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <FolderTree className="w-4 h-4" />
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
