import React from 'react';
import { ArrowRight, ShieldCheck, Store, Truck, Clock, Check } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export const OrderSuccessModal = ({ orderDetails, onClose }) => {
  const { settings } = useSettings();

  if (!orderDetails) return null;

  const order = orderDetails.placedOrder || orderDetails.order || orderDetails;
  const orderNumber = order?.invoice_number || order?.orderId || 'ORD-2026';
  const isPickup = order?.deliveryMethod === 'pickup' || orderDetails?.deliveryMethod === 'pickup';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in" 
        onClick={onClose}
      />

      {/* Modern White Minimalist Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden z-10 animate-slide-up border border-slate-200/90 my-auto p-6 sm:p-8 text-center space-y-5">
        
        {/* Celebration Icon */}
        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
          <Check className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3]" />
        </div>

        {/* Title & Order ID */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isPickup ? 'Store Pickup Order Placed!' : 'Order Placed Successfully!'}
          </h2>
          <p className="text-xs text-slate-500">
            Order Reference <strong className="text-slate-900 font-mono">#{orderNumber}</strong>
          </p>
        </div>

        {/* Dispatch Notice / Same-day Delivery Banner */}
        {isPickup ? (
          <div className="p-3.5 rounded-2xl bg-[#F4F5F7] text-xs text-slate-800 text-left flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">Pickup Time Confirmation Pending</span>
              <span className="text-slate-600 text-[11px] leading-relaxed">
                The store will confirm your pickup time shortly in <strong>My Orders</strong>.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-[#F4F5F7] text-xs text-slate-800 text-left flex items-start gap-2.5">
            <Truck className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">⚡ Delivery Expected Today</span>
              <span className="text-slate-600 text-[11px] leading-relaxed">
                Your order is packed fresh and dispatched directly to your doorstep today.
              </span>
            </div>
          </div>
        )}

        {/* Order Details Receipt Card */}
        <div className="bg-[#F4F5F7] rounded-2xl p-4 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Customer:</span>
            <span className="font-bold text-slate-900">
              {order?.customer_name || order?.customer?.name || 'Verified Customer'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Delivery Mode:</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              {isPickup ? (
                <>
                  <Store className="w-3.5 h-3.5 text-slate-900" />
                  <span>Store Pickup</span>
                </>
              ) : (
                <>
                  <Truck className="w-3.5 h-3.5 text-slate-900" />
                  <span>Home Delivery (Today)</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Payment Mode:</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
              Cash on Delivery (COD)
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
            <span className="text-slate-500 font-bold">Total Amount:</span>
            <span className="font-black text-sm text-slate-900">
              {settings.currency}{Number(order?.total_amount || order?.total || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>

      </div>
    </div>
  );
};
