import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
} from 'react-native-chart-kit';
import {
  Calendar,
  TrendingUp,
  Download,
  Filter,
  Activity,
  Droplet,
  Leaf,
} from 'lucide-react-native';

import { AppHeader, Section, Button, Chip } from '../components';
import { colors, typography, spacing } from '../core/theme';
import { useHaptic } from '../core/haptics';
import { useGardenStore } from '../stores/garden';
import { useActivityStore } from '../stores/activity';
import { useAnalyticsStore } from '../stores/analytics';

const { width: screenWidth } = Dimensions.get('window');
const chartConfig = {
  backgroundColor: colors.white,
  backgroundGradientFrom: colors.white,
  backgroundGradientTo: colors.white,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: colors.primary,
  },
};

type TimeRange = 'week' | 'month' | 'year';
type AnalyticsTab = 'overview' | 'health' | 'activities' | 'trends';

export default function AnalyticsScreen() {
  const haptic = useHaptic();
  const { plants } = useGardenStore();
  const { getActivitiesByPlant } = useActivityStore();
  const {
    getHealthTrends,
    getActivityStats,
    getWateringFrequency,
    getFertilizerUsage,
    getCareConsistency,
    getPlantSuccessRate,
  } = useAnalyticsStore();

  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);

  const selectedPlant = selectedPlantId ? plants.find(p => p.id === selectedPlantId) : null;

  const handleTimeRangeChange = async (range: TimeRange) => {
    await haptic.selection();
    setTimeRange(range);
  };

  const handleTabChange = async (tab: AnalyticsTab) => {
    await haptic.selection();
    setActiveTab(tab);
  };

  const handleExportData = async () => {
    await haptic.buttonPress();
    // TODO: Implement export functionality
    router.push('/export');
  };

  // Generate mock data for charts
  const generateHealthTrendData = () => {
    const labels = timeRange === 'week'
      ? ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']
      : timeRange === 'month'
      ? ['สัปดาห์ 1', 'สัปดาห์ 2', 'สัปดาห์ 3', 'สัปดาห์ 4']
      : ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'];

    return {
      labels,
      datasets: [{
        data: selectedPlant
          ? [85, 88, 92, 89, 94, 91, 95]
          : [82, 85, 88, 86, 90, 89, 92],
        color: (opacity = 1) => `rgba(22, 163, 74, ${opacity})`,
        strokeWidth: 3,
      }],
    };
  };

  const generateActivityData = () => {
    return {
      labels: ['รดน้ำ', 'ใส่ปุ๋ย', 'ตรวจใบ', 'พ่นยา'],
      datasets: [{
        data: selectedPlant
          ? [28, 8, 12, 3]
          : [156, 45, 67, 23],
      }],
    };
  };

  const generateWateringFrequencyData = () => {
    const days = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
    return {
      labels: days,
      datasets: [{
        data: [3, 2, 4, 3, 5, 2, 4],
      }],
    };
  };

  const generateCareConsistencyData = () => {
    return {
      data: [
        {
          name: 'รดน้ำ',
          population: 0.95,
          color: colors.primary,
          legendFontColor: colors.gray700,
          legendFontSize: 12,
        },
        {
          name: 'ใส่ปุ๋ย',
          population: 0.78,
          color: '#f59e0b',
          legendFontColor: colors.gray700,
          legendFontSize: 12,
        },
        {
          name: 'ตรวจใบ',
          population: 0.85,
          color: '#8b5cf6',
          legendFontColor: colors.gray700,
          legendFontSize: 12,
        },
      ],
    };
  };

  const renderOverviewTab = () => (
    <View>
      {/* Summary Cards */}
      <Section title="สรุปภาพรวม" icon={<Activity size={20} color={colors.primary} />}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {selectedPlant ? '1' : plants.length}
            </Text>
            <Text style={styles.summaryLabel}>ต้นไม้</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {selectedPlant ? '41' : '291'}
            </Text>
            <Text style={styles.summaryLabel}>กิจกรรม</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>92%</Text>
            <Text style={styles.summaryLabel}>สุขภาพเฉลี่ย</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>87%</Text>
            <Text style={styles.summaryLabel}>ความสม่ำเสมอ</Text>
          </View>
        </View>
      </Section>

      {/* Health Trend Chart */}
      <Section
        title="แนวโน้มสุขภาพ"
        icon={<TrendingUp size={20} color={colors.primary} />}
      >
        <LineChart
          data={generateHealthTrendData()}
          width={screenWidth - spacing(8)}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </Section>

      {/* Activity Distribution */}
      <Section
        title="การกระจายกิจกรรม"
        icon={<Leaf size={20} color={colors.primary} />}
      >
        <BarChart
          data={generateActivityData()}
          width={screenWidth - spacing(8)}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      </Section>
    </View>
  );

  const renderHealthTab = () => (
    <View>
      <Section title="สุขภาพต้นไม้" icon={<Activity size={20} color={colors.primary} />}>
        <LineChart
          data={generateHealthTrendData()}
          width={screenWidth - spacing(8)}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />

        <View style={styles.healthInsights}>
          <Text style={styles.insightTitle}>ข้อมูลเชิงลึก</Text>
          <Text style={styles.insightText}>
            • สุขภาพต้นไม้ดีขึ้น 8% ในเดือนที่ผ่านมา
          </Text>
          <Text style={styles.insightText}>
            • ต้นไม้ที่ได้รับการดูแลสม่ำเสมอมีสุขภาพดีกว่า 15%
          </Text>
          <Text style={styles.insightText}>
            • ช่วงฤดูฝนต้องระวังโรคเชื้อรามากขึ้น
          </Text>
        </View>
      </Section>
    </View>
  );

  const renderActivitiesTab = () => (
    <View>
      {/* Watering Frequency */}
      <Section
        title="ความถี่การรดน้ำ"
        icon={<Droplet size={20} color={colors.primary} />}
      >
        <BarChart
          data={generateWateringFrequencyData()}
          width={screenWidth - spacing(8)}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
        />
      </Section>

      {/* Care Consistency */}
      <Section
        title="ความสม่ำเสมอในการดูแล"
        icon={<Calendar size={20} color={colors.primary} />}
      >
        <ProgressChart
          data={generateCareConsistencyData()}
          width={screenWidth - spacing(8)}
          height={220}
          strokeWidth={16}
          radius={32}
          chartConfig={chartConfig}
          hideLegend={false}
          style={styles.chart}
        />
      </Section>

      {/* Activity Statistics */}
      <Section title="สถิติกิจกรรม">
        <View style={styles.statsList}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>การรดน้ำเฉลี่ย:</Text>
            <Text style={styles.statValue}>3.2 ครั้ง/สัปดาห์</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>การใส่ปุ๋ย:</Text>
            <Text style={styles.statValue}>1.1 ครั้ง/สัปดาห์</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>การตรวจสุขภาพ:</Text>
            <Text style={styles.statValue}>1.9 ครั้ง/สัปดาห์</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>ปริมาณน้ำเฉลี่ย:</Text>
            <Text style={styles.statValue}>245 ml/ครั้ง</Text>
          </View>
        </View>
      </Section>
    </View>
  );

  const renderTrendsTab = () => (
    <View>
      <Section title="แนวโน้มและพยากรณ์" icon={<TrendingUp size={20} color={colors.primary} />}>
        <View style={styles.trendsList}>
          <View style={styles.trendItem}>
            <View style={styles.trendIcon}>
              <Text style={styles.trendEmoji}>📈</Text>
            </View>
            <View style={styles.trendContent}>
              <Text style={styles.trendTitle}>สุขภาพดีขึ้นต่อเนื่อง</Text>
              <Text style={styles.trendDescription}>
                สุขภาพต้นไม้เพิ่มขึ้น 12% ในช่วง 3 เดือนที่ผ่านมา
              </Text>
            </View>
          </View>

          <View style={styles.trendItem}>
            <View style={styles.trendIcon}>
              <Text style={styles.trendEmoji}>💧</Text>
            </View>
            <View style={styles.trendContent}>
              <Text style={styles.trendTitle}>การรดน้ำมีประสิทธิภาพ</Text>
              <Text style={styles.trendDescription}>
                ลดปริมาณน้ำลง 18% แต่ต้นไม้ยังคงมีสุขภาพดี
              </Text>
            </View>
          </View>

          <View style={styles.trendItem}>
            <View style={styles.trendIcon}>
              <Text style={styles.trendEmoji}>⚠️</Text>
            </View>
            <View style={styles.trendContent}>
              <Text style={styles.trendTitle}>คำเตือนฤดูฝน</Text>
              <Text style={styles.trendDescription}>
                ควรลดการรดน้ำ 30% ในช่วงฤดูฝนที่จะมาถึง
              </Text>
            </View>
          </View>

          <View style={styles.trendItem}>
            <View style={styles.trendIcon}>
              <Text style={styles.trendEmoji}>🏆</Text>
            </View>
            <View style={styles.trendContent}>
              <Text style={styles.trendTitle}>เป้าหมายความสม่ำเสมอ</Text>
              <Text style={styles.trendDescription}>
                อีก 3% คุณจะได้รับ Badge "ผู้ดูแลมืออาชีพ"
              </Text>
            </View>
          </View>
        </View>
      </Section>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="วิเคราะห์และสถิติ"
        back
        onBack={() => router.back()}
        right={
          <TouchableOpacity onPress={handleExportData}>
            <Download size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {/* Filter Controls */}
      <View style={styles.controls}>
        {/* Plant Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.plantFilter}
        >
          <Chip
            label="ทั้งหมด"
            active={selectedPlantId === null}
            onPress={() => setSelectedPlantId(null)}
            style={styles.filterChip}
          />
          {plants.map((plant) => (
            <Chip
              key={plant.id}
              label={plant.name}
              active={selectedPlantId === plant.id}
              onPress={() => setSelectedPlantId(plant.id)}
              style={styles.filterChip}
            />
          ))}
        </ScrollView>

        {/* Time Range Filter */}
        <View style={styles.timeRangeFilter}>
          {(['week', 'month', 'year'] as TimeRange[]).map((range) => (
            <Chip
              key={range}
              label={range === 'week' ? 'สัปดาห์' : range === 'month' ? 'เดือน' : 'ปี'}
              active={timeRange === range}
              onPress={() => handleTimeRangeChange(range)}
              style={styles.timeChip}
            />
          ))}
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: 'ภาพรวม', icon: '📊' },
            { key: 'health', label: 'สุขภาพ', icon: '🌱' },
            { key: 'activities', label: 'กิจกรรม', icon: '📅' },
            { key: 'trends', label: 'แนวโน้ม', icon: '📈' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => handleTabChange(tab.key as AnalyticsTab)}
            >
              <Text style={styles.tabEmoji}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'health' && renderHealthTab()}
        {activeTab === 'activities' && renderActivitiesTab()}
        {activeTab === 'trends' && renderTrendsTab()}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  controls: {
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  plantFilter: {
    marginBottom: spacing(3),
  },
  filterChip: {
    marginRight: spacing(2),
  },
  timeRangeFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeChip: {
    flex: 1,
    marginHorizontal: spacing(1),
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  tab: {
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    alignItems: 'center',
    minWidth: 80,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabEmoji: {
    fontSize: 20,
    marginBottom: spacing(1),
  },
  tabLabel: {
    fontSize: 12,
    color: colors.gray600,
    fontFamily: typography.fontFamily,
    fontWeight: '500' as any,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '600' as any,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing(4),
  },
  chart: {
    marginVertical: spacing(2),
    borderRadius: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    padding: spacing(4),
    alignItems: 'center',
    marginBottom: spacing(3),
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: 'bold' as any,
    color: colors.primary,
    fontFamily: typography.fontFamily,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.gray700,
    fontFamily: typography.fontFamily,
    marginTop: spacing(1),
  },
  healthInsights: {
    marginTop: spacing(4),
    padding: spacing(4),
    backgroundColor: colors.gray50,
    borderRadius: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: colors.gray900,
    fontFamily: typography.fontFamily,
    marginBottom: spacing(2),
  },
  insightText: {
    fontSize: 14,
    color: colors.gray700,
    fontFamily: typography.fontFamily,
    lineHeight: 20,
    marginBottom: spacing(1),
  },
  statsList: {
    marginTop: spacing(2),
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  statLabel: {
    fontSize: 14,
    color: colors.gray700,
    fontFamily: typography.fontFamily,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600' as any,
    color: colors.gray900,
    fontFamily: typography.fontFamily,
  },
  trendsList: {
    marginTop: spacing(2),
  },
  trendItem: {
    flexDirection: 'row',
    padding: spacing(4),
    backgroundColor: colors.gray50,
    borderRadius: 12,
    marginBottom: spacing(3),
  },
  trendIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing(3),
  },
  trendEmoji: {
    fontSize: 24,
  },
  trendContent: {
    flex: 1,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600' as any,
    color: colors.gray900,
    fontFamily: typography.fontFamily,
    marginBottom: spacing(1),
  },
  trendDescription: {
    fontSize: 14,
    color: colors.gray600,
    fontFamily: typography.fontFamily,
    lineHeight: 20,
  },
  spacer: {
    height: spacing(6),
  },
});