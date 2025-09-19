import { z } from 'zod';
import { ActivityKind, ActivityEntry } from './activity';
import { Plant, PlantStatus } from './garden';

// ============================================================================
// TIME RANGE AND PERIOD TYPES
// ============================================================================

export type TimeRange = 'week' | 'month' | 'quarter' | 'year';
export type TimeGranularity = 'day' | 'week' | 'month';

export interface DateRange {
  start: Date;
  end: Date;
}

// ============================================================================
// ACTIVITY PATTERN ANALYSIS
// ============================================================================

export interface ActivityFrequencyData {
  activityKind: ActivityKind;
  frequency: number; // activities per period
  averageDaysBetween: number;
  totalCount: number;
  lastActivity?: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number; // percentage change
}

export interface ActivityTimingPattern {
  hour: number; // 0-23
  activityCount: number;
  percentage: number;
  isOptimal: boolean;
  plantKinds: ActivityKind[];
}

export interface CareEffectivenessData {
  activityKind: ActivityKind;
  beforeHealthScore: number;
  afterHealthScore: number;
  improvement: number;
  correlationStrength: number; // -1 to 1
  sampleSize: number;
  confidence: number; // 0-1
}

export interface OptimalCareSchedule {
  plantId: string;
  recommendations: {
    activityKind: ActivityKind;
    recommendedFrequency: number; // days
    bestTimeOfDay: number; // hour 0-23
    reasoning: string;
    reasoningThai: string;
    confidence: number;
  }[];
  generatedAt: Date;
  validUntil: Date;
}

// ============================================================================
// PLANT HEALTH ANALYTICS
// ============================================================================

export interface HealthTrendData {
  plantId: string;
  dataPoints: {
    date: Date;
    healthScore: number;
    status: PlantStatus;
    activities: ActivityEntry[];
  }[];
  overallTrend: 'improving' | 'declining' | 'stable';
  trendSlope: number;
  rSquared: number; // goodness of fit
  prediction: {
    nextWeek: number;
    nextMonth: number;
    confidence: number;
  };
}

export interface HealthDeclinePrediction {
  plantId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-1
  predictedDeclineDate?: Date;
  riskFactors: {
    factor: string;
    impact: number; // 0-1
    description: string;
    descriptionThai: string;
  }[];
  preventiveActions: {
    action: string;
    priority: number;
    expectedImprovement: number;
    actionThai: string;
  }[];
}

export interface HealthFactorAnalysis {
  plantId: string;
  positiveFactors: {
    factor: string;
    correlation: number;
    impact: string;
    impactThai: string;
  }[];
  negativeFactors: {
    factor: string;
    correlation: number;
    impact: string;
    impactThai: string;
  }[];
  recommendations: string[];
  recommendationsThai: string[];
}

export interface PlantHealthReport {
  plantId: string;
  plant: Plant;
  generatedAt: Date;
  reportPeriod: DateRange;

  // Summary
  currentHealth: {
    score: number;
    status: PlantStatus;
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  };

  // Trends
  healthTrend: HealthTrendData;
  careHistory: {
    totalActivities: number;
    mostFrequentActivity: ActivityKind;
    lastActivity?: Date;
    careConsistency: number; // 0-1
  };

  // Analysis
  strengths: string[];
  strengthsThai: string[];
  improvementAreas: string[];
  improvementAreasThai: string[];

  // Predictions
  riskAssessment: HealthDeclinePrediction;

  // Action items
  immediateActions: string[];
  immediateActionsThai: string[];
  longTermGoals: string[];
  longTermGoalsThai: string[];
}

// ============================================================================
// SEASONAL PATTERN DETECTION
// ============================================================================

export interface SeasonalPattern {
  season: 'hot' | 'rainy' | 'cool' | 'winter'; // Thailand seasons
  seasonThai: string;
  activityPatterns: {
    activityKind: ActivityKind;
    frequency: number;
    frequencyChange: number; // vs other seasons
    optimalTiming: number[]; // hours of day
  }[];
  plantHealthChanges: {
    averageHealthScore: number;
    commonIssues: string[];
    commonIssuesThai: string[];
  };
  recommendations: string[];
  recommendationsThai: string[];
}

