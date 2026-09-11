import React from 'react';
import { LayoutGrid, Package } from 'lucide-react';

export const CategorySidebar = ({ 
  categories, 
  products, 
  selectedCategory, 
  onSelectCategory 
}) => {
  const categoryData = categories.map((cat) => {
    if (cat === 'All Products') {
      return {
        name: 'All Products',
        displayName: 'All Items',
        count: products.length,
        image: null,
        isAll: true
      };
    }

    const catProds = products.filter(
      (p) => p.category && p.category.toLowerCase() === cat.toLowerCase()
    );
    const firstImage = catProds.find((p) => p.image)?.image || null;

    return {
      name: cat,
      displayName: cat,
      count: catProds.length,
      image: firstImage,
      isAll: false
    };
  });

  return (
    <aside className="w-[64px] sm:w-[72px] lg:w-52 flex-shrink-0 sticky top-2 sm:top-3 z-20 self-start">
      {/* Container */}
      <div className="bg-white rounded border border-slate-200/90 shadow-xs overflow-hidden max-h-[calc(100dvh-1rem)] overflow-y-auto scrollbar-none">
        
        {/* Desktop Sidebar Header */}
        <div className="hidden lg:block p-2.5 bg-slate-50 border-b border-slate-200/80">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-700">
            Departments
          </h2>
        </div>

        {/* Category Items List (Vertical Rail on both mobile & desktop) */}
        <div className="flex flex-col divide-y divide-slate-100">
          {categoryData.map((cat) => {
            const isSelected = selectedCategory === cat.name;

            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => onSelectCategory(cat.name)}
                className={`flex flex-col lg:flex-row items-center lg:items-center gap-1 lg:gap-2.5 p-1.5 sm:p-2 lg:p-2.5 text-center lg:text-left transition-all duration-150 relative cursor-pointer group ${
                  isSelected
                    ? 'bg-emerald-50/90 text-emerald-950 font-bold'
                    : 'bg-white hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                {/* Active Indicator Bar (Right side on mobile, left side on desktop) */}
                {isSelected && (
                  <>
                    <div className="lg:hidden absolute right-0 top-1 bottom-1 w-1 bg-emerald-600 rounded-l" />
                    <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-r" />
                  </>
                )}

                {/* Category Thumbnail */}
                <div 
                  className={`w-9 h-9 sm:w-10 sm:h-10 lg:w-9 lg:h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 group-hover:border-slate-300'
                  }`}
                >
                  {cat.isAll ? (
                    <LayoutGrid className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-600" />
                  ) : cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1 w-full">
                  <span className={`block text-[9.5px] sm:text-[10px] lg:text-[11.5px] leading-tight line-clamp-2 ${
                    isSelected ? 'text-emerald-900 font-black' : 'text-slate-800'
                  }`}>
                    {cat.displayName}
                  </span>
                  <span className="hidden lg:block text-[9.5px] text-slate-400 font-medium mt-0.5">
                    {cat.count} {cat.count === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </aside>
  );
};
