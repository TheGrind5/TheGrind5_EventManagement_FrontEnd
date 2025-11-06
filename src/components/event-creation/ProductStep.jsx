import React, { useCallback, memo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Divider,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { productsAPI } from '../../services/apiClient';

const ProductStep = ({ data, onChange, eventId }) => {
  const handleInputChange = useCallback((field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  }, [data, onChange]);

  const handleProductChange = useCallback((index, field, value) => {
    const newProducts = [...data.products];
    newProducts[index] = {
      ...newProducts[index],
      [field]: value
    };
    
    handleInputChange('products', newProducts);
  }, [data.products, handleInputChange]);

  const addProduct = useCallback(() => {
    const newProduct = {
      name: '',
      image: '',
      price: 0
    };
    
    handleInputChange('products', [...data.products, newProduct]);
  }, [data.products, handleInputChange]);

  const removeProduct = useCallback((index) => {
    const newProducts = data.products.filter((_, i) => i !== index);
    handleInputChange('products', newProducts);
  }, [data.products, handleInputChange]);

  const handleImageUpload = useCallback(async (index, file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    try {
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        handleProductChange(index, 'image', base64String);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Lỗi khi upload ảnh');
    }
  }, [handleProductChange]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Tạo phụ kiện
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Phụ kiện sự kiện
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addProduct}
            >
              Thêm phụ kiện
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Tạo các phụ kiện (như áo, túi, mũ...) để người mua vé có thể chọn thêm khi đặt vé
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {data.products.map((product, index) => (
              <Card key={index} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Phụ kiện {index + 1}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => removeProduct(index)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        label="Tên phụ kiện"
                        value={product.name}
                        onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                        fullWidth
                        required
                        placeholder="VD: Áo sự kiện, Túi đựng, Mũ..."
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Ảnh phụ kiện
                        </Typography>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id={`product-image-${index}`}
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleImageUpload(index, file);
                            }
                          }}
                        />
                        <label htmlFor={`product-image-${index}`}>
                          <Button
                            variant="outlined"
                            component="span"
                            fullWidth
                            sx={{ mb: 1 }}
                          >
                            Chọn ảnh
                          </Button>
                        </label>
                        {product.image && (
                          <Box sx={{ mt: 1 }}>
                            <img
                              src={product.image}
                              alt={product.name || 'Product'}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '200px',
                                objectFit: 'contain',
                                borderRadius: '4px'
                              }}
                            />
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleProductChange(index, 'image', '')}
                              sx={{ mt: 1 }}
                            >
                              Xóa ảnh
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center">
                        <TextField
                          label="Giá tiền (VND)"
                          type="number"
                          value={product.isFree ? 0 : product.price}
                          onChange={e => handleProductChange(index, 'price', parseFloat(e.target.value) || 0)}
                          fullWidth
                          required
                          inputProps={{ min: 0 }}
                          disabled={!!product.isFree}
                          sx={{ flex: 1, mr: 2 }}
                        />
                        <Box>
                          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: 18, fontWeight: 600 }}>
                            <input
                              type="checkbox"
                              checked={!!product.isFree}
                              onChange={e => {
                                handleProductChange(index, 'isFree', e.target.checked);
                                handleProductChange(index, 'price', e.target.checked ? 0 : (product.price === 0 ? '' : product.price));
                              }}
                              style={{ width: 20, height: 20, marginRight: 10, accentColor: '#7AC943' }}
                            />
                            <span style={{ fontSize: 20, color: product.isFree ? '#7AC943' : '#222', fontWeight: 'bold', userSelect: 'none', transition: 'color 0.2s' }}>
                              {product.isFree 
                                ? <span style={{ display: 'flex', alignItems: 'center' }}>✔<span style={{ marginLeft: 6 }}>Miễn phí</span></span>
                                : 'Miễn phí'}
                            </span>
                          </label>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
            
            {data.products.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, border: '2px dashed #ccc', borderRadius: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Chưa có phụ kiện nào
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={addProduct}
                >
                  Thêm phụ kiện đầu tiên
                </Button>
              </Box>
            )}
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default memo(ProductStep);

