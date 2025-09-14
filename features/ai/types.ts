import { PlantAnalysisResult, PlantIssue, PlantRecommendation, WeatherContext, SeasonalContext, AnalysisConfig } from '../../types/ai';

// Extended AI analysis interfaces for the Smart Plant app

// Plant identification result
export interface PlantIdentificationResult {
  plantName: string;
  plantNameThai: string;
  scientificName: string;
  confidence: number;
  alternativeSuggestions: Array<{
    name: string;
    nameThai: string;
    scientificName: string;
    confidence: number;
  }>;
  category: 'indoor' | 'outdoor' | 'succulent' | 'flowering' | 'foliage' | 'herb';
  careLevel: 'beginner' | 'intermediate' | 'advanced';
  commonIssues: string[];
}

// Plant analysis response specifically for the app
export interface SmartPlantAnalysis extends PlantAnalysisResult {
  plantNameThai: string;
  quickTips: string[];
  urgentActions: string[];
  longTermCare: string[];
  fertilizer: FertilizerRecommendation;
  watering: WateringRecommendation;
  environment: EnvironmentalRecommendation;
}

// NPK fertilizer recommendation
export interface FertilizerRecommendation {
  npkRatio: string; // e.g., "10-10-10"
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'seasonal';
  frequencyThai: string;
  amount: string;
  timing: string;
  timingThai: string;
  organicAlternatives: string[];
  warnings: string[];
}

// Watering recommendation
export interface WateringRecommendation {
  frequency: number; // days between watering
  frequencyRange: string; // "7-10 days"
  frequencyThai: string;
  amount: string;
  amountThai: string;
  method: string;
  methodThai: string;
  indicators: string[];
  indicatorsThai: string[];
  seasonalAdjustments: Record<string, string>;
}

// Environmental recommendation
export interface EnvironmentalRecommendation {
  lightRequirement: 'low' | 'medium' | 'high' | 'bright_indirect' | 'direct';
  lightRequirementThai: string;
  humidity: string;
  humidityThai: string;
  temperature: string;
  temperatureThai: string;
  airflow: string;
  airflowThai: string;
  placement: string[];
  placementThai: string[];
}

// Care tip with Thai language support
export interface CareInstruction {
  id: string;
  category: 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'lighting' | 'temperature' | 'humidity' | 'pest_control' | 'disease_prevention';
  title: string;
  titleThai: string;
  description: string;
  descriptionThai: string;
  priority: 1 | 2 | 3 | 4 | 5;
  timeframe: 'immediate' | 'daily' | 'weekly' | 'monthly' | 'seasonal';
  timeframeThai: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  difficultyThai: string;
  supplies: string[];
  suppliesThai: string[];
  steps: string[];
  stepsThai: string[];
  warnings: string[];
  warningsThai: string[];
  icon: string;
}

// Scan service configuration
export interface ScanServiceConfig extends AnalysisConfig {
  includeFertilizerRecommendations: boolean;
  includeSeasonalTips: boolean;
  preferredLanguage: 'th' | 'en' | 'both';
  expertMode: boolean; // More detailed recommendations
  quickScan: boolean; // Faster processing with basic recommendations
}

// Analysis request
export interface AnalysisRequest {
  imageUri: string;
  config?: Partial<ScanServiceConfig>;
  userContext?: {
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
    previousPlants?: string[];
    carePreferences?: Record<string, any>;
  };
  locationContext?: {
    latitude?: number;
    longitude?: number;
    region?: string;
  };
}

// Analysis response
export interface AnalysisResponse {
  success: boolean;
  analysis?: SmartPlantAnalysis;
  error?: {
    code: string;
    message: string;
    messageThai: string;
    details?: Record<string, any>;
  };
  processingTime: number;
  timestamp: Date;
}

// Plant health assessment result
export interface HealthAssessment {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  overallHealthThai: string;
  healthScore: number; // 0-100
  assessmentSummary: string;
  assessmentSummaryThai: string;
  strengths: string[];
  strengthsThai: string[];
  concerns: string[];
  concernsThai: string[];
  immediateActions: string[];
  immediateActionsThai: string[];
}

// Issue detection with Thai language support
export interface DetectedIssue extends PlantIssue {
  titleThai: string;
  descriptionThai: string;
  symptomsThai?: string[];
  causesThai?: string[];
  treatmentsThai?: string[];
  preventionTips: string[];
  preventionTipsThai: string[];
  progressMonitoring: string[];
  progressMonitoringThai: string[];
}

// Smart recommendation with Thai support
export interface SmartRecommendation extends PlantRecommendation {
  titleThai: string;
  descriptionThai: string;
  actionItemsThai: string[];
  timeFrameThai: string;
  requiredSuppliesThai?: string[];
  costEstimate?: string;
  costEstimateThai?: string;
  successRate: number; // 0-100
  relatedTips: string[];
  relatedTipsThai: string[];
}

// Weather impact analysis
export interface WeatherImpactAnalysis {
  currentConditions: WeatherContext;
  impacts: Array<{
    aspect: 'watering' | 'fertilizing' | 'growth' | 'health' | 'pest_risk';
    impact: 'positive' | 'neutral' | 'negative' | 'critical';
    description: string;
    descriptionThai: string;
    recommendations: string[];
    recommendationsThai: string[];
  }>;
  forecast: Array<{
    date: Date;
    recommendations: string[];
    recommendationsThai: string[];
  }>;
}

// Seasonal care adjustments
export interface SeasonalCareGuide {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  seasonThai: string;
  monthlyTips: Record<number, {
    focus: string;
    focusThai: string;
    activities: string[];
    activitiesThai: string[];
    warnings: string[];
    warningsThai: string[];
  }>;
  generalGuidance: {
    watering: string;
    wateringThai: string;
    fertilizing: string;
    fertilizingThai: string;
    lighting: string;
    lightingThai: string;
    temperature: string;
    temperatureThai: string;
  };
}

export type AnalysisError =
  | 'IMAGE_PROCESSING_FAILED'
  | 'PLANT_NOT_RECOGNIZED'
  | 'POOR_IMAGE_QUALITY'
  | 'SERVICE_UNAVAILABLE'
  | 'INVALID_REQUEST'
  | 'RATE_LIMIT_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

// Export all for easy importing
export * from '../../types/ai';