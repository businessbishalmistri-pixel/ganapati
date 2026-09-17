/**
 * supabaseStore.js
 * Integration with XYVOT Storefront API & Supabase Backend
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

import { INITIAL_DEFAULT_PRODUCTS, normalizeProduct } from './inventoryData';

export const DEFAULT_STORE_API_KEY = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_STORE_API_KEY : '') || '';

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

    let productsList = [];
    if (!error && Array.isArray(data) && data.length > 0) {
      productsList = data;
    } else {
      productsList = INITIAL_DEFAULT_PRODUCTS;
    }

    // Filter out draft products from storefront
    const visibleProducts = productsList.filter(p => p && p.status !== 'draft' && !p.is_draft);

    return visibleProducts.map((p) => {
      const rawPrice = parseFloat(p.selling_price || p.price || p.unit_price || 0);
      const originalPrice = p.mrp ? parseFloat(p.mrp) : (p.original_price ? parseFloat(p.original_price) : null);
      const rawStock = parseInt(p.stock_quantity ?? p.stock ?? 999, 10);
      
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

      // Pure database image
      const primaryImage = p.image_url || p.image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null);
      const imageList = Array.isArray(p.images) && p.images.length > 0 
        ? p.images 
        : (primaryImage ? [primaryImage] : []);

      return {
        id: p.id,
        name: p.title || p.name || 'Product Item',
        title: p.title || p.name || 'Product Item',
        category: p.category || 'General',
        price: effectivePrice,
        selling_price: effectivePrice,
        originalPrice: originalPrice && !isNaN(originalPrice) ? originalPrice : null,
        mrp: originalPrice && !isNaN(originalPrice) ? originalPrice : effectivePrice,
        rating: parseFloat(p.rating) || 4.9,
        reviewsCount: parseInt(p.reviews_count ?? 48, 10),
        stock: effectiveStock,
        stock_quantity: effectiveStock,
        low_stock_threshold: parseInt(p.low_stock_threshold ?? 5, 10),
        badge: effectiveStock <= (p.low_stock_threshold || 5) && effectiveStock > 0 ? 'Low Stock' : (p.badge || (p.featured ? 'Featured' : null)),
        image: primaryImage,
        image_url: primaryImage,
        images: imageList,
        description: p.description || `${p.title || p.name || 'Product'} - Fresh & authentic grocery item from Ganapati Stores.`,
        features: Array.isArray(p.features) && p.features.length > 0 
          ? p.features 
          : ['Authentic Quality Item', 'Direct WhatsApp Dispatch'],
        has_variants: hasVariants,
        hasVariants: hasVariants,
        variants: cleanVariants,
        unit: p.unit || p.weight || '',
        sku: p.sku || '',
        brand: p.brand || 'Ganapati Stores',
        sub_category: p.sub_category || '',
        is_pinned: Boolean(p.is_pinned || p.is_starred || p.sub_category === 'pinned' || p.featured),
        is_starred: Boolean(p.is_pinned || p.is_starred || p.sub_category === 'pinned' || p.featured),
        status: p.status || 'active'
      };
    });
  } catch (err) {
    console.error('Error fetching live products:', err);
    return INITIAL_DEFAULT_PRODUCTS.filter(p => p.status !== 'draft');
  }
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
        description: p.description || `${p.name || 'Product'} - Fresh & authentic grocery item from Ganapati Stores.`,
        features: Array.isArray(p.features) && p.features.length > 0 ? p.features : ['Authentic Quality Item', 'Direct WhatsApp Dispatch'],
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

export function mapDbToStoreSettings(dbRow) {
  if (!dbRow) return null;
  return {
    storeName: dbRow.store_name ?? 'Ganapati Store',
    whatsappNumber: dbRow.whatsapp_number ?? '+91 9147364980',
    storeAddress: dbRow.store_address ?? 'Main Store Hub',
    storeHours: dbRow.store_hours ?? 'Mon - Sun: 8:00 AM - 9:00 PM',
    announcementText: dbRow.announcement_text ?? 'Free delivery on orders over ₹200 • Cash on Delivery',
    bannerImageUrl: dbRow.banner_image_url || '',
    flatShippingFee: dbRow.flat_shipping_fee !== undefined && dbRow.flat_shipping_fee !== null ? Number(dbRow.flat_shipping_fee) : 30,
    freeShippingThreshold: dbRow.free_shipping_threshold !== undefined && dbRow.free_shipping_threshold !== null ? Number(dbRow.free_shipping_threshold) : 200,
    currency: dbRow.currency ?? '₹'
  };
}

export function mapStoreSettingsToDb(settings = {}) {
  const dbPayload = {
    id: 'main_store',
    updated_at: new Date().toISOString()
  };
  if (settings.storeName !== undefined) dbPayload.store_name = settings.storeName;
  if (settings.whatsappNumber !== undefined) dbPayload.whatsapp_number = settings.whatsappNumber;
  if (settings.storeAddress !== undefined) dbPayload.store_address = settings.storeAddress;
  if (settings.storeHours !== undefined) dbPayload.store_hours = settings.storeHours;
  if (settings.announcementText !== undefined) dbPayload.announcement_text = settings.announcementText;
  if (settings.bannerImageUrl !== undefined) dbPayload.banner_image_url = settings.bannerImageUrl;
  if (settings.flatShippingFee !== undefined) dbPayload.flat_shipping_fee = Number(settings.flatShippingFee) || 0;
  if (settings.freeShippingThreshold !== undefined) dbPayload.free_shipping_threshold = Number(settings.freeShippingThreshold) || 0;
  if (settings.currency !== undefined) dbPayload.currency = settings.currency;
  return dbPayload;
}

/**
 * Fetch 100% of store settings directly from Supabase store_settings table
 */
