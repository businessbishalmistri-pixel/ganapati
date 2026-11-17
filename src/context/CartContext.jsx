import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import {
  syncCustomerCloudCart,
  STORE_ORGANIZATION_ID,
  sanitizeWhatsAppPhone
} from '../services/supabase';

const CartContext = createContext();
const CART_STORAGE_KEY = 'quickcart_cart_items';

export const CartProvider = ({ children }) => {
  const { showToast } = useToast();
  const { customer } = useAuth();

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [justAddedId, setJustAddedId] = useState(null);

  const lastCustomerPhoneRef = useRef(customer?.phone ? sanitizeWhatsAppPhone(customer.phone) : null);
  const syncTimeoutRef = useRef(null);

  // 1. Persist to localStorage optimistically on every change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  // 2. Profile cleared -> wipe the local cart session. There is no cloud
  // read: anon cannot read the customers table, so localStorage is the
  // source of truth and the cloud copy is backup only.
  useEffect(() => {
    const currentPhone = customer?.phone ? sanitizeWhatsAppPhone(customer.phone) : null;
    const previousPhone = lastCustomerPhoneRef.current;
    lastCustomerPhoneRef.current = currentPhone;

    if (previousPhone && !currentPhone) {
      setCartItems([]);
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
      } catch (e) {}
    }
  }, [customer?.phone]);

  // 3. Debounced (300ms) background backup to the cloud for profiled users
  useEffect(() => {
    const currentPhone = customer?.phone ? sanitizeWhatsAppPhone(customer.phone) : null;
    if (!currentPhone) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncCustomerCloudCart(currentPhone, STORE_ORGANIZATION_ID, cartItems);
    }, 300);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [cartItems, customer?.phone]);

  const addToCart = (product, quantity = 1, selectedVariant = null) => {
    const itemStock = selectedVariant
      ? parseInt(selectedVariant.stock_quantity ?? selectedVariant.stock ?? 0, 10)
      : parseInt(product.stock_quantity ?? product.stock ?? 0, 10);
    const itemPrice = selectedVariant 
      ? parseFloat(selectedVariant.selling_price ?? selectedVariant.price) 
      : parseFloat(product.selling_price ?? product.price ?? 0);
    const variantLabel = selectedVariant ? (selectedVariant.name || selectedVariant.size || selectedVariant.unit) : null;
    const variantId = selectedVariant?.id ? String(selectedVariant.id) : null;
    const cartKey = variantId ? `${product.id}_${variantId}` : String(product.id);

    if (itemStock <= 0) {
      showToast(`Sorry, "${product.title || product.name}${variantLabel ? ` (${variantLabel})` : ''}" is out of stock.`, 'warning');
      return false;
    }

    let addedSuccessfully = false;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => {
        const itemKey = item.cartKey || item.cartItemId || (item.variantId ? `${item.id}_${item.variantId}` : String(item.id));
        return String(itemKey) === String(cartKey);
      });

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = currentQty + quantity;

        if (newQty > itemStock) {
          showToast(
            `Stock limit reached: Only ${itemStock} units available for "${product.title || product.name}${variantLabel ? ` (${variantLabel})` : ''}".`,
            'warning'
          );
          return prevItems;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          price: itemPrice,
          selling_price: itemPrice,
          unit: variantLabel || updated[existingIndex].unit || product.unit || '1 unit',
          variantName: variantLabel,
          variantId: variantId,
          selectedVariant: selectedVariant || updated[existingIndex].selectedVariant,
          quantity: newQty,
        };
        addedSuccessfully = true;
        return updated;
      } else {
        if (quantity > itemStock) {
          showToast(
            `Only ${itemStock} units available in stock.`,
            'warning'
          );
          return prevItems;
        }
        addedSuccessfully = true;
        return [
          ...prevItems, 
          { 
            ...product, 
            cartKey: cartKey,
            cartItemId: cartKey,
            id: product.id,
            variantId: variantId,
            variantName: variantLabel,
            sku: selectedVariant?.sku || product.sku || '',
            name: product.name || product.title,
            title: product.title || product.name,
            price: itemPrice,
            selling_price: itemPrice,
            unit: variantLabel || product.unit || '1 unit',
            quantity: quantity,
            stockQuantity: itemStock,
            stock: itemStock,
            imageUrl: product.image_url || product.image || (product.images && product.images[0]) || '',
            image: product.image_url || product.image || (product.images && product.images[0]) || '',
            selectedVariant: selectedVariant || null
          }
        ];
      }
    });

    if (addedSuccessfully) {
      setJustAddedId(cartKey);
      setTimeout(() => setJustAddedId(null), 1200);
      showToast(`Added "${product.title || product.name}${variantLabel ? ` (${variantLabel})` : ''}" to cart!`, 'success');
      return true;
    }
    return false;
  };

  const updateQuantity = (cartKey, newQuantity, maxStock) => {
    const targetKeyStr = String(cartKey);
    if (newQuantity <= 0) {
      removeFromCart(cartKey);
      return;
    }

    if (maxStock !== undefined && newQuantity > maxStock) {
      showToast(`Cannot exceed current stock level of ${maxStock}`, 'warning');
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        const itemKeyStr = String(item.cartKey || item.cartItemId || (item.variantId ? `${item.id}_${item.variantId}` : item.id));
        const match = itemKeyStr === targetKeyStr;
        return match
          ? { ...item, quantity: Math.min(newQuantity, item.stockQuantity ?? item.stock ?? maxStock ?? newQuantity) }
          : item;
      })
    );
  };

  const removeFromCart = (cartKey) => {
    const targetKeyStr = String(cartKey);
    const item = cartItems.find((i) => {
      const iKeyStr = String(i.cartKey || i.cartItemId || (i.variantId ? `${i.id}_${i.variantId}` : i.id));
      return iKeyStr === targetKeyStr;
    });
    setCartItems((prevItems) => 
      prevItems.filter((i) => {
        const iKeyStr = String(i.cartKey || i.cartItemId || (i.variantId ? `${i.id}_${i.variantId}` : i.id));
        return iKeyStr !== targetKeyStr;
      })
    );
    if (item) {
      const vLabel = item.variantName || (item.selectedVariant ? (item.selectedVariant.name || item.selectedVariant.size) : '');
      showToast(`Removed "${item.title || item.name}${vLabel ? ` (${vLabel})` : ''}" from cart`, 'info');
    }
  };

  const clearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {}

    const currentPhone = customer?.phone ? sanitizeWhatsAppPhone(customer.phone) : null;
    if (currentPhone) {
      syncCustomerCloudCart(currentPhone, STORE_ORGANIZATION_ID, []);
    }
    showToast('Cart cleared', 'info');
  };

  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItemsCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        justAddedId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
