import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  ArrowUpDown, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Download, 
  RefreshCw, 
  Package,
  Check
} from 'lucide-react';

export function ProductInventoryTable({
  products = [],
  categories = [],
  onEditProduct,
  onAddProduct,
  onDeleteProduct,
  onToggleInStock,
  onRefresh,
  isRefreshing
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('updated_at'); // 'name' | 'price' | 'updated_at'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'in-stock' | 'out-of-stock'

  // Filter and Sort Pipeline
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const isInStock = p.in_stock !== false && (p.stock > 0 || p.stock === undefined);

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (p.title || p.name || '').toLowerCase().includes(q);
        const matchCategory = (p.category || '').toLowerCase().includes(q);
        const matchBrand = (p.brand || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCategory && !matchBrand) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }

      // 3. Stock Level Filter
      if (stockFilter === 'in-stock' && !isInStock) return false;
      if (stockFilter === 'out-of-stock' && isInStock) return false;

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = (a.title || a.name || '').localeCompare(b.title || b.name || '');
      } else if (sortBy === 'price') {
        comparison = (a.selling_price || 0) - (b.selling_price || 0);
      } else {
        const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
        const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
        comparison = dateA - dateB;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy, sortOrder]);

  // Export CSV Helper
  const handleExportCSV = () => {
    if (filteredProducts.length === 0) return;
    const headers = ['ID', 'Product Name', 'Category', 'Pack/Unit', 'Selling Price (₹)', 'MRP (₹)', 'In Stock'];
    const rows = filteredProducts.map(p => [
      p.id,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      p.unit || '',
      p.selling_price,
      p.mrp || p.selling_price,
      p.in_stock !== false ? 'Yes' : 'No'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ganapati_products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              All Products
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your store products, prices, and stock availability.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
              title="Refresh from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
              title="Download CSV report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onAddProduct}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
          {/* Search */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by product name, brand, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter (All / In Stock / Out of Stock) */}
          <div className="sm:col-span-2">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
            >
              <option value="all">Stock: All</option>
              <option value="in-stock">🟢 In Stock Only</option>
              <option value="out-of-stock">🔴 Out of Stock Only</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="sm:col-span-2 flex gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="updated_at">Latest Added</option>
              <option value="name">Name (A-Z)</option>
              <option value="price">Price</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors cursor-pointer"
              title={`Sort order: ${sortOrder.toUpperCase()}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Product</th>
                <th className="py-3.5 px-3 font-semibold">Category</th>
                <th className="py-3.5 px-3 font-semibold text-right">Price</th>
                <th className="py-3.5 px-4 font-semibold text-center">Stock Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-3">
                      <Package className="w-6 h-6" />
                    </div>
                    <p className="font-medium text-slate-600">No products found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try changing your search or add a new product.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isInStock = product.in_stock !== false && (product.stock > 0 || product.stock === undefined);
                  const selling = product.selling_price || 0;
                  const mrp = product.mrp || selling;

                  return (
                    <tr 
                      key={product.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Product Thumbnail & Details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {product.image_url || product.image ? (
                              <img
                                src={product.image_url || product.image}
                                alt={product.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=120&q=80';
                                }}
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-[280px]">
                            <span className="font-semibold text-slate-900 block truncate" title={product.title}>
                              {product.title}
                            </span>
                            {product.unit && (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium mt-0.5 inline-block">
                                {product.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700">
                          {product.category || 'General'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-slate-900 text-sm">
                          ₹{selling.toLocaleString('en-IN')}
                        </div>
                        {mrp > selling && (
                          <div className="text-[10px] text-slate-400 line-through">
                            ₹{mrp.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Stock Status One-Click Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleInStock(product.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            isInStock
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                          }`}
                          title="Click to toggle In Stock / Out of Stock"
                        >
                          {isInStock ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span>In Stock</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              <span>Out of Stock</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${product.title}"?`)) {
                                onDeleteProduct(product.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
