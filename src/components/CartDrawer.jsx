import React, { useState, useEffect } from 'react';
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
  Store,
  Truck,
  Sparkles
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

  // Delivery Method: 'shipping' (Home Delivery) | 'pickup' (Store Pickup)
  const [deliveryMethod, setDeliveryMethod] = useState('shipping');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCartOpen) setIsCartOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  // Subtotal & Delivery Calculation
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.selling_price || item.price || 0;
    return acc + (price * item.quantity);
  }, 0);

  const freeThreshold = settings?.freeShippingThreshold !== undefined ? Number(settings.freeShippingThreshold) : 200;
  const flatFee = settings?.flatShippingFee !== undefined ? Number(settings.flatShippingFee) : 30;
  
  const isFreeDelivery = deliveryMethod === 'pickup' || (subtotal >= freeThreshold);
  const deliveryFee = deliveryMethod === 'pickup' ? 0 : (isFreeDelivery ? 0 : flatFee);
  const totalAmount = subtotal + deliveryFee;

  const freeShippingProgress = freeThreshold > 0 ? Math.min(100, Math.round((subtotal / freeThreshold) * 100)) : 100;
  const amountNeededForFreeShipping = Math.max(0, freeThreshold - subtotal);

  const handleProceedToWhatsApp = () => {
    // 1. If shipping and customer details missing, prompt to fill
    if (deliveryMethod === 'shipping' && (!customer || !customer.name || !customer.phone || !customer.address)) {
      openProfileModal('checkout');
      return;
    }

    // 2. If pickup and customer name/phone missing, prompt
    if (deliveryMethod === 'pickup' && (!customer || !customer.name || !customer.phone)) {
      openProfileModal('checkout');
      return;
    }

    const storePhone = (settings?.whatsappNumber || '919147364980').replace(/\D/g, '');
    const cleanStorePhone = storePhone.length === 10 ? '91' + storePhone : storePhone;

    const itemsList = cartItems
      .map((item, idx) => {
        const itemPrice = (item.selling_price || item.price || 0) * item.quantity;
        return `${idx + 1}. ${item.title || item.name}${item.unit ? ` (${item.unit})` : ''} - Qty: ${item.quantity} (₹${itemPrice.toFixed(2)})`;
      })
      .join('\n');

    let message = '';
    if (deliveryMethod === 'shipping') {
      const gpsLink = customer.gpsUrl 
        ? customer.gpsUrl 
        : (customer.lat && customer.lng ? `https://maps.google.com/?q=${customer.lat},${customer.lng}` : 'Not provided');

      message = 
`*New Order - ${settings?.storeName || 'Ganapati Store'}*
*Delivery Method:* Home Delivery (COD)

*Customer Details:*
• *Name:* ${customer.name}
• *Phone:* ${customer.phone}
• *Delivery Address:* ${customer.address}
• *Live GPS:* ${gpsLink}

*Items Ordered:*
${itemsList}

*Bill Summary:*
• Items Subtotal: ₹${subtotal.toFixed(2)}
• Delivery Charges: ${deliveryFee === 0 ? 'FREE (₹0.00)' : `₹${deliveryFee.toFixed(2)}`}
• *Total Payable (COD):* ₹${totalAmount.toFixed(2)}

Please confirm and dispatch to my delivery address. Thank you!`;
    } else {
      message = 
`*New Order - ${settings?.storeName || 'Ganapati Store'}*
*Delivery Method:* Store Pickup (Pay at Store)

*Customer Details:*
• *Name:* ${customer?.name || 'Customer'}
• *Phone:* ${customer?.phone || 'Not provided'}
• *Store Pickup Hub:* ${settings?.storeAddress || 'Main Store Hub'}

*Items Ordered:*
${itemsList}

*Bill Summary:*
• Items Subtotal: ₹${subtotal.toFixed(2)}
• Delivery Charges: ₹0.00 (Store Pickup)
• *Total Payable on Pickup:* ₹${subtotal.toFixed(2)}

Please keep my order ready for store pickup. Thank you!`;
    }

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

          {/* Dynamic Free Delivery Progress Indicator */}
          {cartItems.length > 0 && deliveryMethod === 'shipping' && (
            <div className="px-3 sm:px-4 pt-2.5 pb-1">
              {amountNeededForFreeShipping > 0 ? (
                <div className="p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-900 font-medium flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>
                        Add <strong className="font-bold font-mono text-amber-950">₹{amountNeededForFreeShipping.toFixed(2)}</strong> more for <strong className="text-emerald-700">FREE Delivery</strong>
                      </span>
                    </span>
                    <span className="text-[11px] font-bold text-amber-800 font-mono">
                      {freeShippingProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(5, freeShippingProgress)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50/90 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-semibold shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>🎉 You unlocked <strong>FREE Delivery</strong>!</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Saved ₹{flatFee}
                  </span>
                </div>
              )}
            </div>
          )}

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
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-1">
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

          {/* Footer / Delivery Options, Address Box, Bill Summary & WhatsApp Action */}
          {cartItems.length > 0 && (
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-white space-y-2.5">
              
              {/* 1. Delivery Option Radio Selector */}
              <div className="flex items-center gap-6 text-xs font-semibold text-slate-800">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="cartDeliveryMethod"
                    value="shipping"
                    checked={deliveryMethod === 'shipping'}
                    onChange={() => setDeliveryMethod('shipping')}
                    className="w-4 h-4 text-slate-900 focus:ring-slate-900 border-slate-300 cursor-pointer accent-slate-900"
                  />
                  <span className={deliveryMethod === 'shipping' ? 'font-bold text-slate-900' : 'text-slate-600'}>
                    Home Delivery
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="cartDeliveryMethod"
                    value="pickup"
                    checked={deliveryMethod === 'pickup'}
                    onChange={() => setDeliveryMethod('pickup')}
                    className="w-4 h-4 text-slate-900 focus:ring-slate-900 border-slate-300 cursor-pointer accent-slate-900"
                  />
                  <span className={deliveryMethod === 'pickup' ? 'font-bold text-slate-900' : 'text-slate-600'}>
                    Store pickup
                  </span>
                </label>
              </div>

              {/* 2. Address / Location Box */}
              <div className="p-3 bg-white border border-slate-800 rounded-xl text-xs">
                {deliveryMethod === 'shipping' ? (
                  customer?.address ? (
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                        </p>
                        <p className="text-slate-600 text-[11px] leading-snug line-clamp-2">
                          {customer.address}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openProfileModal()}
                        className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => openProfileModal('checkout')}
                      className="flex items-center justify-between cursor-pointer text-slate-700 hover:text-emerald-700 transition-colors py-0.5"
                    >
                      <span className="text-[11px] font-semibold text-slate-600">
                        Click to enter home delivery address
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )
                ) : (
                  <div className="space-y-0.5 py-0.5">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-slate-700" />
                      <span>{settings?.storeName || 'Ganapati Store'}</span>
                    </p>
                    <p className="text-slate-600 text-[11px] leading-snug">
                      {settings?.storeAddress || 'Main Store Hub, Habra, West Bengal 743263'}
                    </p>
                  </div>
                )}
              </div>

              {/* 3. Detailed Bill Breakdown Card */}
              <div className="p-3 bg-slate-100/90 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Items Subtotal ({totalItemsCount})</span>
                  <span className="font-mono font-medium text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Delivery charges</span>
                  <span className="font-mono font-medium text-slate-900">
                    {deliveryFee === 0 ? '0' : `₹${deliveryFee.toFixed(2)}`}
                  </span>
                </div>

                <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">Subtotal Amount</span>
                  <span className="font-bold text-slate-900 text-sm sm:text-base font-mono">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* 4. Direct WhatsApp Order Button */}
              <button
                type="button"
                onClick={handleProceedToWhatsApp}
                className="w-full flex items-center justify-center gap-2 bg-[#3F9368] hover:bg-[#347c57] active:bg-[#2b6748] text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md shadow-emerald-700/20 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>SEND ORDER VIA WHATSAPP</span>
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
