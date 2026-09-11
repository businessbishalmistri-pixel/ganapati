/**
 * addressService.js
 * Address Book management with instant LocalStorage access and Supabase background sync
 */
import { supabase } from './supabase';

const STORAGE_KEY = 'customer_saved_addresses';

export const addressService = {
  /**
   * 1. Get all saved addresses from LocalStorage
   */
  getAddresses: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not load saved addresses from storage', e);
    }
    return [];
  },

  /**
   * 2. Get active / default address
   */
  getDefaultAddress: () => {
    const list = addressService.getAddresses();
    return list.find((a) => a.isDefault) || list[0] || null;
  },

  /**
   * 3. Save or Update Address (with Supabase background sync)
   */
  saveAddress: async (phone, addressData) => {
    const list = addressService.getAddresses();
    const isFirst = list.length === 0;
    const shouldBeDefault = isFirst || Boolean(addressData.isDefault);

    // Normalize coordinates & properties
    const lat = addressData.lat ?? addressData.gpsCoords?.lat ?? 22.8291;
    const lng = addressData.lng ?? addressData.gpsCoords?.lng ?? 88.6148;
    const street = addressData.street || addressData.address || '';
    const recipientName = addressData.recipientName || addressData.name || 'Verified Customer';
    const label = addressData.label || addressData.tag || 'Home';
    const pincode = addressData.pincode || addressData.postalCode || '743263';
    const city = addressData.city || 'Habra / Ashoknagar';
    const state = addressData.state || 'West Bengal';

    let updatedList;
    if (addressData.id) {
      // Edit existing
      updatedList = list.map((item) => {
        if (item.id === addressData.id) {
          return {
            ...item,
            ...addressData,
            label,
            tag: label,
            recipientName,
            name: recipientName,
            street,
            address: street,
            city,
            state,
            pincode,
            postalCode: pincode,
            lat,
            lng,
            gpsCoords: { lat, lng },
            isDefault: shouldBeDefault,
            updatedAt: new Date().toISOString()
          };
        }
        return shouldBeDefault ? { ...item, isDefault: false } : item;
      });
    } else {
      // Add new
      const newAddress = {
        ...addressData,
        id: `addr_${Date.now()}`,
        label,
        tag: label,
        recipientName,
        name: recipientName,
        phone: addressData.phone || phone || '',
        street,
        address: street,
        city,
        state,
        pincode,
        postalCode: pincode,
        lat,
        lng,
        gpsCoords: { lat, lng },
        isDefault: shouldBeDefault,
        updatedAt: new Date().toISOString()
      };

      updatedList = shouldBeDefault
        ? list.map((item) => ({ ...item, isDefault: false })).concat(newAddress)
        : [...list, newAddress];
    }

    // Ensure at least 1 address is marked default
    if (!updatedList.some((a) => a.isDefault) && updatedList.length > 0) {
      updatedList[0].isDefault = true;
    }

    // Update LocalStorage instantly
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('address_changed', { detail: updatedList }));
    }

    // Background sync to Supabase if customer phone is available
    if (phone) {
      const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
      try {
        await supabase
          .from('customers')
          .update({ addresses: updatedList })
          .eq('phone', cleanPhone);
      } catch (err) {
        console.warn('Background Supabase address sync error:', err);
      }
    }

    return updatedList;
  },

  /**
   * 4. Set an address as Default
   */
  setDefaultAddress: async (phone, addressId) => {
    const list = addressService.getAddresses();
    const updatedList = list.map((item) => ({
      ...item,
      isDefault: item.id === addressId
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('address_changed', { detail: updatedList }));
    }

    if (phone) {
      const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
      try {
        await supabase
          .from('customers')
          .update({ addresses: updatedList })
          .eq('phone', cleanPhone);
      } catch (err) {
        console.warn('Background sync error:', err);
      }
    }
    return updatedList;
  },

  /**
   * 5. Delete Address (Default address cannot be deleted)
   */
  deleteAddress: async (phone, addressId) => {
    const list = addressService.getAddresses();
    const toDelete = list.find((item) => item.id === addressId);
    if (toDelete?.isDefault) {
      console.warn('Cannot delete default address');
      return list;
    }

    let updatedList = list.filter((item) => item.id !== addressId);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('address_changed', { detail: updatedList }));
    }

    if (phone) {
      const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
      try {
        await supabase
          .from('customers')
          .update({ addresses: updatedList })
          .eq('phone', cleanPhone);
      } catch (err) {
        console.warn('Background sync error:', err);
      }
    }
    return updatedList;
  },

  /**
   * 6. Clear Addresses (Used on customer logout)
   */
  clearAddresses: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('address_changed', { detail: [] }));
      }
    } catch (e) {
      console.warn('Could not clear addresses', e);
    }
  }
};
