import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  X,
  Plus, 
  ArrowUpDown, 
  Edit3, 
  Trash2, 
  Download, 
  RefreshCw, 
  Package,
  ChevronRight,
  SlidersHorizontal,
  Star
} from 'lucide-react';
import { smartSearchProducts } from '../../utils/smartSearch';

export function ProductInventoryTable({
  products = [],
  categories = [],
  onEditProduct,
  onAddProduct,
  onDeleteProduct,
  onToggleInStock,
  onTogglePinProduct,
  onRefresh,
  isRefreshing
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'in-stock' | 'out-of-stock'
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = React.useRef(null);

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

  // Filter Pipeline with Smart Search
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

    // 3. Default sort: Starred/pinned items first, then by latest updated
    return [...searched].sort((a, b) => {
      const aPinned = Boolean(a.is_pinned || a.is_starred || a.sub_category === 'pinned');
      const bPinned = Boolean(b.is_pinned || b.is_starred || b.sub_category === 'pinned');
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  return (
    <div className="space-y-3 font-sans">
      
      {/* 🌟 SLIM INVENTORY TOOLBAR */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        
        {/* 📱 MOBILE VIEW: Top Search -> Middle Category -> Bottom Tabs */}
        <div className="sm:hidden space-y-2">
          {/* 1. Top Search */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
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

          {/* 2. Middle Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* 3. Bottom Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs ${
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
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
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
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                stockFilter === 'out-of-stock'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span>Out of Stock ({outOfStockCount})</span>
            </button>
          </div>
        </div>

        {/* 🖥️ DESKTOP & TABLET VIEW: Single Sleek Row */}
        <div className="hidden sm:flex items-center justify-between gap-3">
          
          {/* Left: Filter Tab Options */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs ${
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
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
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
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                stockFilter === 'out-of-stock'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span>Out of Stock ({outOfStockCount})</span>
            </button>
          </div>

          {/* Right: Expandable Search Icon & Category Dropdown */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search as icon button -> expands to search bar when clicked */}
            {isSearchExpanded || searchQuery ? (
              <div className="relative flex items-center animate-fadeIn">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  autoFocus
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 sm:w-60 pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchExpanded(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Close search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsSearchExpanded(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Search products"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs"
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
                        e.currentTarget.style.display = 'none';
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

                      {/* ⭐ Star Pin to Top (Mobile) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePinProduct && onTogglePinProduct(product.id);
                        }}
                        className={`p-1 rounded-full transition-colors cursor-pointer flex items-center justify-center ${
                          product.is_pinned 
                            ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' 
                            : 'text-slate-300 hover:text-amber-400 hover:bg-slate-100'
                        }`}
                        title={product.is_pinned ? "Starred (Shown at top)" : "Star product (Pin to top)"}
                      >
                        <Star className={`w-3.5 h-3.5 transition-colors ${product.is_pinned ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
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
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 block truncate text-xs" title={product.title}>
                                {product.title}
                              </span>
                              {/* ⭐ Star Pin to Top (Desktop after title) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTogglePinProduct && onTogglePinProduct(product.id);
                                }}
                                className={`p-0.5 rounded hover:bg-slate-100 transition-colors inline-flex items-center justify-center cursor-pointer flex-shrink-0 ${
                                  product.is_pinned ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
                                }`}
                                title={product.is_pinned ? "Starred (Shown at top)" : "Star product (Pin to top)"}
                              >
                                <Star className={`w-3.5 h-3.5 transition-colors ${product.is_pinned ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                              </button>
                            </div>
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
