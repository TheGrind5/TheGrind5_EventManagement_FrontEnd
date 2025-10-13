// Wishlist Types
export const WishlistItem = {
  id: null,
  ticketTypeId: null,
  title: '',
  eventName: '',
  price: 0,
  thumbnailUrl: null,
  quantity: 1,
  maxQuantity: 0,
  createdAt: null
};

export const WishlistResponse = {
  items: [],
  totals: {
    count: 0,
    sum: 0
  }
};

export const WishlistCheckoutResponse = {
  orderDraftId: '',
  next: ''
};

// Request types
export const AddWishlistItemRequest = {
  ticketTypeId: null,
  quantity: 1
};

export const UpdateWishlistItemRequest = {
  quantity: 1
};

export const BulkDeleteWishlistRequest = {
  ids: []
};

export const WishlistCheckoutRequest = {
  ids: []
};
