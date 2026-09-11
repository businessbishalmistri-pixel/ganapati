import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ShoppingBag,
  Store,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { LocationPicker } from './LocationPicker';

export function CustomerProfileModal() {
  const { 
    isProfileOpen, 
    closeProfileModal, 
    customer, 
    saveProfile, 
    profilePendingAction 
  } = useAuth();
  
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [useForPickup, setUseForPickup] = useState(true);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState({ lat: 22.8291, lng: 88.6148 }); // Default to West Bengal area or previous coord
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isProfileOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isProfileOpen]);

  useEffect(() => {
    if (isProfileOpen) {
      if (customer) {
        setName(customer.name || customer.fullName || '');
        setPhone(customer.phone ? customer.phone.replace(/\D/g, '').slice(-10) : '');
        setAddress(customer.address || customer.street || '');
        setUseForPickup(customer.useForPickup !== undefined ? customer.useForPickup : true);
        if (customer.lat && customer.lng) {
          setCoords({ lat: parseFloat(customer.lat), lng: parseFloat(customer.lng) });
        }
      } else {
        setName('');
        setPhone('');
        setAddress('');
        setUseForPickup(true);
      }
      setErrors({});
    }
  }, [isProfileOpen, customer]);

  if (!isProfileOpen) return null;

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Please enter your full name';
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!address.trim()) {
      errs.address = 'Please enter your delivery address / house no.';
    }

    if (!coords || !coords.lat || !coords.lng) {
      errs.coords = 'Please pinpoint your delivery spot on the map';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const latNum = coords?.lat ? Number(coords.lat.toFixed(6)) : null;
    const lngNum = coords?.lng ? Number(coords.lng.toFixed(6)) : null;

    const profileData = {
      name: name.trim(),
      fullName: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      street: address.trim(),
      useForPickup: useForPickup,
      pickupName: useForPickup ? name.trim() : (customer?.pickupName || ''),
      pickupPhone: useForPickup ? phone.trim() : (customer?.pickupPhone || ''),
      lat: latNum,
      lng: lngNum,
      gpsLocation: latNum && lngNum ? `${latNum}, ${lngNum}` : '',
      gpsUrl: latNum && lngNum ? `https://maps.google.com/?q=${latNum},${lngNum}` : ''
    };

    saveProfile(profileData);
    showToast('Delivery details & map location saved!', 'success');
    closeProfileModal();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={closeProfileModal} />

      {/* Sheet / Modal Container */}
      <div className="relative bg-white w-full max-w-3xl lg:max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden z-10 animate-slide-up sm:animate-fadeIn">
        
        {/* Mobile Drag Indicator Pill */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 sm:hidden flex-shrink-0" />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Delivery & Map Details
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Fill in your details and pinpoint your location on the map
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeProfileModal}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 overscroll-contain">
            {profilePendingAction === 'checkout' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
                <ShoppingBag className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>Please save your delivery information and map pin below to send your WhatsApp order.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Side: Form Inputs */}
              <div className="space-y-4">
                {/* 1. Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amit Roy"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        errors.name ? 'border-red-300 ring-red-100' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                {/* 2. Contact Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setErrors(prev => ({ ...prev, phone: '' })); }}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all font-mono ${
                        errors.phone ? 'border-red-300 ring-red-100' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                {/* Checkbox: Use this details for store pickup orders */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useForPickup}
                      onChange={(e) => setUseForPickup(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 transition-colors cursor-pointer accent-emerald-600"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800 block">
                        Use this details for store pickup orders
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Saves this name and contact number for quick 1-click store pickup orders.
                      </p>
                    </div>
                  </label>
                </div>

                {/* 3. Delivery Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Delivery Address / House No. <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="House / Flat No., Landmark, Area"
                      value={address}
                      onChange={(e) => { setAddress(e.target.value); setErrors(prev => ({ ...prev, address: '' })); }}
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        errors.address ? 'border-red-300 ring-red-100' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                      }`}
                    />
                  </div>
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>
              </div>

              {/* Right Side: Map Selection */}
              <div className="-mx-4 sm:mx-0">
                <div className="bg-slate-50/50 p-0 sm:p-3 rounded-none sm:rounded-2xl border-0 sm:border border-slate-100">
                  <LocationPicker
                    coordinates={coords}
                    onChange={(newCoords) => {
                      setCoords(newCoords);
                      setErrors(prev => ({ ...prev, coords: '' }));
                    }}
                    label="Pinpoint Delivery Spot"
                    required={true}
                    error={errors.coords}
                    autoLocate={!customer?.lat || !customer?.lng}
                  />
                </div>
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
              onClick={closeProfileModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center cursor-pointer"
            >
              <span>Save Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
