import React from 'react';
import { Package, LayoutGrid } from 'lucide-react';

export const CategoryVisualGrid = ({ 
  categories, 
  products, 
  selectedCategory, 
  onSelectCategory 
}) => {
  // Build metadata for each category
  const categoryData = categories.map((cat) => {
    if (cat === 'All Products') {
      return {
        name: 'All Products',
        displayName: 'All Items',
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
      image: firstImage,
      isAll: false
    };
  });

  return (
    <div className="w-full">
      {/* Borderless, clean Blinkit-style category row */}
      <div className="flex items-start gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none">
        {categoryData.map((cat) => {
          const isSelected = selectedCategory === cat.name;

          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              className="group flex flex-col items-center flex-shrink-0 cursor-pointer text-center transition-all duration-200 outline-none w-20 sm:w-24"
            >
              {/* Category Image Container */}
              <div 
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-300 ${
                  isSelected
                    ? 'ring-2 ring-emerald-600 shadow-md scale-105 bg-emerald-50'
                    : 'bg-slate-100/90 group-hover:bg-slate-200/80 group-hover:scale-105 shadow-sm'
                }`}
              >
                {cat.isAll ? (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white">
                    <LayoutGrid className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                ) : cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.displayName}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Package className="w-7 h-7 sm:w-8 sm:h-8 group-hover:text-emerald-600 transition-colors" />
                  </div>
                )}
              </div>

              {/* Category Title */}
              <span className={`mt-2 text-xs font-semibold leading-tight line-clamp-2 px-1 transition-colors ${
                isSelected 
                  ? 'text-emerald-700 font-bold' 
                  : 'text-slate-700 group-hover:text-slate-900'
              }`}>
                {cat.displayName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
