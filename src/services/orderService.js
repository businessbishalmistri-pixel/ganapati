/**
 * orderService.js
 * Handles saving orders to Firestore and formatting WhatsApp messages
 */
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestoreDb, isFirebaseConfigured } from './firebase';
import { inventoryApi } from './inventoryApi';
import { submitBackendOrder } from './supabaseStore';

const LOCAL_ORDERS_KEY = 'quickcart_saved_orders';

export const saveOrder = async (orderData) => {
  const orderId = 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const timestamp = new Date().toISOString();

  const completeOrder = {
    orderId,
    createdAt: timestamp,
    status: 'PLACED_PENDING_WHATSAPP',
    ...orderData,
  };

  let savedToFirestore = false;
  let firestoreId = null;

  // 1. Try saving to Firestore if configured
  if (isFirebaseConfigured()) {
    try {
      const db = getFirestoreDb();
      if (db) {
        const docRef = await addDoc(collection(db, 'orders'), {
          ...completeOrder,
          serverTimestamp: serverTimestamp(),
        });
        firestoreId = docRef.id;
        savedToFirestore = true;
      }
    } catch (err) {
      console.warn('Could not save to Firestore, falling back to local store:', err);
    }
  }

  // 2. Fallback / local backup in localStorage
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]');
    existing.unshift({
      ...completeOrder,
      firestoreId,
      savedToFirestore
    });
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch (err) {
    console.error('Error saving order locally', err);
  }

  // 3. Sync with XYVOT / Supabase backend orders
  try {
    await submitBackendOrder(completeOrder);
  } catch (err) {
    console.log('Backend sync status:', err);
  }

  // 4. Decrement inventory
  if (orderData.items && orderData.items.length > 0) {
    await inventoryApi.decrementStockForOrder(orderData.items);
  }

  return {
    ...completeOrder,
    firestoreId,
    savedToFirestore
  };
};

/**
 * Generate formatted WhatsApp message
 */
export const formatWhatsAppMessage = (order, storeSettings = {}) => {
  const divider = '━━━━━━━━━━━━━━━━━━━━';
  
  let msg = `🛍️ *NEW ORDER: ${order.orderId || order.invoice_number || 'ORDER'}*\n`;
  msg += `${divider}\n\n`;

  // Customer Info
  const customerName = order.customer?.name || order.customer_name || 'Customer';
  const customerPhone = order.customer?.phone || order.customer_phone || '';
  const customerEmail = order.customer?.email || order.customer_email || '';

  msg += `👤 *Customer Details:*\n`;
  msg += `• *Name:* ${customerName}\n`;
  if (customerPhone) {
    msg += `• *Phone:* ${customerPhone}\n`;
  }
  if (customerEmail) {
    msg += `• *Email:* ${customerEmail}\n`;
  }
  msg += `\n`;

  // Delivery Method
  const isShipping = order.deliveryMethod === 'shipping';
  msg += `📦 *Fulfillment Method:* ${isShipping ? '🚚 Home Delivery' : '🏪 Store Pickup'}\n`;

  if (isShipping) {
    const addr = order.shippingAddress || {};
    const deliveryAddressStr = order.delivery_address || (addr.street ? `${addr.street}\n${addr.city || ''}, ${addr.state || ''} ${addr.postalCode || ''}` : '');
    
    if (deliveryAddressStr) {
      msg += `📍 *Delivery Address:*\n${deliveryAddressStr.trim()}\n`;
    }
    
    const lat = addr.coordinates?.lat ?? order.gps_lat;
    const lng = addr.coordinates?.lng ?? order.gps_lng;
    if (lat && lng) {
      const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
      msg += `🗺️ *Pin Location (Google Maps):*\n${mapsUrl}\n`;
    }
  } else {
    msg += `🏢 *Pickup Store:* ${storeSettings.storeAddress || 'Main Store Hub'}\n`;
    msg += `ℹ️ *Pickup Time:* Will be confirmed via WhatsApp reply\n`;
  }

  msg += `\n${divider}\n`;
  msg += `🛒 *Items to Dispatch:*\n`;

  const items = order.items || [];
  items.forEach((item, index) => {
    const vLabel = item.selectedVariant ? ` (${item.selectedVariant.name || item.selectedVariant.size})` : (item.variant_name ? ` (${item.variant_name})` : '');
    const title = item.title || item.product_name || 'Product';
    const qty = item.quantity || 1;
    msg += `${index + 1}. *${title}${vLabel}* × ${qty}\n`;
  });

  msg += `${divider}\n\n`;
  
  msg += `💳 *Payment:* ${isShipping ? 'Cash on Delivery (COD)' : 'Pay on Store Pickup (COD / Cash / UPI)'}\n\n`;
  msg += `_Thank you for ordering with ${storeSettings.storeName || 'Ganapati Store'}!_`;

  return msg;
};

/**
 * Clean phone number & create wa.me link
 */
export const buildWhatsAppUrl = (rawPhoneNumber, messageText) => {
  // Strip out spaces, dashes, parentheses, plus
  let cleaned = (rawPhoneNumber || '').replace(/[^0-9]/g, '');
  
  // If 10 digit Indian number without country code, prepend 91
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  const encodedText = encodeURIComponent(messageText);
  return `https://wa.me/${cleaned}?text=${encodedText}`;
};

export const getSavedOrders = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]');
  } catch {
    return [];
  }
};
