import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Select, MenuItem, FormControl, InputLabel,
  Button, ButtonGroup, ToggleButton, ToggleButtonGroup, Card, CardContent,
  Grid, Stack, Chip, CircularProgress, Alert, IconButton, Tooltip
} from '@mui/material';
import {
  TrendingUp, TrendingDown, Download, PictureAsPdf, FileDownload,
  Refresh, FilterList, CompareArrows
} from '@mui/icons-material';
// Recharts import - đã được cài đặt
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vi } from 'date-fns/locale';
import { ticketsAPI, eventsAPI } from '../../services/apiClient';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

// Recharts đã được cài đặt và kích hoạt
const RECCHARTS_INSTALLED = true;

const SalesChart = ({ hostEvents = [] }) => {
  // Filter states
  const [timeRange, setTimeRange] = useState('30days'); // 7days, 30days, thisMonth, lastMonth, custom
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [viewType, setViewType] = useState('day'); // day, week, month
  const [chartType, setChartType] = useState('line'); // line, bar, area, combo
  const [selectedTicketTypes, setSelectedTicketTypes] = useState([]);
  
  // Data states
  const [chartData, setChartData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalTicketsSold: 0,
    totalRevenue: 0,
    avgTicketsPerDay: 0,
    avgOrderValue: 0,
    growthRate: 0,
    revenueGrowthRate: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calculate date range based on timeRange
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case '7days':
        return { start: subDays(now, 7), end: now, isAllTime: false };
      case '30days':
        return { start: subDays(now, 30), end: now, isAllTime: false };
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now), isAllTime: false };
      case 'lastMonth':
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)), isAllTime: false };
      case 'all':
        // Return a wide range to include all tickets (100 years back)
        return { start: new Date(2000, 0, 1), end: now, isAllTime: true };
      case 'custom':
        return { start: startDate || subDays(now, 30), end: endDate || now, isAllTime: false };
      default:
        return { start: subDays(now, 30), end: now, isAllTime: false };
    }
  };

  // Fetch sales data
  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { start, end, isAllTime } = getDateRange();
      const eventIds = hostEvents.map(e => e.eventId);
      
      if (eventIds.length === 0) {
        setChartData([]);
        setMetrics({
          totalTicketsSold: 0,
          totalRevenue: 0,
          avgTicketsPerDay: 0,
          avgOrderValue: 0,
          growthRate: 0,
          revenueGrowthRate: 0
        });
        return;
      }

      // Fetch tickets for all host events
      const allTickets = [];
      const ticketCountByDate = {};
      let totalRevenue = 0;
      let totalTickets = 0;

      for (const eventId of eventIds) {
        try {
          const ticketsResponse = await ticketsAPI.getTicketsByEvent(eventId);
          const tickets = Array.isArray(ticketsResponse.data) ? ticketsResponse.data : [];
          
          console.log(`[SalesChart] Event ${eventId}: Found ${tickets.length} tickets`);
          
          tickets.forEach(ticket => {
            // Filter by status first
            if (ticket.status !== 'Assigned' && ticket.status !== 'Used') {
              return; // Skip tickets not sold
            }

            // Get ticket date - use issuedAt, fallback to order.createdAt, or skip if neither exists
            let ticketDate = null;
            
            // Try issuedAt first (camelCase or PascalCase)
            if (ticket.issuedAt) {
              ticketDate = new Date(ticket.issuedAt);
            } else if (ticket.IssuedAt) {
              ticketDate = new Date(ticket.IssuedAt);
            } 
            // Fallback to Order.CreatedAt
            else if (ticket.order?.createdAt) {
              ticketDate = new Date(ticket.order.createdAt);
            } else if (ticket.Order?.CreatedAt) {
              ticketDate = new Date(ticket.Order.CreatedAt);
            }
            
            // Skip if no valid date
            if (!ticketDate || isNaN(ticketDate.getTime())) {
              console.warn(`[SalesChart] Ticket ${ticket.ticketId || ticket.TicketId} has no valid date`, ticket);
              return;
            }

            // Filter by date range (skip if isAllTime or if within range)
            if (isAllTime || (ticketDate >= start && ticketDate <= end)) {
              allTickets.push(ticket);
              
              // Group by date/week/month
              const dateKey = getDateKey(ticketDate);
              if (!ticketCountByDate[dateKey]) {
                ticketCountByDate[dateKey] = { tickets: 0, revenue: 0 };
              }
              ticketCountByDate[dateKey].tickets += 1;
              
              // Get price - handle both camelCase and PascalCase
              const price = ticket.ticketType?.price || ticket.TicketType?.Price || 0;
              if (price > 0) {
                ticketCountByDate[dateKey].revenue += price;
                totalRevenue += price;
              }
              totalTickets += 1;
            }
          });
          
          console.log(`[SalesChart] Event ${eventId}: Processed ${allTickets.length} tickets in range`);
        } catch (err) {
          console.error(`[SalesChart] Error fetching tickets for event ${eventId}:`, err);
        }
      }

      console.log(`[SalesChart] Total tickets found: ${totalTickets}, Total revenue: ${totalRevenue}`);
      console.log(`[SalesChart] Date range: ${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`);
      console.log(`[SalesChart] Chart data points: ${Object.keys(ticketCountByDate).length}`);

      // Convert to chart data format
      const sortedKeys = Object.keys(ticketCountByDate).sort();
      const chartDataArray = sortedKeys.map(key => ({
        date: key,
        tickets: ticketCountByDate[key].tickets,
        revenue: ticketCountByDate[key].revenue
      }));

      setChartData(chartDataArray);

      // Calculate metrics
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const avgTicketsPerDay = daysDiff > 0 ? (totalTickets / daysDiff).toFixed(1) : 0;
      const avgOrderValue = totalTickets > 0 ? (totalRevenue / totalTickets).toFixed(0) : 0;

      // Calculate growth rate (simplified - compare with previous period)
      const previousPeriodStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
      const previousMetrics = await calculatePreviousPeriodMetrics(eventIds, previousPeriodStart, start);
      
      const growthRate = previousMetrics.totalTickets > 0
        ? (((totalTickets - previousMetrics.totalTickets) / previousMetrics.totalTickets) * 100).toFixed(1)
        : 0;
      
      const revenueGrowthRate = previousMetrics.totalRevenue > 0
        ? (((totalRevenue - previousMetrics.totalRevenue) / previousMetrics.totalRevenue) * 100).toFixed(1)
        : 0;

      setMetrics({
        totalTicketsSold: totalTickets,
        totalRevenue,
        avgTicketsPerDay: parseFloat(avgTicketsPerDay),
        avgOrderValue: parseFloat(avgOrderValue),
        growthRate: parseFloat(growthRate),
        revenueGrowthRate: parseFloat(revenueGrowthRate)
      });
    } catch (err) {
      setError('Không thể tải dữ liệu biểu đồ');
      console.error('Error fetching sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get date key based on viewType
  const getDateKey = (date) => {
    switch (viewType) {
      case 'day':
        return format(date, 'dd/MM/yyyy');
      case 'week':
        const weekStart = startOfWeek(date, { locale: vi, weekStartsOn: 1 });
        return format(weekStart, 'dd/MM/yyyy');
      case 'month':
        return format(date, 'MM/yyyy');
      default:
        return format(date, 'dd/MM/yyyy');
    }
  };

  // Calculate previous period metrics
  const calculatePreviousPeriodMetrics = async (eventIds, start, end) => {
    let totalTickets = 0;
    let totalRevenue = 0;

    for (const eventId of eventIds) {
      try {
        const ticketsResponse = await ticketsAPI.getTicketsByEvent(eventId);
        const tickets = Array.isArray(ticketsResponse.data) ? ticketsResponse.data : [];
        
        tickets.forEach(ticket => {
          // Filter by status first
          if (ticket.status !== 'Assigned' && ticket.status !== 'Used') {
            return;
          }

          // Get ticket date - use issuedAt, fallback to order.createdAt
          let ticketDate = null;
          
          if (ticket.issuedAt) {
            ticketDate = new Date(ticket.issuedAt);
          } else if (ticket.IssuedAt) {
            ticketDate = new Date(ticket.IssuedAt);
          } else if (ticket.order?.createdAt) {
            ticketDate = new Date(ticket.order.createdAt);
          } else if (ticket.Order?.CreatedAt) {
            ticketDate = new Date(ticket.Order.CreatedAt);
          }
          
          if (!ticketDate || isNaN(ticketDate.getTime())) {
            return;
          }

          if (ticketDate >= start && ticketDate <= end) {
            totalTickets += 1;
            const price = ticket.ticketType?.price || ticket.TicketType?.Price || 0;
            if (price > 0) {
              totalRevenue += price;
            }
          }
        });
      } catch (err) {
        // Silently fail for previous period
      }
    }

    return { totalTickets, totalRevenue };
  };

  useEffect(() => {
    if (hostEvents.length > 0) {
      fetchSalesData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, startDate, endDate, viewType]);

  // Render chart based on chartType
  const renderChart = () => {
    // Show installation message if recharts is not installed
    if (!RECCHARTS_INSTALLED) {
      return (
        <Box sx={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Typography variant="h6" color="text.secondary">
            Chưa cài đặt thư viện biểu đồ
          </Typography>
          <Alert severity="info" sx={{ maxWidth: 500 }}>
            <Typography variant="body2" gutterBottom>
              Vui lòng chạy lệnh sau trong terminal để cài đặt recharts:
            </Typography>
            <Box component="pre" sx={{ mt: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 1, fontSize: '0.875rem', overflow: 'auto' }}>
              cd TheGrind5_EventManagement_FrontEnd{'\n'}npm install recharts
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Sau đó:
            </Typography>
            <Typography variant="body2" component="ol" sx={{ pl: 2, mt: 0.5 }}>
              <li>Mở file <code>src/components/host/SalesChart.jsx</code></li>
              <li>Uncomment dòng import recharts (dòng 12-16)</li>
              <li>Đổi <code>RECCHARTS_INSTALLED = false</code> thành <code>RECCHARTS_INSTALLED = true</code></li>
              <li>Khởi động lại ứng dụng (npm start)</li>
            </Typography>
          </Alert>
        </Box>
      );
    }

    if (chartData.length === 0) {
      const { start, end, isAllTime } = getDateRange();
      return (
        <Box sx={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Typography variant="h6" color="text.secondary">
            Chưa có dữ liệu cho khoảng thời gian này
          </Typography>
          <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
            {isAllTime ? (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Không có vé nào đã được bán cho các sự kiện của bạn.
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" gutterBottom component="div">
                Không có vé nào được bán trong khoảng thời gian từ{' '}
                <strong>{format(start, 'dd/MM/yyyy')}</strong> đến{' '}
                <strong>{format(end, 'dd/MM/yyyy')}</strong>.
                <br />
                <br />
                Thử chọn khoảng thời gian khác hoặc chọn <strong>"Tất cả"</strong> để xem toàn bộ dữ liệu.
              </Typography>
            )}
            {hostEvents.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Bạn chưa có sự kiện nào. Hãy tạo sự kiện và bán vé để xem biểu đồ.
              </Alert>
            )}
          </Box>
        </Box>
      );
    }

    // Render chart với recharts
    const chartProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <RechartsTooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="tickets" stroke="#8884d8" name="Số vé" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Doanh thu (VND)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Doanh thu (VND)" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Area type="monotone" dataKey="tickets" stackId="1" stroke="#8884d8" fill="#8884d8" name="Tổng tích lũy vé" />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'combo':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <RechartsTooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="tickets" fill="#8884d8" name="Số vé" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#ff7300" name="Doanh thu (VND)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <Box>
      {/* Filter Bar */}
      <Paper sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Khoảng thời gian</InputLabel>
            <Select
              value={timeRange}
              label="Khoảng thời gian"
              onChange={(e) => {
                setTimeRange(e.target.value);
                if (e.target.value !== 'custom') {
                  setStartDate(null);
                  setEndDate(null);
                }
              }}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="7days">7 ngày qua</MenuItem>
              <MenuItem value="30days">30 ngày qua</MenuItem>
              <MenuItem value="thisMonth">Tháng này</MenuItem>
              <MenuItem value="lastMonth">Tháng trước</MenuItem>
              <MenuItem value="custom">Tùy chỉnh</MenuItem>
            </Select>
          </FormControl>

          {timeRange === 'custom' && (
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
              <DatePicker
                label="Từ ngày"
                value={startDate}
                onChange={setStartDate}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />
              <DatePicker
                label="Đến ngày"
                value={endDate}
                onChange={setEndDate}
                slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
              />
            </LocalizationProvider>
          )}

          <ButtonGroup size="small" variant="outlined">
            <ToggleButtonGroup
              value={viewType}
              exclusive
              onChange={(e, newValue) => newValue && setViewType(newValue)}
              size="small"
            >
              <ToggleButton value="day">Ngày</ToggleButton>
              <ToggleButton value="week">Tuần</ToggleButton>
              <ToggleButton value="month">Tháng</ToggleButton>
            </ToggleButtonGroup>
          </ButtonGroup>

          <ButtonGroup size="small" variant="outlined">
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={(e, newValue) => newValue && setChartType(newValue)}
              size="small"
            >
              <ToggleButton value="line">Line</ToggleButton>
              <ToggleButton value="bar">Bar</ToggleButton>
              <ToggleButton value="area">Area</ToggleButton>
              <ToggleButton value="combo">Combo</ToggleButton>
            </ToggleButtonGroup>
          </ButtonGroup>

          <Box sx={{ flexGrow: 1 }} />
          
          <Tooltip title="Làm mới dữ liệu">
            <IconButton onClick={fetchSalesData} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Metrics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tổng vé đã bán
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {metrics.totalTicketsSold}
              </Typography>
              {metrics.growthRate !== 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {metrics.growthRate > 0 ? (
                    <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                  )}
                  <Typography variant="caption" color={metrics.growthRate > 0 ? 'success.main' : 'error.main'}>
                    {Math.abs(metrics.growthRate)}% so với kỳ trước
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tổng doanh thu
              </Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">
                {formatCurrency(metrics.totalRevenue)}
              </Typography>
              {metrics.revenueGrowthRate !== 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {metrics.revenueGrowthRate > 0 ? (
                    <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                  )}
                  <Typography variant="caption" color={metrics.revenueGrowthRate > 0 ? 'success.main' : 'error.main'}>
                    {Math.abs(metrics.revenueGrowthRate)}% tăng trưởng
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Trung bình vé/ngày
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {metrics.avgTicketsPerDay}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Giá trị đơn hàng TB
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                {formatCurrency(metrics.avgOrderValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chart */}
      <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Biểu đồ bán vé theo thời gian
          </Typography>
          <ButtonGroup size="small">
            <Tooltip title="Export CSV">
              <IconButton size="small">
                <FileDownload />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export PDF">
              <IconButton size="small">
                <PictureAsPdf />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
        </Box>

        {loading ? (
          <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          renderChart()
        )}
      </Paper>
    </Box>
  );
};

export default SalesChart;

