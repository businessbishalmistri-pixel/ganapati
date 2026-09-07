import React, { useEffect } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Plus, Minus, AlertCircle, Package, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const CartDrawer = () => {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    totalItemsCount,
    setIsCheckoutOpen,
  } = useCart();

  const { customer, openLoginModal } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) setIsCartOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    if (!customer) {
      // Guest cart preserved locally -> Prompt WhatsApp OTP verification
      openLoginModal('checkout');
    } else {
      setIsCheckoutOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Slide-over Right Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-md bg-white shadow-2xl flex flex-col animate-slide-left h-full overflow-hidden">
          
          {/* Header */}
          <div className="p-4 sm:p-5 flex items-center justify-between bg-white border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#F4F5F7] text-slate-900 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Your Cart</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-600 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 divide-y divide-slate-100">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#F4F5F7] flex items-center justify-center text-slate-500">
                  <ShoppingBag className="w-8 h-8 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Your cart is empty</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                    Explore our catalog and add items with real-time stock availability.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Start Browsing
                </button>
              </div>
            ) : (
              cartItems.map((item) => {
                const itemKey = item.cartKey || item.cartItemId || item.id;
                const isMax = item.quantity >= (item.stockQuantity || item.stock);
                const variantLabel = item.variantName || (item.selectedVariant ? (item.selectedVariant.name || item.selectedVariant.size) : null);
                return (
                  <div
                    key={itemKey}
                    className="py-3.5 sm:py-4 flex gap-3.5 items-center transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-[#F4F5F7] flex items-center justify-center flex-shrink-0">
                      {item.image_url || item.image ? (
                        <img
                          src={item.image_url || item.image}
                          alt={item.title || item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-7 h-7 text-slate-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {item.title || item.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeFromCart(itemKey)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1 flex-shrink-0 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {variantLabel && (
                            <span className="text-[10px] font-bold bg-[#F4F5F7] text-slate-700 px-2 py-0.5 rounded-full">
                              {variantLabel}
                            </span>
                          )}
                          <p className="text-xs text-slate-500 font-medium">
                            {settings.currency}{item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5">
                        {/* Stepper */}
                        <div className="flex items-center bg-[#F4F5F7] rounded-xl px-1.5 py-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(itemKey, item.quantity - 1, item.stock)}
                            disabled={item.quantity <= 1}
                            className="p-1 text-slate-600 hover:text-slate-900 disabled:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-slate-900 font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(itemKey, item.quantity + 1, item.stock)}
                            disabled={isMax}
                            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Total price for this item */}
                        <span className="text-sm font-bold text-slate-900 font-mono">
                          {settings.currency}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {isMax && (
                        <p className="text-[10px] text-amber-700 flex items-center gap-1 mt-1 font-medium">
                          <AlertCircle className="w-3 h-3" /> Max available inventory reached
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer / Breakdown & Checkout Action */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white space-y-3.5">
              <div className="bg-[#F4F5F7] p-3.5 rounded-2xl text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal ({totalItemsCount})</span>
                  <span className="font-semibold text-slate-900 font-mono">{settings.currency}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Estimated Fulfillment</span>
                  <span className="text-slate-500 font-medium">Calculated at checkout</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200/60">
                  <span>Subtotal Amount</span>
                  <span className="text-base font-black text-slate-900 font-mono">{settings.currency}{subtotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-bold py-3.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

              <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>100% Safe & Secure &bull; Cash on Delivery Available</span>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
