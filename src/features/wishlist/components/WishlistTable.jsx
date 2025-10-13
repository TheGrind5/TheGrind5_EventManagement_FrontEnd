import React from 'react';

const WishlistTable = ({ 
  wishlist, 
  selectedIds, 
  loading, 
  onToggleSelectItem, 
  onToggleSelectAll, 
  onUpdateQuantity, 
  onDeleteItem, 
  onDeleteSelected, 
  onCheckout 
}) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const allSelected = wishlist.items.length > 0 && selectedIds.size === wishlist.items.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < wishlist.items.length;

  if (loading && wishlist.items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }}
        />
        <p>Đang tải danh sách wishlist...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (wishlist.items.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '60px 20px',
        color: '#666'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>💝</div>
        <h3 style={{ marginBottom: '10px', color: '#333' }}>Wishlist trống</h3>
        <p>Bạn chưa có vé nào trong wishlist. Hãy thêm một số vé từ trang chi tiết sự kiện!</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      {/* Table Header */}
      <div style={{
        background: '#f8f9fa',
        padding: '16px 20px',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={allSelected}
              ref={input => {
                if (input) input.indeterminate = someSelected;
              }}
              onChange={onToggleSelectAll}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontWeight: '500' }}>
              {selectedIds.size > 0 ? `${selectedIds.size} mục đã chọn` : 'Chọn tất cả'}
            </span>
          </label>
        </div>
        
        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onDeleteSelected}
              disabled={loading}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: loading ? 0.7 : 1
              }}
            >
              Xóa đã chọn
            </button>
            <button
              onClick={onCheckout}
              disabled={loading}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: loading ? 0.7 : 1
              }}
            >
              Thanh toán
            </button>
          </div>
        )}
      </div>

      {/* Table Body */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>
                Sản phẩm
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>
                Sự kiện
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>
                Giá
              </th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>
                Số lượng
              </th>
              <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#495057' }}>
                Thành tiền
              </th>
              <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#495057' }}>
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {wishlist.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => onToggleSelectItem(item.id)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.thumbnailUrl && (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          style={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #dee2e6'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: '500', color: '#333', marginBottom: '4px' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Thêm vào: {formatDate(item.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '16px', color: '#666' }}>
                  {item.eventName}
                </td>
                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '500' }}>
                  {formatPrice(item.price)}
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    max={item.maxQuantity}
                    value={item.quantity}
                    onChange={(e) => {
                      const newQuantity = Math.max(1, Math.min(parseInt(e.target.value) || 1, item.maxQuantity));
                      onUpdateQuantity(item.id, newQuantity);
                    }}
                    style={{
                      width: '60px',
                      padding: '6px 8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      textAlign: 'center',
                      fontSize: '14px'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Tối đa: {item.maxQuantity}
                  </div>
                </td>
                <td style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#28a745' }}>
                  {formatPrice(item.price * item.quantity)}
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '18px',
                      padding: '4px',
                      borderRadius: '4px',
                      opacity: loading ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.target.style.background = '#f8f9fa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.target.style.background = 'none';
                      }
                    }}
                    title="Xóa khỏi wishlist"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderTop: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Tổng cộng: <strong>{wishlist.totals.count}</strong> mục
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#28a745' }}>
          {formatPrice(wishlist.totals.sum)}
        </div>
      </div>
    </div>
  );
};

export default WishlistTable;
