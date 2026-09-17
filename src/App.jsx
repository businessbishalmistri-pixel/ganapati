import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Grid,
  Star,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { smartSearchProducts } from './utils/searchHelper';
import { CategorySidebar } from './components/CategorySidebar';
import { CategoryShelf } from './components/CategoryShelf';
import { CategoryGrid } from './components/CategoryGrid';
import { MyOrdersModal } from './components/MyOrdersModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { StorePickupModal } from './components/StorePickupModal';
import { fetchSingleProductById } from './services/supabaseStore';
import { WelcomeConfetti } from './components/WelcomeConfetti';
import { AdminApp } from './components/admin/AdminApp';
import { MobileBottomNav } from './components/MobileBottomNav';

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

  // Filters & Sorting: selectedCategory is null on home view
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryKeywords, setSelectedCategoryKeywords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured'); // 'featured' | 'price-low' | 'price-high' | 'rating' | 'stock'

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [latestOrderInfo, setLatestOrderInfo] = useState(null);
  const scrollPosRef = useRef(0);

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
        setSelectedProduct((prev) => {
          if (prev) {
            const targetScroll = scrollPosRef.current || 0;
            requestAnimationFrame(() => {
              window.scrollTo({ top: targetScroll, behavior: 'auto' });
            });
          }
          return null;
        });
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

  // Handle selecting a product with clean URL update & scroll position tracking
  const handleSelectProduct = (prod) => {
    if (prod) {
      scrollPosRef.current = window.scrollY || document.documentElement.scrollTop || 0;
      setSelectedProduct(prod);
      window.history.pushState({ productId: prod.id }, '', `/product/${prod.id}`);
      document.title = `${prod.title || prod.name} — Ganapati Store`;
    } else {
      handleCloseProduct();
    }
  };

  // Handle closing product detail: preserves category & search filters and restores exact scroll position
  const handleCloseProduct = () => {
    setSelectedProduct(null);
    window.history.pushState({}, '', '/');
    document.title = 'Ganapati Store — Fresh Groceries & Daily Essentials';
    const targetScroll = scrollPosRef.current || 0;
    requestAnimationFrame(() => {
      window.scrollTo({ top: targetScroll, behavior: 'auto' });
      setTimeout(() => {
        window.scrollTo({ top: targetScroll, behavior: 'auto' });
      }, 50);
    });
  };

  // Handle explicitly navigating completely back to all categories home
  const handleBackToShop = () => {
    setSelectedProduct(null);
    setSelectedCategory(null);
    setSelectedCategoryKeywords([]);
    setSearchQuery('');
    window.history.pushState({}, '', '/');
    document.title = 'Ganapati Store — Fresh Groceries & Daily Essentials';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Shift user directly to search/catalog view when clicking or focusing search
  const handleSearchFocus = () => {
    if (selectedProduct) {
      setSelectedProduct(null);
    }
    if (!selectedCategory) {
      setSelectedCategory('All Products');
      setSelectedCategoryKeywords([]);
    }
  };

  // Handle Mobile Bottom Nav Search Click: focuses mobile search input and shifts to catalog view directly
  const handleMobileSearchClick = () => {
    handleSearchFocus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const input = document.getElementById('mobile-search-input');
      if (input) {
        input.focus();
      }
    }, 100);
  };

  // Dynamic back button label depending on where the user clicked the product
  const backLabel = useMemo(() => {
    if (searchQuery.trim()) {
      return `Back to Search: "${searchQuery.trim()}"`;
    }
    if (selectedCategory && selectedCategory !== 'All Products') {
      return `Back to ${selectedCategory}`;
    }
    return 'Back to Home';
  }, [searchQuery, selectedCategory]);

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
    // 1. Filter by category (if selected and not 'All Products')
    const categoryFiltered = products.filter((p) => {
      if (!selectedCategory || selectedCategory === 'All Products') return true;
      const catLower = (p.category || '').toLowerCase();
      const targetLower = selectedCategory.toLowerCase();
      if (catLower === targetLower) return true;
      if (selectedCategoryKeywords && selectedCategoryKeywords.length > 0) {
        return selectedCategoryKeywords.some(
          (k) => catLower.includes(k) || (p.title && p.title.toLowerCase().includes(k)) || (p.name && p.name.toLowerCase().includes(k))
        );
      }
      return false;
    });

    // 2. Apply smart typo-tolerant fuzzy search
    const searched = searchQuery.trim()
      ? smartSearchProducts(selectedCategory ? categoryFiltered : products, searchQuery)
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
  }, [products, selectedCategory, selectedCategoryKeywords, searchQuery, sortBy]);

  const starredProducts = useMemo(() => {
    const list = products.filter((p) => Boolean(p.is_pinned || p.is_starred || p.sub_category === 'pinned' || p.featured));
    return list.length > 0 ? list : products.slice(0, 10);
  }, [products]);

  const inStockCount = products.filter((p) => p.stock > 0).length;
  const isHomeView = !searchQuery.trim() && !selectedCategory;

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
    <div className="min-h-screen bg-white flex flex-col selection:bg-emerald-500 selection:text-white relative [overflow-x:clip]">
      {/* Gentle Welcome Confetti on Screen Load */}
      <WelcomeConfetti />

      {/* Navigation */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onHomeClick={handleBackToShop}
        onSearchFocus={handleSearchFocus}
      />

      {/* Main View: Full Product Detail Page OR Store Catalog */}
      {selectedProduct ? (
        <ProductDetailPage
          product={selectedProduct}
          allProducts={products}
          onBack={handleCloseProduct}
          backLabel={backLabel}
          onSelectProduct={handleSelectProduct}
        />
      ) : (
        <>
          {/* Store Banner Image with Shimmer Skeleton (Shown only on Home view) */}
          {isHomeView && settings?.bannerImageUrl ? (
            <section className="w-full pt-3 sm:pt-4">
              <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
                <div className="relative w-full overflow-hidden rounded-[16px] bg-slate-100 min-h-[90px] sm:min-h-[140px] shadow-2xs">
                  {!bannerLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse z-0" />
                  )}
                  <img
                    key={settings.bannerImageUrl}
                    src={settings.bannerImageUrl}
                    alt={settings?.storeName ? `${settings.storeName} — Fresh Groceries & Daily Essentials` : "Ganapati Store"}
                    className={`w-full h-auto block rounded-[16px] relative z-1 transition-opacity duration-300 ${bannerLoaded ? 'opacity-100' : 'opacity-0'}`}
                    loading="eager"
                    fetchpriority="high"
                    onLoad={() => setBannerLoaded(true)}
                    onError={() => setBannerLoaded(true)}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-5">
            {isHomeView ? (
              /* HOME VIEW: CATEGORIES GRID & STAR PRODUCTS */
              <div className="py-2 space-y-6 sm:space-y-8">
                {/* Categories Grid */}
                <CategoryGrid
                  categories={dynamicCategories}
                  products={products}
                  onSelectCategory={(catName, catKeywords = []) => {
                    setSelectedCategory(catName);
                    setSelectedCategoryKeywords(catKeywords || []);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />

                {/* Star Products Section */}
                {starredProducts.length > 0 && (
                  <section className="space-y-3 sm:space-y-4 pt-2">
                    {/* Header */}
                    <div className="flex items-center gap-2 pb-1">
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        Recommended
                      </h2>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 sm:gap-2.5">
                      {starredProducts.map((product, idx) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onSelectProduct={handleSelectProduct}
                          priority={idx < 6}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              /* SEARCH & CATEGORY CATALOG VIEW */
              <div className="flex flex-row gap-2 sm:gap-3.5 lg:gap-5 items-start">

                {/* Left Column: Category Rail */}
                <CategorySidebar
                  categories={dynamicCategories}
                  products={products}
                  selectedCategory={selectedCategory || 'All Products'}
                  onSelectCategory={(cat) => {
                    if (cat === 'All Products') {
                      setSelectedCategory('All Products');
                    } else {
                      setSelectedCategory(cat);
                    }
                    setSearchQuery('');
                  }}
                />

                {/* Right Column: Product Catalog & Search Results */}
                <div className="flex-1 min-w-0 space-y-3">

                  {/* Header Bar: Navigation back to home, Title & Sort */}
                  <div className="flex items-center justify-between gap-2 py-2 -mx-1 px-1 sm:mx-0 sm:px-0">
                    
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Back to All Categories Home Button (Shown on Tablet & Desktop, hidden on Mobile) */}
                      <button
                        onClick={handleBackToShop}
                        className="hidden sm:flex p-1.5 -ml-1 rounded-full text-slate-700 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer items-center justify-center flex-shrink-0"
                        title="Back to Categories"
                        aria-label="Back to Categories"
                      >
                        <ArrowLeft className="w-4.5 h-4.5" />
                      </button>

                      {/* Active Title */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-600 flex-shrink-0" />
                        <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 truncate">
                          {searchQuery.trim()
                            ? `Search: "${searchQuery}"`
                            : selectedCategory || 'All Products'}
                        </h2>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {filteredProducts.length}
                        </span>
                      </div>

                      {/* Clear Search / Filter */}
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Clear Search &times;
                        </button>
                      )}
                    </div>

                    {/* Sorting dropdown */}
                    <div className="flex items-center gap-1 bg-white rounded-xl px-2.5 py-1 shadow-2xs flex-shrink-0">
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer pr-2 pl-0.5 py-0.5"
                        style={{ backgroundImage: 'none' }}
                      >
                        <option value="featured">Featured</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="stock">Most in Stock</option>
                      </select>
                    </div>
                  </div>

                  {/* Products Grid Skeleton / Content */}
                  {loading ? (
                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 sm:gap-2.5">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-1.5 sm:p-2 flex flex-col justify-between overflow-hidden shadow-2xs space-y-1.5">
                          <div className="aspect-square bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse rounded-2xl relative overflow-hidden" />
                          <div className="space-y-1 pt-1">
                            <div className="h-2.5 bg-slate-200 rounded-full w-full animate-pulse" />
                            <div className="h-2.5 bg-slate-200 rounded-full w-3/4 animate-pulse" />
                          </div>
                          <div className="h-4 bg-slate-200 rounded-full w-1/3 animate-pulse pt-0.5" />
                        </div>
                      ))}
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="bg-white rounded p-8 text-center border border-slate-200/90 space-y-2.5 max-w-md mx-auto my-6 shadow-xs">
                      <div className="w-10 h-10 rounded bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Search className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">No matching products found</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Try searching with different keywords or browse another category.
                        </p>
                      </div>
                      <button
                        onClick={handleBackToShop}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                      >
                        Back to Categories
                      </button>
                    </div>
                  ) : (
                    /* Products Grid */
                    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 sm:gap-2.5">
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
            )}
          </main>
        </>
      )}

      {/* Dedicated Mobile Bottom Navigation (Visible strictly on mobile screens, hidden on tablet & desktop) */}
      <MobileBottomNav
        isHomeView={isHomeView}
        onHomeClick={handleBackToShop}
        onSearchClick={handleMobileSearchClick}
        searchQuery={searchQuery}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 mt-16 py-8 px-4 sm:px-6 lg:px-8 mb-16 sm:mb-0">
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
