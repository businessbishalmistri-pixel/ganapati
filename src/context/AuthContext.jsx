import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const PROFILE_KEY = 'ganapati_customer_profile';
const LEGACY_SESSION_KEY = 'customer_session';

export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY) || localStorage.getItem(LEGACY_SESSION_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read customer profile', e);
    }
    return null;
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profilePendingAction, setProfilePendingAction] = useState(null); // 'checkout' | null

  // Keep in sync with localStorage
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem(PROFILE_KEY) || localStorage.getItem(LEGACY_SESSION_KEY);
        if (saved) {
          setCustomer(JSON.parse(saved));
        } else {
          setCustomer(null);
        }
      } catch (e) {
        console.warn('Could not parse profile from storage', e);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const saveProfile = (profileData) => {
    const standardized = {
      name: profileData.name || '',
      fullName: profileData.name || '',
      phone: profileData.phone || '',
      address: profileData.address || '',
      street: profileData.address || '',
      lat: profileData.lat || null,
      lng: profileData.lng || null,
      gpsLocation: profileData.gpsLocation || (profileData.lat && profileData.lng ? `${profileData.lat}, ${profileData.lng}` : ''),
      gpsUrl: profileData.gpsUrl || (profileData.lat && profileData.lng ? `https://maps.google.com/?q=${profileData.lat},${profileData.lng}` : ''),
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(standardized));
      localStorage.setItem(LEGACY_SESSION_KEY, JSON.stringify(standardized));
    } catch (e) {
      console.warn('Could not save profile to localStorage', e);
    }

    setCustomer(standardized);
    return standardized;
  };

  const openProfileModal = (pendingAction = null) => {
    setProfilePendingAction(pendingAction);
    setIsProfileOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileOpen(false);
    setProfilePendingAction(null);
  };

  const clearProfile = () => {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    setCustomer(null);
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        currentCustomer: customer,
        isProfileOpen,
        setIsProfileOpen,
        openProfileModal,
        closeProfileModal,
        saveProfile,
        clearProfile,
        profilePendingAction,
        setProfilePendingAction,
        // Deprecated compatibility stubs
        isAuthOpen: false,
        setIsAuthOpen: (val) => setIsProfileOpen(val),
        openLoginModal: (action) => openProfileModal(action),
        isOrdersOpen: false,
        setIsOrdersOpen: () => {},
        logout: clearProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
