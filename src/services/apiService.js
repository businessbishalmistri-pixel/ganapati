/**
 * apiService.js
 * Unified API Service for WhatsApp OTP Auth, Live Products, COD Checkout & Invoices
 */
import { supabase, STORE_ORGANIZATION_ID, STORE_API_KEY as DEFAULT_API_KEY, submitStoreApiOrder } from './supabase';
import { saveOrder, getSavedOrders } from './orderService';

export const STORE_API_KEY = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_STORE_API_KEY : '') || DEFAULT_API_KEY || '';

// 1. Send OTP (Calls Supabase backend, NEVER calls Facebook)
export const sendWhatsAppOtp = async (phoneNumber) => {
  const { data, error } = await supabase.rpc('request_store_whatsapp_otp', {
    p_api_key: STORE_API_KEY,
    p_phone: phoneNumber
  });

  if (error || data?.status !== 200) {
    throw new Error(error?.message || data?.error || 'Failed to send OTP');
  }
  return data;
};

// 2. Verify OTP
export const verifyWhatsAppOtp = async (phoneNumber, enteredOtp) => {
  const { data, error } = await supabase.rpc('verify_store_whatsapp_otp', {
    p_api_key: STORE_API_KEY,
    p_phone: phoneNumber,
    p_otp: enteredOtp
  });

  if (error || data?.status !== 200) {
    throw new Error(error?.message || data?.error || 'Invalid OTP code');
  }
  return data;
};

// Aliases for compatibility
export const sendWhatsAppOtpApi = sendWhatsAppOtp;
export const verifyWhatsAppOtpApi = verifyWhatsAppOtp;

/**
 * 3. 1-Click Cash on Delivery (COD) Checkout Endpoint
 */
export async function submitCODCheckout(orderPayload) {
  try {
    const backendResult = await submitStoreApiOrder(STORE_API_KEY, orderPayload);
    
    const savedOrder = await saveOrder({
      ...orderPayload,
      invoice_number: backendResult?.invoice_number || `INV-${Date.now()}`,
      status: 'pending_cod',
      paymentMethod: 'Cash on Delivery (COD)'
    });

    return {
      success: true,
      order: {
        ...savedOrder,
        invoice_number: backendResult?.invoice_number || savedOrder.orderId
      }
    };
  } catch (error) {
    console.error('COD Checkout API Error:', error);
    const localOrder = await saveOrder({
      ...orderPayload,
      status: 'pending_cod',
      paymentMethod: 'Cash on Delivery (COD)'
    });
    return { success: true, order: localOrder };
  }
}

/**
 * 4. Get Customer Orders for My Orders Portal
 */
export async function fetchCustomerOrders(phone) {
  const localOrders = getSavedOrders();
  const cleanedPhone = phone ? phone.toString().replace(/\D/g, '').slice(-10) : '';

  try {
    let query = supabase
      .from('sales_orders')
      .select('*')
      .eq('organization_id', STORE_ORGANIZATION_ID)
      .order('created_at', { ascending: false });

    if (cleanedPhone) {
      query = query.ilike('customer_phone', `%${cleanedPhone}%`);
    }

    const { data, error } = await query.limit(50);

    if (!error && Array.isArray(data)) {
      const formattedBackendOrders = data.map((ord) => ({
        id: ord.id,
        orderId: ord.invoice_number || `ORD-${ord.id.slice(0, 6)}`,
        invoice_number: ord.invoice_number,
        createdAt: ord.created_at,
        customer: {
          name: ord.customer_name,
          phone: ord.customer_phone || cleanedPhone || 'Verified Customer',
          email: ord.customer_email || ''
        },
        deliveryMethod: 'shipping',
        paymentMethod: ord.payment_method || 'Cash on Delivery (COD)',
        status: ord.status || 'pending_cod',
        subtotal: parseFloat(ord.subtotal || 0),
        deliveryFee: 0,
        total: parseFloat(ord.total_amount || 0),
        items: Array.isArray(ord.items) ? ord.items : []
      }));

      const allOrders = [...localOrders];
      for (const bo of formattedBackendOrders) {
        if (!allOrders.some((o) => o.orderId === bo.orderId || o.invoice_number === bo.invoice_number || o.id === bo.id)) {
          allOrders.push(bo);
        }
      }
      return allOrders;
    }
  } catch (e) {
    console.warn('Could not fetch Supabase orders:', e);
  }

  return localOrders;
}
