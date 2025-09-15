import React from 'react';
import { View, ViewStyle } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <SkeletonPlaceholder
      LinearGradientComponent={LinearGradient}
      backgroundColor={theme.isDark ? '#374151' : '#f3f4f6'}
      highlightColor={theme.isDark ? '#4b5563' : '#ffffff'}
      speed={1200}
    >
      <View
        style={[
          {
            width,
            height,
            borderRadius,
          },
          style,
        ]}
      />
    </SkeletonPlaceholder>
  );
};

// Plant Card Skeleton
export const PlantCardSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: theme.spacing(4),
        marginBottom: theme.spacing(3),
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.isDark ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <SkeletonPlaceholder
        LinearGradientComponent={LinearGradient}
        backgroundColor={theme.isDark ? '#374151' : '#f3f4f6'}
        highlightColor={theme.isDark ? '#4b5563' : '#ffffff'}
        speed={1200}
      >
        <View style={{ flexDirection: 'row' }}>
          {/* Plant Image */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 12,
            }}
          />

          {/* Plant Info */}
          <View style={{ flex: 1, marginLeft: theme.spacing(3) }}>
            {/* Plant Name */}
            <View
              style={{
                width: '70%',
                height: 18,
                borderRadius: 4,
                marginBottom: theme.spacing(2),
              }}
            />

            {/* Scientific Name */}
            <View
              style={{
                width: '85%',
                height: 14,
                borderRadius: 4,
                marginBottom: theme.spacing(2),
              }}
            />

            {/* Status Chip */}
            <View
              style={{
                width: 60,
                height: 24,
                borderRadius: 12,
              }}
            />
          </View>
        </View>

        {/* Health Score Bar */}
        <View
          style={{
            marginTop: theme.spacing(3),
            height: 8,
            borderRadius: 4,
          }}
        />
      </SkeletonPlaceholder>
    </View>
  );
};

// Activity Row Skeleton
export const ActivityRowSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing(3),
        paddingHorizontal: theme.spacing(4),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
      }}
    >
      <SkeletonPlaceholder
        LinearGradientComponent={LinearGradient}
        backgroundColor={theme.isDark ? '#374151' : '#f3f4f6'}
        highlightColor={theme.isDark ? '#4b5563' : '#ffffff'}
        speed={1200}
      >
        {/* Activity Icon */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: theme.spacing(3),
          }}
        />

        {/* Activity Info */}
        <View style={{ flex: 1 }}>
          {/* Activity Type */}
          <View
            style={{
              width: '60%',
              height: 16,
              borderRadius: 4,
              marginBottom: theme.spacing(1),
            }}
          />

          {/* Activity Details */}
          <View
            style={{
              width: '80%',
              height: 12,
              borderRadius: 4,
            }}
          />
        </View>

        {/* Time */}
        <View
          style={{
            width: 50,
            height: 12,
            borderRadius: 4,
          }}
        />
      </SkeletonPlaceholder>
    </View>
  );
};

// Notification Item Skeleton
export const NotificationSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        padding: theme.spacing(4),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
      }}
    >
      <SkeletonPlaceholder
        LinearGradientComponent={LinearGradient}
        backgroundColor={theme.isDark ? '#374151' : '#f3f4f6'}
        highlightColor={theme.isDark ? '#4b5563' : '#ffffff'}
        speed={1200}
      >
        {/* Notification Icon */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            marginRight: theme.spacing(3),
          }}
        />

        {/* Notification Content */}
        <View style={{ flex: 1 }}>
          {/* Title */}
          <View
            style={{
              width: '70%',
              height: 16,
              borderRadius: 4,
              marginBottom: theme.spacing(1),
            }}
          />

          {/* Description */}
          <View
            style={{
              width: '90%',
              height: 12,
              borderRadius: 4,
              marginBottom: theme.spacing(1),
            }}
          />

          {/* Time */}
          <View
            style={{
              width: '30%',
              height: 10,
              borderRadius: 4,
            }}
          />
        </View>
      </SkeletonPlaceholder>
    </View>
  );
};

// Garden Grid Skeleton
export const GardenGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  const { theme } = useTheme();

  return (
    <View style={{ padding: theme.spacing(4) }}>
      {Array.from({ length: count }).map((_, index) => (
        <PlantCardSkeleton key={index} />
      ))}
    </View>
  );
};

// Activity List Skeleton
export const ActivityListSkeleton: React.FC = () => {
  return (
    <View>
      {Array.from({ length: 8 }).map((_, index) => (
        <ActivityRowSkeleton key={index} />
      ))}
    </View>
  );
};

// Notification List Skeleton
export const NotificationListSkeleton: React.FC = () => {
  return (
    <View>
      {Array.from({ length: 10 }).map((_, index) => (
        <NotificationSkeleton key={index} />
      ))}
    </View>
  );
};

// Analytics Chart Skeleton
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 220 }) => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        height,
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: theme.spacing(4),
        marginVertical: theme.spacing(2),
      }}
    >
      <SkeletonPlaceholder
        LinearGradientComponent={LinearGradient}
        backgroundColor={theme.isDark ? '#374151' : '#f3f4f6'}
        highlightColor={theme.isDark ? '#4b5563' : '#ffffff'}
        speed={1200}
      >
        {/* Chart Title */}
        <View
          style={{
            width: '50%',
            height: 16,
            borderRadius: 4,
            marginBottom: theme.spacing(4),
          }}
        />

        {/* Chart Area */}
        <View
          style={{
            flex: 1,
            borderRadius: 8,
          }}
        />
      </SkeletonPlaceholder>
    </View>
  );
};
