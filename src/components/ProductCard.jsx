import React from 'react';
import { Plus, Minus, Clock, Check, AlertTriangle, XCircle, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export const ProductCard = ({ product, onSelectProduct }) => {
  const { addToCart, updateQuantity, cartItems } = useCart();
  const { settings } = useSettings();

  const priceVal = parseFloat(product.selling_price || product.price || 0) || 0;
  const mrpVal = parseFloat(product.mrp || product.originalPrice || product.original_price || 0) || 0;
  const hasVariants = Boolean((product.has_variants || product.hasVariants) && Array.isArray(product.variants) && product.variants.length > 0);
  const minPrice = hasVariants
    ? Math.min(...product.variants.map((v) => parseFloat(v.selling_price || v.price || priceVal)))
    : priceVal;

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
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Title */}
          <h3 
            onClick={() => onSelectProduct(product)}
            className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 hover:text-emerald-600 transition-colors cursor-pointer leading-snug"
            title={product.title || product.name}
          >
            {product.title || product.name}
          </h3>

          {/* Unit / Options / Category Info */}
          <div className="flex items-center gap-1.5 mt-1">
            {hasVariants ? (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                {product.variants.length} Options
              </span>
            ) : product.unit ? (
              <span className="text-[11px] text-slate-500 font-medium truncate">
                {product.unit}
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 font-medium truncate">
                {product.category || 'Item'}
              </span>
            )}
          </div>
        </div>

        {/* Price & Add Stepper Row */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                {hasVariants ? `From ${settings.currency}${minPrice.toFixed(0)}` : `${settings.currency}${priceVal.toFixed(0)}`}
              </span>
              {mrpVal > priceVal && (
                <span className="text-[10px] text-slate-400 line-through">
                  {settings.currency}{mrpVal.toFixed(0)}
                </span>
              )}
            </div>
          </div>

          {/* Blinkit-Style Green ADD / SELECT Button */}
          {hasVariants ? (
            <button
              onClick={() => onSelectProduct(product)}
              disabled={isOutOfStock}
              className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded text-xs font-black uppercase tracking-wider transition-all shadow-xs active:scale-95 border ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                  : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-600 shadow-emerald-600/10'
              }`}
            >
              <span>{isOutOfStock ? 'Out' : 'SELECT'}</span>
            </button>
          ) : qtyInCart > 0 ? (
            <div className="flex items-center border border-emerald-600 bg-emerald-600 text-white rounded overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateQuantity(product.id, qtyInCart - 1, product.stock);
                }}
                title="Decrease"
                className="w-6 h-7 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-emerald-700 transition-colors font-bold active:scale-90"
              >
                <Minus className="w-3 h-3" />
              </button>
              
              <span className="w-5 sm:w-6 text-center text-xs font-black select-none">
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
                className="w-6 h-7 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold active:scale-90"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addToCart(product, 1)}
              disabled={isOutOfStock}
              title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded text-xs font-black uppercase tracking-wider transition-all shadow-xs active:scale-95 border ${
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
    </div>
  );
};
