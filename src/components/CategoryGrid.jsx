import React, { useMemo } from 'react';
import { Package } from 'lucide-react';
import { QUICK_COMMERCE_CATEGORIES } from '../data/categoryCatalog';

export const CategoryGrid = ({ 
  categories = [], 
  products = [], 
  onSelectCategory 
}) => {
  // Extract ONLY categories that actually exist in the database products
  const activeCategories = useMemo(() => {
    const catMap = new Map();

    products.forEach((prod) => {
      const catName = prod.category && typeof prod.category === 'string' ? prod.category.trim() : '';
      if (!catName || catName.toLowerCase() === 'all products') return;

      if (!catMap.has(catName)) {
        const lower = catName.toLowerCase();

        // 1. Priority #1: Custom Admin Category Image (Uploaded / edited via Admin Panel)
        const customCat = Array.isArray(categories) 
          ? categories.find((c) => {
              if (!c) return false;
              const cName = typeof c === 'object' ? (c.name || '') : String(c);
              return cName.trim().toLowerCase() === lower;
            })
          : null;
        const customImage = typeof customCat === 'object' && customCat ? (customCat.image_url || customCat.image) : null;

        // 2. Priority #2: Quick Commerce Category Collage Preset (if no custom uploaded artwork)
        const preset = QUICK_COMMERCE_CATEGORIES.find(
          (c) => c.name.toLowerCase() === lower || (c.keywords && c.keywords.some((k) => lower.includes(k)))
        );

        catMap.set(catName, {
          name: catName,
          count: 1,
          image: customImage && customImage.trim() ? customImage.trim() : (preset ? preset.image : null),
          keywords: preset ? preset.keywords : [lower]
        });
      } else {
        const item = catMap.get(catName);
        item.count += 1;
      }
    });

    return Array.from(catMap.values());
  }, [products, categories]);

  if (activeCategories.length === 0) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-x-0 gap-y-3 sm:gap-y-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-1.5 px-1 sm:px-2.5 lg:px-3 py-1.5 sm:py-2.5 animate-pulse">
            <div className="w-full max-w-[82px] sm:max-w-[90px] lg:max-w-[74px] xl:max-w-[80px] aspect-square bg-slate-100 rounded-[16px]" />
            <div className="h-2.5 bg-slate-100 rounded-full w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full pb-4">
      {/* 10-Column Desktop Grid / 4-Column Mobile Grid with 0px Grid Gap */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 xl:grid-cols-10 gap-x-0 gap-y-3 sm:gap-y-4 lg:gap-y-5">
        {activeCategories.map((cat) => (
          <button
            key={cat.name}
            type="button"
            onClick={() => onSelectCategory(cat.name, cat.keywords)}
            className="group flex flex-col items-center cursor-pointer text-center select-none px-1 sm:px-2.5 lg:px-3 py-1.5 sm:py-2.5 rounded-[16px] hover:bg-slate-50/90 active:bg-slate-100 transition-all duration-150 w-full"
            title={`Browse ${cat.name}`}
          >
            {/* Scaled Image Container */}
            <div className="w-full max-w-[82px] sm:max-w-[90px] lg:max-w-[74px] xl:max-w-[80px] aspect-square bg-slate-100 rounded-[16px] flex items-center justify-center transition-all duration-200 shadow-2xs group-hover:shadow-xs overflow-hidden relative">
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-50/50 text-slate-400">
                  <Package className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 transition-colors" />
                </div>
              )}
            </div>

            {/* Category Title Below (Part of the same clickable cell) */}
            <span className="mt-2 text-[12px] font-semibold text-slate-800 group-hover:text-emerald-700 leading-[1.2] line-clamp-2 px-0.5 text-center transition-colors">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
