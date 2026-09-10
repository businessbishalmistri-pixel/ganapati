import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  ArrowUpDown, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Download, 
  RefreshCw, 
  Package,
  Layers,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
  Minus
} from 'lucide-react';

export function ProductInventoryTable({
  products = [],
  viewFilter = 'all', // 'all' | 'low-stock' | 'expired' | 'draft'
  categories = [],
  onEditProduct,
  onAddProduct,
  onDeleteProduct,
  onQuickStockChange,
  onToggleStatus,
  onRefresh,
  isRefreshing
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('updated_at'); // 'name' | 'price' | 'stock' | 'expiry' | 'updated_at'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'in-stock' | 'low-stock' | 'out-of-stock'

  // Filter and Sort Pipeline
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Navigation View Filter
      if (viewFilter === 'low-stock') {
        const threshold = p.low_stock_threshold || 5;
        if (p.stock > threshold) return false;
      } else if (viewFilter === 'expired') {
        if (!p.isExpired && !p.isExpiringSoon) return false;
      } else if (viewFilter === 'draft') {
        if (p.status !== 'draft') return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (p.title || p.name || '').toLowerCase().includes(q);
        const matchSku = (p.sku || '').toLowerCase().includes(q);
        const matchCategory = (p.category || '').toLowerCase().includes(q);
        const matchBrand = (p.brand || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSku && !matchCategory && !matchBrand) return false;
      }

      // 3. Category Filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }

      // 4. Stock Level Filter
      if (stockFilter === 'in-stock' && p.stock <= (p.low_stock_threshold || 5)) return false;
      if (stockFilter === 'low-stock' && (p.stock > (p.low_stock_threshold || 5) || p.stock === 0)) return false;
      if (stockFilter === 'out-of-stock' && p.stock > 0) return false;

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = (a.title || a.name || '').localeCompare(b.title || b.name || '');
      } else if (sortBy === 'price') {
        comparison = (a.selling_price || 0) - (b.selling_price || 0);
      } else if (sortBy === 'stock') {
        comparison = (a.stock || 0) - (b.stock || 0);
      } else if (sortBy === 'expiry') {
        const dateA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
        const dateB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
        comparison = dateA - dateB;
      } else {
        const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
        const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
        comparison = dateA - dateB;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [products, viewFilter, searchQuery, selectedCategory, stockFilter, sortBy, sortOrder]);

  // Export CSV Helper
  const handleExportCSV = () => {
    if (filteredProducts.length === 0) return;
    const headers = ['ID', 'Title', 'Category', 'SKU', 'Selling Price (₹)', 'MRP (₹)', 'Cost Price (₹)', 'Stock', 'Low Stock Threshold', 'Expiry Date', 'Status'];
    const rows = filteredProducts.map(p => [
      p.id,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      p.sku || '',
      p.selling_price,
      p.mrp,
      p.cost_price,
      p.stock,
      p.low_stock_threshold,
      p.expiry_date || 'N/A',
      p.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ganapati_inventory_${viewFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSectionTitle = () => {
    switch (viewFilter) {
      case 'low-stock': return 'Low Stock Alerts';
      case 'expired': return 'Expired & Expiring Products';
      case 'draft': return 'Draft Products';
      default: return 'All Products & Inventory';
    }
  };

  const getSectionSubtitle = () => {
    switch (viewFilter) {
      case 'low-stock': return 'Products whose available inventory has reached or fallen below the threshold.';
      case 'expired': return 'Products past expiration date or expiring within the next 30 days.';
      case 'draft': return 'Items saved in draft state that are not published on the storefront.';
      default: return 'Comprehensive view of all catalog products with real-time stock and prices.';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {getSectionTitle()}
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {getSectionSubtitle()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
              title="Refresh live from database"
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
              placeholder="Search by title, SKU, category, brand..."
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

          {/* Stock Level Filter */}
          <div className="sm:col-span-2">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="all">Stock: All</option>
              <option value="in-stock">In Stock (&gt; Low)</option>
              <option value="low-stock">Low Stock (≤ Limit)</option>
              <option value="out-of-stock">Out of Stock (0)</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="sm:col-span-2 flex gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="updated_at">Latest</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="stock">Stock</option>
              <option value="expiry">Expiry</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-colors"
              title={`Sort order: ${sortOrder.toUpperCase()}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Product</th>
                <th className="py-3.5 px-3 font-semibold">Category</th>
                <th className="py-3.5 px-3 font-semibold text-right">Selling / MRP</th>
                <th className="py-3.5 px-3 font-semibold text-right">Cost Price</th>
                <th className="py-3.5 px-4 font-semibold text-center">Stock & Level</th>
                <th className="py-3.5 px-3 font-semibold text-center">Expiry Date</th>
                <th className="py-3.5 px-3 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-3">
                      <Package className="w-6 h-6" />
                    </div>
                    <p className="font-medium text-slate-600">No products found matching your filters</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try adjusting the search query, category filter or add a new product.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLow = product.stock <= (product.low_stock_threshold || 5) && product.stock > 0;
                  const isOut = product.stock === 0;

                  // Price calculations
                  const selling = product.selling_price || 0;
                  const mrp = product.mrp || selling;
                  const cost = product.cost_price || 0;
                  const marginPct = selling > cost && cost > 0 ? Math.round(((selling - cost) / selling) * 100) : 0;

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
                          <div className="min-w-0 max-w-[220px]">
                            <span className="font-semibold text-slate-900 block truncate" title={product.title}>
                              {product.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-400">
                                {product.sku || 'NO-SKU'}
                              </span>
                              {product.unit && (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                  {product.unit}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700">
                          {product.category || 'General'}
                        </span>
                      </td>

                      {/* Selling / MRP */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-slate-900">
                          ₹{selling.toLocaleString('en-IN')}
                        </div>
                        {mrp > selling && (
                          <div className="text-[10px] text-slate-400 line-through">
                            ₹{mrp.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-medium text-slate-600">
                          ₹{cost.toLocaleString('en-IN')}
                        </div>
                        {marginPct > 0 && (
                          <span className="text-[10px] font-semibold text-emerald-600">
                            +{marginPct}% margin
                          </span>
                        )}
                      </td>

                      {/* Stock & Fast Adjuster */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onQuickStockChange(product.id, Math.max(0, product.stock - 1))}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors text-xs font-bold"
                            title="Decrease stock by 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <div className="min-w-[40px] px-1 text-center">
                            <span className={`font-bold font-mono text-sm ${
                              isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                            }`}>
                              {product.stock}
                            </span>
                          </div>

                          <button
                            onClick={() => onQuickStockChange(product.id, product.stock + 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors text-xs font-bold"
                            title="Increase stock by 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Status Badge */}
                        <div className="mt-1">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              Low Stock (≤{product.low_stock_threshold || 5})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                              In Stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3 px-3 text-center">
                        {product.expiry_date ? (
                          <div>
                            <span className="font-mono text-[11px] text-slate-700 block">
                              {product.expiry_date}
                            </span>
                            {product.isExpired ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded mt-0.5">
                                <AlertTriangle className="w-3 h-3" /> Expired
                              </span>
                            ) : product.isExpiringSoon ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5">
                                <Clock className="w-3 h-3" /> In {product.daysUntilExpiry}d
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Valid</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Status (Active / Draft) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onToggleStatus(product.id)}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                            product.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                          title="Click to toggle Active / Draft"
                        >
                          {product.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Live</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-slate-500" />
                              <span>Draft</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${product.title}" from inventory?`)) {
                                onDeleteProduct(product.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
