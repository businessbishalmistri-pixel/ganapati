import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Truck, 
  Store, 
  MapPin, 
  CheckCircle2, 
  MessageCircle, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  Edit3,
  Check,
  Building2,
  CalendarCheck,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { addressService } from '../services/addressService';
import { formatWhatsAppMessage, buildWhatsAppUrl } from '../services/orderService';
import { submitStoreApiOrder, STORE_API_KEY, upsertStoreCustomerProfile } from '../services/supabase';

export const CheckoutModal = ({ onOrderSuccess }) => {
  const { isCheckoutOpen, setIsCheckoutOpen, cartItems, subtotal, clearCart } = useCart();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const { currentCustomer, customer, setIsAuthOpen, openAddressBook, isProfileOpen } = useAuth();

  const activeCustomer = currentCustomer || customer;

  // Delivery Method: 'shipping' (Home Delivery) | 'pickup' (Store Pickup)
  const [deliveryMethod, setDeliveryMethod] = useState('shipping');

  // Contact State (Initialized from activeCustomer only)
  const [customerInfo, setCustomerInfo] = useState(() => {
    if (activeCustomer) {
      const defaultAddr = addressService.getDefaultAddress();
      return {
        name: defaultAddr?.name || defaultAddr?.recipientName || activeCustomer.fullName || activeCustomer.name || '',
        phone: defaultAddr?.phone || activeCustomer.phone || '',
        email: activeCustomer.email || ''
      };
    }
    return { name: '', phone: '', email: '' };
  });

  // Shipping Address State (Initialized from activeCustomer only)
  const [shippingAddress, setShippingAddress] = useState(() => {
    if (activeCustomer) {
      const defaultAddr = addressService.getDefaultAddress();
      if (defaultAddr) {
        return {
          tag: defaultAddr.tag || defaultAddr.label || 'Home',
          street: defaultAddr.address || defaultAddr.street || '',
          city: defaultAddr.city || 'Habra / Ashoknagar',
          state: defaultAddr.state || 'West Bengal',
          postalCode: defaultAddr.postalCode || defaultAddr.pincode || '743263',
          notes: '',
          coordinates: {
            lat: defaultAddr.gpsCoords?.lat ?? defaultAddr.lat ?? 22.8291,
            lng: defaultAddr.gpsCoords?.lng ?? defaultAddr.lng ?? 88.6148
          }
        };
      }
      return {
        tag: 'Home',
        street: activeCustomer.address || activeCustomer.shippingAddress?.street || '',
        city: activeCustomer.city || activeCustomer.shippingAddress?.city || 'Habra',
        state: activeCustomer.state || activeCustomer.shippingAddress?.state || 'West Bengal',
        postalCode: activeCustomer.postalCode || activeCustomer.shippingAddress?.postalCode || '743263',
        notes: activeCustomer.notes || '',
        coordinates: {
          lat: activeCustomer.gpsLat || activeCustomer.shippingAddress?.coordinates?.lat || 22.8291,
          lng: activeCustomer.gpsLng || activeCustomer.shippingAddress?.coordinates?.lng || 88.6148
        }
      };
    }
    return {
      tag: 'Home',
      street: '',
      city: 'Habra',
      state: 'West Bengal',
      postalCode: '743263',
      notes: '',
      coordinates: { lat: 22.8291, lng: 88.6148 }
    };
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingPickupPerson, setIsEditingPickupPerson] = useState(false);

  // Sync shipping address & customer contact ONLY when logged in
  const syncShippingDetails = () => {
    if (activeCustomer) {
      const defaultAddr = addressService.getDefaultAddress();
      if (defaultAddr) {
        setCustomerInfo({
          name: defaultAddr.name || defaultAddr.recipientName || activeCustomer.fullName || activeCustomer.name || '',
          phone: defaultAddr.phone || activeCustomer.phone || '',
          email: activeCustomer.email || ''
        });

        setShippingAddress({
          tag: defaultAddr.tag || defaultAddr.label || 'Home',
          street: defaultAddr.address || defaultAddr.street || '',
          city: defaultAddr.city || 'Habra / Ashoknagar',
          state: defaultAddr.state || 'West Bengal',
          postalCode: defaultAddr.postalCode || defaultAddr.pincode || '743263',
          notes: '',
          coordinates: {
            lat: defaultAddr.gpsCoords?.lat ?? defaultAddr.lat ?? 22.8291,
            lng: defaultAddr.gpsCoords?.lng ?? defaultAddr.lng ?? 88.6148
          }
        });
      } else {
        setCustomerInfo({
          name: activeCustomer.fullName || activeCustomer.name || '',
          phone: activeCustomer.phone || '',
          email: activeCustomer.email || ''
        });

        setShippingAddress({
          tag: 'Home',
          street: activeCustomer.address || activeCustomer.shippingAddress?.street || '',
          city: activeCustomer.city || activeCustomer.shippingAddress?.city || 'Habra / Ashoknagar',
          state: activeCustomer.state || activeCustomer.shippingAddress?.state || 'West Bengal',
          postalCode: activeCustomer.postalCode || activeCustomer.shippingAddress?.postalCode || '743263',
          notes: activeCustomer.notes || '',
          coordinates: {
            lat: activeCustomer.gpsLat || activeCustomer.shippingAddress?.coordinates?.lat || 22.8291,
            lng: activeCustomer.gpsLng || activeCustomer.shippingAddress?.coordinates?.lng || 88.6148
          }
        });
      }
    } else {
      // Clean guest state
      setCustomerInfo((prev) => ({
        name: prev.name || '',
        phone: prev.phone || '',
        email: prev.email || ''
      }));
    }
  };

  useEffect(() => {
    syncShippingDetails();

    const handleAddressChange = () => {
      syncShippingDetails();
    };

    window.addEventListener('address_changed', handleAddressChange);
    window.addEventListener('storage', handleAddressChange);
    return () => {
      window.removeEventListener('address_changed', handleAddressChange);
      window.removeEventListener('storage', handleAddressChange);
    };
  }, [activeCustomer, isCheckoutOpen, isProfileOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isCheckoutOpen) setIsCheckoutOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCheckoutOpen, setIsCheckoutOpen]);

  if (!isCheckoutOpen) return null;

  // Calculate delivery fee
  const deliveryFee = deliveryMethod === 'shipping' 
    ? (subtotal >= settings.freeShippingThreshold ? 0 : settings.flatShippingFee)
    : 0;

  const grandTotal = subtotal + deliveryFee;

  const validate = () => {
    const errs = {};
    if (deliveryMethod === 'shipping') {
      if (!shippingAddress.street.trim()) {
        showToast('Please add a delivery address to place your order', 'warning');
        openAddressBook('address', 'add');
        return false;
      }
      if (!customerInfo.name.trim()) errs.name = 'Recipient name is required';
      if (!customerInfo.phone.trim()) {
        errs.phone = 'Contact number is required';
      }
    } else {
      if (!customerInfo.name.trim()) errs.name = 'Full name is required';
      if (!customerInfo.phone.trim()) {
        errs.phone = 'WhatsApp phone number is required';
      } else if (customerInfo.phone.trim().length < 10) {
        errs.phone = 'Please enter a valid 10-digit mobile number';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceCodOrder = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fill in all required delivery details', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Format order payload
      const orderPayload = {
        customer_name: customerInfo.name.trim(),
        customer_phone: customerInfo.phone.trim(),
        customer_email: customerInfo.email.trim() || null,
        delivery_address: deliveryMethod === 'shipping' 
          ? `${shippingAddress.street.trim()}, ${shippingAddress.city.trim()}, ${shippingAddress.postalCode.trim()}`
          : `Store Pickup: ${settings.storeName || 'Ganapati Store'} (${settings.storeAddress || 'Main Market Road, Habra, West Bengal 743263'})`,
        gps_lat: deliveryMethod === 'shipping' ? shippingAddress.coordinates.lat : 22.8291,
        gps_lng: deliveryMethod === 'shipping' ? shippingAddress.coordinates.lng : 88.6148,
        deliveryMethod: deliveryMethod,
        channel: 'website',
        payment_method: deliveryMethod === 'shipping' ? 'Cash on Delivery (COD)' : 'Pay on Store Pickup (COD)',
        payment_gateway: 'Cash on Delivery (COD)',
        status: 'pending_cod',
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        total_amount: grandTotal,
        items: cartItems.map((item) => ({
          id: item.id,
          product_name: item.title || item.name,
          title: item.title || item.name,
          variant_name: item.selectedVariant ? item.selectedVariant.name || item.selectedVariant.size : null,
          unit_price: parseFloat(item.price || 0),
          price: parseFloat(item.price || 0),
          quantity: parseInt(item.quantity, 10),
          image: item.image || item.image_url || null
        }))
      };

      // 2. Submit order to Supabase backend API
      const result = await submitStoreApiOrder(STORE_API_KEY, orderPayload);

      if (result.status === 201 || result.success) {
        const placedOrder = result.order || {
          ...orderPayload,
          orderId: result.invoice_number,
          invoice_number: result.invoice_number,
          createdAt: new Date().toISOString()
        };

        // 3. Save / Update customer profile in background ONLY for authenticated users
        if (activeCustomer && deliveryMethod === 'shipping') {
          upsertStoreCustomerProfile({
            phone: customerInfo.phone.trim(),
            fullName: customerInfo.name.trim(),
            email: customerInfo.email.trim(),
            address: shippingAddress.street.trim(),
            city: shippingAddress.city.trim(),
            state: shippingAddress.state.trim(),
            postalCode: shippingAddress.postalCode.trim(),
            gpsLat: shippingAddress.coordinates.lat,
            gpsLng: shippingAddress.coordinates.lng,
          }).catch(console.warn);
        } else if (!activeCustomer) {
          // Reset guest form inputs for next checkout
          setCustomerInfo({ name: '', phone: '', email: '' });
          setShippingAddress({
            tag: 'Home',
            street: '',
            city: 'Habra',
            state: 'West Bengal',
            postalCode: '743263',
            notes: '',
            coordinates: { lat: 22.8291, lng: 88.6148 }
          });
        }

        // 4. Trigger celebration confetti
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 }
        });

        // 5. Clear cart and notify
        clearCart();
        setIsCheckoutOpen(false);
        showToast('Order placed successfully! Redirecting...', 'success');

        if (onOrderSuccess) {
          onOrderSuccess({
            ...placedOrder,
            deliveryMethod: deliveryMethod,
            storeAddress: settings.storeAddress || 'Main Market Road, Habra, West Bengal 743263',
            storeName: settings.storeName || 'Ganapati Store'
          });
        }
      }
    } catch (err) {
      console.error('Order placement error:', err);
      showToast('Failed to place order: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => setIsCheckoutOpen(false)}
      />

      {/* Slide-over Right Side Panel Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-md bg-white shadow-2xl flex flex-col animate-slide-left h-full overflow-hidden">
          
          {/* Header */}
          <div className="p-4 sm:p-5 flex items-center justify-between bg-white sticky top-0 z-20">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Checkout & Dispatch
              </h2>
            </div>

            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Content */}
          <div className="px-4 sm:px-5 pb-6 overflow-y-auto space-y-4 flex-1">
            
            {/* Delivery Method Switcher */}
            <div className="p-1 bg-[#F4F5F7] rounded-2xl grid grid-cols-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDeliveryMethod('shipping')}
                className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  deliveryMethod === 'shipping'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Home Delivery</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod('pickup')}
                className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  deliveryMethod === 'pickup'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Store Pickup</span>
              </button>
            </div>

            {/* OPTION A: HOME DELIVERY */}
            {deliveryMethod === 'shipping' && (
              <>
                {/* Same-Day Delivery Guarantee Banner */}
                <div className="p-3.5 rounded-2xl bg-[#F4F5F7] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 uppercase tracking-wide">
                      <span>⚡ Delivery Expected Today</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Your order will be packed fresh and delivered to your doorstep today by <strong>{settings.storeName || 'Ganapati Store'}</strong>.
                    </p>
                  </div>
                </div>

                {/* Saved Delivery Address Card */}
                {shippingAddress.street ? (
                  <div className="p-4 rounded-2xl bg-[#F4F5F7] space-y-2.5 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-800 shadow-xs">
                          <Check className="w-3 h-3 text-slate-800 stroke-[3]" />
                          <span>Delivery Address</span>
                        </span>
                        {shippingAddress.tag && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
                            {shippingAddress.tag}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => openAddressBook('address', 'list')}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white hover:bg-slate-100 text-slate-900 shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        <span>Change</span>
                      </button>
                    </div>

                    <div className="space-y-1 text-xs pt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{customerInfo.name || 'Recipient'}</span>
                        <span className="font-semibold text-slate-600 font-mono">{customerInfo.phone ? `+91 ${customerInfo.phone.replace(/\D/g, '').slice(-10)}` : ''}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-medium">
                        {shippingAddress.street}
                      </p>
                      <p className="text-slate-500 font-medium">
                        {shippingAddress.city}, {shippingAddress.state} - <strong className="text-slate-800">{shippingAddress.postalCode}</strong>
                      </p>
                      {customerInfo.email && (
                        <p className="text-slate-400 text-[11px] pt-0.5">{customerInfo.email}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-[#F4F5F7] text-center space-y-2.5">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">No delivery address saved</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Please add a delivery address to continue checkout</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAddressBook('address', 'add')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Delivery Address</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* OPTION B: STORE PICKUP */}
            {deliveryMethod === 'pickup' && (
              <div className="space-y-4">
                {/* Store Pickup Notice Banner */}
                <div className="p-3.5 rounded-2xl bg-[#F4F5F7] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 uppercase tracking-wide">
                      <span>Pickup Time Notice</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Your pickup time will be confirmed by the store in <strong>My Orders</strong> right after placing the order.
                    </p>
                  </div>
                </div>

                {/* Store Physical Location Card */}
                <div className="p-4 rounded-2xl bg-[#F4F5F7] space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Building2 className="w-4 h-4 text-slate-900" />
                    <span>{settings.storeName || 'Ganapati Store'} Hub</span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 pl-6">
                    <p className="font-semibold text-slate-800">
                      {settings.storeAddress || 'Main Market Road, Habra, West Bengal 743263'}
                    </p>
                    <p className="text-slate-500">
                      Store Hours: {settings.storeHours || 'Mon - Sun: 8:00 AM - 9:00 PM'}
                    </p>
                    <p className="text-slate-500">
                      WhatsApp Support: {settings.whatsappNumber || '+91 9147364980'}
                    </p>
                  </div>
                </div>

                {/* Pickup Customer Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">1</span>
                      Pickup Person Details
                    </h3>

                    {customerInfo.name && !isEditingPickupPerson && (
                      <button
                        type="button"
                        onClick={() => setIsEditingPickupPerson(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F4F5F7] hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer active:scale-95"
                      >
                        <Edit3 className="w-3 h-3 text-slate-600" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {customerInfo.name && !isEditingPickupPerson ? (
                    <div className="bg-[#F4F5F7] p-3.5 rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{customerInfo.name}</span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-slate-800 text-[10px] font-bold shadow-xs">
                            <Check className="w-3 h-3 text-slate-800" />
                            <span>Profile Contact</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">+91 {customerInfo.phone}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerInfo.name && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setIsEditingPickupPerson(false)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Full Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Bishal Mistri"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border-0 focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            WhatsApp Number <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            placeholder="98765 43210"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value.replace(/\D/g, '') })}
                            className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border-0 focus:bg-white focus:ring-1 focus:ring-slate-400 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Items & Cost Breakdown */}
            <div className="bg-[#F4F5F7] p-3.5 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal ({cartItems.length})</span>
                <span className="font-semibold text-slate-900">{settings.currency}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{deliveryMethod === 'shipping' ? 'Delivery Fee' : 'Store Pickup'}</span>
                <span className="font-bold text-slate-900">
                  {deliveryFee === 0 ? 'FREE' : `${settings.currency}${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200/60">
                <span>Total Payable ({deliveryMethod === 'shipping' ? 'COD' : 'Pickup'})</span>
                <span className="text-slate-900 text-base">{settings.currency}{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Notice (Just before Place Order) */}
            <div className="p-3.5 rounded-2xl bg-[#F4F5F7] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">
                  {deliveryMethod === 'shipping' ? 'Payment Method: Cash on Delivery (COD)' : 'Payment Method: Pay at Store on Pickup'}
                </span>
                <span className="text-slate-600 text-[11px] leading-relaxed">
                  Pay with cash or UPI upon {deliveryMethod === 'shipping' ? 'doorstep delivery' : 'store pickup'}. 100% verified & secure.
                </span>
              </div>
            </div>

          </div>

          {/* Drawer Sticky Footer / Place Order Button */}
          <div className="p-4 sm:p-5 bg-white sticky bottom-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Total Payable ({deliveryMethod === 'shipping' ? 'COD' : 'Pickup'}):
              </span>
              <div className="text-xl font-black text-slate-900">
                {settings.currency}{grandTotal.toFixed(2)}
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlaceCodOrder}
              disabled={isSubmitting}
              className="w-full sm:w-auto flex-1 sm:max-w-xs flex items-center justify-center gap-2 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-bold py-3.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Placing Order...</span>
                </div>
              ) : (
                <>
                  <span>Place Order</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
