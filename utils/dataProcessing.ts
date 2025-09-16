import { ActivityEntry, ActivityKind, Plant } from '../types';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AnalyticsDataPoint {
  x: Date;
  y: number;
  label?: string;
}

export interface WateringPattern {
  plantId: string;
  plantName: string;
  frequency: number; // days between watering
  consistency: number; // 0-1, higher is more consistent
  volume: number; // average ml per watering
}

export interface FertilizerUsage {
  plantId: string;
  plantName: string;
  totalAmount: number;
  frequency: number;
  npkRatio: { n: number; p: number; k: number };
}

export interface PlantHealthTrend {
  plantId: string;
  plantName: string;
  trend: 'improving' | 'stable' | 'declining';
  score: number; // 0-100
  dataPoints: AnalyticsDataPoint[];
}

export interface ActivityHeatmapData {
  date: Date;
  count: number;
  activities: ActivityKind[];
}

export interface CareInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'achievement';
  title: string;
  description: string;
  plantId?: string;
  actionable?: boolean;
  data?: any;
}

/**
 * Calculate watering frequency for a plant
 */
export const calculateWateringFrequency = (activities: ActivityEntry[]): number => {
  const wateringActivities = activities
    .filter(a => a.kind === 'รดน้ำ')
    .map(a => new Date(a.dateISO))
    .sort((a, b) => b.getTime() - a.getTime());

  if (wateringActivities.length < 2) return 0;

  const intervals = [];
  for (let i = 0; i < wateringActivities.length - 1; i++) {
    const days = (wateringActivities[i].getTime() - wateringActivities[i + 1].getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(days);
  }

  return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
};

/**
 * Calculate consistency score (0-1) based on watering intervals
 */
export const calculateConsistency = (activities: ActivityEntry[]): number => {
  const wateringActivities = activities
    .filter(a => a.kind === 'รดน้ำ')
    .map(a => new Date(a.dateISO))
    .sort((a, b) => b.getTime() - a.getTime());

  if (wateringActivities.length < 3) return 0;

  const intervals = [];
  for (let i = 0; i < wateringActivities.length - 1; i++) {
    const days = (wateringActivities[i].getTime() - wateringActivities[i + 1].getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(days);
  }

  const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // Lower standard deviation = higher consistency
  // Normalize to 0-1 scale
  return Math.max(0, 1 - (stdDev / mean));
};

/**
 * Calculate average watering volume
 */
export const calculateAverageVolume = (activities: ActivityEntry[]): number => {
  const wateringWithVolume = activities
    .filter(a => a.kind === 'รดน้ำ' && a.quantity && parseFloat(a.quantity) > 0);

  if (wateringWithVolume.length === 0) return 0;

  const total = wateringWithVolume.reduce((sum, a) => sum + (parseFloat(a.quantity || '0')), 0);
  return total / wateringWithVolume.length;
};

/**
 * Generate watering patterns for all plants
 */
export const generateWateringPatterns = (
  plants: Plant[],
  allActivities: Record<string, ActivityEntry[]>
): WateringPattern[] => {
  return plants.map(plant => ({
    plantId: plant.id,
    plantName: plant.name,
    frequency: calculateWateringFrequency(allActivities[plant.id] || []),
    consistency: calculateConsistency(allActivities[plant.id] || []),
    volume: calculateAverageVolume(allActivities[plant.id] || [])
  }));
};

/**
 * Calculate fertilizer usage statistics
 */
export const calculateFertilizerUsage = (
  plants: Plant[],
  allActivities: Record<string, ActivityEntry[]>
): FertilizerUsage[] => {
  return plants.map(plant => {
    const activities = allActivities[plant.id] || [];
    const fertilizerActivities = activities.filter(a => a.kind === 'ใส่ปุ๋ย');

    const totalAmount = fertilizerActivities.reduce((sum, a) => sum + (parseFloat(a.quantity || '0')), 0);
    const frequency = calculateWateringFrequency(fertilizerActivities); // Reuse frequency calculation

    // Calculate average NPK ratio
    const npkActivities = fertilizerActivities.filter(a => a.npk);
    const avgNPK = npkActivities.length > 0
      ? npkActivities.reduce((acc, a) => ({
          n: acc.n + (parseFloat(a.npk?.n || '0')),
          p: acc.p + (parseFloat(a.npk?.p || '0')),
          k: acc.k + (parseFloat(a.npk?.k || '0'))
        }), { n: 0, p: 0, k: 0 })
      : { n: 0, p: 0, k: 0 };

    if (npkActivities.length > 0) {
      avgNPK.n /= npkActivities.length;
      avgNPK.p /= npkActivities.length;
      avgNPK.k /= npkActivities.length;
    }

    return {
      plantId: plant.id,
      plantName: plant.name,
      totalAmount,
      frequency,
      npkRatio: avgNPK
    };
  });
};

/**
 * Generate plant health trend based on activity frequency and consistency
 */
export const generatePlantHealthTrends = (
  plants: Plant[],
  allActivities: Record<string, ActivityEntry[]>,
  dateRange: DateRange
): PlantHealthTrend[] => {
  return plants.map(plant => {
    const activities = allActivities[plant.id] || [];
    const filteredActivities = activities.filter(a => {
      const activityDate = new Date(a.dateISO);
      return activityDate >= dateRange.start && activityDate <= dateRange.end;
    });

    // Calculate health score based on various factors
    const wateringFreq = calculateWateringFrequency(filteredActivities);
    const consistency = calculateConsistency(filteredActivities);
    const activityCount = filteredActivities.length;

    // Health score calculation (0-100)
    let score = 50; // Base score

    // Add points for regular watering (assume ideal frequency is 3-7 days)
    if (wateringFreq >= 3 && wateringFreq <= 7) score += 20;
    else if (wateringFreq > 0) score += 10;

    // Add points for consistency
    score += consistency * 20;

    // Add points for overall activity level
    const activityScore = Math.min(20, activityCount * 2);
    score += activityScore;

    // Determine trend based on recent vs older activities
    const midPoint = new Date((dateRange.start.getTime() + dateRange.end.getTime()) / 2);
    const recentActivities = filteredActivities.filter(a => new Date(a.dateISO) >= midPoint);
    const olderActivities = filteredActivities.filter(a => new Date(a.dateISO) < midPoint);

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentActivities.length > olderActivities.length * 1.2) trend = 'improving';
    else if (recentActivities.length < olderActivities.length * 0.8) trend = 'declining';

    // Generate data points for trend visualization
    const dataPoints = generateHealthDataPoints(filteredActivities, dateRange);

    return {
      plantId: plant.id,
      plantName: plant.name,
      trend,
      score: Math.round(Math.max(0, Math.min(100, score))),
      dataPoints
    };
  });
};

/**
 * Generate data points for health trend visualization
 */
export const generateHealthDataPoints = (
  activities: ActivityEntry[],
  dateRange: DateRange
): AnalyticsDataPoint[] => {
  const points: AnalyticsDataPoint[] = [];
  const dayInMs = 24 * 60 * 60 * 1000;

  // Create weekly intervals
  const startTime = dateRange.start.getTime();
  const endTime = dateRange.end.getTime();
  const weekInMs = 7 * dayInMs;

  for (let time = startTime; time <= endTime; time += weekInMs) {
    const weekStart = new Date(time);
    const weekEnd = new Date(Math.min(time + weekInMs, endTime));

    const weekActivities = activities.filter(a => {
      const activityTime = new Date(a.dateISO).getTime();
      return activityTime >= time && activityTime < time + weekInMs;
    });

    // Calculate health score for this week
    const wateringCount = weekActivities.filter(a => a.kind === 'รดน้ำ').length;
    const otherActivities = weekActivities.filter(a => a.kind !== 'รดน้ำ').length;

    let weekScore = 50;
    weekScore += wateringCount * 10; // Each watering adds points
    weekScore += otherActivities * 5; // Other care activities add points
    weekScore = Math.max(0, Math.min(100, weekScore));

    points.push({
      x: weekStart,
      y: weekScore
    });
  }

  return points;
};

/**
 * Generate activity heatmap data for calendar view
 */
export const generateActivityHeatmap = (
  activities: ActivityEntry[],
  dateRange: DateRange
): ActivityHeatmapData[] => {
  const heatmapData: ActivityHeatmapData[] = [];
  const dayInMs = 24 * 60 * 60 * 1000;

  for (let time = dateRange.start.getTime(); time <= dateRange.end.getTime(); time += dayInMs) {
    const date = new Date(time);
    const dayActivities = activities.filter(a => {
      const activityDate = new Date(a.dateISO);
      return activityDate.toDateString() === date.toDateString();
    });

    const uniqueKinds = [...new Set(dayActivities.map(a => a.kind))];

    heatmapData.push({
      date,
      count: dayActivities.length,
      activities: uniqueKinds
    });
  }

  return heatmapData;
};

/**
 * Generate care insights based on analysis
 */
export const generateCareInsights = (
  plants: Plant[],
  allActivities: Record<string, ActivityEntry[]>,
  wateringPatterns: WateringPattern[],
  healthTrends: PlantHealthTrend[]
): CareInsight[] => {
  const insights: CareInsight[] = [];

  // Check for plants that haven't been watered recently
  plants.forEach(plant => {
    const activities = allActivities[plant.id] || [];
    const lastWatering = activities.find(a => a.kind === 'รดน้ำ');

    if (!lastWatering) {
      insights.push({
        id: `no-water-${plant.id}`,
        type: 'warning',
        title: `${plant.name} needs attention`,
        description: 'No watering activities recorded for this plant',
        plantId: plant.id,
        actionable: true
      });
    } else {
      const daysSinceWatering = (Date.now() - new Date(lastWatering.dateISO).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceWatering > 7) {
        insights.push({
          id: `overdue-water-${plant.id}`,
          type: 'warning',
          title: `${plant.name} may need watering`,
          description: `Last watered ${Math.floor(daysSinceWatering)} days ago`,
          plantId: plant.id,
          actionable: true
        });
      }
    }
  });

  // Check for plants with improving health trends
  healthTrends.forEach(trend => {
    if (trend.trend === 'improving' && trend.score > 70) {
      insights.push({
        id: `improving-${trend.plantId}`,
        type: 'success',
        title: `${trend.plantName} is thriving!`,
        description: `Health score: ${trend.score}/100. Keep up the great care routine!`,
        plantId: trend.plantId
      });
    } else if (trend.trend === 'declining' && trend.score < 50) {
      insights.push({
        id: `declining-${trend.plantId}`,
        type: 'warning',
        title: `${trend.plantName} needs more attention`,
        description: `Health score declining: ${trend.score}/100. Consider adjusting your care routine.`,
        plantId: trend.plantId,
        actionable: true
      });
    }
  });

  // Check for consistent care patterns
  wateringPatterns.forEach(pattern => {
    if (pattern.consistency > 0.8 && pattern.frequency > 0) {
      insights.push({
        id: `consistent-${pattern.plantId}`,
        type: 'achievement',
        title: 'Consistent care achieved!',
        description: `You've been watering ${pattern.plantName} very consistently every ${Math.round(pattern.frequency)} days`,
        plantId: pattern.plantId
      });
    }
  });

  // General achievement insights
  const totalActivities = Object.values(allActivities).flat().length;
  if (totalActivities >= 100) {
    insights.push({
      id: 'activity-milestone',
      type: 'achievement',
      title: '100 Activities Milestone!',
      description: `You've logged ${totalActivities} care activities. Your plants are lucky to have you!`
    });
  }

  return insights;
};

/**
 * Format data for CSV export
 */
export const formatDataForCSV = (
  plants: Plant[],
  allActivities: Record<string, ActivityEntry[]>
): string => {
  const headers = ['Date', 'Plant Name', 'Activity Type', 'Quantity', 'Unit', 'NPK (N-P-K)', 'Notes'];
  const rows = [headers.join(',')];

  plants.forEach(plant => {
    const activities = allActivities[plant.id] || [];
    activities.forEach(activity => {
      const npkString = activity.npk ? `${activity.npk.n}-${activity.npk.p}-${activity.npk.k}` : '';
      const row = [
        new Date(activity.dateISO).toLocaleDateString(),
        plant.name,
        activity.kind,
        activity.quantity || '',
        activity.unit || '',
        npkString,
        activity.note || ''
      ];
      rows.push(row.map(cell => `"${cell}"`).join(','));
    });
  });

  return rows.join('\n');
};

/**
 * Calculate success rate metrics
 */
export interface SuccessMetrics {
  overallScore: number;
  wateringSuccess: number;
  fertilizingSuccess: number;
  consistencyScore: number;
  plantHealthAverage: number;
}

export const calculateSuccessMetrics = (
  plants: Plant[],
  allActivities: Record<string, ActivityEntry[]>,
  healthTrends: PlantHealthTrend[]
): SuccessMetrics => {
  const totalPlants = plants.length;
  if (totalPlants === 0) {
    return {
      overallScore: 0,
      wateringSuccess: 0,
      fertilizingSuccess: 0,
      consistencyScore: 0,
      plantHealthAverage: 0
    };
  }

  // Calculate watering success (plants watered in last 7 days)
  const plantsWateredRecently = plants.filter(plant => {
    const activities = allActivities[plant.id] || [];
    const lastWatering = activities.find(a => a.kind === 'รดน้ำ');
    if (!lastWatering) return false;

    const daysSince = (Date.now() - new Date(lastWatering.dateISO).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  }).length;

  const wateringSuccess = (plantsWateredRecently / totalPlants) * 100;

  // Calculate fertilizing success (plants fertilized in last 30 days)
  const plantsFertilizedRecently = plants.filter(plant => {
    const activities = allActivities[plant.id] || [];
    const lastFertilizing = activities.find(a => a.kind === 'ใส่ปุ๋ย');
    if (!lastFertilizing) return false;

    const daysSince = (Date.now() - new Date(lastFertilizing.dateISO).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  }).length;

  const fertilizingSuccess = (plantsFertilizedRecently / totalPlants) * 100;

  // Calculate average consistency score
  const wateringPatterns = generateWateringPatterns(plants, allActivities);
  const consistencyScore = wateringPatterns.reduce((sum, pattern) => sum + pattern.consistency, 0) / totalPlants * 100;

  // Calculate average plant health
  const plantHealthAverage = healthTrends.reduce((sum, trend) => sum + trend.score, 0) / totalPlants;

  // Calculate overall score
  const overallScore = (wateringSuccess + fertilizingSuccess + consistencyScore + plantHealthAverage) / 4;

  return {
    overallScore: Math.round(overallScore),
    wateringSuccess: Math.round(wateringSuccess),
    fertilizingSuccess: Math.round(fertilizingSuccess),
    consistencyScore: Math.round(consistencyScore),
    plantHealthAverage: Math.round(plantHealthAverage)
  };
};

/**
 * Get date range presets
 */
export const getDateRangePresets = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    week: {
      start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
      end: today
    },
    month: {
      start: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()),
      end: today
    },
    threeMonths: {
      start: new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()),
      end: today
    },
    year: {
      start: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()),
      end: today
    }
  };
};