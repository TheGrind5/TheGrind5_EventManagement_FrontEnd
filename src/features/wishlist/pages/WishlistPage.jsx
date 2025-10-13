import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../hooks';
import WishlistTable from '../components/WishlistTable';

const WishlistPage = () => {
  const navigate = useNavigate();
  const {
    wishlist,
    selectedIds,
    loading,
    error,
    actions: {
      fetchWishlist,
      updateItemQuantity,
      deleteItem,
      deleteSelectedItems,
      checkout,
      toggleSelectItem,
      toggleSelectAll,
      clearSelection,
      debouncedUpdateQuantity
    }
  } = useWishlist();

  // Show toast notifications
  const showToast = (message, type = 'success') => {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : '#dc3545'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 1000;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      toast.remove();
      style.remove();
    }, 3000);
  };

  // Handle quantity update with debouncing
  const handleUpdateQuantity = (itemId, quantity) => {
    debouncedUpdateQuantity(itemId, quantity);
  };

  // Handle delete item
  const handleDeleteItem = async (itemId) => {
    try {
      await deleteItem(itemId);
      showToast('Đã xóa item khỏi wishlist');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  // Handle delete selected items
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      await deleteSelectedItems();
      showToast(`Đã xóa ${selectedIds.size} item khỏi wishlist`);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      const result = await checkout();
      showToast('Chuyển đến trang thanh toán...');
      navigate(result.next);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      showToast(error, 'error');
    }
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Page Header */}
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h1 style={{
                margin: '0 0 8px 0',
                fontSize: '28px',
                fontWeight: '600',
                color: '#333'
              }}>
                💝 Wishlist của tôi
              </h1>
              <p style={{
                margin: '0',
                color: '#666',
                fontSize: '16px'
              }}>
                Quản lý các vé bạn đã thêm vào danh sách yêu thích
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🏠 Về trang chủ
              </button>
            </div>
          </div>
        </div>
        
        {wishlist.items.length > 0 && (
          <div style={{
            background: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            color: '#666'
          }}>
            <span>Tổng: <strong>{wishlist.totals.count}</strong> mục</span>
            <span>•</span>
            <span style={{ color: '#28a745', fontWeight: '600' }}>
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(wishlist.totals.sum)}
            </span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '12px 16px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            <strong>Lỗi:</strong> {error}
          </div>
        )}

        {/* Wishlist Table */}
        <WishlistTable
          wishlist={wishlist}
          selectedIds={selectedIds}
          loading={loading}
          onToggleSelectItem={toggleSelectItem}
          onToggleSelectAll={toggleSelectAll}
          onUpdateQuantity={handleUpdateQuantity}
          onDeleteItem={handleDeleteItem}
          onDeleteSelected={handleDeleteSelected}
          onCheckout={handleCheckout}
        />

        {/* Quick Actions */}
        {wishlist.items.length > 0 && (
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              color: '#333'
            }}>
              Hành động nhanh
            </h3>
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Tiếp tục mua sắm
              </button>
              
              {selectedIds.size > 0 && (
                <>
                  <button
                    onClick={clearSelection}
                    style={{
                      background: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Bỏ chọn tất cả
                  </button>
                  
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    style={{
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    Thanh toán {selectedIds.size} mục đã chọn
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;