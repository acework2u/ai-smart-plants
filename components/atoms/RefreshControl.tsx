import React from 'react';
import { RefreshControl as RNRefreshControl, RefreshControlProps } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useHaptic } from '../../core/haptics';

interface CustomRefreshControlProps extends Omit<RefreshControlProps, 'colors' | 'tintColor'> {
  onRefresh: () => void | Promise<void>;
  refreshing: boolean;
}

export const RefreshControl: React.FC<CustomRefreshControlProps> = ({
  onRefresh,
  refreshing,
  ...props
}) => {
  const { theme } = useTheme();
  const haptic = useHaptic();

  const handleRefresh = async () => {
    await haptic.pullToRefresh();
    onRefresh();
  };

  return (
    <RNRefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      colors={[theme.colors.primary]} // Android
      tintColor={theme.colors.primary} // iOS
      progressBackgroundColor={theme.colors.surface} // Android
      titleColor={theme.colors.textSecondary} // iOS
      title="ดึงเพื่อรีเฟรช" // iOS
      progressViewOffset={0}
      {...props}
    />
  );
};

// Hook for managing refresh state
export const useRefresh = (refreshFunction: () => Promise<void>) => {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshFunction();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshFunction]);

  return { refreshing, onRefresh };
};