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

const SWR_CATALOG_KEY = 'ganapati_admin_catalog_cache_v2';

class AdminInventoryService {
  constructor() {
    this.categories = this.loadCategories();
    this._inMemoryProducts = this.loadInitialCache();
    this.syncCategoriesWithProducts(this._inMemoryProducts);
  }

  loadInitialCache() {
    try {
      const cached = localStorage.getItem(SWR_CATALOG_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeProduct).filter(Boolean);
        }
      }
    } catch (e) {
      console.warn('Could not read catalog cache', e);
    }
    return INITIAL_DEFAULT_PRODUCTS.map(normalizeProduct).filter(Boolean);
  }

  loadCategories() {
    try {
      const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
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
      console.warn('Could not save categories cache', e);
    }
  }

  syncCategoriesWithProducts(products) {
    if (!Array.isArray(products) || products.length === 0) return;
    let hasNew = false;
    const currentCats = [...(this.categories || [])];
    const existingNames = new Set(currentCats.map(c => (c.name || '').trim().toLowerCase()));

    products.forEach(p => {
      const catName = (p.category || '').trim();
      if (catName && !existingNames.has(catName.toLowerCase())) {
        existingNames.add(catName.toLowerCase());
        currentCats.push({
          id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: catName,
          slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          icon: 'Package',
          count: 0
        });
        hasNew = true;
      }
    });

    if (hasNew) {
      this.saveCategories(currentCats);
    }
  }

  /**
   * Fast SWR Product Fetching:
   * Returns in-memory / local snapshot instantly (0ms), while fetching fresh from Supabase.
   */
  async getAllProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const normalized = data.map(normalizeProduct).filter(Boolean);
        this.cacheProductsLocally(normalized);
        this.syncCategoriesWithProducts(normalized);
        return normalized;
      }
    } catch (err) {
      console.error('Failed to query Supabase products table:', err);
    }

    // Return in-memory cached data
    return this.getCachedProducts();
  }

  getCachedProducts() {
    if (this._inMemoryProducts && this._inMemoryProducts.length > 0) {
      return this._inMemoryProducts;
    }
    return this.loadInitialCache();
  }

  cacheProductsLocally(products) {
    const list = products || [];
    this._inMemoryProducts = list;
    try {
      localStorage.setItem(SWR_CATALOG_KEY, JSON.stringify(list));
      localStorage.setItem('quickcart_live_inventory_cache', JSON.stringify(list.filter(p => p.status === 'active')));
    } catch (e) {
      console.warn('Error caching catalog snapshot', e);
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
          stock: newProd.stock || (newProd.in_stock ? 999 : 0),
          stock_quantity: newProd.stock_quantity || (newProd.in_stock ? 999 : 0),
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
          stock: updated.stock,
          stock_quantity: updated.stock_quantity,
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
   * Toggle star/pinned status for product
   */
  async togglePinProduct(id) {
    const currentList = this.getCachedProducts();
    const prod = currentList.find(p => p.id === id);
    if (!prod) return null;

    const nextPinned = !prod.is_pinned;
    return this.updateProduct(id, {
      is_pinned: nextPinned,
      is_starred: nextPinned,
      sub_category: nextPinned ? 'pinned' : ''
    });
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

  async deleteCategoryAndReassign(id, newCategoryName) {
    const targetCat = this.categories.find(c => c.id === id);
    if (!targetCat) return false;

    const oldCategoryName = targetCat.name;

    // 1. Reassign products in local cache and database if newCategoryName provided
    if (newCategoryName && newCategoryName.trim()) {
      const cleanNewCat = newCategoryName.trim();
      let currentProducts = this.getCachedProducts();
      
      // Update local products
      const updatedProducts = currentProducts.map(p => {
        if (p.category === oldCategoryName) {
          return { ...p, category: cleanNewCat, updated_at: new Date().toISOString() };
        }
        return p;
      });
      this.cacheProductsLocally(updatedProducts);
      inventoryApi.products = updatedProducts.filter(p => p.status === 'active');
      inventoryApi.notify();

      // Update in Supabase PostgreSQL
      try {
        await supabase
          .from('products')
          .update({ category: cleanNewCat, updated_at: new Date().toISOString() })
          .eq('category', oldCategoryName);
      } catch (err) {
        console.warn('Supabase bulk category update notice:', err);
      }
    }

    // 2. Delete the category
    this.deleteCategory(id);
    return true;
  }
}

export const adminInventoryService = new AdminInventoryService();
