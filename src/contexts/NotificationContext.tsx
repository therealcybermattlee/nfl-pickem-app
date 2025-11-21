import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NotificationContainer, NotificationData, NotificationType } from '../components/Notification';

interface NotificationContextType {
  notifications: NotificationData[];
  showNotification: (
    type: NotificationType,
    title: string,
    message?: string,
    options?: Partial<NotificationData>
  ) => string;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  // Convenience methods
  success: (title: string, message?: string, options?: Partial<NotificationData>) => string;
  error: (title: string, message?: string, options?: Partial<NotificationData>) => string;
  warning: (title: string, message?: string, options?: Partial<NotificationData>) => string;
  info: (title: string, message?: string, options?: Partial<NotificationData>) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5,
  position = 'top-right',
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message?: string,
      options?: Partial<NotificationData>
    ): string => {
      const id = options?.id || `notification-${Date.now()}-${Math.random()}`;

      const notification: NotificationData = {
        id,
        type,
        title,
        message,
        duration: options?.duration ?? 5000,
        action: options?.action,
      };

      setNotifications((prev) => {
        // Remove oldest notification if we exceed max
        const updated = prev.length >= maxNotifications ? prev.slice(1) : prev;
        return [...updated, notification];
      });

      return id;
    },
    [maxNotifications]
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (title: string, message?: string, options?: Partial<NotificationData>) =>
      showNotification('success', title, message, options),
    [showNotification]
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<NotificationData>) =>
      showNotification('error', title, message, options),
    [showNotification]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<NotificationData>) =>
      showNotification('warning', title, message, options),
    [showNotification]
  );

  const info = useCallback(
    (title: string, message?: string, options?: Partial<NotificationData>) =>
      showNotification('info', title, message, options),
    [showNotification]
  );

  const value: NotificationContextType = {
    notifications,
    showNotification,
    dismissNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
        position={position}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
