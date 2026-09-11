import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Store, 
  Clock, 
  CheckCircle2, 
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

export function StorePickupModal({ onConfirmPickup }) {
  const { 
    isPickupModalOpen, 
    closePickupModal, 
    customer, 
    saveProfile, 
    pickupPendingAction 
  } = useAuth();
  
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isPickupModalOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isPickupModalOpen]);

  useEffect(() => {
    if (isPickupModalOpen) {
      if (customer) {
        setName(customer.name || customer.fullName || '');
        setPhone(customer.phone ? customer.phone.replace(/\D/g, '').slice(-10) : '');
      } else {
        setName('');
        setPhone('');
      }
      setErrors({});
    }
  }, [isPickupModalOpen, customer]);

  if (!isPickupModalOpen) return null;

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Please enter who will pick up the order';
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const profileData = {
      name: name.trim(),
      fullName: name.trim(),
      phone: phone.trim()
    };

    saveProfile(profileData);
    showToast('Pickup contact details saved!', 'success');
    closePickupModal();

    if (onConfirmPickup && pickupPendingAction === 'checkout') {
      onConfirmPickup(profileData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={closePickupModal} />

      {/* Sheet / Modal Container */}
      <div className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden z-10 animate-slide-up sm:animate-fadeIn">
        
        {/* Mobile Drag Indicator Pill */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 sm:hidden flex-shrink-0" />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Store Pickup Details
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Provide contact info for who will collect this order
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closePickupModal}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain">
            
            {/* Store Hub Address Information Card */}
            <div className="p-3.5 bg-[#F4F5F7] rounded-2xl flex items-start gap-3 border border-slate-200/60">
              <div className="w-7 h-7 rounded-xl bg-white text-slate-900 flex items-center justify-center shrink-0 shadow-2xs">
                <Store className="w-3.5 h-3.5 text-slate-900" />
              </div>
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-slate-900 block">{settings?.storeName || 'Ganapati Store'}</span>
                <span className="text-[11px] text-slate-600 block leading-snug">
                  {settings?.storeAddress || 'Main Store Hub'}
                </span>
                <span className="text-[10.5px] text-emerald-700 font-semibold block pt-0.5">
                  Store Hours: {settings?.storeHours || 'Mon - Sun: 8:00 AM - 9:00 PM'}
                </span>
              </div>
            </div>

            {/* Form Fields: Full Name & WhatsApp Number only */}
            <div className="space-y-3.5">
              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pickup Person Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Full name of person collecting order"
                    value={name}
                    onChange={(e) => { 
                      setName(e.target.value); 
                      if (errors.name) setErrors(prev => ({ ...prev, name: '' })); 
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      errors.name ? 'border-rose-300 ring-rose-100 bg-rose-50/40' : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900/10'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-xs text-rose-500 font-semibold mt-1">{errors.name}</p>}
              </div>

              {/* 2. Contact Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pickup Person Phone / WhatsApp <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => { 
                      setPhone(e.target.value.replace(/\D/g, '')); 
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: '' })); 
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-mono ${
                      errors.phone ? 'border-rose-300 ring-rose-100 bg-rose-50/40' : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900/10'
                    }`}
                  />
                </div>
                {errors.phone && <p className="text-xs text-rose-500 font-semibold mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div 
            className="px-4 sm:px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/70 flex-shrink-0"
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
          >
            <button
              type="button"
              onClick={closePickupModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-black active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer"
            >
              <span>Confirm Pickup Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
