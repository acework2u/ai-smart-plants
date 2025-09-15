import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme, VictoryTooltip, VictoryScatter } from 'victory-native';
import { AnalyticsDataPoint } from '../../utils/dataProcessing';
import { THEME } from '../../types';

interface LineChartProps {
  data: AnalyticsDataPoint[];
  title?: string;
  color?: string;
  height?: number;
  showDots?: boolean;
  showTooltips?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  animate?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 32; // Account for padding

const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  color = THEME.colors.primary,
  height = 200,
  showDots = true,
  showTooltips = true,
  xAxisLabel,
  yAxisLabel,
  animate = true
}) => {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      </View>
    );
  }

  // Format data for Victory charts
  const chartData = data.map(point => ({
    x: point.x,
    y: point.y,
    label: point.label || `${point.y}`
  }));

  return (
    <View style={[styles.container, { height: height + (title ? 40 : 0) }]}>
      {title && <Text style={styles.title}>{title}</Text>}
      <VictoryChart
        theme={VictoryTheme.material}
        width={chartWidth}
        height={height}
        padding={{ left: 60, top: 20, right: 40, bottom: 60 }}
        animate={animate ? { duration: 1000 } : false}
      >
        <VictoryAxis
          dependentAxis
          tickFormat={(t) => `${t}`}
          style={{
            grid: { stroke: THEME.colors.gray[200], strokeWidth: 1 },
            tickLabels: { fontSize: 12, fill: THEME.colors.gray[600] },
            axis: { stroke: THEME.colors.gray[300] }
          }}
        />
        <VictoryAxis
          tickFormat={(t) => {
            if (t instanceof Date) {
              return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            return String(t);
          }}
          style={{
            grid: { stroke: THEME.colors.gray[200], strokeWidth: 1 },
            tickLabels: { fontSize: 12, fill: THEME.colors.gray[600], angle: -45 },
            axis: { stroke: THEME.colors.gray[300] }
          }}
        />

        <VictoryLine
          data={chartData}
          style={{
            data: {
              stroke: color,
              strokeWidth: 3,
              strokeLinecap: 'round',
              strokeLinejoin: 'round'
            }
          }}
          interpolation="cardinal"
        />

        {showDots && (
          <VictoryScatter
            data={chartData}
            size={4}
            style={{
              data: { fill: color, stroke: '#ffffff', strokeWidth: 2 }
            }}
            labelComponent={
              showTooltips ? (
                <VictoryTooltip
                  style={{
                    fill: THEME.colors.gray[800],
                    fontSize: 12
                  }}
                  flyoutStyle={{
                    stroke: color,
                    strokeWidth: 1,
                    fill: '#ffffff'
                  }}
                />
              ) : undefined
            }
          />
        )}
      </VictoryChart>

      {(xAxisLabel || yAxisLabel) && (
        <View style={styles.axisLabels}>
          {yAxisLabel && (
            <Text style={[styles.axisLabel, styles.yAxisLabel]}>{yAxisLabel}</Text>
          )}
          {xAxisLabel && (
            <Text style={[styles.axisLabel, styles.xAxisLabel]}>{xAxisLabel}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: THEME.typography.fontSize.lg,
    fontWeight: THEME.typography.fontWeight.semibold as any,
    color: THEME.colors.gray[800],
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: THEME.typography.fontSize.base,
    color: THEME.colors.gray[500],
    textAlign: 'center',
  },
  axisLabels: {
    position: 'relative',
  },
  axisLabel: {
    fontSize: THEME.typography.fontSize.sm,
    color: THEME.colors.gray[600],
    textAlign: 'center',
  },
  yAxisLabel: {
    position: 'absolute',
    left: -45,
    top: -100,
    transform: [{ rotate: '-90deg' }],
  },
  xAxisLabel: {
    marginTop: THEME.spacing.sm,
  },
});

export default LineChart;