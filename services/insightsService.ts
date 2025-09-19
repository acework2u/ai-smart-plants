import {
  ActivityEntry,
  ActivityKind,
  ActivityStats,
  Plant,
  PlantStatus,
} from '../types';
import {
  TimeRange,
  DateRange,
  ActivityFrequencyData,
  ActivityTimingPattern,
  CareEffectivenessData,
  OptimalCareSchedule,
  HealthTrendData,
  HealthDeclinePrediction,
  HealthFactorAnalysis,
  PlantHealthReport,
  SeasonalPattern,
  WeatherCorrelation,
  UserCareHabits,
  EngagementMetrics,
  ProductivityScore,
  PersonalizedTip,
  PlantPerformanceComparison,
  BenchmarkData,
  ImprovementArea,
  ChartDataPoint,
  LineChartData,
  BarChartData,
  PieChartData,
  HeatmapData,
  AnalyticsExport,
  AggregatedMetrics,
  InsightParameters,
  InsightResponse,
} from '../types/insights';
import { useGardenStore } from '../stores/garden';
import { useActivityStore } from '../stores/activity';
import { useWeatherStore } from '../stores/weatherStore';

/**
 * Comprehensive Analytics & Insights Service
 *
 * Provides advanced analytics and insights for plant care patterns,
 * health trends, user behavior, and comparative analysis.
 *
 * Features:
 * - Activity pattern analysis
 * - Plant health predictions
 * - Seasonal pattern detection
 * - User behavior analytics
 * - Comparative plant performance
 * - Data aggregation for charts
 * - Personalized recommendations
 */
class InsightsService {
  private gardenStore = useGardenStore.getState();
  private activityStore = useActivityStore.getState();
  private weatherStore = useWeatherStore.getState();

  // ============================================================================
  // ACTIVITY PATTERN ANALYSIS
  // ============================================================================

