import React, { useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, ArrowUpDown, Package } from 'lucide-react';
import { ProductCard } from './ProductCard';

export const MobileCategoryView = ({
  categories = [],
  products = [],
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
  onBackToHome,
  sortBy,
  setSortBy,
  loading = false,
}) => {
  const sectionRefs = useRef({});
  const pillBarRef = useRef(null);
  const isInitialScrollDone = useRef(false);

  // Group products by category
  const categorySections = useMemo(() => {
    // Collect all unique categories from enriched categories and active products
    const sectionList = [];
    const handledCategoryNames = new Set();

    // 1. Process defined categories in order
    categories.forEach((cat) => {
      const catName = typeof cat === 'object' && cat?.name ? cat.name.trim() : String(cat).trim();
      if (!catName || catName.toLowerCase() === 'all products') return;

      const lower = catName.toLowerCase();
      if (handledCategoryNames.has(lower)) return;
      handledCategoryNames.add(lower);

      const matchingProducts = products.filter((p) => {
        const pCat = (p.category || '').toLowerCase().trim();
        return pCat === lower;
      });

      if (matchingProducts.length > 0) {
        // Sort products inside this section
        const sorted = [...matchingProducts].sort((a, b) => {
          const aPinned = Boolean(a.is_pinned || a.is_starred || a.sub_category === 'pinned');
          const bPinned = Boolean(b.is_pinned || b.is_starred || b.sub_category === 'pinned');
          if (aPinned && !bPinned) return -1;
          if (!aPinned && bPinned) return 1;

          if (sortBy === 'price-low') return a.price - b.price;
          if (sortBy === 'price-high') return b.price - a.price;
          if (sortBy === 'rating') return b.rating - a.rating;
          if (sortBy === 'stock') return b.stock - a.stock;
          return 0;
        });

        sectionList.push({
          id: cat.id || `sec_${lower.replace(/[^a-z0-9]+/g, '_')}`,
          name: catName,
          slug: lower.replace(/[^a-z0-9]+/g, '-'),
          image: typeof cat === 'object' ? (cat.image_url || cat.image) : null,
          products: sorted,
        });
      }
    });

    // 2. Discover any uncategorized or miscellaneous products not covered above
    const otherProducts = products.filter((p) => {
      const pCat = (p.category || '').toLowerCase().trim();
      return !pCat || !handledCategoryNames.has(pCat);
    });

    if (otherProducts.length > 0) {
      sectionList.push({
        id: 'sec_other',
        name: 'Other Essentials',
        slug: 'other-essentials',
        image: null,
        products: otherProducts,
      });
    }

    return sectionList;
  }, [categories, products, sortBy]);

  // Scroll to selected category section on mount or when selected category changes
  useEffect(() => {
    if (!selectedCategory || selectedCategory === 'All Products') return;

    const targetSlug = selectedCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const targetElement = sectionRefs.current[targetSlug];

    if (targetElement) {
      // Delay slightly to let layout settle
      const timer = setTimeout(() => {
        const headerOffset = 115; // Offset for sticky navbar + pill bar
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }, 80);

      return () => clearTimeout(timer);
    }
  }, [selectedCategory]);

  // Scroll active pill into view in the horizontal pill bar
  useEffect(() => {
    if (!selectedCategory || !pillBarRef.current) return;
    const activePill = pillBarRef.current.querySelector('[data-active="true"]');
    if (activePill) {
      activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedCategory]);

  const handlePillClick = (catName, slug) => {
    onSelectCategory(catName);
    const targetElement = sectionRefs.current[slug];
    if (targetElement) {
      const headerOffset = 115;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    } else if (catName === 'All Products') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full space-y-4 pb-12">
      {/* Sticky Top Bar: Back Button, Category Pills & Sort */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md pt-2 pb-2.5 -mx-2 px-2 sm:-mx-4 sm:px-4 border-b border-slate-100 shadow-2xs">
        {/* Navigation & Sort Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {/* Back Button */}
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer select-none"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Categories</span>
          </button>

          {/* Quick Sort dropdown */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-xl px-2 py-1 shadow-2xs flex-shrink-0">
            <ArrowUpDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-[11.5px] font-semibold text-slate-700 bg-transparent outline-none cursor-pointer pr-1 pl-0.5"
              style={{ backgroundImage: 'none' }}
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="stock">In Stock</option>
            </select>
          </div>
        </div>

        {/* Horizontally Scrollable Category Filter Pills */}
        <div
          ref={pillBarRef}
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-0.5"
        >
          <button
            type="button"
            data-active={!selectedCategory || selectedCategory === 'All Products'}
            onClick={() => handlePillClick('All Products', '')}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-[11.5px] font-bold transition-all cursor-pointer select-none ${
              !selectedCategory || selectedCategory === 'All Products'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            All
          </button>

          {categorySections.map((section) => {
            const isActive =
              selectedCategory &&
              selectedCategory.toLowerCase().trim() === section.name.toLowerCase().trim();

            return (
              <button
                key={section.slug}
                type="button"
                data-active={isActive}
                onClick={() => handlePillClick(section.name, section.slug)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[11.5px] font-bold transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                {section.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Sections with Category Headers and 3-Column Products */}
      {loading ? (
        <div className="space-y-6 pt-2">
          {[...Array(3)].map((_, sIdx) => (
            <div key={sIdx} className="space-y-3">
              <div className="h-4 bg-slate-200 rounded-full w-28 animate-pulse" />
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2.5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-1.5 flex flex-col space-y-1.5 shadow-2xs animate-pulse">
                    <div className="aspect-square bg-slate-100 rounded-2xl" />
                    <div className="h-2.5 bg-slate-100 rounded-full w-full" />
                    <div className="h-2 bg-slate-100 rounded-full w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : categorySections.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/90 space-y-2.5 max-w-md mx-auto my-6 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No products available</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Please check back soon or browse other categories.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToHome}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            Back to Categories
          </button>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8 pt-1">
          {categorySections.map((section) => (
            <section
              key={section.slug}
              ref={(el) => (sectionRefs.current[section.slug] = el)}
              id={`cat-section-${section.slug}`}
              className="space-y-2.5 scroll-mt-32"
            >
              {/* Category Section Header */}
              <div className="flex items-center justify-between pb-0.5 pt-1">
                <h2 className="text-[14px] sm:text-[15px] font-bold text-slate-900 tracking-tight">
                  {section.name}
                </h2>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {section.products.length} {section.products.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* 3-Column Products Grid (Matching attached screenshot layout) */}
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2.5">
                {section.products.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelectProduct={onSelectProduct}
                    priority={idx < 6}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
