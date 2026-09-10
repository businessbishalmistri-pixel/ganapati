/**
 * adminInventoryService.js
 * Comprehensive Inventory Management & Admin CRUD Service
 * Synchronized directly with Supabase Database and local realtime caches.
 */
import { supabase } from './supabaseStore';
import { inventoryApi } from './inventoryApi';
import { 
  ADMIN_STORAGE_KEY, 
  CATEGORIES_STORAGE_KEY, 
  DEFAULT_CATEGORIES, 
  INITIAL_DEFAULT_PRODUCTS, 
  normalizeProduct 
} from './inventoryData';

export { ADMIN_STORAGE_KEY, CATEGORIES_STORAGE_KEY, DEFAULT_CATEGORIES, INITIAL_DEFAULT_PRODUCTS, normalizeProduct };

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
   * Fetch all products directly from Supabase database
   */
  async getAllProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);
      } else if (Array.isArray(data)) {
        const normalized = data.map(normalizeProduct).filter(Boolean);
        this.cacheProductsLocally(normalized);
        return normalized;
      }
    } catch (err) {
      console.error('Failed to query Supabase products table:', err);
    }

    // Return locally cached database data (if offline/reloading), never mock hardcoded data
    return this.getCachedProducts();
  }

  getCachedProducts() {
    try {
      const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map(normalizeProduct).filter(Boolean);
        }
      }
    } catch (e) {
      console.warn('Could not load local admin products cache', e);
    }

    return [];
  }

  cacheProductsLocally(products) {
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(products || []));
      // Also sync to storefront cache
      localStorage.setItem('quickcart_live_inventory_cache', JSON.stringify((products || []).filter(p => p.status === 'active')));
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
          in_stock: newProd.in_stock,
          stock: newProd.in_stock ? 999 : 0,
          stock_quantity: newProd.in_stock ? 999 : 0,
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
          in_stock: updated.in_stock,
          stock: updated.in_stock ? 999 : 0,
          stock_quantity: updated.in_stock ? 999 : 0,
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
   * Toggle product in stock vs out of stock
   */
  async toggleInStock(id) {
    const currentList = this.getCachedProducts();
    const prod = currentList.find(p => p.id === id);
    if (!prod) return null;

    const nextInStock = !prod.in_stock;
    return this.updateProduct(id, { 
      in_stock: nextInStock, 
      stock: nextInStock ? 999 : 0,
      stock_quantity: nextInStock ? 999 : 0
    });
  }

  /**
   * Quick update stock quantity (kept for backward compatibility)
   */
  async updateStock(id, newStock) {
    const cleanStock = Math.max(0, parseInt(newStock, 10) || 0);
    const inStock = cleanStock > 0;
    return this.updateProduct(id, { 
      in_stock: inStock,
      stock_quantity: cleanStock, 
      stock: cleanStock 
    });
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
