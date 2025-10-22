import React, { createContext, useContext, useState, useEffect } from 'react';
import { wishlistAPI } from '../services/apiClient';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlist(null);
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await wishlistAPI.getWishlist();
      console.log('Raw wishlist API response:', data);
      console.log('Wishlist data structure:', data?.data ?? data);
      setWishlist(data?.data ?? data);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (ticketTypeId, quantity = 1) => {
    try {
      setLoading(true);
      setError(null);
      await wishlistAPI.addItem(ticketTypeId, quantity);
      await fetchWishlist();
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Failed to add item to wishlist:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId, quantity) => {
    try {
      setLoading(true);
      setError(null);
      await wishlistAPI.updateItem(itemId, quantity);
      await fetchWishlist();
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Failed to update wishlist item:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (itemId) => {
    try {
      setLoading(true);
      setError(null);
      await wishlistAPI.deleteItem(itemId);
      await fetchWishlist();
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Failed to delete wishlist item:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const bulkDelete = async (itemIds) => {
    try {
      setLoading(true);
      setError(null);
      await wishlistAPI.bulkDelete(itemIds);
      await fetchWishlist();
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Failed to bulk delete wishlist items:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkout = async (itemIds) => {
    try {
      setLoading(true);
      setError(null);
      const result = await wishlistAPI.checkout(itemIds);
      await fetchWishlist();
      return result;
    } catch (err) {
      setError(err.message);
      console.error('Failed to checkout wishlist:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getWishlistCount = () => {
    return wishlist?.totals?.count || 0;
  };

  const getWishlistTotal = () => {
    return wishlist?.totals?.sum || 0;
  };

  const isInWishlist = (ticketTypeId) => {
    return wishlist?.items?.some(item => item.ticketTypeId === ticketTypeId) || false;
  };

  const getWishlistItem = (ticketTypeId) => {
    console.log('Looking for ticketTypeId:', ticketTypeId);
    console.log('Current wishlist:', wishlist);
    console.log('Wishlist items:', wishlist?.items);
    const item = wishlist?.items?.find(item => item.ticketTypeId === ticketTypeId);
    console.log('Found item:', item);
    return item;
  };

  const value = {
    wishlist,
    loading,
    error,
    fetchWishlist,
    addItem,
    updateItem,
    deleteItem,
    bulkDelete,
    checkout,
    getWishlistCount,
    getWishlistTotal,
    isInWishlist,
    getWishlistItem
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