export interface WeatherCorrelation {
  weatherFactor: 'temperature' | 'humidity' | 'rainfall' | 'uvIndex';
  activityKind: ActivityKind;
  correlation: number; // -1 to 1
  significance: number; // 0-1
  pattern: {
    description: string;
    descriptionThai: string;
    threshold?: number;
    unit?: string;
  };
  recommendations: string[];
  recommendationsThai: string[];
}

// ============================================================================
// USER BEHAVIOR ANALYTICS
// ============================================================================

export interface UserCareHabits {
  userId?: string;
  carePatterns: {
    preferredTimes: number[]; // hours of day
    averageFrequency: Record<ActivityKind, number>;
    careConsistency: number; // 0-1
    weekdayVsWeekend: {
      weekday: number;
      weekend: number;
      preference: 'weekday' | 'weekend' | 'balanced';
    };
  };

  preferences: {
    favoriteActivity: ActivityKind;
    mostSkippedActivity: ActivityKind;
    plantsWithMostAttention: string[];
    plantsWithLeastAttention: string[];
  };

  streaks: {
    currentStreak: number; // consecutive days with activity
    longestStreak: number;
    streakType: ActivityKind | 'any';
  };
}

export interface EngagementMetrics {
  appUsage: {
    dailyActiveTime: number; // minutes
    weeklyActiveTime: number;
    monthlyActiveTime: number;
    sessionCount: number;
    averageSessionLength: number;
  };

  featureUsage: {
    activityLogging: number;
    plantScanning: number;
    insightsViewing: number;
    settingsAccess: number;
    notificationsInteraction: number;
  };

  plantInteraction: {
    plantsAdded: number;
    plantsRemoved: number;
    activitiesLogged: number;
    photosUploaded: number;
    notesWritten: number;
  };

  engagement: {
    score: number; // 0-100
    level: 'low' | 'medium' | 'high' | 'very_high';
    trends: {
      weekOverWeek: number;
      monthOverMonth: number;
    };
  };
}

export interface ProductivityScore {
  overall: number; // 0-100
  breakdown: {
    consistency: number; // how regular is care
    completeness: number; // how many types of care
    timeliness: number; // care done on time
    effectiveness: number; // impact on plant health
  };

  comparison: {
    vsLastMonth: number;
    vsOptimal: number;
    percentile: number; // vs other users (if applicable)
  };

  achievements: {
    name: string;
    nameThai: string;
    description: string;
    descriptionThai: string;
    unlockedAt: Date;
    category: 'consistency' | 'growth' | 'health' | 'knowledge';
  }[];
}

export interface PersonalizedTip {
  id: string;
  category: 'care' | 'timing' | 'technique' | 'plant_health' | 'seasonal';
  priority: 'low' | 'medium' | 'high';

  title: string;
  titleThai: string;
  description: string;
  descriptionThai: string;

  basedOn: {
    userBehavior: string[];
    plantData: string[];
    seasonalData: boolean;
    weatherData: boolean;
  };

  actionable: {
    steps: string[];
    stepsThai: string[];
    expectedOutcome: string;
    expectedOutcomeThai: string;
  };

  relevance: number; // 0-1
  createdAt: Date;
  expiresAt?: Date;
  plantId?: string; // if tip is plant-specific
}

// ============================================================================
// COMPARATIVE ANALYTICS
// ============================================================================

export interface PlantPerformanceComparison {
  plant: Plant;
  metrics: {
    healthScore: number;
    careFrequency: number;
    growthRate: number; // estimated
    survivalTime: number; // days
  };

  ranking: {
    position: number;
    totalPlants: number;
    percentile: number;
  };

  comparison: {
    bestPerforming: string; // plant ID
    similarities: string[]; // what this plant shares with best
    differences: string[]; // what this plant lacks
  };

  recommendations: {
    immediate: string[];
    immediateThai: string[];
    longTerm: string[];
    longTermThai: string[];
  };
}

export interface BenchmarkData {
  category: 'care_frequency' | 'health_score' | 'activity_variety' | 'consistency';
  ideal: number;
  good: number;
  average: number;
  needsImprovement: number;

  userValue: number;
  userRating: 'ideal' | 'good' | 'average' | 'needs_improvement';

  recommendations: string[];
  recommendationsThai: string[];
}

export interface ImprovementArea {
  area: string;
  areaThai: string;
  currentScore: number;
  targetScore: number;
  priority: 'high' | 'medium' | 'low';

