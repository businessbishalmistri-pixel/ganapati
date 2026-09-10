import React, { useState, useEffect } from 'react';
import { X, Bolt, Check, Phone, ExternalLink, MessageCircle, Store } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';

export function AdminSettingsModal({ isOpen, onClose }) {
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();

  const [whatsappNumber, setWhatsappNumber] = useState(settings?.whatsappNumber || '+91 9147364980');
  const [storeName, setStoreName] = useState(settings?.storeName || 'Ganapati Store');
  const [currency, setCurrency] = useState(settings?.currency || '₹');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setWhatsappNumber(settings?.whatsappNumber || '+91 9147364980');
      setStoreName(settings?.storeName || 'Ganapati Store');
      setCurrency(settings?.currency || '₹');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleTestWhatsApp = () => {
    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 
      ? cleanPhone 
      : cleanPhone.length === 10 
        ? `91${cleanPhone}` 
        : cleanPhone;

    if (!finalPhone || finalPhone.length < 10) {
      showToast('Please enter a valid WhatsApp number first', 'error');
      return;
    }

    const testUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent('Hello! Testing WhatsApp order receiving connection for ' + storeName)}`;
    window.open(testUrl, '_blank');
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);

    const updated = {
      ...settings,
      whatsappNumber: whatsappNumber.trim(),
      storeName: storeName.trim(),
      currency: currency.trim()
    };

    updateSettings(updated);

    // Save directly to localStorage for instant synchronous persistence
    try {
      localStorage.setItem('quickcart_store_settings_live', JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not persist settings to storage', err);
    }

    setTimeout(() => {
      setIsSaving(false);
      showToast('Store settings saved! Orders will now route to ' + whatsappNumber, 'success');
      onClose();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden z-10 animate-slide-up sm:animate-fadeIn">
        
        {/* Mobile Drag Pill */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Bolt className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-none">
              Store Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
          
          {/* 🟢 WhatsApp Order Number Hero Section */}
          <div className="p-3.5 sm:p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                    WhatsApp Order Receiving Number
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">Direct customer order destination</span>
                </div>
              </div>

              {/* Test link button */}
              <button
                type="button"
                onClick={handleTestWhatsApp}
                className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
                title="Test sending message to this number"
              >
                <span>Test Chat</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Input Row */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Phone Number (with Country Code)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="+91 9147364980"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Info helper text */}
            <p className="text-[11px] text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              💡 <strong>How it works:</strong> When a customer clicks <em>"Place Order via WhatsApp"</em> on the storefront, WhatsApp will instantly open on their phone addressed to this number with their full itemized cart and delivery address.
            </p>
          </div>

          {/* 🏪 General Store Details */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Store Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Ganapati Store"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                placeholder="₹"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
