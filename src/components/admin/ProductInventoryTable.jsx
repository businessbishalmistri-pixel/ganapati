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
  Check,
  Tag,
  Filter
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

  return (
    <div className="space-y-3.5">
      
      {/* 🔍 Search & Quick Filter Chips Bar (Mobile Touch Friendly) */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Stock Filter Chips (Horizontal Scrollable on Mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setStockFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              stockFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setStockFilter('in-stock')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              stockFilter === 'in-stock'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>In Stock</span>
          </button>

          <button
            type="button"
            onClick={() => setStockFilter('out-of-stock')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              stockFilter === 'out-of-stock'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>Out of Stock</span>
          </button>

          {/* Category Dropdown */}
          <div className="ml-auto pl-2 flex-shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 📱 Mobile & Tablet View: Touch-Friendly Product Cards */}
      <div className="space-y-2.5 md:hidden">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400">
            <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">No products found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or add a new product.</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isInStock = product.in_stock !== false && (product.stock > 0 || product.stock === undefined);
            const selling = product.selling_price || 0;
            const mrp = product.mrp || selling;

            return (
              <div 
                key={product.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 transition-all active:scale-[0.99]"
              >
                {/* Product Thumbnail */}
                <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
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
                    <Package className="w-6 h-6 text-slate-300" />
                  )}
                </div>

                {/* Center Details */}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-1">
                    {product.title}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {product.unit && (
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                        {product.unit}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 truncate">
                      {product.category}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-sm font-black text-slate-900">
                      ₹{selling.toLocaleString('en-IN')}
                    </span>
                    {mrp > selling && (
                      <span className="text-[10px] text-slate-400 line-through">
                        ₹{mrp.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side: Stock Toggle Switch + Actions */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {/* Clean Toggle Switch (ON = In Stock, OFF = Out of Stock) */}
                  <button
                    type="button"
                    onClick={() => onToggleInStock(product.id)}
                    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                      isInStock ? 'bg-[#005f56]' : 'bg-[#94a3b8]'
                    }`}
                    title={isInStock ? 'In Stock (Click to turn off)' : 'Out of Stock (Click to turn on)'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isInStock ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  {/* Action Icons */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onEditProduct(product)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Edit product"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${product.title}"?`)) {
                          onDeleteProduct(product.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );

          })
        )}
      </div>

      {/* 🖥️ Tablet & Desktop View: Table Grid */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                    <Package className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600">No products found</p>
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

                      {/* Stock Status One-Click Toggle Switch */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleInStock(product.id)}
                          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                            isInStock ? 'bg-[#005f56]' : 'bg-[#94a3b8]'
                          }`}
                          title={isInStock ? 'In Stock (Click to turn off)' : 'Out of Stock (Click to turn on)'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              isInStock ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
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
                              if (window.confirm(`Delete "${product.title}"?`)) {
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
