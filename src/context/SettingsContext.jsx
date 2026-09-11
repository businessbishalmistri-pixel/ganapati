import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  supabase, 
  fetchStoreSettingsFromSupabase, 
  updateStoreSettingsInSupabase, 
  mapDbToStoreSettings 
} from '../services/supabaseStore';

const SettingsContext = createContext();

const CACHE_KEY = 'ganapati_cached_store_settings_v2';
const BROADCAST_NAME = 'ganapati_store_settings_broadcast';

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
    let isMounted = true;

    // 1. Fetch fresh store settings directly from Supabase store_settings table
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
            if (fresh && isMounted) {
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

    // 3. Multi-Tab Instant Sync (BroadcastChannel + storage event)
    let bc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel(BROADCAST_NAME);
        bc.onmessage = (event) => {
          if (event?.data && isMounted) {
            setSettings((prev) => ({ ...prev, ...event.data }));
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }

    const handleStorage = (e) => {
      if (e.key === CACHE_KEY && e.newValue && isMounted) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings((prev) => ({ ...prev, ...parsed }));
        } catch (err) {
          console.warn(err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateSettings = async (newValues) => {
    // 1. Optimistic UI update for instantaneous snappy feedback
    setSettings((prev) => {
      const updated = { ...prev, ...newValues };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel(BROADCAST_NAME);
          bc.postMessage(updated);
          bc.close();
        }
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
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const bc = new BroadcastChannel(BROADCAST_NAME);
            bc.postMessage(next);
            bc.close();
          }
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
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel(BROADCAST_NAME);
        bc.postMessage(DEFAULT_SETTINGS);
        bc.close();
      }
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
