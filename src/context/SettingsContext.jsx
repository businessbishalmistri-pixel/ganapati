import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  supabase, 
  fetchStoreSettingsFromSupabase, 
  updateStoreSettingsInSupabase, 
  mapDbToStoreSettings 
} from '../services/supabaseStore';

const SettingsContext = createContext();

export const DEFAULT_SETTINGS = {
  storeName: 'Ganapati Store',
  tagline: '',
  announcementText: 'Free delivery on orders over ₹200 • Cash on Delivery',
  whatsappNumber: '+91 9147364980',
  currency: '₹',
  storeAddress: 'Main Store Hub',
  storeHours: 'Mon - Sun: 8:00 AM - 9:00 PM',
  freeShippingThreshold: 200,
  flatShippingFee: 30.00,
  bannerImageUrl: '',
  firebaseConfigured: false,
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // 1. Clean up legacy local storage key to ensure 100% cloud database authority
    try {
      localStorage.removeItem('quickcart_store_settings_live');
    } catch (e) {
      console.warn('Could not clean up legacy settings storage', e);
    }

    // 2. Fetch fresh store settings directly from Supabase store_settings table
    let isMounted = true;
    fetchStoreSettingsFromSupabase().then((dbSettings) => {
      if (isMounted) {
        if (dbSettings) {
          setSettings((prev) => ({ ...prev, ...dbSettings }));
        }
        setIsLoadingSettings(false);
      }
    }).catch((err) => {
      console.warn('Error fetching Supabase store_settings:', err);
      if (isMounted) setIsLoadingSettings(false);
    });

    // 3. Subscribe to Realtime Postgres Changes on store_settings table
    // Whenever admin changes settings in Supabase, all connected clients & devices update immediately!
    const channel = supabase
      .channel('realtime:public:store_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings' },
        (payload) => {
          if (payload?.new) {
            const fresh = mapDbToStoreSettings(payload.new);
            if (fresh) {
              setSettings((prev) => ({ ...prev, ...fresh }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const updateSettings = async (newValues) => {
    // 1. Optimistic UI update for instantaneous snappy feedback
    setSettings((prev) => ({ ...prev, ...newValues }));

    // 2. Persist 100% directly to Supabase store_settings table
    const res = await updateStoreSettingsInSupabase(newValues);
    if (res?.success && res.data) {
      setSettings((prev) => ({ ...prev, ...res.data }));
    }
    return res;
  };

  const resetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    await updateStoreSettingsInSupabase(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoadingSettings,
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
