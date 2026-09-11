import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  supabase, 
  fetchStoreSettingsFromSupabase, 
  updateStoreSettingsInSupabase, 
  mapDbToStoreSettings 
} from '../services/supabaseStore';

const SettingsContext = createContext();

const CACHE_KEY = 'ganapati_cached_store_settings_v2';

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
  // Fast initial hydration from local cache to prevent flashing defaults
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn('Could not read cached settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // 1. Fetch fresh store settings directly from Supabase store_settings table
    let isMounted = true;
    fetchStoreSettingsFromSupabase().then((dbSettings) => {
      if (isMounted) {
        if (dbSettings) {
          setSettings((prev) => {
            const next = { ...prev, ...dbSettings };
            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify(next));
            } catch (err) {
              console.warn(err);
            }
            return next;
          });
        }
        setIsLoadingSettings(false);
      }
    }).catch((err) => {
      console.warn('Error fetching Supabase store_settings:', err);
      if (isMounted) setIsLoadingSettings(false);
    });

    // 2. Subscribe to Realtime Postgres Changes on store_settings table
    const channel = supabase
      .channel('realtime:public:store_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings' },
        (payload) => {
          if (payload?.new) {
            const fresh = mapDbToStoreSettings(payload.new);
            if (fresh) {
              setSettings((prev) => {
                const next = { ...prev, ...fresh };
                try {
                  localStorage.setItem(CACHE_KEY, JSON.stringify(next));
                } catch (err) {
                  console.warn(err);
                }
                return next;
              });
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
    setSettings((prev) => {
      const updated = { ...prev, ...newValues };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn(err);
      }
      return updated;
    });

    // 2. Persist 100% directly to Supabase store_settings table
    const res = await updateStoreSettingsInSupabase(newValues);
    if (res?.success && res.data) {
      setSettings((prev) => {
        const next = { ...prev, ...res.data };
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(next));
        } catch (err) {
          console.warn(err);
        }
        return next;
      });
    }
    return res;
  };

  const resetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (err) {
      console.warn(err);
    }
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
