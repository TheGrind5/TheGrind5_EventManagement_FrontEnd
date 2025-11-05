import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocalOffer as VoucherIcon
} from '@mui/icons-material';
import { voucherAPI } from '../../services/apiClient';

const AdminVouchersPage = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filters, setFilters] = useState({
    isActive: null,
    searchCode: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    voucherCode: '',
    discountPercentage: 10,
    validFrom: '',
    validTo: '',
    isActive: true,
    maxUsageCount: null,
    minOrderAmount: null,
    description: ''
  });

  useEffect(() => {
    fetchVouchers();
  }, [filters]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await voucherAPI.getAll(filters);
      setVouchers(response.data || []);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải danh sách voucher');
      console.error('Error fetching vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setIsEditing(false);
    setFormData({
      voucherCode: '',
      discountPercentage: 10,
      validFrom: '',
      validTo: '',
      isActive: true,
      maxUsageCount: null,
      minOrderAmount: null,
      description: ''
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (voucher) => {
    setIsEditing(true);
    setSelectedVoucher(voucher);
    setFormData({
      voucherCode: voucher.voucherCode,
      discountPercentage: voucher.discountPercentage,
      validFrom: voucher.validFrom ? new Date(voucher.validFrom).toISOString().split('T')[0] : '',
      validTo: voucher.validTo ? new Date(voucher.validTo).toISOString().split('T')[0] : '',
      isActive: voucher.isActive,
      maxUsageCount: voucher.maxUsageCount || null,
      minOrderAmount: voucher.minOrderAmount || null,
      description: voucher.description || ''
    });
    setOpenDialog(true);
  };

  const handleOpenViewDialog = async (voucher) => {
    try {
      setSelectedVoucher(voucher);
      // Fetch usage history
      const usageResponse = await voucherAPI.getUsageHistory(voucher.voucherId);
      setSelectedVoucher({
        ...voucher,
        usageHistory: usageResponse.data || []
      });
      setOpenViewDialog(true);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải lịch sử sử dụng');
    }
  };

  const handleOpenDeleteDialog = (voucher) => {
    setSelectedVoucher(voucher);
    setOpenDeleteDialog(true);
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setSuccess('');

      // Validate
      if (!formData.voucherCode.trim()) {
        setError('Mã voucher không được để trống');
        return;
      }

      if (formData.discountPercentage < 1 || formData.discountPercentage > 100) {
        setError('Phần trăm giảm giá phải từ 1 đến 100');
        return;
      }

      if (!formData.validFrom || !formData.validTo) {
        setError('Vui lòng nhập đầy đủ ngày bắt đầu và kết thúc');
        return;
      }

      if (new Date(formData.validFrom) >= new Date(formData.validTo)) {
        setError('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
        return;
      }

      if (isEditing) {
        await voucherAPI.update(selectedVoucher.voucherId, {
          discountPercentage: formData.discountPercentage,
          validFrom: formData.validFrom,
          validTo: formData.validTo,
          isActive: formData.isActive,
          maxUsageCount: formData.maxUsageCount || null,
          minOrderAmount: formData.minOrderAmount || null,
          description: formData.description || null
        });
        setSuccess('Cập nhật voucher thành công!');
      } else {
        await voucherAPI.create(formData);
        setSuccess('Tạo voucher thành công!');
      }

      setOpenDialog(false);
      fetchVouchers();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async () => {
    try {
      setError('');
      await voucherAPI.delete(selectedVoucher.voucherId);
      setSuccess('Xóa voucher thành công!');
      setOpenDeleteDialog(false);
      fetchVouchers();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi xóa voucher');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Không yêu cầu';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const isVoucherValid = (voucher) => {
    const now = new Date();
    const validFrom = new Date(voucher.validFrom);
    const validTo = new Date(voucher.validTo);
    return voucher.isActive && now >= validFrom && now <= validTo;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            <VoucherIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Quản lý Voucher
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            sx={{ bgcolor: 'primary.main' }}
          >
            Tạo Voucher Mới
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Tìm kiếm mã voucher"
                      value={filters.searchCode}
                      onChange={(e) => setFilters({ ...filters, searchCode: e.target.value })}
                      placeholder="Nhập mã voucher..."
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Trạng thái</InputLabel>
                      <Select
                        value={filters.isActive === null ? 'all' : filters.isActive}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFilters({
                            ...filters,
                            isActive: value === 'all' ? null : value === 'true'
                          });
                        }}
                        label="Trạng thái"
                      >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value={true}>Đang hoạt động</MenuItem>
                        <MenuItem value={false}>Vô hiệu hóa</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Alerts */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                {success}
              </Alert>
            )}

            {/* Table */}
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã Voucher</TableCell>
                      <TableCell>Giảm giá</TableCell>
                      <TableCell>Thời gian</TableCell>
                      <TableCell>Đơn tối thiểu</TableCell>
                      <TableCell>Số lần sử dụng</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vouchers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            Không có voucher nào
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      vouchers.map((voucher) => (
                        <TableRow key={voucher.voucherId} hover>
                          <TableCell>
                            <Typography fontWeight="bold">{voucher.voucherCode}</Typography>
                            {voucher.description && (
                              <Typography variant="caption" color="text.secondary">
                                {voucher.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${voucher.discountPercentage}%`}
                              color="primary"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(voucher.validFrom)} - {formatDate(voucher.validTo)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatCurrency(voucher.minOrderAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {voucher.currentUsageCount || 0}
                              {voucher.maxUsageCount ? ` / ${voucher.maxUsageCount}` : ' / ∞'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={isVoucherValid(voucher) ? 'Hợp lệ' : 'Không hợp lệ'}
                              color={isVoucherValid(voucher) ? 'success' : 'default'}
                              size="small"
                            />
                            <Chip
                              label={voucher.isActive ? 'Active' : 'Inactive'}
                              color={voucher.isActive ? 'primary' : 'default'}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Xem chi tiết">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenViewDialog(voucher)}
                                color="info"
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Chỉnh sửa">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditDialog(voucher)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDeleteDialog(voucher)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          {/* Create/Edit Dialog */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              {isEditing ? 'Chỉnh sửa Voucher' : 'Tạo Voucher Mới'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Mã Voucher"
                    value={formData.voucherCode}
                    onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })}
                    required
                    disabled={isEditing}
                    helperText="Mã voucher sẽ được chuyển thành chữ hoa"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phần trăm giảm giá (%)"
                    type="number"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })}
                    required
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Ngày bắt đầu"
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Ngày kết thúc"
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Số lần sử dụng tối đa"
                    type="number"
                    value={formData.maxUsageCount || ''}
                    onChange={(e) => setFormData({ ...formData, maxUsageCount: e.target.value ? parseInt(e.target.value) : null })}
                    helperText="Để trống = không giới hạn"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Đơn hàng tối thiểu (VNĐ)"
                    type="number"
                    value={formData.minOrderAmount || ''}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value ? parseFloat(e.target.value) : null })}
                    helperText="Để trống = không yêu cầu"
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Mô tả"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                    }
                    label="Kích hoạt voucher"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
              <Button onClick={handleSubmit} variant="contained">
                {isEditing ? 'Cập nhật' : 'Tạo'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* View Dialog */}
          <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>
              Chi tiết Voucher: {selectedVoucher?.voucherCode}
            </DialogTitle>
            <DialogContent>
              {selectedVoucher && (
                <Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Mã Voucher</Typography>
                      <Typography variant="body1" fontWeight="bold">{selectedVoucher.voucherCode}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Giảm giá</Typography>
                      <Typography variant="body1">{selectedVoucher.discountPercentage}%</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Thời gian hiệu lực</Typography>
                      <Typography variant="body1">
                        {formatDate(selectedVoucher.validFrom)} - {formatDate(selectedVoucher.validTo)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Đơn hàng tối thiểu</Typography>
                      <Typography variant="body1">{formatCurrency(selectedVoucher.minOrderAmount)}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Số lần sử dụng</Typography>
                      <Typography variant="body1">
                        {selectedVoucher.currentUsageCount || 0}
                        {selectedVoucher.maxUsageCount ? ` / ${selectedVoucher.maxUsageCount}` : ' / ∞'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Trạng thái</Typography>
                      <Chip
                        label={selectedVoucher.isActive ? 'Active' : 'Inactive'}
                        color={selectedVoucher.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </Grid>
                    {selectedVoucher.description && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Mô tả</Typography>
                        <Typography variant="body1">{selectedVoucher.description}</Typography>
                      </Grid>
                    )}
                    {selectedVoucher.usageHistory && selectedVoucher.usageHistory.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                          Lịch sử sử dụng ({selectedVoucher.usageHistory.length})
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Người dùng</TableCell>
                                <TableCell>Đơn hàng</TableCell>
                                <TableCell>Giảm giá</TableCell>
                                <TableCell>Thời gian</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedVoucher.usageHistory.map((usage) => (
                                <TableRow key={usage.usageId}>
                                  <TableCell>{usage.userName}</TableCell>
                                  <TableCell>#{usage.orderId}</TableCell>
                                  <TableCell>{formatCurrency(usage.discountAmount)}</TableCell>
                                  <TableCell>{formatDate(usage.usedAt)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenViewDialog(false)}>Đóng</Button>
            </DialogActions>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogContent>
              <Typography>
                Bạn có chắc chắn muốn xóa voucher <strong>{selectedVoucher?.voucherCode}</strong>?
              </Typography>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Chỉ có thể xóa voucher chưa được sử dụng. Voucher đã được sử dụng chỉ có thể vô hiệu hóa.
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDeleteDialog(false)}>Hủy</Button>
              <Button onClick={handleDelete} color="error" variant="contained">
                Xóa
              </Button>
            </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminVouchersPage;

