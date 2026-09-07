/**
 * supabaseStore.js
 * Integration with XYVOT Storefront API & Supabase Backend
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qirpufadoruqvgubpqzx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcnB1ZmFkb3J1cXZndWJwcXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjgwODUsImV4cCI6MjEwMzk0NDA4NX0.WBzX3E401higTSSrjYMx5LQEcOptiiaU_4Id5j_X8PI';

export const DEFAULT_STORE_API_KEY = 'xyvot_pk_live_139a19_75624283aczwi2';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch real products dynamically from Supabase database
 */
export async function fetchLiveProductsFromBackend() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      return data.map((p) => {
        const rawPrice = parseFloat(p.price ?? p.selling_price ?? p.unit_price ?? 0);
        const originalPrice = p.original_price ? parseFloat(p.original_price) : (p.mrp ? parseFloat(p.mrp) : null);
        const rawStock = parseInt(p.stock_quantity ?? p.stock ?? 0, 10);
        
        // Parse and clean real variants array from XYVOT / Supabase
        let cleanVariants = [];
        try {
          const rawVariants = Array.isArray(p.variants) 
            ? p.variants 
            : (typeof p.variants === 'string' ? JSON.parse(p.variants || '[]') : []);
          
          if (Array.isArray(rawVariants)) {
            cleanVariants = rawVariants.map((v, idx) => ({
              id: v.id || `var_${p.id}_${idx}`,
              name: v.name || v.size || `Option ${idx + 1}`,
              size: v.size || v.name || '',
              sku: v.sku || `${p.sku || 'SKU'}-${idx + 1}`,
              selling_price: parseFloat(v.selling_price ?? v.price ?? rawPrice),
              cost_price: parseFloat(v.cost_price ?? 0),
              stock_quantity: parseInt(v.stock_quantity ?? v.stock ?? 0, 10),
              low_stock_threshold: parseInt(v.low_stock_threshold ?? 3, 10)
            }));
          }
        } catch (e) {
          console.warn('Error parsing variants for product', p.id, e);
        }

        const hasVariants = Boolean(p.has_variants) && cleanVariants.length > 0;
        
        // If hasVariants, compute base price and total stock dynamically
        const minVariantPrice = hasVariants 
          ? Math.min(...cleanVariants.map(v => v.selling_price)) 
          : rawPrice;
        const totalVariantStock = hasVariants
          ? cleanVariants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
          : rawStock;

        const effectivePrice = isNaN(minVariantPrice) ? 0 : minVariantPrice;
        const effectiveStock = isNaN(totalVariantStock) ? 0 : totalVariantStock;

        // Pure database image without any fake fallback URLs
        const primaryImage = p.image_url || p.image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null);
        const imageList = Array.isArray(p.images) && p.images.length > 0 
          ? p.images 
          : (primaryImage ? [primaryImage] : []);

        return {
          id: p.id,
          name: p.name || p.title || 'Product Item',
          title: p.name || p.title || 'Product Item',
          category: p.category || 'General',
          price: effectivePrice,
          selling_price: effectivePrice,
          originalPrice: originalPrice && !isNaN(originalPrice) ? originalPrice : null,
          rating: parseFloat(p.rating) || 4.9,
          reviewsCount: parseInt(p.reviews_count ?? 48, 10),
          stock: effectiveStock,
          stock_quantity: effectiveStock,
          badge: effectiveStock <= 3 && effectiveStock > 0 ? 'Low Stock' : (p.badge || (p.featured ? 'Featured' : null)),
          image: primaryImage,
          image_url: primaryImage,
          images: imageList,
          description: p.description || `${p.name || 'Product'} - Real-time verified item from inventory.`,
          features: Array.isArray(p.features) && p.features.length > 0 
            ? p.features 
            : ['Verified Inventory Item', 'Direct WhatsApp Dispatch'],
          // Real XYVOT Variant Fields
          has_variants: hasVariants,
          hasVariants: hasVariants,
          variants: cleanVariants,
          unit: p.unit || p.weight || '',
          sku: p.sku || ''
        };
      });
    }
  } catch (err) {
    console.error('Error fetching live products from Supabase:', err);
  }
  return [];
}

/**
 * Fetch a single product directly by ID from Supabase
 */
