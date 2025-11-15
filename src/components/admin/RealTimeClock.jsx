import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { formatVietnamDateTime } from '../../utils/dateTimeUtils';
import './RealTimeClock.css';

const RealTimeClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { isDark } = useTheme();

  useEffect(() => {
    // Cập nhật thời gian mỗi giây
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Cleanup interval khi component unmount
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`real-time-clock ${isDark ? 'dark' : 'light'}`}>
      <div className="clock-text">{formatVietnamDateTime(currentTime)}</div>
    </div>
  );
};

export default RealTimeClock;