  impact: {
    description: string;
    descriptionThai: string;
    expectedImprovement: number; // percentage
  };

  actionPlan: {
    steps: string[];
    stepsThai: string[];
    timeframe: string;
    timeframeThai: string;
  };

  metrics: {
    name: string;
    current: number;
    target: number;
    unit: string;
  }[];
}

// ============================================================================
// CHART DATA FORMATS
// ============================================================================

export interface ChartDataPoint {
  x: number | string | Date;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface LineChartData {
  data: ChartDataPoint[];
  title: string;
  titleThai: string;
  xAxisLabel: string;
  yAxisLabel: string;
  xAxisLabelThai: string;
  yAxisLabelThai: string;
  trend?: 'up' | 'down' | 'stable';
  trendColor?: string;
}

export interface BarChartData {
  data: ChartDataPoint[];
  title: string;
  titleThai: string;
  xAxisLabel: string;
  yAxisLabel: string;
  xAxisLabelThai: string;
  yAxisLabelThai: string;
  colorScheme?: string[];
}

export interface PieChartData {
  data: {
    value: number;
    label: string;
    labelThai: string;
    color: string;
    percentage: number;
  }[];
  title: string;
  titleThai: string;
  total: number;
}

export interface HeatmapData {
  data: {
    x: number;
    y: number;
    value: number;
    label?: string;
  }[];
  xLabels: string[];
  yLabels: string[];
  title: string;
  titleThai: string;
  colorScale: string[];
}

// ============================================================================
// INSIGHT CACHING AND METADATA
// ============================================================================

export interface InsightCacheEntry<T = any> {
  key: string;
  data: T;
  generatedAt: Date;
  expiresAt: Date;
  dependencies: string[]; // what data this insight depends on
  computationTime: number; // milliseconds
  version: string;
}

export interface InsightMetadata {
  type: string;
  plantId?: string;
  timeRange?: TimeRange;
  parameters?: Record<string, any>;
  confidence: number;
  sampleSize: number;
  lastComputed: Date;
  computationCost: 'low' | 'medium' | 'high';
}

// ============================================================================
// EXPORT AND ANALYTICS AGGREGATION
// ============================================================================

export interface AnalyticsExport {
  exportId: string;
  generatedAt: Date;
  format: 'json' | 'csv' | 'pdf';
  timeRange: DateRange;
  plantIds: string[];

  data: {
    summary: {
      totalPlants: number;
      totalActivities: number;
      averageHealthScore: number;
      topPerformingPlant: string;
    };

    plants: PlantHealthReport[];
    activities: ActivityEntry[];
    insights: PersonalizedTip[];
    charts: (LineChartData | BarChartData | PieChartData)[];
  };

  metadata: {
    appVersion: string;
    exportVersion: string;
    language: 'th' | 'en';
    includePersonalData: boolean;
  };
}

export interface AggregatedMetrics {
  timestamp: Date;
  timeframe: TimeRange;

  plants: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    averageHealthScore: number;
  };

  activities: {
    total: number;
    byKind: Record<ActivityKind, number>;
    dailyAverage: number;
    consistency: number;
  };

  user: {
    engagementScore: number;
    productivityScore: number;
    streakDays: number;
    activeDays: number;
  };

  trends: {
    healthTrend: 'improving' | 'declining' | 'stable';
    activityTrend: 'increasing' | 'decreasing' | 'stable';
    engagementTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const InsightParametersSchema = z.object({
  plantId: z.string().uuid().optional(),
  timeRange: z.enum(['week', 'month', 'quarter', 'year']).optional(),
  includeInactive: z.boolean().default(false),
  minDataPoints: z.number().min(1).default(3),
  confidence: z.number().min(0).max(1).default(0.7),
});

export type InsightParameters = z.infer<typeof InsightParametersSchema>;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type InsightType =
  | 'activity_patterns'
  | 'health_trends'
  | 'seasonal_patterns'
  | 'user_behavior'
  | 'comparative_analysis'
  | 'personalized_tips';

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';

export interface InsightRequest {
  type: InsightType;
  plantId?: string;
  timeRange?: TimeRange;
  parameters?: Record<string, any>;
  forceRefresh?: boolean;
}

export interface InsightResponse<T = any> {
  success: boolean;
  data?: T;
  metadata?: InsightMetadata;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  cached: boolean;
  computationTime: number;
}