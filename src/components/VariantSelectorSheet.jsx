import React, { useState, useEffect } from 'react';
import { X, Check, ShoppingBag, Plus, Minus, Package, AlertCircle, Sparkles, Layers } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

export function VariantSelectorSheet({ isOpen, onClose, product }) {
  const { addToCart, cartItems } = useCart();
  const { settings } = useSettings();

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  
  // Find initial variant (first available in-stock or first in array)
  const [selectedVariantId, setSelectedVariantId] = useState(() => {
    const firstInStock = variants.find(v => (v.stock_quantity ?? v.stock ?? 1) > 0);
    return firstInStock?.id || variants[0]?.id || null;
  });

  const [quantity, setQuantity] = useState(1);

  // Sync when product or sheet opens & lock background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (variants.length > 0) {
        const firstInStock = variants.find(v => (v.stock_quantity ?? v.stock ?? 1) > 0);
        setSelectedVariantId(firstInStock?.id || variants[0]?.id || null);
        setQuantity(1);
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentVariant = variants.find(v => v.id === selectedVariantId) || variants[0] || {};
  const currentPrice = parseFloat(currentVariant.selling_price ?? currentVariant.price ?? product.selling_price ?? product.price ?? 0);
  const currentMrp = parseFloat(currentVariant.mrp ?? currentVariant.original_price ?? product.mrp ?? currentPrice);
  const isCurrentOutOfStock = (currentVariant.stock_quantity !== undefined && currentVariant.stock_quantity <= 0) || (currentVariant.in_stock === false);

  const discountPercent = currentMrp > currentPrice && currentMrp > 0
    ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100)
    : 0;

  const totalPrice = currentPrice * quantity;

  const handleConfirmAddToCart = () => {
    if (isCurrentOutOfStock) return;
    addToCart(product, quantity, currentVariant);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end sm:justify-center sm:items-center">
      {/* Dim Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Sheet Container: Bottom sheet on Mobile (~50% height), Centered popup on Desktop */}
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[80vh] sm:max-h-[85vh] overflow-hidden pointer-events-auto z-10 animate-slide-up sm:animate-scale-in">
        
        {/* Mobile Top Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0" />

        {/* Header with Product Preview */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            {/* Product Thumbnail */}
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200/80 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-2xs">
              {product.image_url || product.image ? (
                <img
                  src={product.image_url || product.image}
                  alt={product.title || product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Package className="w-5 h-5 text-slate-400" />
              )}
            </div>

            {/* Title & Category */}
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 leading-tight" title={product.title || product.name}>
                {product.title || product.name}
              </h3>
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{variants.length} available pack options</span>
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Friendly Guidance Banner */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 px-3.5 py-2 flex items-center gap-2 text-emerald-900 text-xs font-medium">
          <Layers className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Select your preferred pack size & quantity to add to cart:</span>
        </div>

        {/* Scrollable Variants Options List */}
        <div className="p-3.5 sm:p-4 overflow-y-auto overscroll-contain space-y-2 flex-1 no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-0.5">
            Available Options ({variants.length})
          </span>

          <div className="space-y-2">
            {variants.map((v) => {
              const isSelected = v.id === selectedVariantId;
              const price = parseFloat(v.selling_price ?? v.price ?? product.selling_price ?? 0);
              const mrp = parseFloat(v.mrp ?? v.original_price ?? product.mrp ?? price);
              const isOutOfStock = (v.stock_quantity !== undefined && v.stock_quantity <= 0) || (v.in_stock === false);
              const vDiscount = mrp > price && mrp > 0
                ? Math.round(((mrp - price) / mrp) * 100)
                : 0;
              const inCartItem = cartItems.find(i => String(i.cartKey || i.cartItemId) === `${product.id}_${v.id}` || String(i.variantId) === String(v.id));

              return (
                <div
                  key={v.id}
                  onClick={() => {
                    if (!isOutOfStock) {
                      setSelectedVariantId(v.id);
                    }
                  }}
                  className={`relative p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                    isOutOfStock
                      ? 'opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed'
                      : isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600/30'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  {/* Left: Radio Pill + Variant Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'border-emerald-600 bg-emerald-600 text-white' 
                        : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 block leading-tight">
                          {v.name || v.unit || v.size || v.title || 'Standard'}
                        </span>
                        {inCartItem && inCartItem.quantity > 0 && (
                          <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded-full font-mono">
                            In cart: {inCartItem.quantity}
                          </span>
                        )}
                      </div>
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-rose-600">
                          Out of Stock
                        </span>
                      ) : vDiscount > 0 ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded inline-block mt-0.5">
                          {vDiscount}% OFF
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Right: Pricing */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-sm text-slate-900 font-mono">
                      {settings.currency}{price.toLocaleString('en-IN')}
                    </div>
                    {mrp > price && (
                      <div className="text-[10px] text-slate-400 line-through font-mono">
                        {settings.currency}{mrp.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Bottom Footer: Quantity Stepper (Centered) + Total on Right + Add to Cart Button */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-white space-y-3 flex-shrink-0">
          
          {/* Row: Centered Stepper & Right Total matching reference */}
          <div className="grid grid-cols-3 items-center w-full">
            {/* Left Col: Spacer to keep center column mathematically centered */}
            <div className="flex items-center justify-start" />

            {/* Center Col: Quantity Stepper */}
            <div className="flex items-center justify-center">
              <div className="inline-flex items-center justify-between border border-slate-200 bg-slate-50/70 rounded-xl w-32 h-10 px-1 select-none shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isCurrentOutOfStock}
                  className="flex-1 h-full flex items-center justify-center text-slate-400 hover:text-slate-700 active:scale-90 disabled:opacity-25 transition-all cursor-pointer font-bold"
                  title="Decrease"
                >
                  <Minus className="w-4 h-4 stroke-[2]" />
                </button>

                <span className="px-2 text-center text-sm font-bold text-slate-900 font-mono select-none">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.min(99, q + 1))}
                  disabled={quantity >= 99 || isCurrentOutOfStock}
                  className="flex-1 h-full flex items-center justify-center text-slate-400 hover:text-slate-700 active:scale-90 disabled:opacity-25 transition-all cursor-pointer font-bold"
                  title="Increase"
                >
                  <Plus className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            </div>

            {/* Right Col: Total Price */}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider leading-none mb-0.5">
                TOTAL
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 font-mono leading-tight">
                {settings.currency}{totalPrice.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleConfirmAddToCart}
            disabled={isCurrentOutOfStock}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${
              isCurrentOutOfStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isCurrentOutOfStock ? 'Currently Unavailable' : `Add ${quantity > 1 ? `${quantity} items` : 'to Cart'} • ${settings.currency}${totalPrice.toFixed(2)}`}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