export async function fetchSingleProductById(productId) {
  if (!productId) return null;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (!error && data) {
      const p = data;
      const rawPrice = parseFloat(p.price ?? p.selling_price ?? p.unit_price ?? 0);
      const originalPrice = p.original_price ? parseFloat(p.original_price) : (p.mrp ? parseFloat(p.mrp) : null);
      const rawStock = parseInt(p.stock_quantity ?? p.stock ?? 0, 10);
      
      let cleanVariants = [];
      try {
        const rawVariants = Array.isArray(p.variants) 
          ? p.variants 
          : (typeof p.variants === 'string' ? JSON.parse(p.variants || '[]') : []);
        if (Array.isArray(rawVariants)) {
          cleanVariants = rawVariants.map((v, idx) => ({
            id: v.id || `var_${p.id}_${idx}`,
            name: v.name || v.size || `Option ${idx + 1}`,
            size: v.size || v.name || '',
            sku: v.sku || `${p.sku || 'SKU'}-${idx + 1}`,
            selling_price: parseFloat(v.selling_price ?? v.price ?? rawPrice),
            cost_price: parseFloat(v.cost_price ?? 0),
            stock_quantity: parseInt(v.stock_quantity ?? v.stock ?? 0, 10),
            low_stock_threshold: parseInt(v.low_stock_threshold ?? 3, 10)
          }));
        }
      } catch (e) {
        console.warn('Error parsing variants', e);
      }

      const hasVariants = Boolean(p.has_variants) && cleanVariants.length > 0;
      const minVariantPrice = hasVariants ? Math.min(...cleanVariants.map(v => v.selling_price)) : rawPrice;
      const totalVariantStock = hasVariants ? cleanVariants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) : rawStock;
      const effectivePrice = isNaN(minVariantPrice) ? 0 : minVariantPrice;
      const effectiveStock = isNaN(totalVariantStock) ? 0 : totalVariantStock;
      const primaryImage = p.image_url || p.image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null);

      return {
        id: p.id,
        name: p.name || p.title || 'Product Item',
        title: p.name || p.title || 'Product Item',
        category: p.category || 'General',
        price: effectivePrice,
        selling_price: effectivePrice,
        originalPrice: originalPrice && !isNaN(originalPrice) ? originalPrice : null,
        rating: parseFloat(p.rating) || 4.9,
        reviewsCount: parseInt(p.reviews_count ?? 48, 10),
        stock: effectiveStock,
        stock_quantity: effectiveStock,
        badge: effectiveStock <= 3 && effectiveStock > 0 ? 'Low Stock' : (p.badge || (p.featured ? 'Featured' : null)),
        image: primaryImage,
        image_url: primaryImage,
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (primaryImage ? [primaryImage] : []),
        description: p.description || `${p.name || 'Product'} - Real-time verified item from inventory.`,
        features: Array.isArray(p.features) && p.features.length > 0 ? p.features : ['Verified Inventory Item', 'Direct WhatsApp Dispatch'],
        has_variants: hasVariants,
        hasVariants: hasVariants,
        variants: cleanVariants,
        unit: p.unit || p.weight || '',
        sku: p.sku || ''
      };
    }
  } catch (err) {
    console.error('Error fetching product by ID from Supabase:', err);
  }
  return null;
}

/**
 * Fetch real store organization info from database
 */
export async function fetchStoreInfoFromBackend() {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('name, owner_phone, owner_email')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        storeName: data.name || 'Store Hub',
        whatsappNumber: data.owner_phone || '+91 9147364980',
        supportEmail: data.owner_email || ''
      };
    }
  } catch (err) {
    console.warn('Could not fetch store organization info:', err);
  }
  return null;
}

/**
 * Submit real order to backend sales_orders table
 */
export async function submitBackendOrder(orderPayload) {
  try {
    const invNumber = `INV-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const payload = {
      invoice_number: invNumber,
      customer_name: orderPayload.customer.name,
      customer_email: orderPayload.customer.email || null,
      subtotal: orderPayload.subtotal,
      discount_pct: 0,
      discount_amount: 0,
      taxable_amount: orderPayload.subtotal,
      gst_amount: 0,
      total_amount: orderPayload.total,
      payment_method: 'COD / WhatsApp',
      items: orderPayload.items
    };

    const { data, error } = await supabase.from('sales_orders').insert([payload]).select();
    if (!error && data && data.length > 0) {
      return { success: true, orderId: data[0].id, invoiceNumber: invNumber };
    }
  } catch (err) {
    console.warn('Could not record order in backend sales_orders:', err);
  }
  return { success: false };
}
