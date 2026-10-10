import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { CURRENCIES, DEFAULT_TAX_RATE } from '../constants/currencies';
import { useAuth } from './AuthContext';

const CartContext = createContext({
  items: [],
  customer: { name: '', mobile: '' },
  currency: CURRENCIES[0],
  isTaxIncluded: false,
  taxRate: DEFAULT_TAX_RATE,
  subtotal: 0,
  tax: 0,
  total: 0,
  itemCount: 0,
  addToCart: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  setCustomer: () => {},
  toggleTax: () => {},
  setCurrency: () => {},
});

export const CartProvider = ({ children }) => {
  const { profile } = useAuth();
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState({ name: '', mobile: '' });
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [isTaxIncluded, setIsTaxIncluded] = useState(false);

  // Sync default currency and tax rate from profile
  useEffect(() => {
    if (profile?.currency) {
      const match = CURRENCIES.find((c) => c.code === profile.currency);
      if (match) {
        setCurrency(match);
      } else if (profile.currencySymbol) {
        setCurrency({ code: profile.currency, symbol: profile.currencySymbol, rate: 1 });
      }
    }
  }, [profile]);

  const taxRate = profile?.taxRate ?? DEFAULT_TAX_RATE;

  const addToCart = (item, variant) => {
    if (!item || !variant) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const resolvedId = String(item.id || item._id || '');
    const normalizedItem = {
      ...item,
      id: resolvedId,
      _id: resolvedId,
      imageUrl: item.imageUrl || '',
    };

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (ci) => {
          const ciId = String(ci.item?.id || ci.item?._id || '');
          return ciId === resolvedId && ci.selectedVariant?.name === variant.name;
        }
      );

      if (existingIndex > -1) {
        const next = [...prevItems];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + 1,
        };
        return next;
      }

      return [...prevItems, { item: normalizedItem, selectedVariant: variant, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, variantName, newQty) => {
    try {
      Haptics.selectionAsync();
    } catch {}

    const targetId = String(itemId);
    setItems((prevItems) => {
      if (newQty <= 0) {
        return prevItems.filter(
          (ci) => !(String(ci.item?.id || ci.item?._id || '') === targetId && ci.selectedVariant?.name === variantName)
        );
      }

      return prevItems.map((ci) =>
        String(ci.item?.id || ci.item?._id || '') === targetId && ci.selectedVariant?.name === variantName
          ? { ...ci, quantity: newQty }
          : ci
      );
    });
  };

  const removeItem = (itemId, variantName) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}

    const targetId = String(itemId);
    setItems((prevItems) =>
      prevItems.filter(
        (ci) => !(String(ci.item?.id || ci.item?._id || '') === targetId && ci.selectedVariant?.name === variantName)
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setCustomer({ name: '', mobile: '' });
  };

  const toggleTax = () => {
    setIsTaxIncluded((prev) => !prev);
  };

  const { subtotal, itemCount } = useMemo(() => {
    let sub = 0;
    let count = 0;
    for (const ci of items) {
      const price = ci.selectedVariant?.price || 0;
      sub += price * ci.quantity;
      count += ci.quantity;
    }
    return { subtotal: sub, itemCount: count };
  }, [items]);

  const tax = isTaxIncluded ? subtotal * taxRate : 0;
  const total = subtotal + tax;

  return (
    <CartContext.Provider
      value={{
        items,
        customer,
        currency,
        isTaxIncluded,
        taxRate,
        subtotal,
        tax,
        total,
        itemCount,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        setCustomer,
        toggleTax,
        setCurrency,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
