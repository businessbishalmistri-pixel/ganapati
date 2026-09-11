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
  const variantsList = Array.isArray(product?.variants) ? product.variants : [];
  const hasVariants = Boolean(
    variantsList.length > 1 || 
    ((product?.has_variants || product?.hasVariants) && variantsList.length > 0)
  );
  const firstVariant = hasVariants ? variantsList[0] : null;
  const displayPrice = firstVariant 
    ? (parseFloat(firstVariant.selling_price || firstVariant.price || priceVal) || priceVal)
    : priceVal;
  const displayMrp = firstVariant 
    ? (parseFloat(firstVariant.mrp || firstVariant.originalPrice || firstVariant.original_price || mrpVal) || 0)
    : mrpVal;

  // Track all cart items matching this product (standard or any of its variants)
  const matchingCartItems = cartItems.filter((i) => {
    const iKey = String(i.cartKey || i.cartItemId || i.id);
    return iKey === String(product.id) || iKey.startsWith(`${product.id}_`) || String(i.id) === String(product.id);
  });
  const totalQtyInCart = matchingCartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const primaryCartKey = matchingCartItems.length > 0 
    ? (matchingCartItems[0].cartKey || matchingCartItems[0].cartItemId || matchingCartItems[0].id) 
    : product.id;

  const maxStock = parseInt(product.stock_quantity ?? product.stock ?? 999, 10);
  const isOutOfStock = product.in_stock === false || (product.stock !== undefined && product.stock <= 0 && (!hasVariants || variantsList.every(v => (v.stock_quantity ?? v.stock ?? 0) <= 0)));
  const isMaxInCart = maxStock > 0 && totalQtyInCart >= maxStock;

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

        {/* 🛒 Action Button / Stepper Overlay on Bottom-Right of Image (Blue Marked Area) */}
        <div 
          className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {hasVariants ? (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isOutOfStock) {
                  setIsVariantSheetOpen(true);
                }
              }}
              disabled={isOutOfStock}
              title={isOutOfStock ? 'Out of Stock' : 'Select Variant & Add'}
              className={`min-h-[26px] sm:min-h-[28px] px-2.5 py-1 sm:px-3 sm:py-1 rounded text-[11.5px] sm:text-[11.5px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 border cursor-pointer flex items-center justify-center gap-1 ${
                isOutOfStock
                  ? 'bg-white/90 backdrop-blur-xs text-slate-400 cursor-not-allowed border-slate-200'
                  : totalQtyInCart > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-emerald-600/30'
                  : 'bg-white hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-600 shadow-emerald-900/10'
              }`}
            >
              <span>{isOutOfStock ? 'Out' : totalQtyInCart > 0 ? `ADD • ${totalQtyInCart}` : 'ADD'}</span>
            </button>
          ) : totalQtyInCart > 0 ? (
            <div 
              className="inline-flex items-center border border-emerald-600 bg-emerald-600 text-white rounded px-1 py-0.5 sm:px-1.5 shadow-md gap-1 min-h-[26px] sm:min-h-[28px]"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(primaryCartKey, totalQtyInCart - 1, maxStock);
                }}
                title="Decrease"
                className="p-0.5 sm:p-1 flex items-center justify-center hover:bg-emerald-700 active:bg-emerald-800 rounded transition-colors font-bold active:scale-90 cursor-pointer"
              >
                <Minus className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
              </button>
              
              <span className="px-0.5 text-center text-[11.5px] sm:text-xs font-black select-none font-mono min-w-[14px]">
                {totalQtyInCart}
              </span>
              
              <button
                type="button"
                disabled={isMaxInCart}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(primaryCartKey, totalQtyInCart + 1, maxStock);
                }}
                title={isMaxInCart ? "Stock limit reached" : "Increase"}
                className="p-0.5 sm:p-1 flex items-center justify-center hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors font-bold active:scale-90 cursor-pointer"
              >
                <Plus className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product, 1);
              }}
              disabled={isOutOfStock}
              title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              className={`min-h-[26px] sm:min-h-[28px] px-2.5 py-1 sm:px-3 sm:py-1 rounded text-[11.5px] sm:text-[11.5px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 border cursor-pointer flex items-center justify-center ${
                isOutOfStock
                  ? 'bg-white/90 backdrop-blur-xs text-slate-400 cursor-not-allowed border-slate-200'
                  : 'bg-white hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-600 shadow-emerald-900/10'
              }`}
            >
              <span>{isOutOfStock ? 'Out' : 'ADD'}</span>
            </button>
          )}
        </div>
      </div>


      {/* Product Details Area (Compact 3-Column Density) */}
      <div className="p-1.5 sm:p-2.5 flex-1 flex flex-col justify-between space-y-1">
        <div>
          {/* Title with 3-line clamp */}
          <h3 
            onClick={() => onSelectProduct(product)}
            className="font-bold text-slate-900 text-[10.5px] sm:text-[12.5px] line-clamp-3 hover:text-emerald-600 transition-colors cursor-pointer leading-snug"
            title={product.title || product.name}
          >
            {product.title || product.name}
          </h3>

          {/* Unit / Options / Category Info */}
          <div className="flex items-center gap-1 mt-0.5">
            {hasVariants ? (
              <span className="text-[9px] sm:text-[9.5px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-bold">
                {variantsList.length} Options
              </span>
            ) : product.unit ? (
              <span className="text-[9.5px] sm:text-[11px] text-slate-500 font-medium truncate">
                {product.unit}
              </span>
            ) : (
              <span className="text-[9.5px] sm:text-[11px] text-slate-500 font-medium truncate">
                {product.category || 'Item'}
              </span>
            )}
          </div>
        </div>

        {/* Price Row */}
        <div className="pt-0.5 flex items-baseline gap-1">
          <span className="text-[14px] sm:text-[13px] font-black text-slate-900 tracking-tight">
            {settings.currency}{displayPrice.toFixed(0)}
          </span>
          {displayMrp > displayPrice && (
            <span className="text-[11px] sm:text-[9.5px] text-slate-400 line-through">
              {settings.currency}{displayMrp.toFixed(0)}
            </span>
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
