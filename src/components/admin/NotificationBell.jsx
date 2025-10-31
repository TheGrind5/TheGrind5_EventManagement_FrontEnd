import { useAuth } from '../../contexts/AuthContext';

const NotificationBell = () => {
  const { user } = useAuth();

  // Component này sẽ không hiển thị gì vì tính năng Report Event đã bị xóa
  if (user?.role !== 'Admin') {
    return null;
  }

  return null;
};

export default NotificationBell;

