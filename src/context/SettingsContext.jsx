import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

import { fetchStoreInfoFromBackend } from '../services/supabaseStore';

const DEFAULT_SETTINGS = {
  storeName: 'Ganapati Store',
  tagline: '',
  announcementText: 'Free delivery on orders over ₹200 • Cash on Delivery',
  whatsappNumber: '+91 9147364980',
  currency: '₹',
  storeAddress: 'Main Store Hub',
  storeHours: 'Mon - Sat: 9:00 AM - 8:00 PM',
  freeShippingThreshold: 200,
  flatShippingFee: 30.00,
  bannerImageUrl: 'https://res.cloudinary.com/ovj5ffsn/image/upload/v1788725847/freepik-flat-professional-supermarket-green-facebook-header-20260906190851o7W2.png',
  firebaseConfigured: false,
};

const STORAGE_KEY = 'quickcart_store_settings_live';

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Dynamically fetch store organization name from database
    fetchStoreInfoFromBackend().then((info) => {
      if (info && info.storeName) {
        setSettings((prev) => ({
          ...prev,
          storeName: info.storeName || prev.storeName,
          whatsappNumber: info.whatsappNumber || prev.whatsappNumber
        }));
      }
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings((prev) => ({ ...prev, ...parsed }));
        } catch (err) {
          console.error(err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSettings = (newValues) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newValues };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        isSettingsOpen,
        setIsSettingsOpen
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
