import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  requestStoreWhatsAppOtp, 
  verifyStoreWhatsAppOtp, 
  upsertStoreCustomerProfile 
} from '../services/supabase';

const AuthContext = createContext();

const SESSION_KEY = 'customer_session';

export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY) || localStorage.getItem('quickcart_customer_session');
      if (savedSession) {
        return JSON.parse(savedSession);
      }
    } catch (e) {
      console.warn('Could not read customer session', e);
    }
    return null;
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState('hub');
  const [profileInitialSubView, setProfileInitialSubView] = useState('list');

  const openAddressBook = (tab = 'address', subView = 'list') => {
    setProfileInitialTab(tab);
    setProfileInitialSubView(subView);
    setIsProfileOpen(true);
  };

  // OTP Verification State
  const [otpState, setOtpState] = useState({
    sent: false,
    phone: '',
    countdown: 300, // 5 minutes
    generatedOtp: null
  });

  // Sync session on mount/storage
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_KEY) || localStorage.getItem('quickcart_customer_session');
      if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        setCustomer(sessionData);
      } else {
        setCustomer(null);
      }
    } catch (e) {
      console.warn('Could not read customer session', e);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    let timer;
    if (otpState.sent && otpState.countdown > 0) {
      timer = setInterval(() => {
        setOtpState((prev) => ({
          ...prev,
          countdown: Math.max(0, prev.countdown - 1)
        }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpState.sent, otpState.countdown]);

  /**
   * Step A: Send OTP to customer's WhatsApp
   */
  const sendWhatsAppOtp = async (phoneNumber) => {
    const cleanPhone = (phoneNumber || '').replace(/\D/g, '');
    const res = await requestStoreWhatsAppOtp(cleanPhone);
    
    setOtpState({
      sent: true,
      phone: cleanPhone,
      countdown: 300,
      generatedOtp: res.otp
    });

    return res;
  };

  /**
   * Step B: Customer enters 6-digit code & saves session in localStorage
   */
  const verifyWhatsAppOtp = async (enteredOtp) => {
    try {
      const res = await verifyStoreWhatsAppOtp(otpState.phone, enteredOtp);
      if (res && res.customer) {
        // Save session in localStorage
        localStorage.setItem('customer_session', JSON.stringify(res.customer));
        localStorage.setItem('quickcart_customer_session', JSON.stringify(res.customer));
        setCustomer(res.customer);
        setOtpState({ sent: false, phone: '', countdown: 0, generatedOtp: null });
        setIsAuthOpen(false);
        return { success: true, customer: res.customer };
      }
      return { success: false, error: 'Invalid OTP code' };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid OTP code. Please check your WhatsApp.' };
    }
  };

  /**
   * Update Customer Profile & GPS Map Address
   */
  const updateProfile = async (profileData) => {
    const merged = {
      phone: customer?.phone || profileData.phone,
      fullName: profileData.fullName || profileData.name || customer?.fullName || customer?.name,
      name: profileData.name || profileData.fullName || customer?.name,
      email: profileData.email ?? customer?.email,
      address: profileData.address || profileData.street || profileData.shippingAddress?.street || customer?.address,
      city: profileData.city || profileData.shippingAddress?.city || customer?.city,
      state: profileData.state || profileData.shippingAddress?.state || customer?.shippingAddress?.state,
      postalCode: profileData.postalCode || profileData.shippingAddress?.postalCode || customer?.shippingAddress?.postalCode,
      gpsLat: profileData.gpsLat || profileData.coordinates?.lat || profileData.shippingAddress?.coordinates?.lat || customer?.gpsLat,
      gpsLng: profileData.gpsLng || profileData.coordinates?.lng || profileData.shippingAddress?.coordinates?.lng || customer?.gpsLng,
    };

    const res = await upsertStoreCustomerProfile(merged);
    setCustomer(res.customer);
    return res;
  };

  /**
   * Customer Logout
   */
  const logout = () => {
    try {
      localStorage.removeItem('customer_session');
      localStorage.removeItem('quickcart_customer_session');
      localStorage.removeItem('customer_saved_addresses');
      localStorage.removeItem('quickcart_saved_orders');

      // Purge any dynamically keyed customer records
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('xyvot_customer_') || key.startsWith('customer_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}
    setCustomer(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('address_changed', { detail: [] }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        currentCustomer: customer,
        setCurrentCustomer: setCustomer,
        isAuthOpen,
        setIsAuthOpen,
        isOrdersOpen,
        setIsOrdersOpen,
        isProfileOpen,
        setIsProfileOpen,
        profileInitialTab,
        setProfileInitialTab,
        profileInitialSubView,
        setProfileInitialSubView,
        openAddressBook,
        otpState,
        sendWhatsAppOtp,
        verifyWhatsAppOtp,
        updateProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
