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
          <div className="p-3 sm:p-4 flex items-center justify-between bg-white border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F4F5F7] text-slate-900 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Your Cart</h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-600 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#F4F5F7] flex items-center justify-center text-slate-500">
                  <ShoppingBag className="w-7 h-7 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Your cart is empty</h3>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-xs leading-relaxed">
                    Explore our catalog and add items for direct WhatsApp delivery.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Start Browsing
                </button>
              </div>
            ) : (
              <div className="space-y-2 py-2.5">
                {cartItems.map((item) => {
                  const itemKey = item.cartKey || item.cartItemId || item.id;
                  const isMax = item.quantity >= (item.stockQuantity || item.stock || 999);
                  const price = item.selling_price || item.price || 0;

                  return (
                    <div
                      key={itemKey}
                      className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex gap-3 items-center transition-all"
                    >
                      {/* Left: Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 flex items-center justify-center flex-shrink-0">
                        {item.image_url || item.image ? (
                          <img
                            src={item.image_url || item.image}
                            alt={item.title || item.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=160&q=80';
                            }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-7 h-7 text-slate-400" />
                        )}
                      </div>

                      {/* Right: Content Block */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.2 space-y-1">
                        {/* Top: Title & Price */}
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {item.title || item.name}
                          </h4>
                          {price > 0 && (
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900 font-mono flex-shrink-0">
                              ₹{price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        
                        {/* Description / Subtitle */}
                        <p className="text-[11px] text-slate-400 leading-tight truncate">
                          {item.unit ? `${item.unit}` : 'Standard Pack'} {item.category ? `• ${item.category}` : ''}
                        </p>

                        {/* Bottom: Black Pill Quantity Stepper & Red Trash Can */}
                        <div className="flex items-center justify-between pt-0.5">
                          {/* Sleek Black Quantity Stepper Pill */}
                          <div className="inline-flex items-center bg-black text-white rounded-full px-1.5 py-0.5 gap-1.5 shadow-xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                              className="w-5 h-5 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white transition-colors cursor-pointer"
                              title="Decrease"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            
                            <span className="px-1 text-[11px] font-bold font-mono min-w-[14px] text-center">
                              {item.quantity}
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                              disabled={isMax}
                              className="w-5 h-5 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white disabled:opacity-30 transition-colors cursor-pointer"
                              title="Increase"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          {/* Red Outline Trash Can Icon */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(itemKey)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {isMax && (
                          <p className="text-[10px] text-amber-700 flex items-center gap-1 mt-0.5 font-medium">
                            <AlertCircle className="w-3 h-3" /> Max item limit reached
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer / Delivery Details Summary & WhatsApp Action */}
          {cartItems.length > 0 && (
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-white space-y-2.5">
              {/* Delivery Details Status Card */}
              {customer?.name && customer?.phone ? (
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5 text-[11px]">
                      <User className="w-3 h-3 text-emerald-700" />
                      Delivery to: {customer.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => openProfileModal()}
                      className="text-[10px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                  <p className="text-slate-600 text-[10px] truncate flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                    <span>{customer.address}</span>
                  </p>
                </div>
              ) : (
                <div 
                  onClick={() => openProfileModal('checkout')}
                  className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>Click to set your delivery details</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                </div>
              )}

              {/* Direct WhatsApp Order Button */}
              <button
                type="button"
                onClick={handleProceedToWhatsApp}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send Order via WhatsApp</span>
              </button>

              <p className="text-[9px] text-center text-slate-400">
                Products and delivery info will be sent directly to our store WhatsApp.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