export async function fetchStoreSettingsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 'main_store')
      .maybeSingle();

    if (!error && data) {
      return mapDbToStoreSettings(data);
    }

    // Fallback if id is not 'main_store'
    const { data: firstRow, error: firstErr } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!firstErr && firstRow) {
      return mapDbToStoreSettings(firstRow);
    }
  } catch (err) {
    console.warn('Could not fetch store_settings from Supabase:', err);
  }
  return null;
}

/**
 * Persist 100% of store settings directly to Supabase store_settings table
 */
export async function updateStoreSettingsInSupabase(newSettings = {}) {
  try {
    const payload = mapStoreSettingsToDb(newSettings);
    const { data, error } = await supabase
      .from('store_settings')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error updating store_settings in Supabase:', error);
      return { success: false, error };
    }

    return { success: true, data: mapDbToStoreSettings(data) };
  } catch (err) {
    console.error('Exception updating store_settings:', err);
    return { success: false, error: err };
  }
}

/**
 * Backward compatibility helpers
 */
export async function fetchStoreInfoFromBackend() {
  return await fetchStoreSettingsFromSupabase();
}

/**
 * Categories Database Persistence in Supabase
 */
export async function fetchCategoriesFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug || (c.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        image_url: c.image_url || c.image || '',
        image: c.image_url || c.image || '',
        icon: c.icon || 'Package',
        created_at: c.created_at,
        updated_at: c.updated_at
      }));
    }
  } catch (err) {
    console.warn('Could not query Supabase categories table:', err);
  }
  return null;
}

export async function upsertCategoryToSupabase(category) {
  if (!category || !category.name) return null;
  const cleanId = category.id || `cat_${Date.now()}`;
  const payload = {
    id: cleanId,
    name: category.name.trim(),
    slug: category.slug || category.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    image_url: category.image_url || category.image || '',
    icon: category.icon || 'Package',
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('categories')
      .upsert([payload], { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (!error && data) {
      return {
        ...data,
        image_url: data.image_url || data.image || '',
        image: data.image_url || data.image || ''
      };
    }
    if (error) {
      console.warn('Supabase category upsert warning:', error.message);
    }
  } catch (err) {
    console.warn('Failed to upsert category to Supabase:', err);
  }
  return payload;
}

export async function deleteCategoryFromSupabase(id) {
  if (!id) return false;
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (!error) return true;
    console.warn('Supabase category delete warning:', error.message);
  } catch (err) {
    console.warn('Failed to delete category from Supabase:', err);
  }
  return false;
}

export async function submitBackendOrder(order) {
  if (!order) return null;
  try {
    const payload = {
      order_id: order.orderId || order.invoice_number || `ORD-${Date.now()}`,
      customer_name: order.customer?.name || order.customer_name || 'Customer',
      customer_phone: order.customer?.phone || order.customer_phone || '',
      customer_email: order.customer?.email || order.customer_email || '',
      delivery_method: order.deliveryMethod || 'pickup',
      delivery_address: order.shippingAddress ? JSON.stringify(order.shippingAddress) : (order.delivery_address || ''),
      items: Array.isArray(order.items) ? order.items : [],
      status: order.status || 'pending',
      created_at: order.createdAt || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([payload])
      .select()
      .maybeSingle();

    if (!error && data) return data;
    if (error) {
      console.warn('Supabase order insert note:', error.message);
    }
  } catch (err) {
    console.warn('Could not submit order to Supabase:', err);
  }
  return null;
}

