import React from 'react';
import { LayoutGrid, Package } from 'lucide-react';
import { QUICK_COMMERCE_CATEGORIES } from '../data/categoryCatalog';

export const CategorySidebar = ({ 
  categories, 
  products, 
  selectedCategory, 
  onSelectCategory 
}) => {
  const categoryData = categories.map((catItem) => {
    const catName = typeof catItem === 'object' && catItem?.name ? catItem.name : String(catItem);
    if (catName === 'All Products') {
      return {
        name: 'All Products',
        displayName: 'All Items',
        count: products.length,
        image: null,
        isAll: true
      };
    }

    const catProds = products.filter(
      (p) => p.category && p.category.toLowerCase() === catName.toLowerCase()
    );

    const lower = catName.toLowerCase();
    const customImage = typeof catItem === 'object' && (catItem?.image_url || catItem?.image)
      ? (catItem.image_url || catItem.image).trim()
      : null;
    const preset = QUICK_COMMERCE_CATEGORIES.find(
      (c) => c.name.toLowerCase() === lower || (c.keywords && c.keywords.some((k) => lower.includes(k)))
    );

    return {
      name: catName,
      displayName: catName,
      count: catProds.length,
      image: customImage && customImage.trim() ? customImage.trim() : (preset ? preset.image : null),
      isAll: false
    };
  });

  return (
    <aside className="w-[62px] sm:w-[72px] lg:w-52 flex-shrink-0 sticky top-1 sm:top-2 z-20 self-start">
      {/* Borderless Container */}
      <div className="bg-white rounded-2xl p-1 sm:p-1.5 max-h-[calc(100dvh-0.5rem)] overflow-y-auto no-scrollbar scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* Desktop Sidebar Header */}
        <div className="hidden lg:block px-3 py-2.5 mb-1">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Departments
          </h2>
        </div>

        {/* Category Items List with Clean Whitespace (No Divider Lines) */}
        <div className="flex flex-col space-y-1 sm:space-y-1.5">
          {categoryData.map((cat) => {
            const isSelected = selectedCategory === cat.name;

            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => onSelectCategory(cat.name)}
                className={`flex flex-col lg:flex-row items-center lg:items-center gap-1 sm:gap-1.5 lg:gap-3 p-1.5 sm:p-2 lg:px-3 lg:py-2.5 text-center lg:text-left rounded-xl transition-all duration-150 relative cursor-pointer group ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-950 font-bold'
                    : 'bg-transparent hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                {/* Category Thumbnail (Borderless) */}
                <div 
                  className={`w-9 h-9 sm:w-10 sm:h-10 lg:w-9 lg:h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-emerald-100/70 shadow-2xs'
                      : 'bg-slate-100 group-hover:bg-slate-200/70'
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
                  <span className={`block text-[9.5px] sm:text-[10px] lg:text-[12px] leading-tight line-clamp-2 ${
                    isSelected ? 'text-emerald-900 font-black' : 'text-slate-800'
                  }`}>
                    {cat.displayName}
                  </span>
                  <span className="hidden lg:block text-[10px] text-slate-400 font-medium mt-0.5">
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
