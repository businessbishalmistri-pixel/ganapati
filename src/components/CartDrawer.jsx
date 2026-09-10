import React, { useEffect } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Plus, 
  Minus, 
  AlertCircle, 
  Package, 
  MessageCircle,
  MapPin,
  User,
  Phone
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

export const CartDrawer = () => {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItemsCount
  } = useCart();

  const { customer, openProfileModal } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) setIsCartOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  const handleProceedToWhatsApp = () => {
    // 1. Check if customer details are saved in localStorage
    if (!customer || !customer.name || !customer.phone || !customer.address) {
      openProfileModal('checkout');
      return;
    }

    // 2. Format WhatsApp message containing ONLY customer details and product names (NO PRICES, NO TOTALS)
    const storePhone = (settings?.whatsappNumber || '919876543210').replace(/\D/g, '');
    const cleanStorePhone = storePhone.length === 10 ? '91' + storePhone : storePhone;

    const gpsLink = customer.gpsUrl 
      ? customer.gpsUrl 
      : (customer.lat && customer.lng ? `https://maps.google.com/?q=${customer.lat},${customer.lng}` : 'Not provided');

    const itemsList = cartItems
      .map((item, idx) => `${idx + 1}. ${item.title || item.name}${item.unit ? ` (${item.unit})` : ''} - Qty: ${item.quantity}`)
      .join('\n');

    const message = 
`*New Order - Ganapati Stores*

*Customer Details:*
• *Name:* ${customer.name}
• *Phone:* ${customer.phone}
• *Delivery Address:* ${customer.address}
• *Live GPS Location:* ${gpsLink}

*Items Ordered:*
${itemsList}

Please confirm my order and deliver to the above address. Thank you!`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanStorePhone}?text=${encoded}`;

    window.open(whatsappUrl, '_blank');
    
    showToast('WhatsApp order generated! Redirecting to chat...', 'success');
    clearCart();
    setIsCartOpen(false);
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
                    Explore our catalog and add items for direct WhatsApp delivery.
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
                const isMax = item.quantity >= (item.stockQuantity || item.stock || 999);
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
                        
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.unit && (
                            <span className="text-[11px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.2 rounded">
                              {item.unit}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50/60 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                            className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          
                          <span className="px-2.5 text-xs font-bold text-slate-900 font-mono">
                            {item.quantity}
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                            disabled={isMax}
                            className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

          {/* Footer / Delivery Details Summary & WhatsApp Action */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white space-y-3.5">
              {/* Delivery Details Status Card */}
              {customer?.name && customer?.phone ? (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-700" />
                      Delivery to: {customer.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => openProfileModal()}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-slate-600 text-[11px] truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>{customer.address}</span>
                  </p>
                  {customer.lat && customer.lng && (
                    <span className="text-[10px] text-emerald-700 font-medium block">
                      📍 GPS location attached
                    </span>
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => openProfileModal('checkout')}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>Click to set your name, phone & delivery address</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                </div>
              )}

              {/* Direct WhatsApp Order Button */}
              <button
                type="button"
                onClick={handleProceedToWhatsApp}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/25 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send Order via WhatsApp</span>
              </button>

              <p className="text-[10px] text-center text-slate-400">
                Products and delivery info will be sent directly to our store WhatsApp.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
