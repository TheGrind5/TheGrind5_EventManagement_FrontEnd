import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Cart Context
const CartContext = createContext();

// Cart Actions
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART'
};

// Cart Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM:
      const existingItem = state.items.find(
        item => item.ticketTypeId === action.payload.ticketTypeId
      );
      
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.ticketTypeId === action.payload.ticketTypeId
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      }
      
      return {
        ...state,
        items: [...state.items, action.payload]
      };

    case CART_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => item.ticketTypeId !== action.payload)
      };

    case CART_ACTIONS.UPDATE_QUANTITY:
      return {
        ...state,
        items: state.items.map(item =>
          item.ticketTypeId === action.payload.ticketTypeId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      };

    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: []
      };

    case CART_ACTIONS.LOAD_CART:
      return {
        ...state,
        items: action.payload || []
      };

    default:
      return state;
  }
};

// Initial State
const initialState = {
  items: []
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('eventCart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: cartData });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('eventCart', JSON.stringify(state.items));
  }, [state.items]);

  // Cart Actions
  const addToCart = (ticketType, quantity = 1) => {
    const cartItem = {
      ticketTypeId: ticketType.ticketTypeId,
      eventId: ticketType.eventId,
      typeName: ticketType.typeName,
      price: ticketType.price,
      quantity: quantity,
      maxOrder: ticketType.maxOrder,
      minOrder: ticketType.minOrder,
      availableQuantity: ticketType.availableQuantity
    };

    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: cartItem });
  };

  const removeFromCart = (ticketTypeId) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: ticketTypeId });
  };

  const updateQuantity = (ticketTypeId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(ticketTypeId);
    } else {
      dispatch({ 
        type: CART_ACTIONS.UPDATE_QUANTITY, 
        payload: { ticketTypeId, quantity } 
      });
    }
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  // Computed values
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isEmpty = state.items.length === 0;

  // Group items by event
  const itemsByEvent = state.items.reduce((groups, item) => {
    if (!groups[item.eventId]) {
      groups[item.eventId] = [];
    }
    groups[item.eventId].push(item);
    return groups;
  }, {});

  const value = {
    // State
    items: state.items,
    totalItems,
    totalAmount,
    isEmpty,
    itemsByEvent,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
