import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  FileText, 
  FolderTree, 
  LogOut, 
  ExternalLink, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Menu, 
  X,
  Layers,
  Sparkles,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { adminInventoryService } from '../../services/adminInventoryService';
import { ProductInventoryTable } from './ProductInventoryTable';
import { CategoryManager } from './CategoryManager';
import { ProductFormModal } from './ProductFormModal';

export function AdminDashboard({ session, onLogout, onVisitStore }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'low-stock' | 'expired' | 'draft' | 'categories'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Compute metrics for top cards & sidebar badges
  const totalProductsCount = products.length;
  const lowStockCount = products.filter(p => p.stock <= (p.low_stock_threshold || 5) && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalStockAlertCount = lowStockCount + outOfStockCount;
  
  const expiredCount = products.filter(p => p.isExpired).length;
  const expiringSoonCount = products.filter(p => p.isExpiringSoon).length;
  const totalExpiryAlertCount = expiredCount + expiringSoonCount;

  const draftCount = products.filter(p => p.status === 'draft').length;
  const activeProductsCount = products.filter(p => p.status === 'active').length;

  const totalSellingValuation = products.reduce((sum, p) => sum + ((p.selling_price || 0) * (p.stock || 0)), 0);
  const totalCostValuation = products.reduce((sum, p) => sum + ((p.cost_price || 0) * (p.stock || 0)), 0);

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

  const handleQuickStockChange = async (id, newStock) => {
    await adminInventoryService.updateStock(id, newStock);
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

  const navItems = [
    { id: 'all', label: 'All Products', icon: Package, badge: totalProductsCount, color: 'text-blue-600 bg-blue-50' },
    { id: 'low-stock', label: 'Low Stock', icon: AlertTriangle, badge: totalStockAlertCount, color: totalStockAlertCount > 0 ? 'text-amber-700 bg-amber-100 font-bold' : 'text-slate-500 bg-slate-100' },
    { id: 'expired', label: 'Expired', icon: Clock, badge: totalExpiryAlertCount, color: totalExpiryAlertCount > 0 ? 'text-red-700 bg-red-100 font-bold' : 'text-slate-500 bg-slate-100' },
    { id: 'draft', label: 'Draft', icon: FileText, badge: draftCount, color: 'text-slate-700 bg-slate-100' },
    { id: 'categories', label: 'Categories', icon: FolderTree, badge: categories.length, color: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans antialiased text-slate-900 selection:bg-blue-500 selection:text-white">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Left Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand & Store Switcher */}
        <div>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-900 leading-tight">Ganapati Stores</h2>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Admin
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Add Product Button */}
          <div className="p-3">
            <button
              onClick={handleOpenAddModal}
              className="w-full py-2.5 px-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 block">
              Inventory Views
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50/80 text-blue-700 shadow-sm border border-blue-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.color}`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions & User Profile */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {/* Visit Store Button */}
          <button
            onClick={onVisitStore}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-500" />
              <span>Visit Storefront</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Admin User Badge & Logout */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">Administrator</span>
                <span className="text-[10px] text-slate-400 block truncate">admin@ganapati</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Log out of admin session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs font-medium text-slate-500">Dashboard /</span>
              <h1 className="text-sm font-bold text-slate-900 capitalize">
                {activeTab === 'all' ? 'All Products' : activeTab.replace('-', ' ')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onVisitStore}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <span>View Store: ganapatistores.com</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-4 sm:p-8 space-y-6 flex-1">
          {/* Top Summary Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Card 1: Total Products */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Catalog
                </span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {totalProductsCount}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 inline-block">
                  {activeProductsCount} Live on Store
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>

            {/* Card 2: Low Stock Alerts */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Low Stock
                </span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {totalStockAlertCount}
                </div>
                <span className="text-[11px] text-amber-600 font-semibold mt-0.5 inline-block">
                  {outOfStockCount} Out of Stock
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            {/* Card 3: Expired / Expiring */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Expiry Alerts
                </span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {totalExpiryAlertCount}
                </div>
                <span className="text-[11px] text-red-600 font-semibold mt-0.5 inline-block">
                  {expiredCount} Past Expiry Date
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Card 4: Inventory Valuation */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Stock Valuation
                </span>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-mono">
                  ₹{Math.round(totalSellingValuation).toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5 inline-block">
                  Cost: ₹{Math.round(totalCostValuation).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Active View Router */}
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
              viewFilter={activeTab}
              categories={categories}
              onEditProduct={handleOpenEditModal}
              onAddProduct={handleOpenAddModal}
              onDeleteProduct={handleDeleteProduct}
              onQuickStockChange={handleQuickStockChange}
              onToggleStatus={handleToggleStatus}
              onRefresh={loadData}
              isRefreshing={isRefreshing}
            />
          )}
        </div>
      </main>

      {/* Product Form Modal (Add & Edit) */}
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
