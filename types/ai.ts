import { z } from 'zod';
import { PlantStatus } from './garden';

// AI analysis confidence levels
export type ConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

// Plant issue types for AI detection
export type PlantIssueType = 'disease' | 'pest' | 'nutrient' | 'environmental' | 'physical';

// Issue severity levels
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

// Plant issue schema
export const PlantIssueSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['disease', 'pest', 'nutrient', 'environmental', 'physical']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  confidence: z.number().min(0).max(1),
  treatmentUrgency: z.number().min(1).max(5),
  detectedAt: z.date(),
  resolvedAt: z.date().optional(),
  symptoms: z.array(z.string()).optional(),
  causes: z.array(z.string()).optional(),
  treatments: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type PlantIssue = z.infer<typeof PlantIssueSchema>;

// Plant recommendation categories
export type RecommendationCategory = 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'lighting' | 'treatment' | 'environmental';

// Recommendation priority levels
export type RecommendationPriority = 1 | 2 | 3 | 4 | 5;

// Plant recommendation schema
export const PlantRecommendationSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(['watering', 'fertilizing', 'pruning', 'repotting', 'lighting', 'treatment', 'environmental']),
  priority: z.number().min(1).max(5),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  actionItems: z.array(z.string()),
  timeFrame: z.enum(['immediate', 'within_day', 'within_week', 'monthly', 'seasonal']),
  requiredSupplies: z.array(z.string()).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedTime: z.string().optional(), // "5 minutes", "30 minutes", etc.
  confidence: z.number().min(0).max(1),
  source: z.enum(['ai', 'rule_based', 'expert', 'user']).default('ai'),
  createdAt: z.date(),
  validUntil: z.date().optional(),
});

export type PlantRecommendation = z.infer<typeof PlantRecommendationSchema>;

// AI analysis metadata
export const AnalysisMetadataSchema = z.object({
  imageQuality: z.number().min(0).max(1),
  processingTime: z.number().min(0), // milliseconds
  modelVersion: z.string(),
  confidence: z.number().min(0).max(1),
  weatherContext: z.object({
    temperature: z.number(),
    humidity: z.number(),
    condition: z.string(),
    forecast: z.string().optional(),
  }).optional(),
  seasonalContext: z.object({
    season: z.enum(['spring', 'summer', 'autumn', 'winter']),
    month: z.number().min(1).max(12),
    region: z.string(),
  }).optional(),
  userContext: z.object({
    experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    careHistory: z.array(z.string()).optional(),
    preferences: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
});

export type AnalysisMetadata = z.infer<typeof AnalysisMetadataSchema>;

// Complete plant analysis result
export const PlantAnalysisResultSchema = z.object({
  analysisId: z.string().uuid(),
  plantId: z.string().uuid().optional(), // Null for new plant analysis
  plantName: z.string(),
  scientificName: z.string().optional(),
  confidence: z.number().min(0).max(1),
  healthStatus: z.enum(['Healthy', 'Warning', 'Critical']),
  healthScore: z.number().min(0).max(100), // Overall health score
  issues: z.array(PlantIssueSchema),
  recommendations: z.array(PlantRecommendationSchema),
  analysisTimestamp: z.date(),
  imageUri: z.string().optional(),
  metadata: AnalysisMetadataSchema,
  tags: z.array(z.string()).optional(), // For categorization
  notes: z.string().optional(), // AI-generated summary
});

export type PlantAnalysisResult = z.infer<typeof PlantAnalysisResultSchema>;

// AI tip categories
export type TipCategory = 'watering' | 'fertilizing' | 'lighting' | 'temperature' | 'humidity' | 'pruning' | 'propagation' | 'seasonal' | 'general';

// AI tip schema
export const AITipSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  category: z.enum(['watering', 'fertilizing', 'lighting', 'temperature', 'humidity', 'pruning', 'propagation', 'seasonal', 'general']),
  priority: z.number().min(1).max(5),
  icon: z.string().optional(), // Emoji or icon name
  plantTypes: z.array(z.string()).optional(), // Applicable plant types
  conditions: z.array(z.string()).optional(), // When this tip applies
  source: z.enum(['ai', 'expert', 'community', 'research']).default('ai'),
  confidence: z.number().min(0).max(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean().default(true),
  seasonality: z.array(z.enum(['spring', 'summer', 'autumn', 'winter'])).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  actionUrl: z.string().optional(), // Deep link for more info
});

export type AITip = z.infer<typeof AITipSchema>;

// Weather context for AI analysis
export interface WeatherContext {
  temperature: number; // Celsius
  humidity: number; // Percentage
  condition: 'sunny' | 'cloudy' | 'rain' | 'storm' | 'hot' | 'cold';
  forecast?: string;
  uvIndex?: number;
  windSpeed?: number;
}

// Seasonal context for AI analysis
export interface SeasonalContext {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  month: number;
  region: string;
  dayLength?: number; // Hours of daylight
  averageTemp?: number;
}

// User care history context
export interface UserCareHistory {
  lastWatering?: Date;
  lastFertilizing?: Date;
  careFrequency?: number; // Average days between activities
  preferredCareTime?: string; // Time of day
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  commonIssues?: string[]; // Historical problems
}

// AI analysis request configuration
export interface AnalysisConfig {
  includeIssueDetection: boolean;
  includeRecommendations: boolean;
  includeTips: boolean;
  confidenceThreshold: number; // Minimum confidence to include results
  maxRecommendations: number;
  maxIssues: number;
  contextSources: ('weather' | 'seasonal' | 'user_history')[];
  language: 'th' | 'en';
}

// AI model performance metrics
export interface ModelMetrics {
  modelVersion: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  inferenceTime: number; // milliseconds
  lastUpdated: Date;
  trainingDataSize: number;
  supportedSpecies: string[];
}

// Validation functions
export const validatePlantAnalysisResult = (data: unknown): PlantAnalysisResult => {
  const result = PlantAnalysisResultSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid analysis result: ${result.error.message}`);
  }
  return result.data;
};

export const validatePlantIssue = (data: unknown): PlantIssue => {
  const result = PlantIssueSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid plant issue: ${result.error.message}`);
  }
  return result.data;
};

