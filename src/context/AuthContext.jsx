import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const PROFILE_KEY = 'ganapati_customer_profile';
const PICKUP_PROFILE_KEY = 'ganapati_pickup_profile';
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

  const [pickupProfile, setPickupProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(PICKUP_PROFILE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read pickup profile', e);
    }
    return null;
  });

  // Ephemeral/session-only pickup contact for current cart order
  const [sessionPickupContact, setSessionPickupContact] = useState(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profilePendingAction, setProfilePendingAction] = useState(null); // 'checkout' | null

  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [pickupPendingAction, setPickupPendingAction] = useState(null); // 'checkout' | null

  // Keep in sync with localStorage
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem(PROFILE_KEY) || localStorage.getItem(LEGACY_SESSION_KEY);
        setCustomer(saved ? JSON.parse(saved) : null);

        const savedPickup = localStorage.getItem(PICKUP_PROFILE_KEY);
        setPickupProfile(savedPickup ? JSON.parse(savedPickup) : null);
      } catch (e) {
        console.warn('Could not parse profile from storage', e);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const saveProfile = (profileData) => {
    const standardized = {
      ...(customer || {}),
      name: profileData.name || customer?.name || '',
      fullName: profileData.name || customer?.fullName || '',
      phone: profileData.phone || customer?.phone || '',
      address: profileData.address !== undefined ? profileData.address : (customer?.address || ''),
      street: profileData.street !== undefined ? profileData.street : (customer?.street || ''),
      lat: profileData.lat !== undefined ? profileData.lat : (customer?.lat || null),
      lng: profileData.lng !== undefined ? profileData.lng : (customer?.lng || null),
      gpsLocation: profileData.gpsLocation || (profileData.lat && profileData.lng ? `${profileData.lat}, ${profileData.lng}` : (customer?.gpsLocation || '')),
      gpsUrl: profileData.gpsUrl || (profileData.lat && profileData.lng ? `https://maps.google.com/?q=${profileData.lat},${profileData.lng}` : (customer?.gpsUrl || '')),
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

  const savePickupProfile = (pickupData, saveForFuture = false) => {
    const standardized = {
      name: pickupData.name || '',
      phone: pickupData.phone || '',
      updatedAt: new Date().toISOString()
    };

    // Always set for current checkout session
    setSessionPickupContact(standardized);

    // Only save permanently to localStorage if user explicitly checked "Use this for future store pickup"
    if (saveForFuture) {
      try {
        localStorage.setItem(PICKUP_PROFILE_KEY, JSON.stringify(standardized));
      } catch (e) {
        console.warn('Could not save pickup profile to localStorage', e);
      }
      setPickupProfile(standardized);
    }

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

  const openPickupModal = (pendingAction = null) => {
    setPickupPendingAction(pendingAction);
    setIsPickupModalOpen(true);
  };

  const closePickupModal = () => {
    setIsPickupModalOpen(false);
    setPickupPendingAction(null);
  };

  const clearProfile = () => {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(PICKUP_PROFILE_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    setCustomer(null);
    setPickupProfile(null);
    setSessionPickupContact(null);
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        currentCustomer: customer,
        pickupProfile,
        sessionPickupContact,
        setSessionPickupContact,
        savePickupProfile,
        isProfileOpen,
        setIsProfileOpen,
        openProfileModal,
        closeProfileModal,
        isPickupModalOpen,
        setIsPickupModalOpen,
        openPickupModal,
        closePickupModal,
        pickupPendingAction,
        setPickupPendingAction,
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
