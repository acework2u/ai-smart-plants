import React, { createContext, useContext, useState, useCallback } from 'react';
import { View } from 'react-native';
import { ToastManager, ToastConfig, ToastType } from '../atoms/Toast';

interface ToastContextValue {
  showToast: (toast: Omit<ToastConfig, 'id'>) => string;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
  showSuccess: (title: string, message?: string, duration?: number) => string;
  showError: (title: string, message?: string, duration?: number) => string;
  showWarning: (title: string, message?: string, duration?: number) => string;
  showInfo: (title: string, message?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 3,
}) => {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);

  const showToast = useCallback((toast: Omit<ToastConfig, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastConfig = { ...toast, id };

    setToasts(prevToasts => {
      const updatedToasts = [newToast, ...prevToasts];
      // Keep only the latest maxToasts
      return updatedToasts.slice(0, maxToasts);
    });

    return id;
  }, [maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const showSuccess = useCallback((
    title: string,
    message?: string,
    duration?: number
  ) => {
    return showToast({
      type: 'success',
      title,
      message,
      duration,
    });
  }, [showToast]);

  const showError = useCallback((
    title: string,
    message?: string,
    duration?: number
  ) => {
    return showToast({
      type: 'error',
      title,
      message,
      duration,
    });
  }, [showToast]);

  const showWarning = useCallback((
    title: string,
    message?: string,
    duration?: number
  ) => {
    return showToast({
      type: 'warning',
      title,
      message,
      duration,
    });
  }, [showToast]);

  const showInfo = useCallback((
    title: string,
    message?: string,
    duration?: number
  ) => {
    return showToast({
      type: 'info',
      title,
      message,
      duration,
    });
  }, [showToast]);

  const value: ToastContextValue = {
    showToast,
    hideToast,
    hideAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, pointerEvents: 'box-none' }}>
        <ToastManager toasts={toasts} onRemove={hideToast} />
      </View>
    </ToastContext.Provider>
  );
};

export default ToastProvider;