import { fetchLiveProductsFromBackend, supabase } from './supabaseStore';
import { INITIAL_DEFAULT_PRODUCTS, normalizeProduct } from './inventoryData';

const STORAGE_KEY = 'quickcart_live_inventory_cache';

class InventoryService {
  constructor() {
    this.listeners = new Set();
    this.products = this.loadCachedData();
    this.fetchCatalog();
    this.setupRealtimeSubscription();

    if (typeof window !== 'undefined') {
      const handleFocus = () => {
        if (document.visibilityState === 'visible') {
          this.fetchCatalog();
        }
      };
      window.addEventListener('visibilitychange', handleFocus);
      window.addEventListener('focus', handleFocus);
    }
  }

  loadCachedData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeProduct).filter(Boolean);
        }
      }
    } catch (e) {
      console.warn('Could not read cached inventory', e);
    }
    return [];
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.products));
    } catch (e) {
      console.warn('Could not save inventory cache', e);
    }
  }

  /**
   * Subscribe to real-time inventory updates
   */
  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.products);
    this.fetchCatalog();
    return () => this.listeners.delete(callback);
  }

  notify(broadcast = true) {
    this.saveData();
    for (const listener of this.listeners) {
      listener([...this.products]);
    }
    if (broadcast && typeof window !== 'undefined' && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'INVENTORY_SYNC',
          products: this.products
        });
      } catch (e) {}
    }
  }

  /**
   * Fetch real products directly from backend (Deduplicated)
   */
  async fetchCatalog() {
    if (this._inFlightFetch) {
      return this._inFlightFetch;
    }
    this._inFlightFetch = (async () => {
      try {
        const liveProducts = await fetchLiveProductsFromBackend();
        if (Array.isArray(liveProducts)) {
          this.products = liveProducts;
          this.notify();
          return liveProducts;
        }
      } catch (err) {
        console.error('Failed to fetch catalog from backend:', err);
      } finally {
        this._inFlightFetch = null;
      }
      return [...this.products];
    })();
    return this._inFlightFetch;
  }

  /**
   * Listen to real-time PostgreSQL changes in Supabase with Instant Delta Patching (<50ms)
   */
  setupRealtimeSubscription() {
    try {
      // 1. Cross-tab instant communication (Same device)
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          this.broadcastChannel = new BroadcastChannel('ganapati_live_inventory_channel');
          this.broadcastChannel.onmessage = (event) => {
            if (event.data?.type === 'INVENTORY_SYNC' && Array.isArray(event.data?.products)) {
              this.products = event.data.products;
              this.notify(false);
            }
          };
        } catch (e) {}
      }

      // 2. Supabase Realtime WebSocket stream (All devices worldwide)
      let debounceTimer = null;
      supabase
        .channel('public:products:global_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          // Instant In-Memory Delta Update (0ms lag before fetch completes)
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedItem = normalizeProduct(payload.new);
            if (updatedItem) {
              this.products = this.products.map(p => p.id === updatedItem.id ? { ...p, ...updatedItem } : p);
              this.notify();
            }
          } else if (payload.eventType === 'INSERT' && payload.new) {
            const newItem = normalizeProduct(payload.new);
            if (newItem && !this.products.some(p => p.id === newItem.id)) {
              this.products = [newItem, ...this.products];
              this.notify();
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const delId = payload.old.id;
            if (delId) {
              this.products = this.products.filter(p => p.id !== delId);
              this.notify();
            }
          }

          // Full background revalidation
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            this.fetchCatalog();
          }, 350);
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription not supported or failed', e);
    }
  }

  /**
   * Get single product by ID
   */
  async getProductById(id) {
    if (this.products.length === 0) {
      await this.fetchCatalog();
    }
    const product = this.products.find((p) => p.id === id);
    return product ? { ...product } : null;
  }

  /**
   * Check if quantity is available in stock
   */
  checkStock(id, requestedQty = 1) {
    const product = this.products.find((p) => p.id === id);
    if (!product) return { available: false, currentStock: 0, maxAllowed: 0 };
    return {
      available: product.stock >= requestedQty,
      currentStock: product.stock,
      maxAllowed: product.stock
    };
  }

  /**
   * Decrement stock when order is placed
   */
  async decrementStockForOrder(items) {
    let updated = false;
    this.products = this.products.map((prod) => {
      const matched = items.find((item) => item.id === prod.id);
      if (matched) {
        const newStock = Math.max(0, prod.stock - matched.quantity);
        updated = true;
        return { ...prod, stock: newStock };
      }
      return prod;
    });

    if (updated) {
      this.notify();
    }

    // Sync real stock decrement to Supabase database
    for (const item of items) {
      try {
        const prod = this.products.find((p) => p.id === item.id);
        if (prod) {
          await supabase
            .from('products')
            .update({ stock_quantity: prod.stock })
            .eq('id', item.id);
        }
      } catch (err) {
        console.warn('Failed to sync stock decrement to database:', err);
      }
    }

    return true;
  }
}

export const inventoryApi = new InventoryService();
