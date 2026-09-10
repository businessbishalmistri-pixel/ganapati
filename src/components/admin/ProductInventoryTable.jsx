import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  ArrowUpDown, 
  Edit3, 
  Trash2, 
  Download, 
  RefreshCw, 
  Package,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import { smartSearchProducts } from '../../utils/smartSearch';

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

  // Counts calculation
  const categoryProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const inStockCount = useMemo(() => {
    return categoryProducts.filter(p => p.in_stock !== false && (p.stock > 0 || p.stock === undefined)).length;
  }, [categoryProducts]);

  const outOfStockCount = useMemo(() => {
    return categoryProducts.filter(p => p.in_stock === false || p.stock === 0).length;
  }, [categoryProducts]);

  // Filter and Sort Pipeline with Smart Search
  const filteredProducts = useMemo(() => {
    // 1. Filter by Category & Stock status first
    const baseFiltered = products.filter((p) => {
      const isInStock = p.in_stock !== false && (p.stock > 0 || p.stock === undefined);

      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }

      if (stockFilter === 'in-stock' && !isInStock) return false;
      if (stockFilter === 'out-of-stock' && isInStock) return false;

      return true;
    });

    // 2. Apply Smart Typo-Tolerant & Phonetic Search
    const searched = searchQuery.trim()
      ? smartSearchProducts(baseFiltered, searchQuery)
      : baseFiltered;

    // 3. Sort (preserve relevance order if default sort, otherwise sort explicitly)
    return [...searched].sort((a, b) => {
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
    <div className="space-y-3 font-sans">
      
      {/* 🌟 SLIM TOOLBAR */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-2.5">
        
        {/* Search Input Row + Sort & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Smart Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products (smart search)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Action Buttons & Sorting */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 flex-shrink-0">
            {/* Sort Dropdown & Toggle */}
            <div className="flex items-center gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="updated_at">Latest</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                title={`Sort: ${sortOrder.toUpperCase()}`}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Scrollable Filter Chips (All, In Stock, Out of Stock, Category) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setStockFilter('all')}
            className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs ${
              stockFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({categoryProducts.length})
          </button>

          <button
            type="button"
            onClick={() => setStockFilter('in-stock')}
            className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
              stockFilter === 'in-stock'
                ? 'bg-[#005f56] text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>In Stock ({inStockCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStockFilter('out-of-stock')}
            className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
              stockFilter === 'out-of-stock'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            <span>Out of Stock ({outOfStockCount})</span>
          </button>

          {/* Category Dropdown */}
          <div className="ml-auto pl-1 flex-shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 📱 MOBILE WIDGET CARDS VIEW (Polished & Compact) */}
      <div className="space-y-2 md:hidden">
        {/* List Header */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Products List ({filteredProducts.length})
          </span>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setStockFilter('all');
            }}
            className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center text-slate-400 shadow-xs">
            <Package className="w-8 h-8 mx-auto mb-1.5 text-slate-300" />
            <p className="font-bold text-slate-700 text-xs">No products found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try a different search or clear filters.</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isInStock = product.in_stock !== false && (product.stock > 0 || product.stock === undefined);
            const selling = product.selling_price || 0;
            const mrp = product.mrp || selling;

            return (
              <div 
                key={product.id}
                className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex gap-3 items-center transition-all"
              >
                {/* 1. Left: Product Thumbnail */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-slate-100 border border-slate-200/60 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                  {product.image_url || product.image ? (
                    <img
                      src={product.image_url || product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=160&q=80';
                      }}
                    />
                  ) : (
                    <Package className="w-7 h-7 text-slate-300" />
                  )}
                </div>

                {/* 2. Right: Content Block */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-1">
                  {/* Top Row: Title on Left, Price on Right */}
                  <div className="flex items-start justify-between gap-1.5">
                    <h3 className="font-bold text-sm text-slate-900 leading-tight truncate" title={product.title}>
                      {product.title}
                    </h3>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-extrabold text-slate-900 font-mono block">
                        ₹{selling.toLocaleString('en-IN')}
                      </span>
                      {mrp > selling && (
                        <span className="text-[10px] text-slate-400 line-through font-mono block">
                          ₹{mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subtitle: Pack/Unit & Category */}
                  <p className="text-[11px] text-slate-400 leading-tight truncate">
                    {product.unit ? `QTY: ${product.unit}` : 'Standard Pack'} {product.category ? `• ${product.category}` : ''}
                  </p>

                  {/* Bottom Row: Stock Toggle Pill + Edit on Left, Red Trash Icon on Right */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      {/* Interactive Stock Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => onToggleInStock(product.id)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                          isInStock ? 'bg-[#005f56]' : 'bg-[#94a3b8]'
                        }`}
                        title={isInStock ? 'In Stock (Click to turn off)' : 'Out of Stock (Click to turn on)'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            isInStock ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Stock Label */}
                      <span className={`text-[10px] font-bold ${
                        isInStock ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        {isInStock ? 'In stock' : 'Out'}
                      </span>

                      {/* Edit Button */}
                      <button
                        onClick={() => onEditProduct(product)}
                        className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-0.5 transition-colors cursor-pointer"
                      >
                        <span>Edit</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>

                    {/* Red Outline Trash Button */}
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${product.title}"?`)) {
                          onDeleteProduct(product.id);
                        }
                      }}
                      className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🖥️ TABLET & DESKTOP VIEW: Full Table Grid */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[250px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3 font-semibold text-center w-20">Stock</th>
                <th className="py-2.5 px-3 font-semibold">Product</th>
                <th className="py-2.5 px-2.5 font-semibold">Category</th>
                <th className="py-2.5 px-2.5 font-semibold text-right">Price</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-400">
                    <Package className="w-7 h-7 mx-auto mb-1.5 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-xs">No products found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try clearing your filters or add a new product.</p>
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
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. FRONT COLUMN: Clean Stock Status Toggle Switch */}
                      <td className="py-2 px-3 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => onToggleInStock(product.id)}
                          className={`relative inline-flex h-6 w-10 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                            isInStock ? 'bg-[#005f56]' : 'bg-[#94a3b8]'
                          }`}
                          title={isInStock ? 'In Stock (Click to turn off)' : 'Out of Stock (Click to turn on)'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              isInStock ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* 2. Product Thumbnail & Title */}
                      <td className="py-2 px-3 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/80 overflow-hidden flex-shrink-0 flex items-center justify-center">
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
                              <Package className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-[280px] lg:max-w-md">
                            <span className="font-bold text-slate-900 block truncate text-xs" title={product.title}>
                              {product.title}
                            </span>
                            {product.unit && (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium mt-0.5 inline-block">
                                {product.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Category */}
                      <td className="py-2 px-2.5 align-middle">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 whitespace-nowrap">
                          {product.category || 'General'}
                        </span>
                      </td>

                      {/* 4. Price */}
                      <td className="py-2 px-2.5 text-right align-middle">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm font-mono">
                          ₹{selling.toLocaleString('en-IN')}
                        </div>
                        {mrp > selling && (
                          <div className="text-[10px] text-slate-400 line-through font-mono">
                            ₹{mrp.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      {/* 5. Action Icons */}
                      <td className="py-2 px-3 text-right align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200/60 transition-colors cursor-pointer"
                            title="Edit product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Delete "${product.title}"?`)) {
                                onDeleteProduct(product.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200/60 transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