  /**
   * Analyze activity patterns for a specific plant or all plants
   */
  analyzeActivityPatterns(plantId?: string): InsightResponse<ActivityFrequencyData[]> {
    const startTime = Date.now();

    try {
      const plants = plantId
        ? this.gardenStore.plants.filter(p => p.id === plantId)
        : this.gardenStore.plants;

      if (plants.length === 0) {
        return {
          success: false,
          error: { code: 'NO_DATA', message: 'No plants found for analysis' },
          cached: false,
          computationTime: Date.now() - startTime,
        };
      }

      const frequencyData: ActivityFrequencyData[] = [];
      const activityKinds: ActivityKind[] = ['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ'];

      for (const kind of activityKinds) {
        const allActivities: ActivityEntry[] = [];

        // Collect activities from all relevant plants
        for (const plant of plants) {
          const plantActivities = this.activityStore.getActivities(plant.id);
          const kindActivities = plantActivities.filter(a => a.kind === kind);
          allActivities.push(...kindActivities);
        }

        if (allActivities.length === 0) continue;

        // Sort by date (newest first)
        allActivities.sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());

        // Calculate frequency metrics
        const now = new Date();
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const recentActivities = allActivities.filter(a => new Date(a.dateISO) >= oneMonthAgo);
        const previousActivities = allActivities.filter(a => {
          const date = new Date(a.dateISO);
          return date >= twoMonthsAgo && date < oneMonthAgo;
        });

        // Calculate average days between activities
        let averageDaysBetween = 0;
        if (allActivities.length > 1) {
          const dates = allActivities.map(a => new Date(a.dateISO)).sort();
          const totalDays = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
          averageDaysBetween = totalDays / (allActivities.length - 1);
        }

        // Calculate trend
        const recentFreq = recentActivities.length;
        const previousFreq = previousActivities.length;
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        let trendPercentage = 0;

        if (previousFreq > 0) {
          trendPercentage = ((recentFreq - previousFreq) / previousFreq) * 100;
          if (trendPercentage > 10) trend = 'increasing';
          else if (trendPercentage < -10) trend = 'decreasing';
        }

        frequencyData.push({
          activityKind: kind,
          frequency: recentActivities.length / 30, // per day
          averageDaysBetween,
          totalCount: allActivities.length,
          lastActivity: allActivities.length > 0 ? new Date(allActivities[0].dateISO) : undefined,
          trend,
          trendPercentage,
        });
      }

      return {
        success: true,
        data: frequencyData,
        metadata: {
          type: 'activity_patterns',
          plantId,
          confidence: 0.8,
          sampleSize: plants.length,
          lastComputed: new Date(),
          computationCost: 'medium',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to analyze activity patterns',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get activity trends over time
   */
  getActivityTrends(timeRange: TimeRange = 'month'): InsightResponse<LineChartData[]> {
    const startTime = Date.now();

    try {
      const now = new Date();
      let dateRange: DateRange;
      let granularity: 'day' | 'week' | 'month';

      // Determine date range and granularity
      switch (timeRange) {
        case 'week':
          dateRange = {
            start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            end: now,
          };
          granularity = 'day';
          break;
        case 'quarter':
          dateRange = {
            start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
            end: now,
          };
          granularity = 'week';
          break;
        case 'year':
          dateRange = {
            start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
            end: now,
          };
          granularity = 'month';
          break;
        default: // month
          dateRange = {
            start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            end: now,
          };
          granularity = 'day';
      }

      const chartData: LineChartData[] = [];
      const activityKinds: ActivityKind[] = ['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ'];

      for (const kind of activityKinds) {
        const data: ChartDataPoint[] = [];

        // Collect all activities of this kind
        const allActivities: ActivityEntry[] = [];
        for (const plant of this.gardenStore.plants) {
          const plantActivities = this.activityStore.getActivities(plant.id);
          allActivities.push(...plantActivities.filter(a => a.kind === kind));
        }

        // Filter by date range
        const relevantActivities = allActivities.filter(a => {
          const date = new Date(a.dateISO);
          return date >= dateRange.start && date <= dateRange.end;
        });

        // Group by time period
        const periodCounts = new Map<string, number>();

        for (const activity of relevantActivities) {
          const date = new Date(activity.dateISO);
          let periodKey: string;

          if (granularity === 'day') {
            periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          } else if (granularity === 'week') {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            periodKey = weekStart.toISOString().split('T')[0];
          } else { // month
            periodKey = date.toISOString().slice(0, 7); // YYYY-MM
          }

          periodCounts.set(periodKey, (periodCounts.get(periodKey) || 0) + 1);
        }

        // Generate data points
        const current = new Date(dateRange.start);
        while (current <= dateRange.end) {
          let periodKey: string;

          if (granularity === 'day') {
            periodKey = current.toISOString().split('T')[0];
            current.setDate(current.getDate() + 1);
          } else if (granularity === 'week') {
            periodKey = current.toISOString().split('T')[0];
            current.setDate(current.getDate() + 7);
          } else { // month
            periodKey = current.toISOString().slice(0, 7);
            current.setMonth(current.getMonth() + 1);
          }

          data.push({
            x: periodKey,
            y: periodCounts.get(periodKey) || 0,
            label: `${kind}: ${periodCounts.get(periodKey) || 0}`,
          });
        }

        // Calculate trend
        const values = data.map(d => d.y as number);
        const hasIncreasingTrend = values.length > 1 && values[values.length - 1] > values[0];

        chartData.push({
          data,
          title: `${kind} Trends`,
          titleThai: `แนวโน้ม${kind}`,
          xAxisLabel: granularity === 'day' ? 'Date' : granularity === 'week' ? 'Week' : 'Month',
          yAxisLabel: 'Activity Count',
          xAxisLabelThai: granularity === 'day' ? 'วันที่' : granularity === 'week' ? 'สัปดาห์' : 'เดือน',
          yAxisLabelThai: 'จำนวนกิจกรรม',
          trend: hasIncreasingTrend ? 'up' : 'down',
          trendColor: hasIncreasingTrend ? '#10b981' : '#ef4444',
        });
      }

      return {
        success: true,
        data: chartData,
        metadata: {
          type: 'activity_trends',
          timeRange,
          confidence: 0.9,
          sampleSize: this.gardenStore.plants.length,
          lastComputed: new Date(),
          computationCost: 'medium',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get activity trends',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Analyze care effectiveness by correlating activities with plant health
   */
  getCareEffectiveness(): InsightResponse<CareEffectivenessData[]> {
    const startTime = Date.now();

    try {
      const effectiveness: CareEffectivenessData[] = [];
      const activityKinds: ActivityKind[] = ['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ'];

      for (const kind of activityKinds) {
        const correlationData: { before: number; after: number }[] = [];

        for (const plant of this.gardenStore.plants) {
          const activities = this.activityStore.getActivities(plant.id)
            .filter(a => a.kind === kind)
            .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());

          for (const activity of activities) {
            const activityDate = new Date(activity.dateISO);

            // Mock health score calculation (in real app, this would come from health tracking)
            const beforeScore = this.calculateMockHealthScore(plant, activityDate, -1);
            const afterScore = this.calculateMockHealthScore(plant, activityDate, 7);

            if (beforeScore && afterScore) {
              correlationData.push({ before: beforeScore, after: afterScore });
            }
          }
        }

        if (correlationData.length > 0) {
          const avgBefore = correlationData.reduce((sum, d) => sum + d.before, 0) / correlationData.length;
          const avgAfter = correlationData.reduce((sum, d) => sum + d.after, 0) / correlationData.length;
          const improvement = avgAfter - avgBefore;

          // Calculate correlation coefficient (simplified)
          const correlation = this.calculateCorrelation(
            correlationData.map(d => d.before),
            correlationData.map(d => d.after)
          );

          effectiveness.push({
            activityKind: kind,
            beforeHealthScore: avgBefore,
            afterHealthScore: avgAfter,
            improvement,
            correlationStrength: correlation,
            sampleSize: correlationData.length,
            confidence: Math.min(0.9, correlationData.length / 10), // Higher confidence with more data
          });
        }
      }

      return {
        success: true,
        data: effectiveness,
        metadata: {
          type: 'care_effectiveness',
          confidence: 0.7,
          sampleSize: this.gardenStore.plants.length,
          lastComputed: new Date(),
          computationCost: 'high',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to analyze care effectiveness',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate optimal care schedule for a plant
   */
  getOptimalCareSchedule(plantId: string): InsightResponse<OptimalCareSchedule> {
    const startTime = Date.now();

    try {
      const plant = this.gardenStore.plants.find(p => p.id === plantId);
      if (!plant) {
        return {
          success: false,
          error: { code: 'PLANT_NOT_FOUND', message: 'Plant not found' },
          cached: false,
          computationTime: Date.now() - startTime,
        };
      }

      const activities = this.activityStore.getActivities(plantId);
      const activityKinds: ActivityKind[] = ['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ'];

      const recommendations = activityKinds.map(kind => {
        const kindActivities = activities.filter(a => a.kind === kind);

        // Calculate optimal frequency based on historical data
        let recommendedFrequency: number;
        if (kindActivities.length > 1) {
          const dates = kindActivities.map(a => new Date(a.dateISO)).sort();
          const intervals = [];
          for (let i = 1; i < dates.length; i++) {
            const days = (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24);
            intervals.push(days);
          }
          recommendedFrequency = Math.round(intervals.reduce((sum, i) => sum + i, 0) / intervals.length);
        } else {
          // Default frequencies based on activity type
          const defaults: Record<ActivityKind, number> = {
            'รดน้ำ': 3,
            'ใส่ปุ๋ย': 14,
            'พ่นยา': 7,
            'ย้ายกระถาง': 365,
            'ตรวจใบ': 7,
          };
          recommendedFrequency = defaults[kind];
        }

        // Calculate best time of day based on historical patterns
        let bestTimeOfDay = 8; // Default to 8 AM
        if (kindActivities.length > 0) {
          const times = kindActivities
            .filter(a => a.time24)
            .map(a => parseInt(a.time24!.split(':')[0]));
          if (times.length > 0) {
            bestTimeOfDay = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length);
          }
        }

        // Generate reasoning
        const reasoningMap: Record<ActivityKind, { en: string; th: string }> = {
          'รดน้ำ': {
            en: `Based on your watering history, every ${recommendedFrequency} days maintains optimal soil moisture`,
            th: `จากประวัติการรดน้ำของคุณ ทุก ${recommendedFrequency} วันจะช่วยรักษาความชื้นในดินให้เหมาะสม`,
          },
          'ใส่ปุ๋ย': {
            en: `Fertilizing every ${recommendedFrequency} days provides consistent nutrition for healthy growth`,
            th: `การใส่ปุ๋ยทุก ${recommendedFrequency} วันจะให้สารอาหารที่สม่ำเสมอเพื่อการเจริญเติบโตที่แข็งแรง`,
          },
          'พ่นยา': {
            en: `Weekly pest prevention helps maintain plant health and prevents infestations`,
            th: `การป้องกันศัตรูพืชรายสัปดาห์ช่วยรักษาสุขภาพของพืชและป้องกันการระบาด`,
          },
          'ย้ายกระถาง': {
            en: `Annual repotting ensures adequate root space and fresh growing medium`,
            th: `การย้ายกระถางประจำปีช่วยให้รากมีพื้นที่เพียงพอและดินปลูกใหม่`,
          },
          'ตรวจใบ': {
            en: `Regular inspection helps detect issues early and maintain plant health`,
            th: `การตรวจสอบเป็นประจำช่วยตรวจพบปัญหาได้เร็วและรักษาสุขภาพของพืช`,
          },
        };

        return {
          activityKind: kind,
          recommendedFrequency,
          bestTimeOfDay,
          reasoning: reasoningMap[kind].en,
          reasoningThai: reasoningMap[kind].th,
          confidence: kindActivities.length > 0 ? 0.8 : 0.6,
        };
      });

      const schedule: OptimalCareSchedule = {
        plantId,
        recommendations,
        generatedAt: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valid for 30 days
      };

      return {
        success: true,
        data: schedule,
        metadata: {
          type: 'optimal_schedule',
          plantId,
          confidence: 0.8,
          sampleSize: activities.length,
          lastComputed: new Date(),
          computationCost: 'medium',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate optimal care schedule',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // PLANT HEALTH ANALYTICS
  // ============================================================================

  /**
   * Calculate health trends for a specific plant
   */
  calculateHealthTrends(plantId: string): InsightResponse<HealthTrendData> {
    const startTime = Date.now();

    try {
      const plant = this.gardenStore.plants.find(p => p.id === plantId);
      if (!plant) {
        return {
          success: false,
          error: { code: 'PLANT_NOT_FOUND', message: 'Plant not found' },
          cached: false,
          computationTime: Date.now() - startTime,
        };
      }

      const activities = this.activityStore.getActivities(plantId);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Generate health data points over time
      const dataPoints = [];
      const current = new Date(thirtyDaysAgo);

      while (current <= now) {
        const dayActivities = activities.filter(a => {
          const activityDate = new Date(a.dateISO);
          return activityDate.toDateString() === current.toDateString();
        });

        const healthScore = this.calculateMockHealthScore(plant, current, 0);
        const status = this.getStatusFromScore(healthScore);

        dataPoints.push({
          date: new Date(current),
          healthScore,
          status,
          activities: dayActivities,
        });

        current.setDate(current.getDate() + 1);
      }

      // Calculate trend metrics
      const scores = dataPoints.map(d => d.healthScore);
      const trendSlope = this.calculateTrendSlope(scores);
      const rSquared = this.calculateRSquared(scores);

      let overallTrend: 'improving' | 'declining' | 'stable';
      if (trendSlope > 0.1) overallTrend = 'improving';
      else if (trendSlope < -0.1) overallTrend = 'declining';
      else overallTrend = 'stable';

      // Simple prediction (linear extrapolation)
      const currentScore = scores[scores.length - 1];
      const nextWeekPrediction = Math.max(0, Math.min(100, currentScore + trendSlope * 7));
      const nextMonthPrediction = Math.max(0, Math.min(100, currentScore + trendSlope * 30));

      const healthTrend: HealthTrendData = {
        plantId,
        dataPoints,
        overallTrend,
        trendSlope,
        rSquared,
        prediction: {
          nextWeek: nextWeekPrediction,
          nextMonth: nextMonthPrediction,
          confidence: Math.max(0.3, rSquared),
        },
      };

      return {
        success: true,
        data: healthTrend,
        metadata: {
          type: 'health_trends',
          plantId,
          confidence: 0.8,
          sampleSize: dataPoints.length,
          lastComputed: new Date(),
          computationCost: 'medium',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to calculate health trends',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Predict potential health decline
   */
  predictHealthDecline(plantId: string): InsightResponse<HealthDeclinePrediction> {
    const startTime = Date.now();

    try {
      const plant = this.gardenStore.plants.find(p => p.id === plantId);
      if (!plant) {
        return {
          success: false,
          error: { code: 'PLANT_NOT_FOUND', message: 'Plant not found' },
          cached: false,
          computationTime: Date.now() - startTime,
        };
      }

      const activities = this.activityStore.getActivities(plantId);
      const now = new Date();

      // Analyze risk factors
      const riskFactors = [];
      let totalRisk = 0;

      // Check watering frequency
      const wateringActivities = activities.filter(a => a.kind === 'รดน้ำ');
      const lastWatering = wateringActivities.length > 0
        ? new Date(wateringActivities[0].dateISO)
        : null;

      if (!lastWatering || (now.getTime() - lastWatering.getTime()) > 7 * 24 * 60 * 60 * 1000) {
        const risk = 0.3;
        totalRisk += risk;
        riskFactors.push({
          factor: 'Infrequent watering',
          impact: risk,
          description: 'Plant may be experiencing water stress',
          descriptionThai: 'พืชอาจขาดน้ำ',
        });
      }

      // Check fertilizing frequency
      const fertilizingActivities = activities.filter(a => a.kind === 'ใส่ปุ๋ย');
      const lastFertilizing = fertilizingActivities.length > 0
        ? new Date(fertilizingActivities[0].dateISO)
        : null;

      if (!lastFertilizing || (now.getTime() - lastFertilizing.getTime()) > 30 * 24 * 60 * 60 * 1000) {
        const risk = 0.2;
        totalRisk += risk;
        riskFactors.push({
          factor: 'Lack of nutrients',
          impact: risk,
          description: 'Plant may be nutrient deficient',
          descriptionThai: 'พืชอาจขาดสารอาหาร',
        });
      }

      // Check inspection frequency
      const inspectionActivities = activities.filter(a => a.kind === 'ตรวจใบ');
      const lastInspection = inspectionActivities.length > 0
        ? new Date(inspectionActivities[0].dateISO)
        : null;

      if (!lastInspection || (now.getTime() - lastInspection.getTime()) > 14 * 24 * 60 * 60 * 1000) {
        const risk = 0.15;
        totalRisk += risk;
        riskFactors.push({
          factor: 'Infrequent monitoring',
          impact: risk,
          description: 'Problems may go undetected',
          descriptionThai: 'ปัญหาอาจไม่ถูกตรวจพบ',
        });
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (totalRisk < 0.2) riskLevel = 'low';
      else if (totalRisk < 0.5) riskLevel = 'medium';
      else if (totalRisk < 0.8) riskLevel = 'high';
      else riskLevel = 'critical';

      // Predict decline date if high risk
      let predictedDeclineDate: Date | undefined;
      if (riskLevel === 'high' || riskLevel === 'critical') {
        const daysToDecline = Math.round((1 - totalRisk) * 30); // Simplified prediction
        predictedDeclineDate = new Date(now.getTime() + daysToDecline * 24 * 60 * 60 * 1000);
      }

      // Generate preventive actions
      const preventiveActions = [
        {
          action: 'Establish regular watering schedule',
          priority: 1,
          expectedImprovement: 0.3,
          actionThai: 'จัดตารางการรดน้ำให้สม่ำเสมอ',
        },
        {
          action: 'Apply appropriate fertilizer',
          priority: 2,
          expectedImprovement: 0.2,
          actionThai: 'ใส่ปุ๋ยที่เหมาะสม',
        },
        {
          action: 'Perform weekly health inspections',
          priority: 3,
          expectedImprovement: 0.15,
          actionThai: 'ตรวจสุขภาพพืชทุกสัปดาห์',
        },
      ];

      const prediction: HealthDeclinePrediction = {
        plantId,
        riskLevel,
        riskScore: totalRisk,
        predictedDeclineDate,
        riskFactors,
        preventiveActions,
      };

      return {
        success: true,
        data: prediction,
        metadata: {
          type: 'health_prediction',
          plantId,
          confidence: 0.7,
          sampleSize: activities.length,
          lastComputed: new Date(),
          computationCost: 'medium',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to predict health decline',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Analyze what factors correlate with plant health
   */
  getHealthFactors(plantId: string): InsightResponse<HealthFactorAnalysis> {
    const startTime = Date.now();

    try {
      const plant = this.gardenStore.plants.find(p => p.id === plantId);
      if (!plant) {
        return {
          success: false,
          error: { code: 'PLANT_NOT_FOUND', message: 'Plant not found' },
          cached: false,
          computationTime: Date.now() - startTime,
        };
      }

      const activities = this.activityStore.getActivities(plantId);

      // Analyze positive factors (correlate with better health)
      const positiveFactors = [
        {
          factor: 'Regular watering',
          correlation: 0.8,
          impact: 'Consistent moisture levels promote healthy growth',
          impactThai: 'ความชื้นที่สม่ำเสมอส่งเสริมการเจริญเติบโตที่แข็งแรง',
        },
        {
          factor: 'Timely fertilization',
          correlation: 0.7,
          impact: 'Adequate nutrition supports plant vitality',
          impactThai: 'สารอาหารที่เพียงพอช่วยเสริมความแข็งแรงของพืช',
        },
        {
          factor: 'Regular monitoring',
          correlation: 0.6,
          impact: 'Early problem detection prevents major issues',
          impactThai: 'การตรวจพบปัญหาเร็วป้องกันปัญหาใหญ่',
        },
      ];

      // Analyze negative factors (correlate with poorer health)
      const negativeFactors = [
        {
          factor: 'Inconsistent care',
          correlation: -0.6,
          impact: 'Irregular care patterns stress the plant',
          impactThai: 'การดูแลไม่สม่ำเสมอทำให้พืชเครียด',
        },
        {
          factor: 'Overwatering',
          correlation: -0.5,
          impact: 'Excessive water can lead to root problems',
          impactThai: 'น้ำมากเกินไปอาจทำให้รากเสียหาย',
        },
      ];

      // Generate recommendations based on activity patterns
      const wateringFreq = activities.filter(a => a.kind === 'รดน้ำ').length;
      const fertilizingFreq = activities.filter(a => a.kind === 'ใส่ปุ๋ย').length;

      const recommendations = [];
      const recommendationsThai = [];

      if (wateringFreq < 10) {
        recommendations.push('Increase watering frequency for better plant health');
        recommendationsThai.push('เพิ่มความถี่ในการรดน้ำเพื่อสุขภาพพืชที่ดีขึ้น');
      }

      if (fertilizingFreq < 3) {
        recommendations.push('Consider monthly fertilization for optimal nutrition');
        recommendationsThai.push('พิจารณาการใส่ปุ๋ยรายเดือนเพื่อสารอาหารที่เหมาะสม');
      }

      recommendations.push('Maintain consistent care schedule for best results');
      recommendationsThai.push('รักษาตารางการดูแลให้สม่ำเสมอเพื่อผลลัพธ์ที่ดีที่สุด');

      const analysis: HealthFactorAnalysis = {
        plantId,
        positiveFactors,
        negativeFactors,
        recommendations,
        recommendationsThai,
      };

      return {
        success: true,
        data: analysis,
        metadata: {
          type: 'health_factors',
          plantId,
          confidence: 0.8,
          sampleSize: activities.length,
          lastComputed: new Date(),
          computationCost: 'medium',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to analyze health factors',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate comprehensive health report for a plant
   */
  generateHealthReport(plantId: string): InsightResponse<PlantHealthReport> {
    const startTime = Date.now();

    try {
      const plant = this.gardenStore.plants.find(p => p.id === plantId);
      if (!plant) {
        return {
          success: false,
          error: { code: 'PLANT_NOT_FOUND', message: 'Plant not found' },
          cached: false,
          computationTime: Date.now() - startTime,
        };
      }

      const activities = this.activityStore.getActivities(plantId);
      const now = new Date();
      const reportPeriod = {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now,
      };

      // Get health trends
      const healthTrendsResponse = this.calculateHealthTrends(plantId);
      const healthTrends = healthTrendsResponse.success ? healthTrendsResponse.data! : null;

      // Get risk assessment
      const riskResponse = this.predictHealthDecline(plantId);
      const riskAssessment = riskResponse.success ? riskResponse.data! : null;

      // Calculate current health metrics
      const currentHealthScore = this.calculateMockHealthScore(plant, now, 0);
      const currentStatus = this.getStatusFromScore(currentHealthScore);
      const grade = this.getGradeFromScore(currentHealthScore);

      // Care history analysis
      const totalActivities = activities.length;
      const kindCounts = activities.reduce((acc, a) => {
        acc[a.kind] = (acc[a.kind] || 0) + 1;
        return acc;
      }, {} as Record<ActivityKind, number>);

      const mostFrequentActivity = Object.entries(kindCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] as ActivityKind;

      const lastActivity = activities.length > 0 ? new Date(activities[0].dateISO) : undefined;

      // Calculate care consistency (simplified)
      let careConsistency = 0.5;
      if (activities.length > 0) {
        const daysSinceFirstActivity = (now.getTime() - new Date(activities[activities.length - 1].dateISO).getTime()) / (1000 * 60 * 60 * 24);
        const expectedActivities = daysSinceFirstActivity / 3; // Expect activity every 3 days
        careConsistency = Math.min(1, activities.length / expectedActivities);
      }

      // Generate strengths and improvement areas
      const strengths = ['Regular monitoring and care'];
      const strengthsThai = ['การติดตามและดูแลเป็นประจำ'];
      const improvementAreas = [];
      const improvementAreasThai = [];

      if (careConsistency < 0.7) {
        improvementAreas.push('More consistent care schedule needed');
        improvementAreasThai.push('ต้องการตารางการดูแลที่สม่ำเสมอมากขึ้น');
      }

      if (!kindCounts['ใส่ปุ๋ย'] || kindCounts['ใส่ปุ๋ย'] < 2) {
        improvementAreas.push('Consider regular fertilization');
        improvementAreasThai.push('พิจารณาการใส่ปุ๋ยเป็นประจำ');
      }

      // Action items
      const immediateActions = ['Check soil moisture and water if needed'];
      const immediateActionsThai = ['ตรวจสอบความชื้นในดินและรดน้ำหากจำเป็น'];
      const longTermGoals = ['Establish consistent care routine for optimal health'];
      const longTermGoalsThai = ['สร้างกิจวัตรการดูแลที่สม่ำเสมอเพื่อสุขภาพที่เหมาะสม'];

      const report: PlantHealthReport = {
        plantId,
        plant,
        generatedAt: now,
        reportPeriod,
        currentHealth: {
          score: currentHealthScore,
          status: currentStatus,
          grade,
        },
        healthTrend: healthTrends || {
          plantId,
          dataPoints: [],
          overallTrend: 'stable',
          trendSlope: 0,
          rSquared: 0,
          prediction: { nextWeek: currentHealthScore, nextMonth: currentHealthScore, confidence: 0.5 },
        },
        careHistory: {
          totalActivities,
          mostFrequentActivity,
          lastActivity,
          careConsistency,
        },
        strengths,
        strengthsThai,
        improvementAreas,
        improvementAreasThai,
        riskAssessment: riskAssessment || {
          plantId,
          riskLevel: 'low',
          riskScore: 0.1,
          riskFactors: [],
          preventiveActions: [],
        },
        immediateActions,
        immediateActionsThai,
        longTermGoals,
        longTermGoalsThai,
      };

      return {
        success: true,
        data: report,
        metadata: {
          type: 'health_report',
          plantId,
          confidence: 0.8,
          sampleSize: activities.length,
          lastComputed: new Date(),
          computationCost: 'high',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate health report',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // SEASONAL PATTERN DETECTION
  // ============================================================================

  /**
   * Detect seasonal patterns in plant care
   */
  getSeasonalPatterns(): InsightResponse<SeasonalPattern[]> {
    const startTime = Date.now();

    try {
      const now = new Date();
      const seasons = ['hot', 'rainy', 'cool', 'winter'] as const;
      const seasonThaiNames = {
        hot: 'ฤดูร้อน',
        rainy: 'ฤดูฝน',
        cool: 'ฤดูหนาว',
        winter: 'ฤดูหนาวเย็น'
      };

      const patterns: SeasonalPattern[] = [];

      for (const season of seasons) {
        // Get activities for this season (simplified - in real app would use proper date calculations)
        const seasonMonths = this.getSeasonMonths(season);
        const seasonActivities: ActivityEntry[] = [];

        for (const plant of this.gardenStore.plants) {
          const plantActivities = this.activityStore.getActivities(plant.id);
          const filteredActivities = plantActivities.filter(a => {
            const month = new Date(a.dateISO).getMonth() + 1;
            return seasonMonths.includes(month);
          });
          seasonActivities.push(...filteredActivities);
        }

        // Analyze activity patterns by kind
        const activityKinds: ActivityKind[] = ['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ'];
        const activityPatterns = activityKinds.map(kind => {
          const kindActivities = seasonActivities.filter(a => a.kind === kind);
          const frequency = kindActivities.length / 90; // per day over 3 months

          // Calculate optimal timing (hours of day)
          const times = kindActivities
            .filter(a => a.time24)
            .map(a => parseInt(a.time24!.split(':')[0]));
          const optimalTiming = times.length > 0
            ? [Math.round(times.reduce((sum, t) => sum + t, 0) / times.length)]
            : [8]; // Default to 8 AM

          return {
            activityKind: kind,
            frequency,
            frequencyChange: Math.random() * 0.4 - 0.2, // Mock change vs other seasons
            optimalTiming,
          };
        });

        // Mock plant health changes for the season
        const averageHealthScore = 75 + Math.random() * 20;
        const commonIssues = this.getSeasonCommonIssues(season);
        const recommendations = this.getSeasonRecommendations(season);

        patterns.push({
          season,
          seasonThai: seasonThaiNames[season],
          activityPatterns,
          plantHealthChanges: {
            averageHealthScore,
            commonIssues: commonIssues.en,
            commonIssuesThai: commonIssues.th,
          },
          recommendations: recommendations.en,
          recommendationsThai: recommendations.th,
        });
      }

      return {
        success: true,
        data: patterns,
        metadata: {
          type: 'seasonal_patterns',
          confidence: 0.7,
          sampleSize: this.gardenStore.plants.length,
          lastComputed: new Date(),
          computationCost: 'high',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to analyze seasonal patterns',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Analyze correlation between weather and care frequency
   */
  getWeatherCorrelation(): InsightResponse<WeatherCorrelation[]> {
    const startTime = Date.now();

    try {
      const correlations: WeatherCorrelation[] = [];
      const weatherFactors = ['temperature', 'humidity', 'rainfall', 'uvIndex'] as const;
      const activityKinds: ActivityKind[] = ['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ'];

      for (const factor of weatherFactors) {
        for (const kind of activityKinds) {
          // Mock correlation calculation (in real app, would use actual weather data)
          const correlation = this.getMockWeatherCorrelation(factor, kind);
          const significance = Math.abs(correlation) > 0.3 ? 0.8 : 0.4;

          let pattern: WeatherCorrelation['pattern'];
          let recommendations: string[];
          let recommendationsThai: string[];

          switch (factor) {
            case 'temperature':
              pattern = {
                description: `${kind} frequency ${correlation > 0 ? 'increases' : 'decreases'} with higher temperatures`,
                descriptionThai: `ความถี่ของ${kind}${correlation > 0 ? 'เพิ่มขึ้น' : 'ลดลง'}เมื่ออุณหภูมิสูงขึ้น`,
                threshold: 30,
                unit: '°C',
              };
              recommendations = ['Adjust care frequency based on temperature'];
              recommendationsThai = ['ปรับความถี่ของการดูแลตามอุณหภูมิ'];
              break;

            case 'humidity':
              pattern = {
                description: `${kind} needs ${correlation > 0 ? 'increase' : 'decrease'} with higher humidity`,
                descriptionThai: `ความต้องการ${kind}${correlation > 0 ? 'เพิ่มขึ้น' : 'ลดลง'}เมื่อความชื้นสูงขึ้น`,
                threshold: 60,
                unit: '%',
              };
              recommendations = ['Monitor humidity levels for optimal care'];
              recommendationsThai = ['ติดตามระดับความชื้นเพื่อการดูแลที่เหมาะสม'];
              break;

            case 'rainfall':
              pattern = {
                description: `Rainfall ${correlation > 0 ? 'increases' : 'reduces'} need for ${kind}`,
                descriptionThai: `ฝน${correlation > 0 ? 'เพิ่ม' : 'ลด'}ความต้องการ${kind}`,
                threshold: 10,
                unit: 'mm',
              };
              recommendations = ['Adjust care based on natural rainfall'];
              recommendationsThai = ['ปรับการดูแลตามฝนธรรมชาติ'];
              break;

            case 'uvIndex':
              pattern = {
                description: `UV intensity affects ${kind} requirements`,
                descriptionThai: `ความเข้มของ UV ส่งผลต่อความต้องการ${kind}`,
                threshold: 7,
                unit: 'UV Index',
              };
              recommendations = ['Consider UV levels when planning care'];
              recommendationsThai = ['พิจารณาระดับ UV เมื่อวางแผนการดูแล'];
              break;
          }

          correlations.push({
            weatherFactor: factor,
            activityKind: kind,
            correlation,
            significance,
            pattern,
            recommendations,
            recommendationsThai,
          });
        }
      }

      // Filter to only significant correlations
      const significantCorrelations = correlations.filter(c => c.significance > 0.6);

      return {
        success: true,
        data: significantCorrelations,
        metadata: {
          type: 'weather_correlation',
          confidence: 0.6,
          sampleSize: this.gardenStore.plants.length,
          lastComputed: new Date(),
          computationCost: 'high',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to analyze weather correlation',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get seasonal recommendations
   */
  getSeasonalRecommendations(): InsightResponse<SeasonalPattern[]> {
    // Reuse the seasonal patterns method for recommendations
    return this.getSeasonalPatterns();
  }

  // ============================================================================
  // USER BEHAVIOR ANALYTICS
  // ============================================================================

  /**
   * Analyze user's care habits and patterns
   */
  getUserCareHabits(): InsightResponse<UserCareHabits> {
    const startTime = Date.now();

    try {
      // Collect all activities from all plants
      const allActivities: ActivityEntry[] = [];
      for (const plant of this.gardenStore.plants) {
        const plantActivities = this.activityStore.getActivities(plant.id);
        allActivities.push(...plantActivities);
      }

      if (allActivities.length === 0) {
        return {
          success: false,
          error: { code: 'NO_DATA', message: 'No activity data available' },
          cached: false,
          computationTime: Date.now() - startTime,
        };
      }

      // Analyze preferred times
      const times = allActivities
        .filter(a => a.time24)
        .map(a => parseInt(a.time24!.split(':')[0]));

      const timeFrequency: Record<number, number> = {};
      times.forEach(hour => {
        timeFrequency[hour] = (timeFrequency[hour] || 0) + 1;
      });

      const preferredTimes = Object.entries(timeFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));

      // Calculate average frequency by activity kind
      const activityKinds: ActivityKind[] = ['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ'];
      const averageFrequency: Record<ActivityKind, number> = {} as any;

      for (const kind of activityKinds) {
        const kindActivities = allActivities.filter(a => a.kind === kind);
        if (kindActivities.length > 1) {
          const dates = kindActivities.map(a => new Date(a.dateISO)).sort();
          const totalDays = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
          averageFrequency[kind] = totalDays / (kindActivities.length - 1);
        } else {
          averageFrequency[kind] = 0;
        }
      }

      // Calculate care consistency
      const totalDays = allActivities.length > 0
        ? (new Date().getTime() - new Date(allActivities[allActivities.length - 1].dateISO).getTime()) / (1000 * 60 * 60 * 24)
        : 1;
      const activeDays = new Set(allActivities.map(a => a.dateISO.split('T')[0])).size;
      const careConsistency = Math.min(1, activeDays / totalDays);

      // Analyze weekday vs weekend patterns
      let weekdayCount = 0;
      let weekendCount = 0;

      allActivities.forEach(activity => {
        const day = new Date(activity.dateISO).getDay();
        if (day === 0 || day === 6) weekendCount++;
        else weekdayCount++;
      });

      const weekdayVsWeekend = {
        weekday: weekdayCount,
        weekend: weekendCount,
        preference: weekdayCount > weekendCount ? 'weekday' : weekendCount > weekdayCount ? 'weekend' : 'balanced' as const,
      };

      // Determine preferences
      const kindCounts = allActivities.reduce((acc, a) => {
        acc[a.kind] = (acc[a.kind] || 0) + 1;
        return acc;
      }, {} as Record<ActivityKind, number>);

      const sortedKinds = Object.entries(kindCounts).sort(([,a], [,b]) => b - a);
      const favoriteActivity = sortedKinds[0]?.[0] as ActivityKind;
      const mostSkippedActivity = sortedKinds[sortedKinds.length - 1]?.[0] as ActivityKind;

      // Mock plant attention analysis
      const plantActivities = this.gardenStore.plants.map(plant => ({
        plantId: plant.id,
        count: this.activityStore.getActivities(plant.id).length,
      })).sort((a, b) => b.count - a.count);

      const plantsWithMostAttention = plantActivities.slice(0, 3).map(p => p.plantId);
      const plantsWithLeastAttention = plantActivities.slice(-3).map(p => p.plantId);

      // Calculate streaks
      const activityDates = [...new Set(allActivities.map(a => a.dateISO.split('T')[0]))].sort();
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      const today = new Date().toISOString().split('T')[0];
      for (let i = activityDates.length - 1; i >= 0; i--) {
        const date = activityDates[i];
        const prevDate = i > 0 ? activityDates[i - 1] : null;

        if (prevDate) {
          const dayDiff = (new Date(date).getTime() - new Date(prevDate).getTime()) / (1000 * 60 * 60 * 24);
          if (dayDiff <= 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        } else {
          tempStreak = 1;
        }

        if (date === today && currentStreak === 0) {
          currentStreak = tempStreak;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      const habits: UserCareHabits = {
        carePatterns: {
          preferredTimes,
          averageFrequency,
          careConsistency,
          weekdayVsWeekend,
        },
        preferences: {
          favoriteActivity,
          mostSkippedActivity,
          plantsWithMostAttention,
          plantsWithLeastAttention,
        },
        streaks: {
          currentStreak,
          longestStreak,
          streakType: 'any',
        },
      };

      return {
        success: true,
        data: habits,
        metadata: {
          type: 'user_habits',
          confidence: 0.8,
          sampleSize: allActivities.length,
          lastComputed: new Date(),
          computationCost: 'medium',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to analyze user care habits',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Calculate engagement metrics
   */
  getEngagementMetrics(): InsightResponse<EngagementMetrics> {
    const startTime = Date.now();

    try {
      // Mock engagement data (in real app, would track actual usage)
      const appUsage = {
        dailyActiveTime: 15 + Math.random() * 10, // 15-25 minutes
        weeklyActiveTime: 105 + Math.random() * 70, // 105-175 minutes
        monthlyActiveTime: 450 + Math.random() * 300, // 450-750 minutes
        sessionCount: 120 + Math.round(Math.random() * 80), // 120-200 sessions
        averageSessionLength: 5 + Math.random() * 5, // 5-10 minutes
      };

      const featureUsage = {
        activityLogging: this.getAllActivitiesCount(),
        plantScanning: this.gardenStore.plants.length,
        insightsViewing: Math.round(Math.random() * 50),
        settingsAccess: Math.round(Math.random() * 20),
        notificationsInteraction: Math.round(Math.random() * 30),
      };

      const plantInteraction = {
        plantsAdded: this.gardenStore.plants.length,
        plantsRemoved: Math.round(Math.random() * 5),
        activitiesLogged: this.getAllActivitiesCount(),
        photosUploaded: Math.round(Math.random() * 50),
        notesWritten: Math.round(Math.random() * 30),
      };

      // Calculate engagement score
      const score = Math.min(100,
        (appUsage.dailyActiveTime / 30) * 20 +
        (featureUsage.activityLogging / 100) * 30 +
        (plantInteraction.activitiesLogged / 50) * 30 +
        (featureUsage.insightsViewing / 20) * 20
      );

      let level: 'low' | 'medium' | 'high' | 'very_high';
      if (score < 25) level = 'low';
      else if (score < 50) level = 'medium';
      else if (score < 75) level = 'high';
      else level = 'very_high';

      const engagement: EngagementMetrics = {
        appUsage,
        featureUsage,
        plantInteraction,
        engagement: {
          score,
          level,
          trends: {
            weekOverWeek: Math.random() * 20 - 10, // -10% to +10%
            monthOverMonth: Math.random() * 30 - 15, // -15% to +15%
          },
        },
      };

      return {
        success: true,
        data: engagement,
        metadata: {
          type: 'engagement_metrics',
          confidence: 0.9,
          sampleSize: this.getAllActivitiesCount(),
          lastComputed: new Date(),
          computationCost: 'low',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to calculate engagement metrics',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Calculate productivity score
   */
  getProductivityScore(): InsightResponse<ProductivityScore> {
    const startTime = Date.now();

    try {
      const allActivities = this.getAllActivities();

      // Calculate productivity components
      const consistency = this.calculateConsistencyScore(allActivities);
      const completeness = this.calculateCompletenessScore(allActivities);
      const timeliness = this.calculateTimelinessScore(allActivities);
      const effectiveness = this.calculateEffectivenessScore();

      const overall = Math.round((consistency + completeness + timeliness + effectiveness) / 4);

      const breakdown = {
        consistency: Math.round(consistency),
        completeness: Math.round(completeness),
        timeliness: Math.round(timeliness),
        effectiveness: Math.round(effectiveness),
      };

      // Mock comparisons
      const comparison = {
        vsLastMonth: Math.random() * 20 - 10, // -10 to +10
        vsOptimal: overall - 85, // How far from optimal (85)
        percentile: Math.min(95, overall + Math.random() * 20), // User percentile
      };

      // Generate achievements based on score
      const achievements = this.generateAchievements(overall, breakdown);

      const score: ProductivityScore = {
        overall,
        breakdown,
        comparison,
        achievements,
      };

      return {
        success: true,
        data: score,
        metadata: {
          type: 'productivity_score',
          confidence: 0.8,
          sampleSize: allActivities.length,
          lastComputed: new Date(),
          computationCost: 'medium',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to calculate productivity score',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate personalized tips based on user data
   */
  getPersonalizedTips(): InsightResponse<PersonalizedTip[]> {
    const startTime = Date.now();

    try {
      const tips: PersonalizedTip[] = [];
      const allActivities = this.getAllActivities();

      // Analyze user patterns to generate tips
      const wateringActivities = allActivities.filter(a => a.kind === 'รดน้ำ');
      const fertilizingActivities = allActivities.filter(a => a.kind === 'ใส่ปุ๋ย');

      // Tip 1: Watering frequency
      if (wateringActivities.length < 5) {
        tips.push({
          id: 'watering-frequency-tip',
          category: 'care',
          priority: 'high',
          title: 'Improve Your Watering Routine',
          titleThai: 'ปรับปรุงกิจวัตรการรดน้ำ',
          description: 'Your plants would benefit from more consistent watering. Regular watering helps maintain optimal soil moisture.',
          descriptionThai: 'พืชของคุณจะได้ประโยชน์จากการรดน้ำที่สม่ำเสมอมากขึ้น การรดน้ำเป็นประจำช่วยรักษาความชื้นในดินให้เหมาะสม',
          basedOn: {
            userBehavior: ['Low watering frequency'],
            plantData: ['Plant moisture requirements'],
            seasonalData: false,
            weatherData: false,
          },
          actionable: {
            steps: ['Set watering reminders', 'Check soil moisture daily', 'Water when top inch is dry'],
            stepsThai: ['ตั้งการแจ้งเตือนการรดน้ำ', 'ตรวจสอบความชื้นในดินทุกวัน', 'รดน้ำเมื่อดินส่วนบนแห้ง'],
            expectedOutcome: 'Healthier, more resilient plants',
            expectedOutcomeThai: 'พืชที่แข็งแรงและทนทานมากขึ้น',
          },
          relevance: 0.9,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });
      }

      // Tip 2: Fertilization
      if (fertilizingActivities.length < 2) {
        tips.push({
          id: 'fertilization-tip',
          category: 'care',
          priority: 'medium',
          title: 'Consider Regular Fertilization',
          titleThai: 'พิจารณาการใส่ปุ๋ยเป็นประจำ',
          description: 'Regular fertilization provides essential nutrients for healthy plant growth and vibrant foliage.',
          descriptionThai: 'การใส่ปุ๋ยเป็นประจำให้สารอาหารที่จำเป็นสำหรับการเจริญเติบโตที่แข็งแรงและใบไม้ที่สดใส',
          basedOn: {
            userBehavior: ['Infrequent fertilization'],
            plantData: ['Nutrient requirements'],
            seasonalData: true,
            weatherData: false,
          },
          actionable: {
            steps: ['Choose appropriate fertilizer', 'Create monthly fertilization schedule', 'Monitor plant response'],
            stepsThai: ['เลือกปุ๋ยที่เหมาะสม', 'สร้างตารางการใส่ปุ๋ยรายเดือน', 'ติดตามการตอบสนองของพืช'],
            expectedOutcome: 'Improved growth and plant vitality',
            expectedOutcomeThai: 'การเจริญเติบโตและความแข็งแรงของพืชที่ดีขึ้น',
          },
          relevance: 0.8,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        });
      }

      // Tip 3: Timing optimization
      const times = allActivities
        .filter(a => a.time24)
        .map(a => parseInt(a.time24!.split(':')[0]));

      const averageTime = times.length > 0 ? times.reduce((sum, t) => sum + t, 0) / times.length : 12;

      if (averageTime > 12) { // Afternoon/evening care
        tips.push({
          id: 'timing-optimization-tip',
          category: 'timing',
          priority: 'low',
          title: 'Try Morning Care Routine',
          titleThai: 'ลองกิจวัตรการดูแลตอนเช้า',
          description: 'Morning care allows plants to utilize water and nutrients throughout the day, promoting better growth.',
          descriptionThai: 'การดูแลตอนเช้าช่วยให้พืชใช้น้ำและสารอาหารตลอดทั้งวัน ส่งเสริมการเจริญเติบโตที่ดีขึ้น',
          basedOn: {
            userBehavior: ['Late day care timing'],
            plantData: ['Optimal absorption times'],
            seasonalData: false,
            weatherData: true,
          },
          actionable: {
            steps: ['Set morning reminders', 'Water between 6-10 AM', 'Check plants during cooler hours'],
            stepsThai: ['ตั้งการแจ้งเตือนตอนเช้า', 'รดน้ำระหว่าง 6-10 โมงเช้า', 'ตรวจสอบพืชในช่วงที่อากาศเย็น'],
            expectedOutcome: 'Better water absorption and reduced stress',
            expectedOutcomeThai: 'การดูดซับน้ำที่ดีขึ้นและความเครียดที่ลดลง',
          },
          relevance: 0.6,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
        });
      }

      // Tip 4: Plant health monitoring
      if (allActivities.filter(a => a.kind === 'ตรวจใบ').length < 3) {
        tips.push({
          id: 'monitoring-tip',
          category: 'plant_health',
          priority: 'medium',
          title: 'Increase Health Monitoring',
          titleThai: 'เพิ่มการติดตามสุขภาพ',
          description: 'Regular health checks help detect problems early, leading to more successful plant care.',
          descriptionThai: 'การตรวจสุขภาพเป็นประจำช่วยตรวจพบปัญหาได้เร็ว นำไปสู่การดูแลพืชที่ประสบความสำเร็จมากขึ้น',
          basedOn: {
            userBehavior: ['Infrequent health monitoring'],
            plantData: ['Early problem detection'],
            seasonalData: false,
            weatherData: false,
          },
          actionable: {
            steps: ['Weekly visual inspection', 'Check for pests and diseases', 'Monitor growth changes'],
            stepsThai: ['ตรวจสอบด้วยสายตาทุกสัปดาห์', 'ตรวจหาศัตรูพืชและโรค', 'ติดตามการเปลี่ยนแปลงของการเจริญเติบโต'],
            expectedOutcome: 'Early problem detection and healthier plants',
            expectedOutcomeThai: 'การตรวจพบปัญหาเร็วและพืชที่แข็งแรงขึ้น',
          },
          relevance: 0.7,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
        });
      }

      return {
        success: true,
        data: tips,
        metadata: {
          type: 'personalized_tips',
          confidence: 0.8,
          sampleSize: allActivities.length,
          lastComputed: new Date(),
          computationCost: 'medium',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate personalized tips',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // COMPARATIVE ANALYTICS
  // ============================================================================

  /**
   * Compare plant performance against each other
   */
  comparePlantPerformance(): InsightResponse<PlantPerformanceComparison[]> {
    const startTime = Date.now();

    try {
      const plants = this.gardenStore.plants;
      if (plants.length === 0) {
        return {
          success: false,
          error: { code: 'NO_DATA', message: 'No plants available for comparison' },
          cached: false,
          computationTime: Date.now() - startTime,
        };
      }

      const comparisons: PlantPerformanceComparison[] = [];

      for (const plant of plants) {
        const activities = this.activityStore.getActivities(plant.id);

        // Calculate metrics
        const healthScore = this.calculateMockHealthScore(plant, new Date(), 0);
        const careFrequency = activities.length / Math.max(1, this.getDaysSinceCreated(plant));
        const growthRate = Math.random() * 2; // Mock growth rate
        const survivalTime = this.getDaysSinceCreated(plant);

        const metrics = {
          healthScore,
          careFrequency,
          growthRate,
          survivalTime,
        };

        // Calculate ranking (simplified)
        const totalScore = healthScore + (careFrequency * 10) + (growthRate * 20) + (survivalTime * 0.1);
        const ranking = {
          position: 1, // Will be calculated later
          totalPlants: plants.length,
          percentile: 50, // Will be calculated later
        };

        // Find best performing plant (highest health score for simplicity)
        const bestPerforming = plants.reduce((best, current) => {
          const currentScore = this.calculateMockHealthScore(current, new Date(), 0);
          const bestScore = this.calculateMockHealthScore(best, new Date(), 0);
          return currentScore > bestScore ? current : best;
        }).id;

        // Mock similarities and differences
        const similarities = ['Regular care schedule', 'Good light exposure'];
        const differences = ['Less frequent fertilization', 'Different watering pattern'];

        const comparison = {
          bestPerforming,
          similarities,
          differences,
        };

        // Generate recommendations
        const recommendations = {
          immediate: ['Check soil moisture', 'Adjust watering schedule'],
          immediateThai: ['ตรวจสอบความชื้นในดิน', 'ปรับตารางการรดน้ำ'],
          longTerm: ['Establish consistent care routine', 'Monitor growth patterns'],
          longTermThai: ['สร้างกิจวัตรการดูแลที่สม่ำเสมอ', 'ติดตามรูปแบบการเจริญเติบโต'],
        };

        comparisons.push({
          plant,
          metrics,
          ranking,
          comparison,
          recommendations,
        });
      }

      // Calculate actual rankings
      comparisons.sort((a, b) => {
        const scoreA = a.metrics.healthScore + (a.metrics.careFrequency * 10);
        const scoreB = b.metrics.healthScore + (b.metrics.careFrequency * 10);
        return scoreB - scoreA;
      });

      comparisons.forEach((comp, index) => {
        comp.ranking.position = index + 1;
        comp.ranking.percentile = Math.round(((plants.length - index) / plants.length) * 100);
      });

      return {
        success: true,
        data: comparisons,
        metadata: {
          type: 'plant_comparison',
          confidence: 0.7,
          sampleSize: plants.length,
          lastComputed: new Date(),
          computationCost: 'high',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to compare plant performance',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get benchmark data for comparison
   */
  getBenchmarkData(): InsightResponse<BenchmarkData[]> {
    const startTime = Date.now();

    try {
      const allActivities = this.getAllActivities();
      const totalPlants = this.gardenStore.plants.length;

      const benchmarks: BenchmarkData[] = [
        {
          category: 'care_frequency',
          ideal: 1.0, // Daily care
          good: 0.7,
          average: 0.5,
          needsImprovement: 0.3,
          userValue: allActivities.length / Math.max(1, totalPlants * 30), // Activities per plant per month
          userRating: 'average', // Will be calculated
          recommendations: ['Increase care frequency for better results'],
          recommendationsThai: ['เพิ่มความถี่ในการดูแลเพื่อผลลัพธ์ที่ดีขึ้น'],
        },
        {
          category: 'health_score',
          ideal: 90,
          good: 75,
          average: 60,
          needsImprovement: 45,
          userValue: this.getAverageHealthScore(),
          userRating: 'good', // Will be calculated
          recommendations: ['Maintain current care standards'],
          recommendationsThai: ['รักษามาตรฐานการดูแลปัจจุบัน'],
        },
        {
          category: 'activity_variety',
          ideal: 5, // All activity types
          good: 4,
          average: 3,
          needsImprovement: 2,
          userValue: this.getActivityVariety(),
          userRating: 'good', // Will be calculated
          recommendations: ['Try incorporating more care activities'],
          recommendationsThai: ['ลองรวมกิจกรรมการดูแลที่หลากหลายมากขึ้น'],
        },
        {
          category: 'consistency',
          ideal: 0.9,
          good: 0.7,
          average: 0.5,
          needsImprovement: 0.3,
          userValue: this.calculateOverallConsistency(),
          userRating: 'average', // Will be calculated
          recommendations: ['Develop more consistent care routines'],
          recommendationsThai: ['พัฒนากิจวัตรการดูแลให้สม่ำเสมอมากขึ้น'],
        },
      ];

      // Calculate user ratings
      benchmarks.forEach(benchmark => {
        const value = benchmark.userValue;
        if (value >= benchmark.ideal) benchmark.userRating = 'ideal';
        else if (value >= benchmark.good) benchmark.userRating = 'good';
        else if (value >= benchmark.average) benchmark.userRating = 'average';
        else benchmark.userRating = 'needs_improvement';
      });

      return {
        success: true,
        data: benchmarks,
        metadata: {
          type: 'benchmark_data',
          confidence: 0.8,
          sampleSize: allActivities.length,
          lastComputed: new Date(),
          computationCost: 'medium',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get benchmark data',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Identify areas for improvement
   */
  getImprovementAreas(): InsightResponse<ImprovementArea[]> {
    const startTime = Date.now();

    try {
      const allActivities = this.getAllActivities();
      const areas: ImprovementArea[] = [];

      // Analyze care frequency
      const avgActivitiesPerWeek = allActivities.length / Math.max(1, this.getTotalDaysWithPlants() / 7);
      if (avgActivitiesPerWeek < 3) {
        areas.push({
          area: 'Care Frequency',
          areaThai: 'ความถี่ของการดูแล',
          currentScore: Math.min(100, avgActivitiesPerWeek * 33),
          targetScore: 90,
          priority: 'high',
          impact: {
            description: 'Increasing care frequency will significantly improve plant health and growth',
            descriptionThai: 'การเพิ่มความถี่ในการดูแลจะปรับปรุงสุขภาพและการเจริญเติบโตของพืชอย่างมาก',
            expectedImprovement: 25,
          },
          actionPlan: {
            steps: ['Set daily plant check reminders', 'Create a care schedule', 'Track daily activities'],
            stepsThai: ['ตั้งการแจ้งเตือนตรวจสอบพืชทุกวัน', 'สร้างตารางการดูแล', 'ติดตามกิจกรรมประจำวัน'],
            timeframe: '2-4 weeks',
            timeframeThai: '2-4 สัปดาห์',
          },
          metrics: [
            { name: 'Activities per week', current: avgActivitiesPerWeek, target: 7, unit: 'activities' },
            { name: 'Plant check frequency', current: 3, target: 7, unit: 'days per week' },
          ],
        });
      }

      // Analyze activity variety
      const activityTypes = new Set(allActivities.map(a => a.kind)).size;
      if (activityTypes < 4) {
        areas.push({
          area: 'Care Variety',
          areaThai: 'ความหลากหลายของการดูแล',
          currentScore: activityTypes * 20,
          targetScore: 80,
          priority: 'medium',
          impact: {
            description: 'Diversifying care activities ensures all plant needs are met',
            descriptionThai: 'การหลากหลายของกิจกรรมการดูแลช่วยให้ความต้องการของพืชทุกด้านได้รับการตอบสนอง',
            expectedImprovement: 20,
          },
          actionPlan: {
            steps: ['Try fertilizing monthly', 'Add regular pest inspections', 'Include plant monitoring'],
            stepsThai: ['ลองใส่ปุ๋ยรายเดือน', 'เพิ่มการตรวจสอบศัตรูพืชเป็นประจำ', 'รวมการติดตามพืช'],
            timeframe: '1-2 months',
            timeframeThai: '1-2 เดือน',
          },
          metrics: [
            { name: 'Activity types used', current: activityTypes, target: 5, unit: 'types' },
            { name: 'Care completeness', current: activityTypes * 20, target: 100, unit: 'percent' },
          ],
        });
      }

      // Analyze consistency
      const consistency = this.calculateOverallConsistency();
      if (consistency < 0.7) {
        areas.push({
          area: 'Care Consistency',
          areaThai: 'ความสม่ำเสมอของการดูแล',
          currentScore: consistency * 100,
          targetScore: 85,
          priority: 'high',
          impact: {
            description: 'Consistent care leads to better plant health and predictable growth',
            descriptionThai: 'การดูแลที่สม่ำเสมอนำไปสู่สุขภาพพืชที่ดีขึ้นและการเจริญเติบโตที่คาดเดาได้',
            expectedImprovement: 30,
          },
          actionPlan: {
            steps: ['Set recurring reminders', 'Create care checklists', 'Track completion rates'],
            stepsThai: ['ตั้งการแจ้งเตือนที่เกิดขึ้นซ้ำ', 'สร้างรายการตรวจสอบการดูแล', 'ติดตามอัตราการทำให้เสร็จ'],
            timeframe: '3-6 weeks',
            timeframeThai: '3-6 สัปดาห์',
          },
          metrics: [
            { name: 'Consistency score', current: consistency, target: 0.85, unit: 'ratio' },
            { name: 'Missed care days', current: 10, target: 3, unit: 'days per month' },
          ],
        });
      }

      return {
        success: true,
        data: areas,
        metadata: {
          type: 'improvement_areas',
          confidence: 0.8,
          sampleSize: allActivities.length,
          lastComputed: new Date(),
          computationCost: 'medium',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to identify improvement areas',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // DATA AGGREGATION FUNCTIONS
  // ============================================================================

  /**
   * Aggregate activity data for processing
   */
  aggregateActivityData(): InsightResponse<AggregatedMetrics> {
    const startTime = Date.now();

    try {
      const allActivities = this.getAllActivities();
      const plants = this.gardenStore.plants;
      const now = new Date();

      // Plant metrics
      const plantMetrics = {
        total: plants.length,
        healthy: plants.filter(p => p.status === 'Healthy').length,
        warning: plants.filter(p => p.status === 'Warning').length,
        critical: plants.filter(p => p.status === 'Critical').length,
        averageHealthScore: this.getAverageHealthScore(),
      };

      // Activity metrics
      const byKind = allActivities.reduce((acc, activity) => {
        acc[activity.kind] = (acc[activity.kind] || 0) + 1;
        return acc;
      }, {} as Record<ActivityKind, number>);

      const activeDays = new Set(allActivities.map(a => a.dateISO.split('T')[0])).size;
      const totalDays = this.getTotalDaysWithPlants();

      const activityMetrics = {
        total: allActivities.length,
        byKind,
        dailyAverage: allActivities.length / Math.max(1, totalDays),
        consistency: activeDays / Math.max(1, totalDays),
      };

      // User metrics (mock data)
      const userMetrics = {
        engagementScore: 75 + Math.random() * 20,
        productivityScore: 70 + Math.random() * 25,
        streakDays: Math.floor(Math.random() * 15),
        activeDays,
      };

      // Calculate trends
      const recentActivities = allActivities.filter(a => {
        const activityDate = new Date(a.dateISO);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return activityDate >= oneWeekAgo;
      });

      const trends = {
        healthTrend: Math.random() > 0.5 ? 'improving' : 'stable' as const,
        activityTrend: recentActivities.length > allActivities.length / 4 ? 'increasing' : 'stable' as const,
        engagementTrend: Math.random() > 0.5 ? 'increasing' : 'stable' as const,
      };

      const aggregated: AggregatedMetrics = {
        timestamp: now,
        timeframe: 'month',
        plants: plantMetrics,
        activities: activityMetrics,
        user: userMetrics,
        trends,
      };

      return {
        success: true,
        data: aggregated,
        metadata: {
          type: 'aggregated_metrics',
          confidence: 0.9,
          sampleSize: allActivities.length,
          lastComputed: new Date(),
          computationCost: 'low',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to aggregate activity data',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Calculate core KPI metrics
   */
  calculateMetrics(): InsightResponse<Record<string, number>> {
    const startTime = Date.now();

    try {
      const allActivities = this.getAllActivities();
      const plants = this.gardenStore.plants;

      const metrics = {
        totalPlants: plants.length,
        totalActivities: allActivities.length,
        averageHealthScore: this.getAverageHealthScore(),
        careFrequency: allActivities.length / Math.max(1, this.getTotalDaysWithPlants()),
        consistency: this.calculateOverallConsistency(),
        productivity: this.getProductivityScore().data?.overall || 0,
        engagement: this.getEngagementMetrics().data?.engagement.score || 0,
        varietyScore: this.getActivityVariety() * 20, // Convert to percentage
        healthyPlantsRatio: plants.length > 0 ? plants.filter(p => p.status === 'Healthy').length / plants.length : 0,
        activePlantRatio: plants.length > 0 ? plants.filter(p => this.activityStore.getActivities(p.id).length > 0).length / plants.length : 0,
      };

      return {
        success: true,
        data: metrics,
        metadata: {
          type: 'kpi_metrics',
          confidence: 0.9,
          sampleSize: allActivities.length,
          lastComputed: new Date(),
          computationCost: 'low',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to calculate metrics',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate chart data for Victory Native charts
   */
  generateChartData(chartType: 'line' | 'bar' | 'pie' | 'area', dataType: string, plantId?: string): InsightResponse<LineChartData | BarChartData | PieChartData> {
    const startTime = Date.now();

    try {
      switch (chartType) {
        case 'line':
          return this.generateLineChartData(dataType, plantId);
        case 'bar':
          return this.generateBarChartData(dataType, plantId);
        case 'pie':
          return this.generatePieChartData(dataType, plantId);
        default:
          return {
            success: false,
            error: { code: 'INVALID_CHART_TYPE', message: 'Unsupported chart type' },
            cached: false,
            computationTime: Date.now() - startTime,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate chart data',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Export analytics data for sharing
   */
  exportAnalytics(format: 'json' | 'csv' = 'json', plantIds?: string[]): InsightResponse<AnalyticsExport> {
    const startTime = Date.now();

    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const targetPlants = plantIds
        ? this.gardenStore.plants.filter(p => plantIds.includes(p.id))
        : this.gardenStore.plants;

      // Collect all data
      const allActivities = targetPlants.flatMap(plant =>
        this.activityStore.getActivities(plant.id)
      );

      const plantReports = targetPlants.map(plant => {
        const reportResponse = this.generateHealthReport(plant.id);
        return reportResponse.success ? reportResponse.data! : null;
      }).filter(Boolean) as PlantHealthReport[];

      const tipsResponse = this.getPersonalizedTips();
      const insights = tipsResponse.success ? tipsResponse.data! : [];

      // Generate charts
      const charts = [
        this.generateLineChartData('health_trends'),
        this.generateBarChartData('activity_frequency'),
        this.generatePieChartData('activity_distribution'),
      ].filter(response => response.success).map(response => response.data!);

      const exportData: AnalyticsExport = {
        exportId: `export_${Date.now()}`,
        generatedAt: now,
        format,
        timeRange: { start: thirtyDaysAgo, end: now },
        plantIds: targetPlants.map(p => p.id),
        data: {
          summary: {
            totalPlants: targetPlants.length,
            totalActivities: allActivities.length,
            averageHealthScore: this.getAverageHealthScore(),
            topPerformingPlant: targetPlants.length > 0 ? targetPlants[0].id : '',
          },
          plants: plantReports,
          activities: allActivities,
          insights,
          charts,
        },
        metadata: {
          appVersion: '1.0.0',
          exportVersion: '1.0',
          language: 'en',
          includePersonalData: true,
        },
      };

      return {
        success: true,
        data: exportData,
        metadata: {
          type: 'export_data',
          confidence: 1.0,
          sampleSize: allActivities.length,
          lastComputed: new Date(),
          computationCost: 'high',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to export analytics',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getAllActivities(): ActivityEntry[] {
    const allActivities: ActivityEntry[] = [];
    for (const plant of this.gardenStore.plants) {
      const plantActivities = this.activityStore.getActivities(plant.id);
      allActivities.push(...plantActivities);
    }
    return allActivities.sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime());
  }

  private getAllActivitiesCount(): number {
    return this.getAllActivities().length;
  }

  private calculateMockHealthScore(plant: Plant, date: Date, daysOffset: number): number {
    // Mock health score calculation
    const baseScore = plant.status === 'Healthy' ? 80 : plant.status === 'Warning' ? 60 : 40;
    const randomVariation = Math.random() * 20 - 10; // -10 to +10
    const timeInfluence = daysOffset * 0.5; // Slight trend over time

    return Math.max(0, Math.min(100, baseScore + randomVariation + timeInfluence));
  }

  private getStatusFromScore(score: number): PlantStatus {
    if (score >= 70) return 'Healthy';
    if (score >= 40) return 'Warning';
    return 'Critical';
  }

  private getGradeFromScore(score: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F' {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateTrendSlope(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  private calculateRSquared(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const slope = this.calculateTrendSlope(values);
    const intercept = mean - slope * (values.length - 1) / 2;

    let ssRes = 0;
    let ssTot = 0;

    values.forEach((value, i) => {
      const predicted = slope * i + intercept;
      ssRes += Math.pow(value - predicted, 2);
      ssTot += Math.pow(value - mean, 2);
    });

    return ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);
  }

  private getDaysSinceCreated(plant: Plant): number {
    const now = new Date();
    const created = new Date(plant.createdAt);
    return Math.max(1, (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getTotalDaysWithPlants(): number {
    if (this.gardenStore.plants.length === 0) return 1;

    const oldest = this.gardenStore.plants.reduce((oldest, plant) => {
      return new Date(plant.createdAt) < new Date(oldest.createdAt) ? plant : oldest;
    });

    return this.getDaysSinceCreated(oldest);
  }

  private getAverageHealthScore(): number {
    const plants = this.gardenStore.plants;
    if (plants.length === 0) return 0;

    const totalScore = plants.reduce((sum, plant) => {
      return sum + this.calculateMockHealthScore(plant, new Date(), 0);
    }, 0);

    return totalScore / plants.length;
  }

  private getActivityVariety(): number {
    const allActivities = this.getAllActivities();
    const uniqueKinds = new Set(allActivities.map(a => a.kind));
    return uniqueKinds.size;
  }

  private calculateOverallConsistency(): number {
    const allActivities = this.getAllActivities();
    if (allActivities.length === 0) return 0;

    const activeDays = new Set(allActivities.map(a => a.dateISO.split('T')[0])).size;
    const totalDays = this.getTotalDaysWithPlants();

    return Math.min(1, activeDays / totalDays);
  }

  private calculateConsistencyScore(activities: ActivityEntry[]): number {
    if (activities.length === 0) return 0;

    const activeDays = new Set(activities.map(a => a.dateISO.split('T')[0])).size;
    const totalDays = this.getTotalDaysWithPlants();

    return Math.min(100, (activeDays / totalDays) * 100);
  }

  private calculateCompletenessScore(activities: ActivityEntry[]): number {
    const activityKinds: ActivityKind[] = ['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ'];
    const usedKinds = new Set(activities.map(a => a.kind));

    return (usedKinds.size / activityKinds.length) * 100;
  }

  private calculateTimelinessScore(activities: ActivityEntry[]): number {
    // Mock timeliness calculation - in real app would compare to recommended schedules
    const morningActivities = activities.filter(a => {
      if (!a.time24) return false;
      const hour = parseInt(a.time24.split(':')[0]);
      return hour >= 6 && hour <= 10;
    });

    return activities.length > 0 ? (morningActivities.length / activities.length) * 100 : 50;
  }

  private calculateEffectivenessScore(): number {
    // Mock effectiveness based on plant health
    return this.getAverageHealthScore();
  }

  private generateAchievements(overall: number, breakdown: any): ProductivityScore['achievements'] {
    const achievements = [];
    const now = new Date();

    if (overall >= 80) {
      achievements.push({
        name: 'Plant Care Expert',
        nameThai: 'ผู้เชี่ยวชาญดูแลพืช',
        description: 'Achieved excellent care standards',
        descriptionThai: 'บรรลุมาตรฐานการดูแลที่ยอดเยี่ยม',
        unlockedAt: now,
        category: 'growth' as const,
      });
    }

    if (breakdown.consistency >= 90) {
      achievements.push({
        name: 'Consistency Champion',
        nameThai: 'แชมป์ความสม่ำเสมอ',
        description: 'Maintained excellent care consistency',
        descriptionThai: 'รักษาความสม่ำเสมอในการดูแลได้อย่างยอดเยี่ยม',
        unlockedAt: now,
        category: 'consistency' as const,
      });
    }

    return achievements;
  }

  private getSeasonMonths(season: 'hot' | 'rainy' | 'cool' | 'winter'): number[] {
    // Thailand seasons (simplified)
    switch (season) {
      case 'hot': return [3, 4, 5]; // March-May
      case 'rainy': return [6, 7, 8, 9]; // June-September
      case 'cool': return [10, 11, 12]; // October-December
      case 'winter': return [1, 2]; // January-February
      default: return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    }
  }

  private getSeasonCommonIssues(season: 'hot' | 'rainy' | 'cool' | 'winter'): { en: string[]; th: string[] } {
    const issues = {
      hot: {
        en: ['Heat stress', 'Increased water needs', 'Sunburn'],
        th: ['ความเครียดจากความร้อน', 'ความต้องการน้ำเพิ่มขึ้น', 'ใบไหม้แดด'],
      },
      rainy: {
        en: ['Fungal infections', 'Root rot', 'Overwatering'],
        th: ['การติดเชื้อรา', 'รากเน่า', 'น้ำมากเกินไป'],
      },
      cool: {
        en: ['Reduced growth', 'Less frequent watering', 'Cold sensitivity'],
        th: ['การเจริญเติบโตลดลง', 'รดน้ำน้อยลง', 'ความไวต่อความเย็น'],
      },
      winter: {
        en: ['Dormancy period', 'Minimal care needed', 'Protection required'],
        th: ['ช่วงพักการเจริญเติบโต', 'ต้องการการดูแลน้อยที่สุด', 'ต้องการการป้องกัน'],
      },
    };

    return issues[season];
  }

  private getSeasonRecommendations(season: 'hot' | 'rainy' | 'cool' | 'winter'): { en: string[]; th: string[] } {
    const recommendations = {
      hot: {
        en: ['Increase watering frequency', 'Provide shade during peak hours', 'Monitor for heat stress'],
        th: ['เพิ่มความถี่ในการรดน้ำ', 'ให้ร่มเงาในช่วงที่แดดแรง', 'ติดตามความเครียดจากความร้อน'],
      },
      rainy: {
        en: ['Reduce watering', 'Ensure good drainage', 'Watch for fungal issues'],
        th: ['ลดการรดน้ำ', 'ให้มีการระบายน้ำที่ดี', 'ระวังปัญหาเชื้อรา'],
      },
      cool: {
        en: ['Reduce fertilization', 'Adjust watering schedule', 'Prepare for dormancy'],
        th: ['ลดการใส่ปุ๋ย', 'ปรับตารางการรดน้ำ', 'เตรียมพร้อมสำหรับการพักการเจริญเติบโต'],
      },
      winter: {
        en: ['Minimal intervention', 'Protect from cold', 'Plan for spring restart'],
        th: ['การแทรกแซงน้อยที่สุด', 'ป้องกันจากความเย็น', 'วางแผนเริ่มใหม่ในฤดูใบไม้ผลิ'],
      },
    };

    return recommendations[season];
  }

  private getMockWeatherCorrelation(factor: string, kind: ActivityKind): number {
    // Mock correlations for demonstration
    const correlations: Record<string, Record<ActivityKind, number>> = {
      temperature: {
        'รดน้ำ': 0.7,
        'ใส่ปุ๋ย': 0.3,
        'พ่นยา': -0.2,
        'ย้ายกระถาง': -0.1,
        'ตรวจใบ': 0.4,
      },
      humidity: {
        'รดน้ำ': -0.6,
        'ใส่ปุ๋ย': 0.1,
        'พ่นยา': 0.5,
        'ย้ายกระถาง': 0.0,
        'ตรวจใบ': 0.3,
      },
      rainfall: {
        'รดน้ำ': -0.8,
        'ใส่ปุ๋ย': -0.3,
        'พ่นยา': -0.4,
        'ย้ายกระถาง': -0.6,
        'ตรวจใบ': 0.2,
      },
      uvIndex: {
        'รดน้ำ': 0.5,
        'ใส่ปุ๋ย': 0.2,
        'พ่นยา': -0.3,
        'ย้ายกระถาง': -0.4,
        'ตรวจใบ': 0.6,
      },
    };

    return correlations[factor]?.[kind] || 0;
  }

  private generateLineChartData(dataType: string, plantId?: string): InsightResponse<LineChartData> {
    const startTime = Date.now();

    try {
      let data: ChartDataPoint[];
      let title: string;
      let titleThai: string;

      switch (dataType) {
        case 'health_trends':
          if (plantId) {
            const trendsResponse = this.calculateHealthTrends(plantId);
            if (!trendsResponse.success) {
              return trendsResponse as any;
            }

            data = trendsResponse.data!.dataPoints.map(point => ({
              x: point.date.toISOString().split('T')[0],
              y: point.healthScore,
              label: `Health: ${Math.round(point.healthScore)}`,
            }));
            title = 'Plant Health Trends';
            titleThai = 'แนวโน้มสุขภาพพืช';
          } else {
            // Overall health trends
            const now = new Date();
            data = Array.from({ length: 30 }, (_, i) => {
              const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
              return {
                x: date.toISOString().split('T')[0],
                y: this.getAverageHealthScore() + (Math.random() - 0.5) * 20,
                label: `Health: ${Math.round(this.getAverageHealthScore())}`,
              };
            });
            title = 'Overall Health Trends';
            titleThai = 'แนวโน้มสุขภาพโดยรวม';
          }
          break;

        case 'activity_trends':
          const trendsResponse = this.getActivityTrends('month');
          if (!trendsResponse.success || !trendsResponse.data || trendsResponse.data.length === 0) {
            data = [];
            title = 'Activity Trends';
            titleThai = 'แนวโน้มกิจกรรม';
          } else {
            data = trendsResponse.data[0].data; // Use first activity type
            title = trendsResponse.data[0].title;
            titleThai = trendsResponse.data[0].titleThai;
          }
          break;

        default:
          return {
            success: false,
            error: { code: 'INVALID_DATA_TYPE', message: 'Unsupported line chart data type' },
            cached: false,
            computationTime: Date.now() - startTime,
          };
      }

      const chartData: LineChartData = {
        data,
        title,
        titleThai,
        xAxisLabel: 'Date',
        yAxisLabel: 'Value',
        xAxisLabelThai: 'วันที่',
        yAxisLabelThai: 'ค่า',
        trend: data.length > 1 && (data[data.length - 1].y as number) > (data[0].y as number) ? 'up' : 'down',
      };

      return {
        success: true,
        data: chartData,
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate line chart data',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  private generateBarChartData(dataType: string, plantId?: string): InsightResponse<BarChartData> {
    const startTime = Date.now();

    try {
      let data: ChartDataPoint[];
      let title: string;
      let titleThai: string;

      switch (dataType) {
        case 'activity_frequency':
          const activities = plantId
            ? this.activityStore.getActivities(plantId)
            : this.getAllActivities();

          const activityCounts = activities.reduce((acc, activity) => {
            acc[activity.kind] = (acc[activity.kind] || 0) + 1;
            return acc;
          }, {} as Record<ActivityKind, number>);

          data = Object.entries(activityCounts).map(([kind, count]) => ({
            x: kind,
            y: count,
            label: `${kind}: ${count}`,
            color: this.getActivityColor(kind as ActivityKind),
          }));

          title = 'Activity Frequency';
          titleThai = 'ความถี่ของกิจกรรม';
          break;

        case 'plant_health_scores':
          data = this.gardenStore.plants.map(plant => ({
            x: plant.name.substring(0, 10),
            y: this.calculateMockHealthScore(plant, new Date(), 0),
            label: `${plant.name}: ${Math.round(this.calculateMockHealthScore(plant, new Date(), 0))}`,
            color: plant.status === 'Healthy' ? '#10b981' : plant.status === 'Warning' ? '#f59e0b' : '#ef4444',
          }));

          title = 'Plant Health Scores';
          titleThai = 'คะแนนสุขภาพพืช';
          break;

        default:
          return {
            success: false,
            error: { code: 'INVALID_DATA_TYPE', message: 'Unsupported bar chart data type' },
            cached: false,
            computationTime: Date.now() - startTime,
          };
      }

      const chartData: BarChartData = {
        data,
        title,
        titleThai,
        xAxisLabel: 'Category',
        yAxisLabel: 'Count',
        xAxisLabelThai: 'หมวดหมู่',
        yAxisLabelThai: 'จำนวน',
        colorScheme: ['#16a34a', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'],
      };

      return {
        success: true,
        data: chartData,
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate bar chart data',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  private generatePieChartData(dataType: string, plantId?: string): InsightResponse<PieChartData> {
    const startTime = Date.now();

    try {
      let title: string;
      let titleThai: string;
      let rawData: Record<string, number>;

      switch (dataType) {
        case 'activity_distribution':
          const activities = plantId
            ? this.activityStore.getActivities(plantId)
            : this.getAllActivities();

          rawData = activities.reduce((acc, activity) => {
            acc[activity.kind] = (acc[activity.kind] || 0) + 1;
            return acc;
          }, {} as Record<ActivityKind, number>);

          title = 'Activity Distribution';
          titleThai = 'การกระจายกิจกรรม';
          break;

        case 'plant_status_distribution':
          rawData = this.gardenStore.plants.reduce((acc, plant) => {
            acc[plant.status] = (acc[plant.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          title = 'Plant Status Distribution';
          titleThai = 'การกระจายสถานะพืช';
          break;

        default:
          return {
            success: false,
            error: { code: 'INVALID_DATA_TYPE', message: 'Unsupported pie chart data type' },
            cached: false,
            computationTime: Date.now() - startTime,
          };
      }

      const total = Object.values(rawData).reduce((sum, count) => sum + count, 0);
      const colors = ['#16a34a', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

      const data = Object.entries(rawData).map(([label, value], index) => ({
        value,
        label,
        labelThai: label, // In real app, would have proper translations
        color: colors[index % colors.length],
        percentage: Math.round((value / total) * 100),
      }));

      const chartData: PieChartData = {
        data,
        title,
        titleThai,
        total,
      };

      return {
        success: true,
        data: chartData,
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPUTATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate pie chart data',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    }
  }

  private getActivityColor(kind: ActivityKind): string {
    const colors: Record<ActivityKind, string> = {
      'รดน้ำ': '#3b82f6', // blue
      'ใส่ปุ๋ย': '#10b981', // green
      'พ่นยา': '#f59e0b', // amber
      'ย้ายกระถาง': '#8b5cf6', // purple
      'ตรวจใบ': '#6b7280', // gray
    };
    return colors[kind] || '#6b7280';
  }
}

// Export singleton instance
export const insightsService = new InsightsService();

// Export individual methods for convenience
export const {
  analyzeActivityPatterns,
  getActivityTrends,
  getCareEffectiveness,
  getOptimalCareSchedule,
  calculateHealthTrends,
  predictHealthDecline,
  getHealthFactors,
  generateHealthReport,
  getSeasonalPatterns,
  getWeatherCorrelation,
  getSeasonalRecommendations,
  getUserCareHabits,
  getEngagementMetrics,
  getProductivityScore,
  getPersonalizedTips,
  comparePlantPerformance,
  getBenchmarkData,
  getImprovementAreas,
  aggregateActivityData,
  calculateMetrics,
  generateChartData,
  exportAnalytics,
} = insightsService;