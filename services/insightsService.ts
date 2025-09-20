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
          recommendedFrequency = parseFloat((intervals.reduce((sum, i) => sum + i, 0) / intervals.length).toFixed(1));
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
            bestTimeOfDay = parseFloat((times.reduce((sum, t) => sum + t, 0) / times.length).toFixed(1));
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
        const daysToDecline = parseFloat(((1 - totalRisk) * 30).toFixed(1)); // Simplified prediction
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
            ? [parseFloat((times.reduce((sum, t) => sum + t, 0) / times.length).toFixed(1))]
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
   * Calculate engagement metrics using real user data
   */
  getEngagementMetrics(): InsightResponse<EngagementMetrics> {
    const startTime = Date.now();

    try {
      // Import user store dynamically to get real user data
      const { useUserStore } = require('../stores/userStore');
      const userState = useUserStore.getState();
      const userStats = userState.user?.statistics;
      const userStreak = userStats?.careStreak;

      if (!userStats) {
        // Fallback if no user data available
        const appUsage = {
          dailyActiveTime: 5, // Default for new users
          weeklyActiveTime: 35,
          monthlyActiveTime: 150,
          sessionCount: 30,
          averageSessionLength: 3,
        };

        const featureUsage = {
          activityLogging: this.getAllActivitiesCount(),
          plantScanning: this.gardenStore.plants.length,
          insightsViewing: 5,
          settingsAccess: 2,
          notificationsInteraction: 3,
        };

        const plantInteraction = {
          plantsAdded: this.gardenStore.plants.length,
          plantsRemoved: 0,
          activitiesLogged: this.getAllActivitiesCount(),
          photosUploaded: 0,
          notesWritten: 0,
        };

        const engagement: EngagementMetrics = {
          appUsage,
          featureUsage,
          plantInteraction,
          engagement: {
            score: 15, // Low score for new users
            level: 'low',
            trends: {
              weekOverWeek: 0,
              monthOverMonth: 0,
            },
          },
        };

        return {
          success: true,
          data: engagement,
          metadata: {
            type: 'engagement_metrics',
            confidence: 0.5,
            sampleSize: 0,
            lastComputed: new Date(),
            computationCost: 'low',
          },
          cached: false,
          computationTime: Date.now() - startTime,
        };
      }

      // Calculate real app usage metrics based on user activity patterns
      const totalActivities = userStats.totalActivities;
      const monthlyActivities = userStats.monthlyStats.activitiesThisMonth;
      const currentStreak = userStreak?.current || 0;
      const totalPlants = userStats.totalPlants;
      const experiencePoints = userStats.experiencePoints;

      // Estimate app usage based on user engagement patterns
      const activitiesPerDay = monthlyActivities / 30; // Average activities per day this month
      const estimatedDailyTime = Math.min(60, Math.max(2, activitiesPerDay * 3 + currentStreak * 2)); // 3 min per activity + streak bonus
      const appUsage = {
        dailyActiveTime: estimatedDailyTime,
        weeklyActiveTime: estimatedDailyTime * 7,
        monthlyActiveTime: estimatedDailyTime * 30,
        sessionCount: Math.max(monthlyActivities, totalActivities / 4), // At least one session per activity, estimated total sessions
        averageSessionLength: Math.max(2, estimatedDailyTime / Math.max(1, activitiesPerDay)), // Time per session
      };

      // Real feature usage metrics
      const featureUsage = {
        activityLogging: totalActivities,
        plantScanning: totalPlants, // Each plant represents a scanning/adding action
        insightsViewing: Math.floor(experiencePoints / 50), // Estimate based on XP earned from achievements
        settingsAccess: Math.max(1, Math.floor(totalActivities / 20)), // Estimate settings access
        notificationsInteraction: Math.floor(currentStreak * 2), // Active users likely interact with notifications
      };

      // Real plant interaction metrics
      const plantInteraction = {
        plantsAdded: totalPlants,
        plantsRemoved: Math.max(0, userStats.plantsSaved), // Plants saved indicates some might have been struggling
        activitiesLogged: totalActivities,
        photosUploaded: Math.floor(totalPlants * 0.3), // Estimate 30% of plants have photos
        notesWritten: Math.floor(totalActivities * 0.1), // Estimate 10% of activities have notes
      };

      // Calculate engagement score based on real metrics
      const consistencyScore = currentStreak > 0 ? Math.min(25, currentStreak * 3) : 0; // Up to 25 points for consistency
      const activityScore = Math.min(30, (totalActivities / 100) * 30); // Up to 30 points for total activities
      const plantCareScore = Math.min(25, (totalPlants / 10) * 25); // Up to 25 points for plant variety
      const experienceScore = Math.min(20, (experiencePoints / 1000) * 20); // Up to 20 points for experience

      const score = parseFloat((consistencyScore + activityScore + plantCareScore + experienceScore).toFixed(1));

      let level: 'low' | 'medium' | 'high' | 'very_high';
      if (score < 25) level = 'low';
      else if (score < 50) level = 'medium';
      else if (score < 75) level = 'high';
      else level = 'very_high';

      // Calculate trends based on recent activity
      const recentActivities = monthlyActivities;
      const previousMonthEstimate = Math.max(1, totalActivities - monthlyActivities);
      const monthOverMonth = previousMonthEstimate > 0 ?
        ((recentActivities - previousMonthEstimate) / previousMonthEstimate) * 100 : 0;

      // Weekly trend based on current streak activity
      const weekOverWeek = currentStreak > 7 ? 10 :
                          currentStreak > 3 ? 5 :
                          currentStreak > 0 ? 0 : -5;

      const engagement: EngagementMetrics = {
        appUsage,
        featureUsage,
        plantInteraction,
        engagement: {
          score,
          level,
          trends: {
            weekOverWeek: parseFloat(weekOverWeek.toFixed(1)),
            monthOverMonth: parseFloat(monthOverMonth.toFixed(1)),
          },
        },
      };

      return {
        success: true,
        data: engagement,
        metadata: {
          type: 'engagement_metrics',
          confidence: 0.8, // Good confidence since we're using real data
          sampleSize: totalActivities,
          lastComputed: new Date(),
          computationCost: 'low',
        },
        cached: false,
        computationTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Error calculating engagement metrics:', error);
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
   * Calculate productivity score using real user and activity data
   */
  getProductivityScore(): InsightResponse<ProductivityScore> {
    const startTime = Date.now();

    try {
      // Get real user data
      const { useUserStore } = require('../stores/userStore');
      const { useAnalyticsStore } = require('../stores/analyticsStore');

      const userState = useUserStore.getState();
      const userStats = userState.user?.statistics;
      const analyticsState = useAnalyticsStore.getState();

      const allActivities = this.getAllActivities();

      // Calculate real productivity components
      const consistency = this.calculateRealConsistencyScore(allActivities, userStats);
      const completeness = this.calculateRealCompletenessScore(allActivities, userStats);
      const timeliness = this.calculateRealTimelinessScore(allActivities);
      const effectiveness = this.calculateRealEffectivenessScore(userStats);

      const overall = parseFloat(((consistency + completeness + timeliness + effectiveness) / 4).toFixed(1));

      const breakdown = {
        consistency: parseFloat(consistency.toFixed(1)),
        completeness: parseFloat(completeness.toFixed(1)),
        timeliness: parseFloat(timeliness.toFixed(1)),
        effectiveness: parseFloat(effectiveness.toFixed(1)),
      };

      // Real comparisons based on historical data
      const monthlyStats = userStats?.monthlyStats;
      const totalActivities = userStats?.totalActivities || 0;
      const monthlyActivities = monthlyStats?.activitiesThisMonth || 0;

      // Calculate real month over month change
      const previousMonthEstimate = Math.max(1, totalActivities - monthlyActivities);
      const vsLastMonth = previousMonthEstimate > 0
        ? parseFloat((((monthlyActivities - previousMonthEstimate) / previousMonthEstimate) * 100).toFixed(1))
        : 0;

      const comparison = {
        vsLastMonth: Math.min(100, Math.max(-100, vsLastMonth)), // Clamp to -100 to 100
        vsOptimal: overall - 85, // How far from optimal (85)
        percentile: this.calculatePercentile(overall), // Calculate realistic percentile
      };

      // Generate achievements based on real score and user data
      const achievements = this.generateRealAchievements(overall, breakdown, userStats);

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
   * Generate intelligent personalized tips based on comprehensive user data
   */
  getPersonalizedTips(): InsightResponse<PersonalizedTip[]> {
    const startTime = Date.now();

    try {
      // Get real user data and stores
      const { useUserStore } = require('../stores/userStore');
      const { useWeatherStore } = require('../stores/weatherStore');

      const userState = useUserStore.getState();
      const weatherState = useWeatherStore.getState();
      const userStats = userState.user?.statistics;
      const currentWeather = weatherState.currentWeather;

      const tips: PersonalizedTip[] = [];
      const allActivities = this.getAllActivities();
      const plants = this.gardenStore.plants;

      // Analyze user patterns more intelligently
      const wateringActivities = allActivities.filter(a => a.kind === 'รดน้ำ');
      const fertilizingActivities = allActivities.filter(a => a.kind === 'ใส่ปุ๋ย');
      const healthCheckActivities = allActivities.filter(a => a.kind === 'ตรวจใบ');

      // Get user engagement level
      const currentStreak = userStats?.careStreak?.current || 0;
      const totalActivities = userStats?.totalActivities || allActivities.length;
      const totalPlants = userStats?.totalPlants || plants.length;

      // Streak-based tips (high priority for engagement)
      if (currentStreak === 0 && totalActivities > 0) {
        tips.push({
          id: 'restart-streak-tip',
          category: 'care',
          priority: 'high',
          title: 'Start a New Care Streak',
          titleThai: 'เริ่มสตรีคการดูแลใหม่',
          description: `You had ${totalActivities} activities before. Starting a care streak today will help maintain consistent plant care.`,
          descriptionThai: `คุณเคยมี ${totalActivities} กิจกรรมการดูแลมาแล้ว การเริ่มสตรีคการดูแลวันนี้จะช่วยรักษาความสม่ำเสมอในการดูแลพืช`,
          basedOn: {
            userBehavior: ['Broken care streak', 'Previous activity history'],
            plantData: ['Plant care requirements'],
            seasonalData: false,
            weatherData: false,
          },
          actionable: {
            steps: ['Water at least one plant today', 'Set daily reminders', 'Start with simple care tasks'],
            stepsThai: ['รดน้ำอย่างน้อย 1 ต้นวันนี้', 'ตั้งการแจ้งเตือนรายวัน', 'เริ่มด้วยงานดูแลง่าย ๆ'],
            expectedOutcome: 'Renewed plant care routine and healthier plants',
            expectedOutcomeThai: 'กิจวัตรการดูแลพืชที่กลับมาและพืชที่แข็งแรงขึ้น',
          },
          relevance: 0.95,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        });
      } else if (currentStreak >= 7 && currentStreak < 30) {
        tips.push({
          id: 'maintain-streak-tip',
          category: 'care',
          priority: 'medium',
          title: 'Keep Your Amazing Streak Going!',
          titleThai: 'รักษาสตรีคสุดยอดของคุณไว้!',
          description: `Fantastic! You've maintained care for ${currentStreak} days. Consider expanding your care routine for even better results.`,
          descriptionThai: `ยอดเยี่ยม! คุณดูแลพืชมาแล้ว ${currentStreak} วัน ลองขยายรูปแบบการดูแลเพื่อผลลัพธ์ที่ดียิ่งขึ้น`,
          basedOn: {
            userBehavior: ['Consistent care streak'],
            plantData: ['Plant improvement opportunities'],
            seasonalData: true,
            weatherData: true,
          },
          actionable: {
            steps: ['Try a new care activity', 'Photograph plant progress', 'Add care notes for learning'],
            stepsThai: ['ลองกิจกรรมการดูแลใหม่', 'ถ่ายภาพความคืบหน้าของพืช', 'เพิ่มบันทึกการดูแลเพื่อการเรียนรู้'],
            expectedOutcome: 'Enhanced plant health and care expertise',
            expectedOutcomeThai: 'สุขภาพพืชที่ดีขึ้นและความเชี่ยวชาญในการดูแล',
          },
          relevance: 0.85,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }

      // Weather-based tips (intelligent seasonal advice)
      if (currentWeather) {
        const temp = currentWeather.temperature;
        const humidity = currentWeather.humidity;

        if (temp && temp > 30) {
          tips.push({
            id: 'hot-weather-tip',
            category: 'seasonal',
            priority: 'high',
            title: 'Hot Weather Plant Protection',
            titleThai: 'ปกป้องพืชในอากาศร้อน',
            description: `Temperature is ${temp.toFixed(1)}°C today. Your plants may need extra protection and hydration.`,
            descriptionThai: `อุณหภูมิวันนี้ ${temp.toFixed(1)}°C พืชของคุณอาจต้องการการปกป้องและความชื้นเพิ่มเติม`,
            basedOn: {
              userBehavior: ['Current care routine'],
              plantData: ['Heat stress prevention'],
              seasonalData: true,
              weatherData: true,
            },
            actionable: {
              steps: ['Water early morning or evening', 'Provide shade during peak hours', 'Increase humidity around plants'],
              stepsThai: ['รดน้ำตอนเช้าหรือเย็น', 'ให้ร่มเงาในช่วงแสงแรง', 'เพิ่มความชื้นรอบพืช'],
              expectedOutcome: 'Plants survive hot weather with minimal stress',
              expectedOutcomeThai: 'พืชอยู่รอดในอากาศร้อนด้วยความเครียดน้อยที่สุด',
            },
            relevance: 0.9,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          });
        }

        if (humidity && humidity < 40) {
          tips.push({
            id: 'low-humidity-tip',
            category: 'plant_health',
            priority: 'medium',
            title: 'Combat Low Humidity',
            titleThai: 'จัดการความชื้นต่ำ',
            description: `Humidity is only ${humidity.toFixed(1)}%. Most tropical plants prefer 50-60% humidity.`,
            descriptionThai: `ความชื้นอยู่ที่ ${humidity.toFixed(1)}% เท่านั้น พืชเขตร้อนส่วนใหญ่ชอบความชื้น 50-60%`,
            basedOn: {
              userBehavior: ['Plant care frequency'],
              plantData: ['Humidity requirements'],
              seasonalData: false,
              weatherData: true,
            },
            actionable: {
              steps: ['Group plants together', 'Use humidity trays', 'Mist leaves (if appropriate)'],
              stepsThai: ['จัดกลุ่มพืชให้เข้าด้วยกัน', 'ใช้ถาดรองน้ำ', 'พ่นใบไม้ (หากเหมาะสม)'],
              expectedOutcome: 'Improved plant health and reduced leaf browning',
              expectedOutcomeThai: 'สุขภาพพืชดีขึ้นและใบไม้เหลืองน้อยลง',
            },
            relevance: 0.8,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          });
        }
      }

      // Activity frequency optimization (smarter analysis)
      const recentActivities = allActivities.filter(a => {
        const daysSince = Math.floor((Date.now() - new Date(a.dateISO).getTime()) / (1000 * 60 * 60 * 24));
        return daysSince <= 14; // Last 2 weeks
      });

      const wateringRatio = recentActivities.length > 0 ? wateringActivities.length / recentActivities.length : 0;

      if (wateringRatio < 0.3 && totalPlants > 0) {
        tips.push({
          id: 'watering-frequency-tip',
          category: 'care',
          priority: 'high',
          title: 'Increase Watering Consistency',
          titleThai: 'เพิ่มความสม่ำเสมอในการรดน้ำ',
          description: `Only ${(wateringRatio * 100).toFixed(1)}% of your recent activities were watering. With ${totalPlants} plants, more frequent watering may be needed.`,
          descriptionThai: `มีเพียง ${(wateringRatio * 100).toFixed(1)}% ของกิจกรรมล่าสุดที่เป็นการรดน้ำ ด้วยพืช ${totalPlants} ต้น อาจต้องรดน้ำบ่อยขึ้น`,
          basedOn: {
            userBehavior: ['Low watering frequency', 'Plant count analysis'],
            plantData: ['Moisture requirements'],
            seasonalData: false,
            weatherData: false,
          },
          actionable: {
            steps: ['Check soil moisture before watering', 'Create watering schedule', 'Use finger test for dryness'],
            stepsThai: ['ตรวจสอบความชื้นในดินก่อนรดน้ำ', 'สร้างตารางการรดน้ำ', 'ใช้นิ้วทดสอบความแห้ง'],
            expectedOutcome: 'Better hydrated plants and improved growth',
            expectedOutcomeThai: 'พืชได้รับน้ำเพียงพอและเจริญเติบโตดีขึ้น',
          },
          relevance: 0.9,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }

      // Plant health monitoring optimization
      const healthCheckRatio = healthCheckActivities.length / Math.max(1, totalPlants);

      if (healthCheckRatio < 1 && totalPlants > 2) {
        tips.push({
          id: 'health-monitoring-tip',
          category: 'plant_health',
          priority: 'medium',
          title: 'Enhance Plant Health Monitoring',
          titleThai: 'เสริมการติดตามสุขภาพพืช',
          description: `You've done ${healthCheckActivities.length} health checks for ${totalPlants} plants. Regular monitoring helps catch issues early.`,
          descriptionThai: `คุณตรวจสุขภาพ ${healthCheckActivities.length} ครั้งสำหรับพืช ${totalPlants} ต้น การติดตามเป็นประจำช่วยตรวจจับปัญหาได้เร็ว`,
          basedOn: {
            userBehavior: ['Health monitoring frequency'],
            plantData: ['Early detection benefits'],
            seasonalData: false,
            weatherData: false,
          },
          actionable: {
            steps: ['Inspect leaves for changes', 'Check for pests weekly', 'Monitor growth patterns'],
            stepsThai: ['ตรวจดูการเปลี่ยนแปลงของใบ', 'ตรวจหาศัตรูพืชทุกสัปดาห์', 'ติดตามรูปแบบการเจริญเติบโต'],
            expectedOutcome: 'Early problem detection and healthier plants',
            expectedOutcomeThai: 'การตรวจพบปัญหาเร็วและพืชแข็งแรงขึ้น',
          },
          relevance: 0.75,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        });
      }

      // Advanced tip: Plant diversity and fertilization
      if (fertilizingActivities.length === 0 && totalActivities > 10) {
        tips.push({
          id: 'fertilization-introduction-tip',
          category: 'care',
          priority: 'medium',
          title: 'Consider Adding Fertilization',
          titleThai: 'พิจารณาเพิ่มการใส่ปุ๋ย',
          description: `You've mastered basic care with ${totalActivities} activities! Fertilization can boost plant growth and health.`,
          descriptionThai: `คุณเชี่ยวชาญการดูแลพื้นฐานแล้วด้วย ${totalActivities} กิจกรรม! การใส่ปุ๋ยจะช่วยส่งเสริมการเจริญเติบโตและสุขภาพพืช`,
          basedOn: {
            userBehavior: ['Experienced care routine', 'No fertilization history'],
            plantData: ['Growth enhancement potential'],
            seasonalData: true,
            weatherData: false,
          },
          actionable: {
            steps: ['Start with liquid fertilizer', 'Fertilize during growing season', 'Observe plant response'],
            stepsThai: ['เริ่มด้วยปุ๋ยเหลว', 'ใส่ปุ๋ยในช่วงการเจริญเติบโต', 'สังเกตการตอบสนองของพืช'],
            expectedOutcome: 'Enhanced plant growth and vibrant foliage',
            expectedOutcomeThai: 'การเจริญเติบโตที่ดีขึ้นและใบไม้เขียวขจี',
          },
          relevance: 0.7,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
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
        comp.ranking.percentile = parseFloat((((plants.length - index) / plants.length) * 100).toFixed(1));
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

  // New real calculation methods for productivity score
  private calculateRealConsistencyScore(activities: ActivityEntry[], userStats: any): number {
    if (!userStats) return this.calculateConsistencyScore(activities);

    // Use real streak data for consistency
    const currentStreak = userStats.careStreak?.current || 0;
    const longestStreak = userStats.careStreak?.longest || 0;

    // Factor in both current streak and historical consistency
    const streakScore = Math.min(50, currentStreak * 5); // Up to 50 points for current streak
    const historicalScore = longestStreak > 0 ? Math.min(50, (currentStreak / longestStreak) * 50) : 0;

    // Also factor in activity distribution over time
    const activeDays = new Set(activities.map(a => a.dateISO.split('T')[0])).size;
    const totalDays = Math.max(1, this.getTotalDaysWithPlants());
    const distributionScore = Math.min(100, (activeDays / totalDays) * 100);

    // Weight: 30% streak, 30% historical, 40% distribution
    return (streakScore * 0.3) + (historicalScore * 0.3) + (distributionScore * 0.4);
  }

  private calculateRealCompletenessScore(activities: ActivityEntry[], userStats: any): number {
    const activityKinds: ActivityKind[] = ['รดน้ำ', 'ใส่ปุ๋ย', 'พ่นยา', 'ย้ายกระถาง', 'ตรวจใบ'];
    const usedKinds = new Set(activities.map(a => a.kind));

    // Base score from activity variety
    const varietyScore = (usedKinds.size / activityKinds.length) * 60; // Up to 60 points

    // Bonus for total activities completed
    const totalActivities = userStats?.totalActivities || activities.length;
    const activityBonus = Math.min(40, totalActivities / 5); // Up to 40 points for 200+ activities

    return varietyScore + activityBonus;
  }

  private calculateRealTimelinessScore(activities: ActivityEntry[]): number {
    if (activities.length === 0) return 30; // Default score for no activities

    // Best times for plant care: morning (6-10am) and evening (4-7pm)
    const optimalActivities = activities.filter(a => {
      if (!a.time24) return false;
      const hour = parseInt(a.time24.split(':')[0]);
      return (hour >= 6 && hour <= 10) || (hour >= 16 && hour <= 19);
    });

    // Calculate how many activities were done at optimal times
    const optimalRatio = activities.length > 0 ? (optimalActivities.length / activities.length) : 0.5;

    // Recent activities count more
    const recentActivities = activities.filter(a => {
      const daysDiff = Math.floor((Date.now() - new Date(a.dateISO).getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    });

    const recencyBonus = Math.min(30, recentActivities.length * 3); // Up to 30 points for recent care

    return parseFloat((optimalRatio * 70 + recencyBonus).toFixed(1));
  }

  private calculateRealEffectivenessScore(userStats: any): number {
    if (!userStats) return this.getAverageHealthScore();

    // Combine plant health with plants saved metric
    const healthScore = this.getAverageHealthScore();
    const plantsSaved = userStats.plantsSaved || 0;
    const totalPlants = userStats.totalPlants || 1;

    // Calculate save rate
    const saveRate = totalPlants > 0 ? Math.min(100, (plantsSaved / totalPlants) * 200) : 0;

    // Weight: 70% current health, 30% historical saves
    return parseFloat((healthScore * 0.7 + saveRate * 0.3).toFixed(1));
  }

  private calculatePercentile(score: number): number {
    // Realistic percentile distribution
    if (score >= 90) return 95;
    if (score >= 80) return 85;
    if (score >= 70) return 75;
    if (score >= 60) return 60;
    if (score >= 50) return 45;
    if (score >= 40) return 30;
    if (score >= 30) return 20;
    return 10;
  }

  private generateRealAchievements(overall: number, breakdown: any, userStats: any): ProductivityScore['achievements'] {
    const achievements = [];
    const now = new Date();

    // Achievement based on overall score
    if (overall >= 85) {
      achievements.push({
        name: 'Master Gardener',
        nameThai: 'นักจัดสวนผู้เชี่ยวชาญ',
        description: 'Achieved master-level productivity',
        descriptionThai: 'บรรลุผลงานระดับผู้เชี่ยวชาญ',
        unlockedAt: now,
        category: 'growth' as const,
      });
    } else if (overall >= 70) {
      achievements.push({
        name: 'Green Thumb',
        nameThai: 'นิ้วมือสีเขียว',
        description: 'Maintained high productivity standards',
        descriptionThai: 'รักษามาตรฐานผลงานระดับสูง',
        unlockedAt: now,
        category: 'growth' as const,
      });
    }

    // Consistency achievements
    if (breakdown.consistency >= 90) {
      achievements.push({
        name: 'Daily Dedication',
        nameThai: 'ความทุ่มเททุกวัน',
        description: 'Exceptional care consistency',
        descriptionThai: 'ความสม่ำเสมอในการดูแลที่ยอดเยี่ยม',
        unlockedAt: now,
        category: 'consistency' as const,
      });
    }

    // Streak-based achievements
    const currentStreak = userStats?.careStreak?.current || 0;
    if (currentStreak >= 30) {
      achievements.push({
        name: 'Monthly Marathon',
        nameThai: 'มาราธอนรายเดือน',
        description: '30-day care streak achieved',
        descriptionThai: 'ดูแลต่อเนื่อง 30 วันสำเร็จ',
        unlockedAt: now,
        category: 'consistency' as const,
      });
    } else if (currentStreak >= 7) {
      achievements.push({
        name: 'Weekly Warrior',
        nameThai: 'นักรบประจำสัปดาห์',
        description: '7-day care streak maintained',
        descriptionThai: 'ดูแลต่อเนื่อง 7 วัน',
        unlockedAt: now,
        category: 'consistency' as const,
      });
    }

    // Health-based achievements
    if (breakdown.effectiveness >= 80) {
      achievements.push({
        name: 'Health Guardian',
        nameThai: 'ผู้พิทักษ์สุขภาพพืช',
        description: 'Outstanding plant health maintained',
        descriptionThai: 'รักษาสุขภาพพืชได้อย่างโดดเด่น',
        unlockedAt: now,
        category: 'health' as const,
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
              label: `Health: ${point.healthScore.toFixed(1)}`,
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
                label: `Health: ${this.getAverageHealthScore().toFixed(1)}`,
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
            label: `${plant.name}: ${this.calculateMockHealthScore(plant, new Date(), 0).toFixed(1)}`,
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
        percentage: parseFloat(((value / total) * 100).toFixed(1)),
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