export const validatePlantRecommendation = (data: unknown): PlantRecommendation => {
  const result = PlantRecommendationSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid recommendation: ${result.error.message}`);
  }
  return result.data;
};

export const validateAITip = (data: unknown): AITip => {
  const result = AITipSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid AI tip: ${result.error.message}`);
  }
  return result.data;
};

// Helper functions
export const getConfidenceLevel = (confidence: number): ConfidenceLevel => {
  if (confidence >= 0.9) return 'very_high';
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.5) return 'medium';
  if (confidence >= 0.3) return 'low';
  return 'very_low';
};

export const getHealthScoreFromIssues = (issues: PlantIssue[]): number => {
  if (issues.length === 0) return 100;

  const severityWeights = { low: 5, medium: 15, high: 30, critical: 50 };
  const totalDeduction = issues.reduce((sum, issue) =>
    sum + severityWeights[issue.severity], 0
  );

  return Math.max(0, 100 - totalDeduction);
};

export const getRecommendationUrgency = (recommendation: PlantRecommendation): string => {
  const urgencyMap = {
    immediate: 'ทันที',
    within_day: 'ภายในวันนี้',
    within_week: 'ภายในสัปดาห์',
    monthly: 'ภายในเดือน',
    seasonal: 'ตามฤดูกาล',
  };
  return urgencyMap[recommendation.timeFrame] || recommendation.timeFrame;
};

export const formatConfidencePercent = (confidence: number): string => {
  return `${Math.round(confidence * 100)}%`;
};

export const getIssueIcon = (type: PlantIssueType): string => {
  const icons: Record<PlantIssueType, string> = {
    disease: '🦠',
    pest: '🐛',
    nutrient: '🧪',
    environmental: '🌡️',
    physical: '🔧',
  };
  return icons[type] || '⚠️';
};

export const getRecommendationIcon = (category: RecommendationCategory): string => {
  const icons: Record<RecommendationCategory, string> = {
    watering: '💧',
    fertilizing: '🌱',
    pruning: '✂️',
    repotting: '🪴',
    lighting: '☀️',
    treatment: '💊',
    environmental: '🌡️',
  };
  return icons[category] || '📋';
};