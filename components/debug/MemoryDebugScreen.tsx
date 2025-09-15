import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useMemoryProfiler, MemoryLeak } from '../../utils/memoryProfiler';
import { performanceMonitor } from '../../utils/performance';

interface MemoryDebugScreenProps {
  onClose?: () => void;
}

export const MemoryDebugScreen: React.FC<MemoryDebugScreenProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const { stats, detectLeaks, generateReport, forceGC, takeSnapshot, clearSnapshots } = useMemoryProfiler();
  const [leaks, setLeaks] = useState<MemoryLeak[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      const detectedLeaks = detectLeaks();
      setLeaks(detectedLeaks);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, detectLeaks]);

  const handleForceGC = () => {
    forceGC();
    Alert.alert('GC Triggered', 'Garbage collection has been forced (if available)');
  };

  const handleGenerateReport = () => {
    const report = generateReport();
    console.log('Memory Report:', report);
    Alert.alert('Report Generated', 'Check console for detailed memory report');
  };

  const handleTakeSnapshot = () => {
    takeSnapshot();
    Alert.alert('Snapshot Taken', 'Memory snapshot captured');
  };

  const handleClearSnapshots = () => {
    clearSnapshots();
    Alert.alert('Snapshots Cleared', 'All memory snapshots have been cleared');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f97316';
      case 'low': return '#eab308';
      default: return theme.colors.text;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 8,
    },
    closeText: {
      color: theme.colors.primary,
      fontSize: 16,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    statsContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    statLabel: {
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    statValue: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    buttonRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
    },
    buttonSecondary: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
    },
    buttonText: {
      color: theme.colors.white,
      fontSize: 12,
      fontWeight: '500',
    },
    buttonTextSecondary: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '500',
    },
    leakItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    leakHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    leakType: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    leakSeverity: {
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    leakDescription: {
      color: theme.colors.text,
      fontSize: 14,
      marginBottom: 4,
    },
    leakRecommendation: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontStyle: 'italic',
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    toggleLabel: {
      color: theme.colors.text,
      fontSize: 14,
      marginRight: 8,
    },
    toggle: {
      width: 50,
      height: 30,
      borderRadius: 15,
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    toggleActive: {
      backgroundColor: theme.colors.primary,
    },
    toggleInactive: {
      backgroundColor: theme.colors.border,
    },
    toggleThumb: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.colors.white,
    },
    performanceSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 16,
    },
    performanceTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    metricRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    metricLabel: {
      color: theme.colors.textSecondary,
      fontSize: 12,
    },
    metricValue: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '500',
    },
  });

  const performanceMetrics = performanceMonitor.getMetrics();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Memory Debug</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Memory Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Memory Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Heap Used</Text>
              <Text style={styles.statValue}>{formatBytes(stats.heap.used)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Heap Total</Text>
              <Text style={styles.statValue}>{formatBytes(stats.heap.total)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Heap Limit</Text>
              <Text style={styles.statValue}>{formatBytes(stats.heap.limit)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Components</Text>
              <Text style={styles.statValue}>{stats.components}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Stores</Text>
              <Text style={styles.statValue}>{stats.stores}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Images</Text>
              <Text style={styles.statValue}>{stats.images}</Text>
            </View>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Controls</Text>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Auto Refresh</Text>
            <TouchableOpacity
              style={[styles.toggle, autoRefresh ? styles.toggleActive : styles.toggleInactive]}
              onPress={() => setAutoRefresh(!autoRefresh)}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { alignSelf: autoRefresh ? 'flex-end' : 'flex-start' }
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleTakeSnapshot}>
              <Text style={styles.buttonText}>Take Snapshot</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={handleForceGC}>
              <Text style={styles.buttonTextSecondary}>Force GC</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={handleGenerateReport}>
              <Text style={styles.buttonTextSecondary}>Generate Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={handleClearSnapshots}>
              <Text style={styles.buttonTextSecondary}>Clear Snapshots</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Memory Leaks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Memory Leaks ({leaks.length})</Text>
          {leaks.length === 0 ? (
            <View style={styles.statsContainer}>
              <Text style={styles.statLabel}>No memory leaks detected</Text>
            </View>
          ) : (
            leaks.map((leak, index) => (
              <View key={index} style={styles.leakItem}>
                <View style={styles.leakHeader}>
                  <Text style={[styles.leakType, { color: theme.colors.text }]}>
                    {leak.type}
                  </Text>
                  <View style={[styles.leakSeverity, { backgroundColor: getSeverityColor(leak.severity) }]}>
                    <Text style={[styles.buttonText, { fontSize: 10 }]}>{leak.severity}</Text>
                  </View>
                </View>
                <Text style={styles.leakDescription}>{leak.description}</Text>
                <Text style={styles.leakRecommendation}>{leak.recommendation}</Text>
              </View>
            ))
          )}
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.performanceSection}>
            <Text style={styles.performanceTitle}>Recent Operations</Text>
            {Object.entries(performanceMetrics).map(([key, value]) => (
              <View key={key} style={styles.metricRow}>
                <Text style={styles.metricLabel}>{key}</Text>
                <Text style={styles.metricValue}>{value.toFixed(2)}ms</Text>
              </View>
            ))}
            {Object.keys(performanceMetrics).length === 0 && (
              <Text style={styles.metricLabel}>No performance metrics available</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Memory debug hook for easy integration
export const useMemoryDebug = () => {
  const [showDebug, setShowDebug] = useState(false);

  // Show debug screen on triple tap (development only)
  useEffect(() => {
    if (!__DEV__) return;

    let tapCount = 0;
    let timeout: NodeJS.Timeout;

    const handleTripleTap = () => {
      tapCount++;
      clearTimeout(timeout);

      if (tapCount === 3) {
        setShowDebug(true);
        tapCount = 0;
      } else {
        timeout = setTimeout(() => {
          tapCount = 0;
        }, 500);
      }
    };

    // In a real implementation, you'd attach this to a specific debug trigger
    global.triggerMemoryDebug = handleTripleTap;

    return () => {
      clearTimeout(timeout);
      delete global.triggerMemoryDebug;
    };
  }, []);

  return {
    showDebug,
    openDebug: () => setShowDebug(true),
    closeDebug: () => setShowDebug(false),
  };
};