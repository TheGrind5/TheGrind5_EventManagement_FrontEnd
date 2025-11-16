import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  IconButton,
  Box
} from '@mui/material';
import { ArrowBackIos, ArrowForwardIos, CalendarToday } from '@mui/icons-material';
import adminAPI from '../../services/adminAPI';
import { formatVietnamDateTimeShort } from '../../utils/dateTimeUtils';
import './EventCalendar.css';

const EventCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDialog, setCalendarDialog] = useState({
    open: false,
    dateLabel: '',
    events: []
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getAllEvents();
        const eventData = response.data?.data || response.data?.Data || response.data || [];
        setEvents(Array.isArray(eventData) ? eventData : []);
      } catch (error) {
        console.error('Error fetching events for calendar:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const eventsByDate = useMemo(() => {
    const grouped = {};
    events.forEach((event) => {
      if (!event?.startTime) return;
      const date = new Date(event.startTime);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(event);
    });
    return grouped;
  }, [events]);

  // Helper function để kiểm tra xem một ngày có phải là hôm nay không
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 42 ô (6 hàng) để hiển thị đầy đủ các tuần trong tháng
    return Array.from({ length: 42 }, (_, index) => {
      const dayNumber = index - startOffset + 1;
      const cellDate = new Date(year, month, dayNumber);
      const inCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
      const key = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;

      return {
        key,
        label: cellDate.getDate(),
        date: cellDate,
        isCurrentMonth: inCurrentMonth,
        isToday: isToday(cellDate),
        events: eventsByDate[key] || []
      };
    });
  }, [currentMonth, eventsByDate]);

  const handleMonthChange = (direction) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const handleDayClick = (cell) => {
    const dateLabel = cell.date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    setCalendarDialog({
      open: true,
      dateLabel,
      events: cell.events
    });
  };

  const closeCalendarDialog = () => {
    setCalendarDialog({
      open: false,
      dateLabel: '',
      events: []
    });
  };

  // Sử dụng formatVietnamDateTimeShort từ dateTimeUtils để đồng bộ UTC+7
  const formatDate = formatVietnamDateTimeShort;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="event-calendar-page">
      <div className="page-header">
        <Typography variant="h4" className="page-title">
          <CalendarToday fontSize="large" style={{ marginRight: 12 }} />
          Lịch Sự Kiện
        </Typography>
        <Typography variant="body1" className="calendar-subtitle">
          Xem nhanh các sự kiện theo từng ngày trong tháng
        </Typography>
      </div>

      <Card className="calendar-card">
        <CardContent>
          <div className="calendar-header">
            <IconButton onClick={() => handleMonthChange(-1)} size="small">
              <ArrowBackIos fontSize="small" />
            </IconButton>
            <Typography variant="h6" className="calendar-title">
              {currentMonth.toLocaleDateString('vi-VN', {
                month: 'long',
                year: 'numeric'
              })}
            </Typography>
            <IconButton onClick={() => handleMonthChange(1)} size="small">
              <ArrowForwardIos fontSize="small" />
            </IconButton>
          </div>

          <div className="calendar-grid-wrapper">
            <div className="calendar-weekdays">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="calendar-weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarCells.map((cell) => (
                <button
                  key={cell.key}
                  type="button"
                  className={`calendar-cell ${cell.isCurrentMonth ? '' : 'calendar-cell--faded'} ${cell.events.length ? 'calendar-cell--has-events' : ''} ${cell.isToday ? 'calendar-cell--today' : ''}`}
                  onClick={() => handleDayClick(cell)}
                >
                  <span className="calendar-day-number">{cell.label}</span>
                  <div className="calendar-events-preview">
                    {cell.events.slice(0, 3).map((event) => (
                      <span
                        key={event.eventId}
                        className="calendar-event-badge"
                        title={event.title}
                      >
                        {event.title}
                      </span>
                    ))}
                    {cell.events.length > 3 && (
                      <span className="calendar-more-events">+{cell.events.length - 3} sự kiện</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={calendarDialog.open} onClose={closeCalendarDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{calendarDialog.dateLabel}</DialogTitle>
        <DialogContent dividers>
          {calendarDialog.events.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              Không có sự kiện nào trong ngày này.
            </Typography>
          ) : (
            calendarDialog.events.map((event) => (
              <Box key={event.eventId} className="calendar-dialog-event">
                <Typography variant="subtitle1" fontWeight={600}>
                  {event.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatDate(event.startTime)} - {event.location || 'Địa điểm chưa cập nhật'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Trạng thái: {event.status}
                </Typography>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCalendarDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default EventCalendar;

