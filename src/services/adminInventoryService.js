/**
 * adminInventoryService.js
 * Comprehensive Inventory Management & Admin CRUD Service
 * Synchronized directly with Supabase Database and local realtime caches.
 */
import { supabase } from './supabaseStore';
import { inventoryApi } from './inventoryApi';

const ADMIN_STORAGE_KEY = 'ganapati_admin_products_v1';
const CATEGORIES_STORAGE_KEY = 'ganapati_admin_categories_v1';

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Groceries & Staples', slug: 'groceries-staples', count: 0, icon: 'ShoppingBag' },
  { id: 'cat-2', name: 'Snacks & Beverages', slug: 'snacks-beverages', count: 0, icon: 'Coffee' },
  { id: 'cat-3', name: 'Packaged Foods', slug: 'packaged-foods', count: 0, icon: 'Package' },
  { id: 'cat-4', name: 'Personal Care', slug: 'personal-care', count: 0, icon: 'Sparkles' },
  { id: 'cat-5', name: 'Household Essentials', slug: 'household-essentials', count: 0, icon: 'Home' },
  { id: 'cat-6', name: 'Dairy & Bakery', slug: 'dairy-bakery', count: 0, icon: 'Milk' },
  { id: 'cat-7', name: 'Spices & Masalas', slug: 'spices-masalas', count: 0, icon: 'Flame' },
];

/**
 * Normalizes a product item to a standard schema
 */
export function normalizeProduct(p) {
  const sellingPrice = parseFloat(p.selling_price ?? p.price ?? p.unit_price ?? 0);
  const mrp = p.mrp ? parseFloat(p.mrp) : (p.original_price ? parseFloat(p.original_price) : sellingPrice);
  const costPrice = parseFloat(p.cost_price ?? (sellingPrice > 0 ? (sellingPrice * 0.75).toFixed(2) : 0));
  const stock = parseInt(p.stock_quantity ?? p.stock ?? 0, 10);
  const lowStockThreshold = parseInt(p.low_stock_threshold ?? 5, 10);
  const primaryImage = p.image_url || p.image || (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '');

  // Determine Expiry Status
  let expiryDate = p.expiry_date || p.expiry || '';
  let isExpired = false;
  let isExpiringSoon = false;
  let daysUntilExpiry = null;

  if (expiryDate) {
    try {
      const exp = new Date(expiryDate);
      if (!isNaN(exp.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffMs = exp.getTime() - today.getTime();
        daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 0) {
          isExpired = true;
        } else if (daysUntilExpiry <= 30) {
          isExpiringSoon = true;
        }
      }
    } catch (e) {
      console.warn('Invalid expiry date:', expiryDate);
    }
  }

  const status = p.status || (p.is_draft ? 'draft' : 'active');

  return {
    id: p.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: p.title || p.name || 'Untitled Product',
    name: p.title || p.name || 'Untitled Product',
    category: p.category || 'General',
    sub_category: p.sub_category || '',
    description: p.description || '',
    selling_price: sellingPrice,
    price: sellingPrice,
    mrp: mrp,
    original_price: mrp,
    cost_price: costPrice,
    stock_quantity: stock,
    stock: stock,
    low_stock_threshold: lowStockThreshold,
    expiry_date: expiryDate,
    isExpired,
    isExpiringSoon,
    daysUntilExpiry,
    status: status, // 'active' | 'draft' | 'archived'
    image_url: primaryImage,
    image: primaryImage,
    images: Array.isArray(p.images) ? p.images : (primaryImage ? [primaryImage] : []),
    sku: p.sku || `GP-${String(Math.floor(100000 + Math.random() * 900000))}`,
    unit: p.unit || p.weight || '1 unit',
    brand: p.brand || 'Ganapati Stores',
    created_at: p.created_at || new Date().toISOString(),
    updated_at: p.updated_at || new Date().toISOString(),
    variants: Array.isArray(p.variants) ? p.variants : []
  };
}

class AdminInventoryService {
  constructor() {
    this.categories = this.loadCategories();
  }

  loadCategories() {
    try {
      const cached = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn('Could not read categories cache', e);
    }
    return DEFAULT_CATEGORIES;
  }

