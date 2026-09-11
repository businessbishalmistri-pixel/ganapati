import React, { useState } from 'react';
import { Plus, Minus, Clock, Check, AlertTriangle, XCircle, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { VariantSelectorSheet } from './VariantSelectorSheet';

export const ProductCard = ({ product, onSelectProduct }) => {
  const { addToCart, updateQuantity, cartItems } = useCart();
  const { settings } = useSettings();
  const [isVariantSheetOpen, setIsVariantSheetOpen] = useState(false);

  const priceVal = parseFloat(product.selling_price || product.price || 0) || 0;
  const mrpVal = parseFloat(product.mrp || product.originalPrice || product.original_price || 0) || 0;
  const hasVariants = Boolean((product.has_variants || product.hasVariants) && Array.isArray(product.variants) && product.variants.length > 0);
  const firstVariant = hasVariants ? product.variants[0] : null;
  const displayPrice = firstVariant 
    ? (parseFloat(firstVariant.selling_price || firstVariant.price || priceVal) || priceVal)
    : priceVal;
  const displayMrp = firstVariant 
    ? (parseFloat(firstVariant.mrp || firstVariant.originalPrice || firstVariant.original_price || mrpVal) || 0)
    : mrpVal;

  const cartItem = cartItems.find((i) => (i.id === product.id || i.cartKey === product.id));
  const qtyInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.in_stock === false || (product.stock !== undefined && product.stock <= 0);
  const isMaxInCart = false;

  return (
    <div className="group relative bg-white rounded border border-slate-200/90 hover:border-emerald-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
      
      {/* Product Image Area */}
      <div 
        className="relative aspect-square w-full bg-slate-100 overflow-hidden cursor-pointer"
        onClick={() => onSelectProduct(product)}
      >
        {product.image_url || product.image ? (
          <img
            src={product.image_url || product.image}
            alt={product.title || product.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80';
            }}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
        )}

        {/* Stock Badge (Shown only when Out of Stock or custom badge) */}
        <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
          {isOutOfStock && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
              <XCircle className="w-2.5 h-2.5" />
              Out of Stock
            </span>
          )}

          {product.badge && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
              {product.badge}
            </span>
          )}
        </div>
      </div>


      {/* Product Details Area (Compact Density) */}
      <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
        <div>
          {/* Title */}
          <h3 
            onClick={() => onSelectProduct(product)}
            className="font-bold text-slate-900 text-[11.5px] sm:text-[12.5px] line-clamp-2 hover:text-emerald-600 transition-colors cursor-pointer leading-snug"
            title={product.title || product.name}
          >
            {product.title || product.name}
          </h3>

          {/* Unit / Options / Category Info */}
          <div className="flex items-center gap-1 mt-0.5">
            {hasVariants ? (
              <span className="text-[9.5px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                {product.variants.length} Options
              </span>
            ) : product.unit ? (
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                {product.unit}
              </span>
            ) : (
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                {product.category || 'Item'}
              </span>
            )}
          </div>
        </div>

        {/* Price & Add Stepper Row */}
        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-[12px] sm:text-sm font-black text-slate-900">
                {settings.currency}{displayPrice.toFixed(0)}
              </span>
              {displayMrp > displayPrice && (
                <span className="text-[9.5px] text-slate-400 line-through">
                  {settings.currency}{displayMrp.toFixed(0)}
                </span>
              )}
            </div>
          </div>

          {/* Action Button: Variant Selector Sheet if multiple options, direct stepper/add if standard */}
          {hasVariants ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isOutOfStock) {
                  setIsVariantSheetOpen(true);
                }
              }}
              disabled={isOutOfStock}
              title={isOutOfStock ? 'Out of Stock' : 'Select Variant & Add'}
              className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded text-[11px] font-black uppercase tracking-wider transition-all shadow-2xs active:scale-95 border cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                  : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-600 shadow-emerald-600/10'
              }`}
            >
              <span>{isOutOfStock ? 'Out' : 'ADD'}</span>
            </button>
          ) : qtyInCart > 0 ? (
            <div className="inline-flex items-center border border-emerald-600 bg-emerald-600 text-white rounded px-1 py-0.5 shadow-2xs gap-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(product.id, qtyInCart - 1, product.stock);
                }}
                title="Decrease"
                className="p-1 flex items-center justify-center hover:bg-emerald-700 rounded transition-colors font-bold active:scale-90 cursor-pointer"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
              
              <span className="px-1 text-center text-[11px] sm:text-xs font-black select-none font-mono min-w-[14px]">
                {qtyInCart}
              </span>
              
              <button
                type="button"
                disabled={isMaxInCart}
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(product.id, qtyInCart + 1, product.stock);
                }}
                title={isMaxInCart ? "Stock limit reached" : "Increase"}
                className="p-1 flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors font-bold active:scale-90 cursor-pointer"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product, 1);
              }}
              disabled={isOutOfStock}
              title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded text-[11px] font-black uppercase tracking-wider transition-all shadow-2xs active:scale-95 border cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                  : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-600 shadow-emerald-600/10'
              }`}
            >
              <span>{isOutOfStock ? 'Out' : 'ADD'}</span>
            </button>
          )}
        </div>

      </div>

      {/* 📱 Mobile Half-Screen Bottom Sheet / 🖥️ Desktop Modal for Variant Selection */}
      {hasVariants && (
        <VariantSelectorSheet
          isOpen={isVariantSheetOpen}
          onClose={() => setIsVariantSheetOpen(false)}
          product={product}
        />
      )}
    </div>
  );
};
