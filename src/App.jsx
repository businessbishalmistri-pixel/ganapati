import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CartDrawer } from './components/CartDrawer';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { ToastContainer } from './components/Toast';
import { inventoryApi } from './services/inventoryApi';
import { useSettings } from './context/SettingsContext';
import { useCart } from './context/CartContext';
import { useToast } from './context/ToastContext';
import { useAuth } from './context/AuthContext';
import { supabase } from './services/supabase';
import {
  SlidersHorizontal,
  ArrowUpDown,
  Package,
  Search,
  RefreshCw,
  ShoppingBag,
  Grid
} from 'lucide-react';
import { smartSearchProducts } from './utils/searchHelper';
import { CategorySidebar } from './components/CategorySidebar';
import { CategoryShelf } from './components/CategoryShelf';
import { MyOrdersModal } from './components/MyOrdersModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { StorePickupModal } from './components/StorePickupModal';
import { fetchSingleProductById } from './services/supabaseStore';
import { WelcomeConfetti } from './components/WelcomeConfetti';
import { AdminApp } from './components/admin/AdminApp';

export function App() {
  const { settings } = useSettings();
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { showToast } = useToast();
  const { customer, currentCustomer } = useAuth();
  const activeCustomer = currentCustomer || customer;

  // Admin Route Detection
  const checkIsAdmin = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path === '/admin' || path.startsWith('/admin/') || hash === '#/admin' || hash === '#admin';
  };

  const [isAdminView, setIsAdminView] = useState(checkIsAdmin);

  const [products, setProducts] = useState(() => inventoryApi.products || []);
  const [loading, setLoading] = useState(() => (!inventoryApi.products || inventoryApi.products.length === 0));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bannerLoaded, setBannerLoaded] = useState(false);

  // Filters & Sorting
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'price-low' | 'price-high' | 'rating' | 'stock'

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [latestOrderInfo, setLatestOrderInfo] = useState(null);

  // Helper to extract productId from current window.location
  const getProductIdFromUrl = () => {
    // 1. Check path: /product/:id or /p/:id (supports trailing slashes)
    const pathname = window.location.pathname;
    const pathMatch = pathname.match(/\/(?:product|p)\/([^/?#]+)/i);
    if (pathMatch && pathMatch[1]) {
      return decodeURIComponent(pathMatch[1]).replace(/\/+$/, '');
    }

    // 2. Check query params: ?p=:id or ?product=:id
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('p') || params.get('product');
    if (paramId) {
      return decodeURIComponent(paramId).trim();
    }

    // 3. Check hash: #/product/:id or #product-:id
    const hash = window.location.hash;
    const hashMatch = hash.match(/#\/?(?:product|p)?\/?([^/?#]+)/i);
    if (hashMatch && hashMatch[1]) {
      return decodeURIComponent(hashMatch[1]).replace(/\/+$/, '');
    }

    return null;
  };

  // Instant Direct Deep-Link Resolution on Initial Mount
  useEffect(() => {
    const urlProductId = getProductIdFromUrl();
    if (urlProductId) {
      fetchSingleProductById(urlProductId).then((prod) => {
        if (prod) {
          setSelectedProduct(prod);
          document.title = `${prod.title || prod.name} — Ganapati Store`;
        }
      });
    }
  }, []);

  // Sync product from URL when products list loads or changes
  useEffect(() => {
    const urlProductId = getProductIdFromUrl();
    if (urlProductId && products.length > 0) {
      const found = products.find((p) => String(p.id).toLowerCase() === String(urlProductId).toLowerCase());
      if (found) {
        setSelectedProduct(found);
        document.title = `${found.title || found.name} — Ganapati Store`;
      }
    }
  }, [products]);

  // Handle Browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const isNowAdmin = checkIsAdmin();
      setIsAdminView(isNowAdmin);

      if (isNowAdmin) {
        document.title = 'Ganapati Stores — Admin Dashboard';
        return;
      }

      const urlProductId = getProductIdFromUrl();
      if (urlProductId) {
        const found = products.find((p) => String(p.id).toLowerCase() === String(urlProductId).toLowerCase());
        if (found) {
          setSelectedProduct(found);
          document.title = `${found.title || found.name} — Ganapati Store`;
        } else {
          fetchSingleProductById(urlProductId).then((prod) => {
            if (prod) {
              setSelectedProduct(prod);
              document.title = `${prod.title || prod.name} — Ganapati Store`;
            } else {
              setSelectedProduct(null);
              document.title = 'Ganapati Store — Fresh Groceries & Daily Essentials';
            }
          });
        }
      } else {
        setSelectedProduct(null);
        document.title = 'Ganapati Store — Fresh Groceries & Daily Essentials';
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  // Navigate to Admin
  const handleNavigateToAdmin = () => {
    window.history.pushState({ view: 'admin' }, '', '/admin');
    setIsAdminView(true);
    document.title = 'Ganapati Stores — Admin Dashboard';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to Storefront
  const handleNavigateToStore = () => {
    window.history.pushState({ view: 'store' }, '', '/');
    setIsAdminView(false);
    setSelectedProduct(null);
    document.title = 'Ganapati Store — Fresh Groceries & Daily Essentials';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle selecting a product with clean URL update
  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    if (prod) {
      window.history.pushState({ productId: prod.id }, '', `/product/${prod.id}`);
      document.title = `${prod.title || prod.name} — Ganapati Store`;
    } else {
      window.history.pushState({}, '', '/');
      document.title = 'Ganapati Store — Fresh Groceries & Daily Essentials';
    }
  };

  // Handle navigating back to home
  const handleBackToShop = () => {
    setSelectedProduct(null);
    window.history.pushState({}, '', '/');
    document.title = 'Ganapati Store — Fresh Groceries & Daily Essentials';
  };

  // Dynamically extract unique categories from actual products
  const dynamicCategories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      if (p.category && typeof p.category === 'string' && p.category.trim()) {
        cats.add(p.category.trim());
      }
    });
    return ['All Products', ...Array.from(cats)];
  }, [products]);

  // Subscribe to real-time inventory updates
  useEffect(() => {
    const unsubscribe = inventoryApi.subscribe((updatedProducts) => {
      setProducts(updatedProducts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter & Sort computation with Smart Typo-Tolerant Search
  const filteredProducts = useMemo(() => {
    // 1. Filter by category
    const categoryFiltered = products.filter((p) => {
      return (
        selectedCategory === 'All Products' ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase())
      );
    });

    // 2. Apply smart typo-tolerant fuzzy search
    const searched = searchQuery.trim()
      ? smartSearchProducts(categoryFiltered, searchQuery)
      : categoryFiltered;

    // 3. Apply sorting: Starred/pinned products always float to the top
    return [...searched].sort((a, b) => {
      const aPinned = Boolean(a.is_pinned || a.is_starred || a.sub_category === 'pinned');
      const bPinned = Boolean(b.is_pinned || b.is_starred || b.sub_category === 'pinned');
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'stock') return b.stock - a.stock;
      return 0; // relevance / featured default
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const inStockCount = products.filter((p) => p.stock > 0).length;

  // Render Admin View if on /admin
  if (isAdminView) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <ToastContainer />
        <AdminApp onNavigateToStore={handleNavigateToStore} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FBFA] flex flex-col selection:bg-emerald-500 selection:text-white relative [overflow-x:clip]">
      {/* Top Organic Ambient Green Gradient (matching reference app environment) */}
      <div className="absolute top-0 inset-x-0 h-[420px] bg-gradient-to-b from-emerald-500/18 via-emerald-200/20 via-50% to-transparent pointer-events-none z-0" />

      {/* Gentle Welcome Confetti on Screen Load */}
      <WelcomeConfetti />

      {/* Navigation */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onHomeClick={handleBackToShop}
      />

      {/* Main View: Full Product Detail Page OR Store Catalog */}
      {selectedProduct ? (
        <ProductDetailPage
          product={selectedProduct}
          allProducts={products}
          onBack={handleBackToShop}
          onSelectProduct={handleSelectProduct}
        />
      ) : (
        <>
          {/* Store Banner Image with Shimmer Skeleton (Rendered only when bannerImageUrl is configured) */}
          {settings?.bannerImageUrl ? (
            <section className="w-full border-b border-slate-200/80">
              <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
                <div className="relative w-full overflow-hidden rounded-xl bg-slate-100 min-h-[90px] sm:min-h-[140px] shadow-xs">
                  {!bannerLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse z-0" />
                  )}
                  <img
                    key={settings.bannerImageUrl}
                    src={settings.bannerImageUrl}
                    alt={settings?.storeName ? `${settings.storeName} — Fresh Groceries & Daily Essentials` : "Ganapati Store"}
                    className={`w-full h-auto block rounded-xl relative z-1 transition-opacity duration-300 ${bannerLoaded ? 'opacity-100' : 'opacity-0'}`}
                    loading="eager"
                    fetchpriority="high"
                    onLoad={() => setBannerLoaded(true)}
                    onError={() => setBannerLoaded(true)}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {/* Catalog Main 2-Column Split Layout Area (Mobile & Desktop) */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-8 py-2.5 sm:py-4">

            <div className="flex flex-row gap-2 sm:gap-3.5 lg:gap-5 items-start">

              {/* Left Column: Blinkit-Style Vertical Category Rail */}
              <CategorySidebar
                categories={dynamicCategories}
                products={products}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  setSearchQuery('');
                }}
              />

              {/* Right Column: High-Density Product Catalog */}
              <div className="flex-1 min-w-0 space-y-3">

                {/* Department Header & Sort Bar */}
                <div className="flex items-center justify-between gap-2 py-1.5 sm:py-2 border-b border-slate-200/80 -mx-1 px-1 sm:mx-0 sm:px-0">
                  
                  {/* Left: Category Title (desktop only) + Items Badge + Clear Filter */}
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 flex-wrap">
                    
                    {/* Category Title: hidden on mobile, shown on desktop */}
                    <div className="hidden sm:flex items-center gap-1.5 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0" />
                      <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 leading-snug truncate">
                        {selectedCategory}
                      </h2>
                    </div>

                    {/* Items Badge */}
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md whitespace-nowrap flex-shrink-0">
                      {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
                    </span>

                    {/* Clear Filter Button */}
                    {selectedCategory !== 'All Products' && (
                      <button
                        onClick={() => setSelectedCategory('All Products')}
                        className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-2 py-0.5 rounded-md transition-colors cursor-pointer whitespace-nowrap shadow-2xs flex-shrink-0"
                      >
                        Clear Filter &times;
                      </button>
                    )}
                  </div>

                  {/* Right: Sorting dropdown */}
                  <div className="flex items-center gap-1.5 ml-auto bg-white border border-slate-200 rounded-lg px-2 py-0.5 sm:px-2.5 sm:py-1 shadow-xs flex-shrink-0">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer pr-3 pl-0.5 py-0.5"
                      style={{ backgroundImage: 'none' }}
                    >
                      <option value="featured">Featured First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="stock">Most in Stock</option>
                    </select>
                  </div>
                </div>

                {/* Products Grid Skeleton / Content */}
                {loading ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-2.5">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="bg-white rounded border border-slate-200/80 p-1.5 sm:p-2 flex flex-col justify-between overflow-hidden shadow-2xs space-y-1.5">
                          {/* Image Skeleton Box with shimmer */}
                          <div className="aspect-square bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse rounded relative overflow-hidden">
                            <div className="absolute bottom-1 right-1 w-9 h-5 bg-slate-300/80 rounded" />
                          </div>
                          {/* Title Skeleton Lines */}
                          <div className="space-y-1 pt-1">
                            <div className="h-2.5 bg-slate-200 rounded w-full animate-pulse" />
                            <div className="h-2.5 bg-slate-200 rounded w-3/4 animate-pulse" />
                            <div className="h-2 bg-slate-100 rounded w-1/2 animate-pulse" />
                          </div>
                          {/* Price Skeleton */}
                          <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse pt-0.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="bg-white rounded p-8 text-center border border-slate-200/90 space-y-2.5 max-w-md mx-auto my-4 shadow-xs">
                    <div className="w-10 h-10 rounded bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">No matching products found</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Try searching with different keywords or switch department categories.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCategory('All Products');
                        setSearchQuery('');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded transition-colors shadow-xs"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  /* Unified High-Density Product Grid: All Items Together One After Another */
                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-2.5">
                    {filteredProducts.map((product, idx) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelectProduct={handleSelectProduct}
                        priority={idx < 8}
                      />
                    ))}
                  </div>
                )}

              </div>

            </div>

          </main>
        </>
      )}

      {/* Floating Cart Button on Mobile */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 sm:hidden animate-slide-up">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded font-bold text-xs uppercase tracking-wider shadow-xl shadow-emerald-600/30 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>View Cart ({totalItemsCount})</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 mt-16 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span className="font-bold text-slate-900">{settings?.storeName || 'Ganapati Store'}</span>
            {settings?.storeAddress && (
              <>
                <span className="hidden sm:inline text-slate-300">&bull;</span>
                <span className="text-slate-600 font-medium">{settings.storeAddress}</span>
              </>
            )}
            {settings?.storeHours && (
              <>
                <span className="hidden sm:inline text-slate-300">&bull;</span>
                <span className="text-slate-500">{settings.storeHours}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Direct WhatsApp Quick Dispatch</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CartDrawer />

      <OrderSuccessModal
        orderDetails={latestOrderInfo}
        onClose={() => setLatestOrderInfo(null)}
      />

      <MyOrdersModal />

      <CustomerProfileModal />
      <StorePickupModal />
    </div>
  );
}
