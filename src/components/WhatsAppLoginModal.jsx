import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, CheckCircle, Smartphone, User, MapPin, Mail, Home, Briefcase, Navigation, Save } from 'lucide-react';
import { requestStoreWhatsAppOtp, verifyStoreWhatsAppOtp, upsertStoreCustomerProfile } from '../services/supabase';
import { addressService } from '../services/addressService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { LocationPicker } from './LocationPicker';

export const WhatsAppLoginModal = () => {
  const { isAuthOpen, setIsAuthOpen, setCurrentCustomer, postAuthAction, setPostAuthAction } = useAuth();
  const { setIsCheckoutOpen } = useCart();
  const { showToast } = useToast();

  const [phone, setPhone] = useState('');
  // step: 'phone' | 'otp' | 'onboarding'
  const [step, setStep] = useState('phone');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300);

  // First-time onboarding state
  const [onboardingData, setOnboardingData] = useState({
    tag: 'Home',
    fullName: '',
    street: '',
    city: 'Habra / Ashoknagar',
    state: 'West Bengal',
    postalCode: '743263',
    email: '',
    isDefault: true,
    coordinates: { lat: 22.8291, lng: 88.6148 }
  });
  const [onboardingErrors, setOnboardingErrors] = useState({});

  const inputRefs = useRef([]);

  useEffect(() => {
    if (isAuthOpen) {
      setPhone('');
      setStep('phone');
      setOtpDigits(['', '', '', '', '', '']);
      setLoading(false);
      setCountdown(300);
    }
  }, [isAuthOpen]);

  useEffect(() => {
    let timer;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthOpen) closeLoginModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthOpen]);

  if (!isAuthOpen) return null;

  const closeLoginModal = () => {
    setIsAuthOpen(false);
    setPhone('');
    setStep('phone');
    setOtpDigits(['', '', '', '', '', '']);
    setPostAuthAction(null);
  };

  const formatMinutes = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Step 1: Send OTP to customer's WhatsApp
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setLoading(true);
    try {
      await requestStoreWhatsAppOtp(cleanPhone);
      setStep('otp');
      setCountdown(300);
      showToast('6-digit OTP sent to your WhatsApp!', 'success');
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    } catch (err) {
      showToast(err.message || 'Failed to send WhatsApp OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otpDigits];
    newOtp[index] = value.substring(value.length - 1);
    setOtpDigits(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits are entered
    if (index === 5 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        verifyCode(fullOtp);
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    if (pastedData.length === 6) {
      verifyCode(pastedData);
    }
  };

  const verifyCode = async (codeToVerify) => {
    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const res = await verifyStoreWhatsAppOtp(cleanPhone, codeToVerify);
      
      const loggedInCust = res.customer;
      localStorage.setItem('customer_session', JSON.stringify(loggedInCust));
      setCurrentCustomer(loggedInCust);

      // Check if user is a first-time user without saved name or address
      const isFirstTime = !loggedInCust?.fullName || 
        loggedInCust?.fullName === 'Verified Customer' || 
        !loggedInCust?.address ||
        !loggedInCust?.shippingAddress?.street;

      if (isFirstTime) {
        // Switch to Step 3: First-Time Onboarding
        setOnboardingData((prev) => ({
          ...prev,
          fullName: loggedInCust.fullName !== 'Verified Customer' ? (loggedInCust.fullName || '') : '',
          email: loggedInCust.email || '',
          street: loggedInCust.address || loggedInCust.shippingAddress?.street || '',
          city: loggedInCust.city || 'Habra / Ashoknagar',
          state: loggedInCust.state || 'West Bengal',
          postalCode: loggedInCust.postalCode || '743263',
          coordinates: {
            lat: loggedInCust.gpsLat || loggedInCust.shippingAddress?.coordinates?.lat || 22.8291,
            lng: loggedInCust.gpsLng || loggedInCust.shippingAddress?.coordinates?.lng || 88.6148
          }
        }));
        setStep('onboarding');
        showToast('OTP verified! Please set up your delivery details.', 'info');
      } else {
        showToast(`Welcome back, ${loggedInCust.fullName || 'Customer'}!`, 'success');
        const shouldCheckout = postAuthAction === 'checkout';
        closeLoginModal();
        if (shouldCheckout) {
          setIsCheckoutOpen(true);
        }
      }
    } catch (err) {
      showToast('Invalid OTP code. Please check your WhatsApp.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Manual click verify
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      showToast('Please enter the complete 6-digit OTP', 'warning');
      return;
    }
    await verifyCode(fullOtp);
  };

  // Step 3: Save First-Time Customer Onboarding Details
  const handleSaveOnboarding = async (e) => {
    e?.preventDefault();
    if (!onboardingData.fullName.trim()) {
      showToast('Please enter your full name', 'warning');
      return;
    }
    if (!onboardingData.street.trim()) {
      showToast('Please enter your delivery street address', 'warning');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Save address via addressService
      const addressPayload = {
        label: onboardingData.tag || 'Home',
        tag: onboardingData.tag || 'Home',
        recipientName: onboardingData.fullName.trim(),
        name: onboardingData.fullName.trim(),
        phone: cleanPhone,
        street: onboardingData.street.trim(),
        address: onboardingData.street.trim(),
        city: onboardingData.city.trim() || 'Habra / Ashoknagar',
        state: onboardingData.state.trim() || 'West Bengal',
        pincode: onboardingData.postalCode.trim() || '743263',
        postalCode: onboardingData.postalCode.trim() || '743263',
        lat: onboardingData.coordinates.lat,
        lng: onboardingData.coordinates.lng,
        gpsCoords: onboardingData.coordinates,
        isDefault: true
      };

      await addressService.saveAddress(cleanPhone, addressPayload);

      const saved = await upsertStoreCustomerProfile({
        phone: cleanPhone,
        fullName: onboardingData.fullName.trim(),
        name: onboardingData.fullName.trim(),
        email: onboardingData.email.trim(),
        address: onboardingData.street.trim(),
        city: onboardingData.city.trim(),
        state: onboardingData.state.trim(),
        postalCode: onboardingData.postalCode.trim(),
        gpsLat: onboardingData.coordinates.lat,
        gpsLng: onboardingData.coordinates.lng,
      });

      if (saved && saved.customer) {
        localStorage.setItem('customer_session', JSON.stringify(saved.customer));
        setCurrentCustomer(saved.customer);
      }

      showToast('Profile & delivery address saved! Ready for 1-click checkout.', 'success');
      const shouldCheckout = postAuthAction === 'checkout';
      closeLoginModal();
      if (shouldCheckout) {
        setIsCheckoutOpen(true);
      }
    } catch (err) {
      showToast('Failed to save profile: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={closeLoginModal}
      />

      {/* Slide-over Right Side Panel Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-md bg-white shadow-2xl flex flex-col animate-slide-left border-l border-slate-200/90 h-full overflow-hidden">
          
          {/* Header with Close Button */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-white flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Smartphone className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {step === 'onboarding' ? 'Add New Address' : 'WhatsApp Login'}
                </h2>
                <p className="text-xs text-slate-500">
                  {step === 'otp' ? 'Enter 6-digit verification code' : step === 'onboarding' ? 'Set up your delivery profile' : 'Direct 1-Click Verification'}
                </p>
              </div>
            </div>

            <button
              onClick={closeLoginModal}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col">
            
            {step === 'phone' && (
              /* Step 1: Phone Entry */
              <div className="space-y-5 my-auto text-left">
                <div className="text-left space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Enter WhatsApp Number</h3>
                  <p className="text-xs text-slate-500">
                    We will send a 6-digit instant verification code
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 text-left">
                      Mobile Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-semibold text-xs border-r border-slate-200 pr-2.5 my-2">
                        +91
                      </div>
                      <input
                        type="tel"
                        placeholder=""
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full pl-16 pr-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all tracking-wider"
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phone.length < 10}
                    className="w-full py-3.5 px-4 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 uppercase tracking-wider"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Get WhatsApp OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {step === 'otp' && (
              /* Step 2: OTP Verification */
              <div className="space-y-5 my-auto text-left">
                <div className="text-left space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Verify WhatsApp OTP</h3>
                  <p className="text-xs text-slate-500">
                    Code sent to <span className="font-semibold text-slate-800">+91 {phone}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
                  <div className="flex justify-start gap-2" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-11 h-12 text-center font-bold text-base rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
                    <span>
                      Resend in <span className="font-semibold font-mono text-slate-800">{formatMinutes(countdown)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpDigits.join('').length < 6}
                    className="w-full py-3.5 px-4 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 uppercase tracking-wider"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Verify Code</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {step === 'onboarding' && (
              /* Step 3: First-Time User Profile & Address Setup (Matches Address Editor UI exactly) */
              <form onSubmit={handleSaveOnboarding} className="space-y-4 animate-fade-in pb-4">
                
                {/* Address Type Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Address Type
                  </label>
                  <div className="flex items-center gap-2">
                    {['Home', 'Work', 'Other'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setOnboardingData({ ...onboardingData, tag })}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          onboardingData.tag === tag
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-[#F4F5F7] text-slate-700 border-transparent hover:bg-slate-200/80'
                        }`}
                      >
                        {tag === 'Home' && <Home className="w-3.5 h-3.5" />}
                        {tag === 'Work' && <Briefcase className="w-3.5 h-3.5" />}
                        {tag === 'Other' && <MapPin className="w-3.5 h-3.5" />}
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient Details */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bishal Mistri"
                      value={onboardingData.fullName}
                      onChange={(e) => setOnboardingData({ ...onboardingData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        WhatsApp Phone
                      </label>
                      <input
                        type="text"
                        value={phone ? `+91 ${phone}` : '+91 98765 43210'}
                        disabled
                        className="w-full px-3.5 py-2.5 text-xs font-mono font-medium rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed border border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="oliva@example.com"
                        value={onboardingData.email}
                        onChange={(e) => setOnboardingData({ ...onboardingData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Address & GPS Details */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Street Address / Flat / Building *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Station Road, 4no Gali, Near City Hospital"
                      value={onboardingData.street}
                      onChange={(e) => setOnboardingData({ ...onboardingData, street: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        placeholder="Habra / Ashoknagar"
                        value={onboardingData.city}
                        onChange={(e) => setOnboardingData({ ...onboardingData, city: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                      <input
                        type="text"
                        placeholder="West Bengal"
                        value={onboardingData.state}
                        onChange={(e) => setOnboardingData({ ...onboardingData, state: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        placeholder="743263"
                        value={onboardingData.postalCode}
                        onChange={(e) => setOnboardingData({ ...onboardingData, postalCode: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#F4F5F7] border border-transparent focus:border-slate-400 focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Leaflet GPS Map Picker */}
                  <div className="pt-2">
                    <LocationPicker
                      coordinates={onboardingData.coordinates}
                      onChange={(coords) => setOnboardingData({ ...onboardingData, coordinates: coords })}
                      label="Pinpoint Location on Map:"
                    />
                  </div>

                  {/* Make Default Address Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={onboardingData.isDefault}
                        onChange={(e) => setOnboardingData({ ...onboardingData, isDefault: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <span>Set as default delivery address</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeLoginModal}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>SAVE</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
