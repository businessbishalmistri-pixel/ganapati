import React from 'react';
import { ProductCard } from './ProductCard';
import { ChevronRight, Layers } from 'lucide-react';

export const CategoryShelf = ({ 
  categoryName, 
  products, 
  onSelectProduct, 
  onViewCategory 
}) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="space-y-4 pt-2">
      {/* Category Section Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-600 flex-shrink-0" />
          <h2 className="text-[11.5px] sm:text-sm font-black uppercase tracking-wider text-slate-700 truncate leading-tight" title={categoryName}>
            {categoryName}
          </h2>
          <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {onViewCategory && (
          <button
            type="button"
            onClick={() => onViewCategory(categoryName)}
            className="text-[10.5px] sm:text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 sm:px-2.5 py-1 rounded transition-all flex items-center gap-1 group flex-shrink-0 self-center"
          >
            <span>See All</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Products Grid (High Density) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-2.5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelectProduct={onSelectProduct}
          />
        ))}
      </div>
    </section>
  );
};
