import { useState, useEffect, useCallback } from 'react';
import { wishlistAPI } from './api';

// Custom hook cho wishlist state management
export const useWishlist = () => {
  const [wishlist, setWishlist] = useState({
    items: [],
    totals: { count: 0, sum: 0 }
  });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch wishlist data
  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await wishlistAPI.getWishlist();
      setWishlist(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add item to wishlist
  const addItem = useCallback(async (ticketTypeId, quantity = 1) => {
    try {
      setLoading(true);
      setError(null);
      await wishlistAPI.addItem(ticketTypeId, quantity);
      await fetchWishlist(); // Refresh wishlist
    } catch (err) {
      setError(err.message);
      throw err; // Re-throw để component có thể handle
    } finally {
      setLoading(false);
    }
  }, [fetchWishlist]);

  // Update item quantity
  const updateItemQuantity = useCallback(async (itemId, quantity) => {
    try {
      setError(null);
      await wishlistAPI.updateItem(itemId, quantity);
      await fetchWishlist(); // Refresh wishlist
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [fetchWishlist]);

  // Delete single item
  const deleteItem = useCallback(async (itemId) => {
    try {
      setLoading(true);
      setError(null);
      await wishlistAPI.deleteItem(itemId);
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      await fetchWishlist(); // Refresh wishlist
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWishlist]);

  // Delete multiple items
  const deleteSelectedItems = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      await wishlistAPI.bulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      await fetchWishlist(); // Refresh wishlist
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedIds, fetchWishlist]);

  // Checkout selected items
  const checkout = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await wishlistAPI.checkout(Array.from(selectedIds));
      return result; // Return result để component có thể navigate
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedIds]);

  // Selection management
  const toggleSelectItem = useCallback((itemId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === wishlist.items.length) {
        return new Set(); // Deselect all
      } else {
        return new Set(wishlist.items.map(item => item.id)); // Select all
      }
    });
  }, [wishlist.items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Debounced update quantity
  const debouncedUpdateQuantity = useCallback(
    debounce((itemId, quantity) => {
      updateItemQuantity(itemId, quantity);
    }, 300),
    [updateItemQuantity]
  );

  // Load wishlist on mount
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  return {
    wishlist,
    selectedIds,
    loading,
    error,
    actions: {
      fetchWishlist,
      addItem,
      updateItemQuantity,
      deleteItem,
      deleteSelectedItems,
      checkout,
      toggleSelectItem,
      toggleSelectAll,
      clearSelection,
      debouncedUpdateQuantity
    }
  };
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
