/**
 * supabase.js
 * Primary XYVOT Store API & Client Service
 * ZERO Meta tokens in frontend - All WhatsApp dispatch handled securely by XYVOT
 */
import { createClient } from '@supabase/supabase-js';

function sanitizeSupabaseUrl(rawUrl) {
  const fallback = 'https://ftiivdzbimggyxbbkaji.supabase.co';
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return fallback;
  // Guard against API keys or publishable tokens mistakenly configured as VITE_SUPABASE_URL
  if (trimmed.startsWith('sb_') || trimmed.startsWith('eyJ') || trimmed.includes('_')) return fallback;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.includes('sb_publishable') || !trimmed.includes('.')) return fallback;
    return trimmed;
  }
  if (/^[a-z0-9-]{15,30}$/i.test(trimmed)) return `https://${trimmed}.supabase.co`;
  if (trimmed.includes('.')) return `https://${trimmed}`;
  return fallback;
}

function sanitizeSupabaseKey(rawKey) {
  const fallback = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0aWl2ZHpiaW1nZ3l4YmJrYWppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzQ2MDksImV4cCI6MjEwNDYxMDYwOX0.ybjdQubcyaathpa4fXhv5nr2otanhyvEbDpbLxeIqXI';
  if (!rawKey || typeof rawKey !== 'string') return fallback;
  const trimmed = rawKey.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return fallback;
  if (!trimmed.startsWith('eyJ')) return fallback;
  return trimmed;
}

const SUPABASE_URL = sanitizeSupabaseUrl(typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : '');
const SUPABASE_ANON_KEY = sanitizeSupabaseKey(typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : '');

export const STORE_API_KEY = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_STORE_API_KEY : '') || '';
export const DEFAULT_STORE_API_KEY = STORE_API_KEY;
export const STORE_ORGANIZATION_ID = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_STORE_ORGANIZATION_ID : '') || '139a19c6-4542-4aa9-86c9-c3d8aaddcc0d';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Active OTP cache for active sessions
const activeOtpSessions = new Map();

/**
 * 1. Send OTP (Calls Supabase backend RPC, NEVER calls Facebook)
 */
export const sendWhatsAppOtp = async (phoneNumber) => {
  const cleanPhone = (phoneNumber || '').toString().replace(/\D/g, '');
  const phoneToSend = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;

  const { data, error } = await supabase.rpc('request_store_whatsapp_otp', {
    p_api_key: STORE_API_KEY,
    p_phone: phoneToSend
  });

  if (error || (data && data.status && data.status !== 200)) {
    throw new Error(error?.message || data?.error || 'Failed to send OTP');
  }
  return data || { status: 200, success: true, message: 'OTP sent' };
};

/**
 * 2. Verify OTP (Calls Supabase backend RPC)
 */
export const verifyWhatsAppOtp = async (phoneNumber, enteredOtp) => {
  const cleanPhone = (phoneNumber || '').toString().replace(/\D/g, '');
  const phoneToSend = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
  const last10Digits = cleanPhone.slice(-10);

  const { data, error } = await supabase.rpc('verify_store_whatsapp_otp', {
    p_api_key: STORE_API_KEY,
    p_phone: phoneToSend,
    p_otp: enteredOtp
  });

  if (error || (data && data.status && data.status !== 200)) {
    throw new Error(error?.message || data?.error || 'Invalid OTP code');
  }

  // Load existing profile from customer_session
  let existingCustomer = {};
  try {
    const raw = localStorage.getItem('customer_session');
    if (raw) existingCustomer = JSON.parse(raw);
  } catch (e) {}

  const customer = data?.customer || {
    phone: last10Digits,
    fullName: existingCustomer.fullName || existingCustomer.name || 'Verified Customer',
    name: existingCustomer.name || existingCustomer.fullName || 'Verified Customer',
    email: existingCustomer.email || '',
    address: existingCustomer.address || existingCustomer.shippingAddress?.street || '',
    city: existingCustomer.city || existingCustomer.shippingAddress?.city || '',
    gpsLat: existingCustomer.gpsLat || existingCustomer.shippingAddress?.coordinates?.lat || 28.6139,
    gpsLng: existingCustomer.gpsLng || existingCustomer.shippingAddress?.coordinates?.lng || 77.2090,
    shippingAddress: existingCustomer.shippingAddress || {
      street: existingCustomer.address || '',
      city: existingCustomer.city || '',
      state: 'Maharashtra',
      postalCode: '400001',
      coordinates: {
        lat: existingCustomer.gpsLat || 28.6139,
        lng: existingCustomer.gpsLng || 77.2090
      }
    },
    verified: true,
    lastLogin: new Date().toISOString()
  };

  return {
    ...data,
    status: 200,
    success: true,
    customer,
    session_token: data?.session_token || `xyvot_sess_${Date.now()}`
  };
};

/**
 * Aliases and wrappers for unified store architecture
 */
