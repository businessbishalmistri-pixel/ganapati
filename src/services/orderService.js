/**
 * orderService.js
 * Single order path: saves orders to the Supabase `orders` table and
 * formats WhatsApp messages. No Firestore, no other order store.
 */
import { supabase } from './supabase';

const LOCAL_ORDERS_KEY = 'quickcart_saved_orders';

export const saveOrder = async (orderData) => {
  const orderId = 'ORD-' + Date.now();
  const timestamp = new Date().toISOString();

  const completeOrder = {
    ...orderData,
    orderId,
    createdAt: timestamp,
    status: 'pending',
    channel: 'website',
    payment_method: 'cod',
    paymentMethod: 'Cash on Delivery (COD)',
  };

  const payload = {
    order_id: orderId,
    customer_name: orderData.customer_name || orderData.customer?.name || 'Customer',
    customer_phone: orderData.customer_phone || orderData.customer?.phone || '',
    customer_email: orderData.customer_email || orderData.customer?.email || '',
    delivery_method: orderData.delivery_method || orderData.deliveryMethod || 'pickup',
    delivery_address: orderData.delivery_address || orderData.shippingAddress || {},
    items: Array.isArray(orderData.items) ? orderData.items : [],
    subtotal: Number(orderData.subtotal || 0),
    total_amount: Number(orderData.total_amount ?? orderData.total ?? orderData.subtotal ?? 0),
    payment_method: 'cod',
    channel: 'website',
    status: 'pending',
  };

  // 1. Save the order first. On failure throw so the caller keeps the cart.
  // No .select() here: anon has no SELECT on orders (by design), and asking
  // for the inserted row back would fail the whole insert. The order number
  // in completeOrder is all the caller needs.
  const { error } = await supabase
    .from('orders')
    .insert([payload]);

  if (error) {
    throw new Error(error.message || 'Could not save the order');
  }

  const savedOrder = { ...completeOrder, id: null };

  // 2. Reduce stock, best effort: the order is already recorded.
  if (Array.isArray(orderData.items)) {
    for (const item of orderData.items) {
      if (!item?.id) continue;
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        p_product_id: String(item.id),
        p_qty: parseInt(item.quantity || 1, 10),
      });
      if (stockError) {
        console.warn('Could not reduce stock for product', item.id, stockError.message);
      }
    }
  }

  // 3. Local backup for order history on this device.
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]');
    existing.unshift(savedOrder);
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch (err) {
    console.error('Error saving order locally', err);
  }

  return savedOrder;
};

/**
 * Load this customer's orders through the get_orders_by_phone function.
 * Returns an empty list when no phone is given, never all orders.
 */
export async function fetchCustomerOrders(phone) {
  const cleanedPhone = phone ? phone.toString().replace(/\D/g, '').slice(-10) : '';
  if (!cleanedPhone) return [];

  const localOrders = getSavedOrders();

  try {
    const { data, error } = await supabase.rpc('get_orders_by_phone', { p_phone: cleanedPhone });

    if (!error && Array.isArray(data)) {
      const formattedBackendOrders = data.map((ord) => {
        const addr = ord.delivery_address;
        const addressStr = typeof addr === 'string'
          ? addr
          : (addr && typeof addr === 'object'
            ? [addr.address || addr.street, addr.city, addr.state, addr.pincode || addr.postalCode].filter(Boolean).join(', ')
            : '');
        return {
          id: ord.id,
          orderId: ord.order_id,
          invoice_number: ord.order_id,
          createdAt: ord.created_at,
          customer: {
            name: ord.customer_name,
            phone: ord.customer_phone || cleanedPhone,
            email: ord.customer_email || ''
          },
          deliveryMethod: ord.delivery_method || 'pickup',
          delivery_address: addressStr,
          paymentMethod: 'Cash on Delivery (COD)',
          payment_method: ord.payment_method || 'cod',
          status: ord.status || 'pending',
          subtotal: parseFloat(ord.subtotal || 0),
          deliveryFee: 0,
          total: parseFloat(ord.total_amount || 0),
          total_amount: parseFloat(ord.total_amount || 0),
          items: Array.isArray(ord.items) ? ord.items : []
        };
      });

      const allOrders = [...localOrders];
      for (const bo of formattedBackendOrders) {
        if (!allOrders.some((o) => o.orderId === bo.orderId || o.invoice_number === bo.invoice_number || o.id === bo.id)) {
          allOrders.push(bo);
        }
      }
      return allOrders;
    }
    if (error) {
      console.warn('Could not fetch orders:', error.message);
    }
  } catch (e) {
    console.warn('Could not fetch orders:', e);
  }

  return localOrders;
}

/**
 * Generate formatted WhatsApp message
 */
export const formatWhatsAppMessage = (order, storeSettings = {}) => {
  const divider = '━━━━━━━━━━━━━━━━━━━━';
  const currency = storeSettings.currency || '₹';
  
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
  let calculatedSubtotal = 0;
  items.forEach((item, index) => {
    const vLabel = item.selectedVariant ? ` (${item.selectedVariant.name || item.selectedVariant.size})` : (item.variant_name ? ` (${item.variant_name})` : (item.unit ? ` (${item.unit})` : ''));
    const title = item.title || item.product_name || item.name || 'Product';
    const qty = item.quantity || 1;
    const unitPrice = parseFloat(item.unit_price ?? item.price ?? item.selling_price ?? 0);
    const itemTotal = unitPrice * qty;
    calculatedSubtotal += itemTotal;

    const priceText = unitPrice > 0 
      ? ` - ${qty} × ${currency}${unitPrice.toFixed(2)} = *${currency}${itemTotal.toFixed(2)}*`
      : ` × ${qty}`;

    msg += `${index + 1}. *${title}${vLabel}*${priceText}\n`;
  });

  msg += `${divider}\n\n`;

  const subtotal = order.subtotal !== undefined ? Number(order.subtotal) : calculatedSubtotal;
  const deliveryFee = order.deliveryFee !== undefined ? Number(order.deliveryFee) : 0;
  const totalAmount = order.total_amount !== undefined 
    ? Number(order.total_amount) 
    : (order.total !== undefined ? Number(order.total) : (subtotal + deliveryFee));

  if (subtotal > 0 || totalAmount > 0) {
    msg += `💰 *Order Summary:*\n`;
    msg += `• Subtotal: ${currency}${subtotal.toFixed(2)}\n`;
    if (isShipping) {
      msg += `• Delivery Fee: ${deliveryFee === 0 ? 'FREE' : `${currency}${deliveryFee.toFixed(2)}`}\n`;
    }
    msg += `• *Total Amount:* *${currency}${totalAmount.toFixed(2)}*\n\n`;
  }
  
  msg += `💳 *Payment:* ${isShipping ? 'Cash on Delivery (COD)' : 'Pay on Store Pickup (COD / Cash / UPI)'}\n`;
  msg += `ℹ️ *Note:* The total amount may vary depending on the store. The bill will be provided by the store.\n\n`;
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
