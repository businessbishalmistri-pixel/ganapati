/**
 * inventoryData.js
 * Clean shared catalog definitions, categories, and normalizer.
 * No circular dependencies.
 */

export const ADMIN_STORAGE_KEY = 'ganapati_admin_products_v1';
export const CATEGORIES_STORAGE_KEY = 'ganapati_admin_categories_v1';

export const DEFAULT_CATEGORIES = [];

export const INITIAL_DEFAULT_PRODUCTS = [];


/**
 * Normalizes a product item to a standard simple schema
 */
export function normalizeProduct(p) {
  if (!p) return null;
  const sellingPrice = parseFloat(p.selling_price ?? p.price ?? p.unit_price ?? 0) || 0;
  const mrp = parseFloat(p.mrp ?? p.original_price ?? sellingPrice) || sellingPrice;
  let primaryImage = '';
  if (p.image_url !== undefined && p.image_url !== null) {
    primaryImage = String(p.image_url).trim();
  } else if (p.image !== undefined && p.image !== null) {
    primaryImage = String(p.image).trim();
  } else if (Array.isArray(p.images) && p.images.length > 0 && p.images[0]) {
    primaryImage = String(p.images[0]).trim();
  }

  // Strip any legacy unsplash URLs
  if (primaryImage.includes('unsplash.com')) {
    primaryImage = '';
  }

  // In Stock status: boolean
  let inStock = true;
  if (p.in_stock !== undefined && p.in_stock !== null) {
    inStock = Boolean(p.in_stock);
  } else if (p.stock !== undefined && p.stock !== null) {
    inStock = Number(p.stock) > 0;
  } else if (p.stock_quantity !== undefined && p.stock_quantity !== null) {
    inStock = Number(p.stock_quantity) > 0;
  } else if (p.status === 'out_of_stock') {
    inStock = false;
  }

  const status = p.status === 'draft' ? 'draft' : 'active';
  const effectiveStock = parseInt(p.stock_quantity ?? p.stock ?? (inStock ? 50 : 0), 10);
  const costPrice = parseFloat(p.cost_price || 0) || 0;
  const lowStockThreshold = parseInt(p.low_stock_threshold ?? 5, 10);
  const isPinned = Boolean(p.is_pinned || p.is_starred || p.sub_category === 'pinned' || p.featured);

  return {
    id: p.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: p.title || p.name || 'Untitled Product',
    name: p.title || p.name || 'Untitled Product',
    category: p.category || 'Groceries & Staples',
    sub_category: p.sub_category || '',
    is_pinned: isPinned,
    is_starred: isPinned,
    description: p.description || '',
    selling_price: sellingPrice,
    price: sellingPrice,
    mrp: mrp,
    original_price: mrp,
    cost_price: costPrice,
    in_stock: inStock && effectiveStock > 0,
    stock: effectiveStock,
    stock_quantity: effectiveStock,
    low_stock_threshold: lowStockThreshold,
    status: status, // 'active' | 'draft'
    image_url: primaryImage,
    image: primaryImage,
    images: primaryImage ? [primaryImage] : [],
    sku: p.sku || `GP-${String(Math.floor(100000 + Math.random() * 900000))}`,
    unit: p.unit || p.weight || '1 unit',
    brand: p.brand || 'Ganapati Stores',
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
    variants: Array.isArray(p.variants) ? p.variants : []
  };
}