  saveCategories(cats) {
    this.categories = cats;
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(cats));
    } catch (e) {
      console.warn('Could not save categories', e);
    }
  }

  /**
   * Fetch all products from Supabase database
   */
  async getAllProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const normalized = data.map(normalizeProduct);
        this.cacheProductsLocally(normalized);
        return normalized;
      }
    } catch (err) {
      console.warn('Supabase fetch failed or table empty, loading cached inventory', err);
    }

    // Return cached / memory inventory
    const cached = this.getCachedProducts();
    if (cached.length > 0) return cached;

    // If nothing exists, initialize with current live inventory
    const initialFromStore = inventoryApi.products.map(normalizeProduct);
    if (initialFromStore.length > 0) {
      this.cacheProductsLocally(initialFromStore);
      return initialFromStore;
    }

    return [];
  }

  getCachedProducts() {
    try {
      const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw).map(normalizeProduct);
      }
    } catch (e) {
      console.warn('Could not load local admin products', e);
    }
    return [];
  }

  cacheProductsLocally(products) {
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(products));
      // Also sync to storefront cache
      localStorage.setItem('quickcart_live_inventory_cache', JSON.stringify(products.filter(p => p.status === 'active')));
    } catch (e) {
      console.warn('Error caching products', e);
    }
  }

  /**
   * Add a new product to Supabase & Store
   */
  async addProduct(productInput) {
    const newProd = normalizeProduct({
      ...productInput,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 1. Try Supabase Insert
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          id: newProd.id,
          name: newProd.title,
          title: newProd.title,
          category: newProd.category,
          sub_category: newProd.sub_category,
          description: newProd.description,
          price: newProd.selling_price,
          selling_price: newProd.selling_price,
          original_price: newProd.mrp,
          mrp: newProd.mrp,
          cost_price: newProd.cost_price,
          stock_quantity: newProd.stock_quantity,
          stock: newProd.stock_quantity,
          low_stock_threshold: newProd.low_stock_threshold,
          expiry_date: newProd.expiry_date,
          status: newProd.status,
          image_url: newProd.image_url,
          image: newProd.image_url,
          sku: newProd.sku,
          unit: newProd.unit,
          brand: newProd.brand,
          variants: newProd.variants
        }])
        .select();

      if (!error && data && data.length > 0) {
        const created = normalizeProduct(data[0]);
        this.updateLocalList(created, 'add');
        inventoryApi.fetchCatalog();
        return created;
      }
    } catch (err) {
      console.warn('Supabase insert failed, maintaining local sync', err);
    }

    // Fallback local update
    this.updateLocalList(newProd, 'add');
    inventoryApi.fetchCatalog();
    return newProd;
  }

  /**
   * Update an existing product
   */
  async updateProduct(id, updates) {
    const currentList = this.getCachedProducts();
    const existing = currentList.find(p => p.id === id) || {};
    const updated = normalizeProduct({
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    });

    // 1. Try Supabase Update
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: updated.title,
          title: updated.title,
          category: updated.category,
          sub_category: updated.sub_category,
          description: updated.description,
          price: updated.selling_price,
          selling_price: updated.selling_price,
          original_price: updated.mrp,
          mrp: updated.mrp,
          cost_price: updated.cost_price,
          stock_quantity: updated.stock_quantity,
          stock: updated.stock_quantity,
          low_stock_threshold: updated.low_stock_threshold,
          expiry_date: updated.expiry_date,
          status: updated.status,
          image_url: updated.image_url,
          image: updated.image_url,
          sku: updated.sku,
          unit: updated.unit,
          brand: updated.brand,
          variants: updated.variants,
          updated_at: updated.updated_at
        })
        .eq('id', id)
        .select();

      if (!error && data && data.length > 0) {
        const saved = normalizeProduct(data[0]);
        this.updateLocalList(saved, 'update');
        inventoryApi.fetchCatalog();
        return saved;
      }
    } catch (err) {
      console.warn('Supabase update failed, maintaining local sync', err);
    }

    // Fallback local update
    this.updateLocalList(updated, 'update');
    inventoryApi.fetchCatalog();
    return updated;
  }

  /**
   * Quick update stock quantity
   */
  async updateStock(id, newStock) {
    const cleanStock = Math.max(0, parseInt(newStock, 10) || 0);
    return this.updateProduct(id, { stock_quantity: cleanStock, stock: cleanStock });
  }

  /**
   * Toggle status between active and draft
   */
  async toggleStatus(id) {
    const currentList = this.getCachedProducts();
    const prod = currentList.find(p => p.id === id);
    if (!prod) return null;

    const nextStatus = prod.status === 'draft' ? 'active' : 'draft';
    return this.updateProduct(id, { status: nextStatus });
  }

  /**
   * Delete product
   */
  async deleteProduct(id) {
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete error', err);
    }

    const currentList = this.getCachedProducts().filter(p => p.id !== id);
    this.cacheProductsLocally(currentList);
    inventoryApi.products = inventoryApi.products.filter(p => p.id !== id);
    inventoryApi.notify();
    return true;
  }

  updateLocalList(product, action) {
    let list = this.getCachedProducts();
    if (action === 'add') {
      list = [product, ...list.filter(p => p.id !== product.id)];
    } else if (action === 'update') {
      list = list.map(p => p.id === product.id ? product : p);
    }
    this.cacheProductsLocally(list);
  }

  /**
   * Categories CRUD
   */
  getCategories() {
    return this.categories;
  }

  addCategory(category) {
    const newCat = {
      id: `cat_${Date.now()}`,
      name: category.name.trim(),
      slug: category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon: category.icon || 'Package',
      count: 0
    };
    const updated = [...this.categories, newCat];
    this.saveCategories(updated);
    return newCat;
  }

  updateCategory(id, updates) {
    const updated = this.categories.map(c => c.id === id ? { ...c, ...updates } : c);
    this.saveCategories(updated);
    return updated.find(c => c.id === id);
  }

  deleteCategory(id) {
    const updated = this.categories.filter(c => c.id !== id);
    this.saveCategories(updated);
    return true;
  }
}

export const adminInventoryService = new AdminInventoryService();