export async function submitStoreApiSendOtp(apiKey, payload) {
  const phone = payload?.phone || payload;
  return await sendWhatsAppOtp(phone);
}

export async function submitStoreApiVerifyOtp(apiKey, payload) {
  const phone = payload?.phone || '';
  const otp = payload?.otp || '';
  return await verifyWhatsAppOtp(phone, otp);
}

export const requestWhatsAppOtpFromXyvot = sendWhatsAppOtp;
export const verifyWhatsAppOtpWithXyvot = verifyWhatsAppOtp;
export const requestStoreWhatsAppOtp = sendWhatsAppOtp;
export const verifyStoreWhatsAppOtp = verifyWhatsAppOtp;

export function sanitizeWhatsAppPhone(phone) {
  const clean = (phone || '').toString().replace(/\D/g, '');
  return clean.slice(-10);
}

/**
 * Upsert Customer Profile in XYVOT Database
 */
export async function upsertStoreCustomerProfile(profileData, orgId) {
  const formattedPhone = sanitizeWhatsAppPhone(profileData.phone);
  
  // Prepare new / updated address object
  const currentAddress = {
    id: profileData.addressId || profileData.id || `addr_${Date.now()}`,
    type: profileData.addressType || profileData.type || profileData.tag || profileData.label || 'Home',
    fullName: profileData.full_name || profileData.fullName || profileData.name || 'Customer',
    phone: formattedPhone,
    email: profileData.email || null,
    street: profileData.address_line || profileData.street || profileData.address || '',
    city: profileData.city || 'Habra',
    state: profileData.state || 'West Bengal',
    pincode: profileData.pincode || profileData.postalCode || '743263',
    lat: parseFloat(profileData.gps_lat || profileData.gpsLat || profileData.lat || 22.8291),
    lng: parseFloat(profileData.gps_lng || profileData.gpsLng || profileData.lng || 88.6148),
    isDefault: profileData.is_default ?? profileData.isDefault ?? true,
    updatedAt: new Date().toISOString()
  };

  const customer = {
    id: profileData.id || `cust_${Date.now()}`,
    admin_id: orgId || null,
    phone: formattedPhone,
    full_name: currentAddress.fullName,
    fullName: currentAddress.fullName,
    name: currentAddress.fullName,
    email: currentAddress.email,
    address_line: currentAddress.street,
    address: currentAddress.street,
    landmark: profileData.landmark || null,
    city: currentAddress.city,
    state: currentAddress.state,
    pincode: currentAddress.pincode,
    postalCode: currentAddress.pincode,
    gps_lat: currentAddress.lat,
    gps_lng: currentAddress.lng,
    gpsLat: currentAddress.lat,
    gpsLng: currentAddress.lng,
    address_type: currentAddress.type,
    is_phone_verified: true,
    addresses: profileData.addresses || [currentAddress],
    shippingAddress: {
      street: currentAddress.street,
      city: currentAddress.city,
      state: currentAddress.state,
      postalCode: currentAddress.pincode,
      coordinates: {
        lat: currentAddress.lat,
        lng: currentAddress.lng
      }
    },
    updated_at: new Date().toISOString()
  };

  // Save session locally
  localStorage.setItem('customer_session', JSON.stringify(customer));
  localStorage.setItem(`xyvot_customer_${formattedPhone}`, JSON.stringify(customer));

  // Save to the database through upsert_customer (the only write path anon can use).
  // Returns the real result: success is true only when the call succeeds.
  const { data, error } = await supabase.rpc('upsert_customer', {
    p_phone: formattedPhone,
    p_full_name: customer.full_name,
    p_email: customer.email,
    p_address: customer.address,
    p_city: customer.city,
    p_gps_lat: customer.gps_lat,
    p_gps_lng: customer.gps_lng,
    p_addresses: customer.addresses,
    p_cart: null
  });

  if (error) {
    console.warn('Supabase customer upsert failed:', error.message);
    return {
      success: false,
      status: 500,
      error: error.message,
      customer,
      ...customer
    };
  }

  return {
    success: true,
    status: 200,
    customer,
    ...customer,
    dbCustomer: data || null
  };
}

/**
 * 4. Cloud cart backup. localStorage is the source of truth for the cart;
 * anon cannot read the customers table, so there is no cloud read. This only
 * backs the cart up through upsert_customer. Returns false when the backup fails.
 */
export async function syncCustomerCloudCart(phone, orgId, items) {
  if (!phone) return false;
  const cleanPhone = sanitizeWhatsAppPhone(phone);
  const cartData = Array.isArray(items) ? items : [];

  try {
    const { error } = await supabase.rpc('upsert_customer', {
      p_phone: cleanPhone,
      p_full_name: null,
      p_email: null,
      p_address: null,
      p_city: null,
      p_gps_lat: null,
      p_gps_lng: null,
      p_addresses: null,
      p_cart: cartData
    });

    if (error) {
      console.warn('syncCustomerCloudCart notice:', error?.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('syncCustomerCloudCart warning:', err);
    return false;
  }
}

