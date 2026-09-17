/**
 * adminInventoryService.js
 * Comprehensive Inventory Management & Admin CRUD Service
 * Synchronized directly with Supabase Database and local realtime caches.
 */
import { 
  supabase, 
  fetchCategoriesFromSupabase, 
  upsertCategoryToSupabase, 
  deleteCategoryFromSupabase 
} from './supabaseStore';
import { inventoryApi } from './inventoryApi';
import { deleteImageFromSupabase } from './imageUploadService';
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
    this.categoryListeners = new Set();
    this.categories = this.loadCategories();
    this._inMemoryProducts = this.loadInitialCache();
    this.syncCategoriesWithProducts(this._inMemoryProducts);
    this.fetchCategoriesFromBackend();
    this.setupCategoriesRealtime();

    if (typeof window !== 'undefined') {
      try {
        const bc = new BroadcastChannel('ganapati_categories_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'CATEGORIES_UPDATED' && Array.isArray(event.data.categories)) {
            this.categories = event.data.categories;
            this.categoryListeners.forEach(cb => cb(this.categories));
          }
        };
      } catch (e) {}

      window.addEventListener('storage', (e) => {
        if (e.key === CATEGORIES_STORAGE_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed)) {
              this.categories = parsed;
              this.categoryListeners.forEach(cb => cb(this.categories));
            }
          } catch (err) {}
        }
      });
    }
  }

  async fetchCategoriesFromBackend() {
    try {
      const dbCats = await fetchCategoriesFromSupabase();
      if (Array.isArray(dbCats) && dbCats.length > 0) {
        // Merge DB categories with any local products
        const current = this.categories || [];
        const mergedMap = new Map();
        
        // Add DB categories
        dbCats.forEach(c => {
          if (c && c.name) mergedMap.set(c.name.toLowerCase().trim(), c);
        });

        // Add local categories if not yet in DB
        current.forEach(c => {
          const lower = (c.name || '').toLowerCase().trim();
          if (!mergedMap.has(lower)) {
            mergedMap.set(lower, c);
            upsertCategoryToSupabase(c).catch(console.warn);
          }
        });

        const merged = Array.from(mergedMap.values());
        this.saveCategories(merged, false);
      }
    } catch (e) {
      console.warn('Error fetching categories from Supabase backend:', e);
    }
  }

  setupCategoriesRealtime() {
    try {
      supabase
        .channel('public:categories')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
          fetchCategoriesFromSupabase().then(fresh => {
            if (Array.isArray(fresh)) {
              this.saveCategories(fresh, false);
            }
          }).catch(console.warn);
        })
        .subscribe();
    } catch (err) {
      console.warn('Categories realtime subscription notice:', err);
    }
  }

  subscribeCategories(callback) {
    this.categoryListeners.add(callback);
    callback([...this.categories]);
    return () => this.categoryListeners.delete(callback);
  }

  notifyCategories() {
    const cats = [...this.categories];
    this.categoryListeners.forEach(cb => {
      try { cb(cats); } catch (e) {}
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ganapati:categories:updated', { detail: cats }));
      try {
        const bc = new BroadcastChannel('ganapati_categories_channel');
        bc.postMessage({ type: 'CATEGORIES_UPDATED', categories: cats });
        bc.close();
      } catch (e) {}
    }
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
    return [];
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
    return [];
  }

  saveCategories(cats) {
    this.categories = cats;
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(cats));
    } catch (e) {
      console.warn('Could not save categories cache', e);
    }
    this.notifyCategories();
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
    const rawImg = productInput.image_url !== undefined ? productInput.image_url : (productInput.image || '');
    const cleanImg = rawImg ? String(rawImg).trim() : '';
    const finalImg = cleanImg.includes('unsplash.com') ? '' : cleanImg;

    const newProd = normalizeProduct({
      ...productInput,
      image_url: finalImg,
      image: finalImg,
      images: finalImg ? [finalImg] : [],
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
          sub_category: newProd.sub_category || null,
          description: newProd.description || null,
          price: newProd.selling_price,
          selling_price: newProd.selling_price,
          original_price: newProd.mrp,
          mrp: newProd.mrp,
          stock: newProd.stock,
          stock_quantity: newProd.stock_quantity,
          status: newProd.status,
          image_url: newProd.image_url || null,
          image: newProd.image_url || null,
          sku: newProd.sku || null,
          unit: newProd.unit || null,
          brand: newProd.brand || null,
          variants: newProd.variants || [],
          created_at: newProd.created_at,
          updated_at: newProd.updated_at
        }])
        .select();

      if (!error && data && data.length > 0) {
        const saved = normalizeProduct(data[0]);
        this.updateLocalList(saved, 'add');
        inventoryApi.fetchCatalog();
        return saved;
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

    const cleanUpdates = { ...updates };
    if (cleanUpdates.image_url !== undefined || cleanUpdates.image !== undefined) {
      const raw = cleanUpdates.image_url !== undefined ? cleanUpdates.image_url : cleanUpdates.image;
      const cleanStr = raw ? String(raw).trim() : '';
      const finalImg = cleanStr.includes('unsplash.com') ? '' : cleanStr;
      cleanUpdates.image_url = finalImg;
      cleanUpdates.image = finalImg;
      cleanUpdates.images = finalImg ? [finalImg] : [];
    }

    // Auto-clean old image from Supabase Storage if image was removed or changed
    if (existing.image_url && (!cleanUpdates.image_url || existing.image_url !== cleanUpdates.image_url)) {
      deleteImageFromSupabase(existing.image_url).catch(console.warn);
    }

    const updated = normalizeProduct({
      ...existing,
      ...cleanUpdates,
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
          sub_category: updated.sub_category || null,
          description: updated.description || null,
          price: updated.selling_price,
          selling_price: updated.selling_price,
          original_price: updated.mrp,
          mrp: updated.mrp,
          stock: updated.stock,
          stock_quantity: updated.stock_quantity,
          status: updated.status,
          image_url: updated.image_url || null,
          image: updated.image_url || null,
          sku: updated.sku || null,
          unit: updated.unit || null,
          brand: updated.brand || null,
          variants: updated.variants || [],
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
   * Delete product (also purges associated images from Supabase Storage)
   */
  async deleteProduct(id) {
    const currentList = this.getCachedProducts();
    const targetProd = currentList.find(p => p.id === id);

    // 1. Purge product images from Supabase Storage
    if (targetProd?.image_url) {
      deleteImageFromSupabase(targetProd.image_url).catch(console.warn);
    }
    if (Array.isArray(targetProd?.images)) {
      targetProd.images.forEach(img => {
        if (img && img !== targetProd.image_url) {
          deleteImageFromSupabase(img).catch(console.warn);
        }
      });
    }

    // 2. Delete from Supabase Database
    try {
      await supabase.from('products').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete error', err);
    }

    const nextList = currentList.filter(p => p.id !== id);
    this.cacheProductsLocally(nextList);
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

  async addCategory(category) {
    const newCat = {
      id: category.id || `cat_${Date.now()}`,
      name: category.name.trim(),
      slug: category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      icon: category.icon || 'Package',
      image_url: category.image_url || category.image || '',
      image: category.image_url || category.image || '',
      count: 0
    };
    const updated = [...this.categories, newCat];
    this.saveCategories(updated);

    // Save directly to Supabase Database
    try {
      await upsertCategoryToSupabase(newCat);
    } catch (err) {
      console.warn('Supabase category database save notice:', err);
    }

    return newCat;
  }

  async updateCategory(id, updates) {
    const targetCat = this.categories.find(c => c.id === id);
    const newImg = updates.image_url !== undefined ? updates.image_url : updates.image;
    
    // Auto-clean old image if updated or removed
    if (targetCat && targetCat.image_url && newImg !== undefined && targetCat.image_url !== newImg) {
      deleteImageFromSupabase(targetCat.image_url).catch(console.warn);
    }

    const updated = this.categories.map(c => c.id === id ? { 
      ...c, 
      ...updates,
      image_url: updates.image_url !== undefined ? updates.image_url : (updates.image !== undefined ? updates.image : c.image_url),
      image: updates.image_url !== undefined ? updates.image_url : (updates.image !== undefined ? updates.image : c.image)
    } : c);
    this.saveCategories(updated);

    const savedCat = updated.find(c => c.id === id);
    
    // Update directly in Supabase Database
    if (savedCat) {
      try {
        await upsertCategoryToSupabase(savedCat);
      } catch (err) {
        console.warn('Supabase category database update notice:', err);
      }
    }

    return savedCat;
  }

  async deleteCategory(id) {
    const targetCat = this.categories.find(c => c.id === id);
    
    // Auto-clean category cover image from Supabase Storage
    if (targetCat?.image_url) {
      deleteImageFromSupabase(targetCat.image_url).catch(console.warn);
    }

    const updated = this.categories.filter(c => c.id !== id);
    this.saveCategories(updated);

    // Delete directly from Supabase Database
    try {
      await deleteCategoryFromSupabase(id);
    } catch (err) {
      console.warn('Supabase category database delete notice:', err);
    }

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
