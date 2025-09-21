export interface PlantIdentificationRequest {
  imageUri: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  date?: string;
  modifiers?: string[];
  plantDetails?: string[];
}

export interface PlantIdentificationResult {
  id: string;
  score: number;
  species: PlantSpecies;
  images: PlantImage[];
  gbif?: GBIFData;
}

export interface PlantSpecies {
  scientificNameWithoutAuthor: string;
  scientificNameAuthorship: string;
  genus: PlantGenus;
  family: PlantFamily;
  commonNames: string[];
}

export interface PlantGenus {
  scientificNameWithoutAuthor: string;
  scientificNameAuthorship: string;
}

export interface PlantFamily {
  scientificNameWithoutAuthor: string;
  scientificNameAuthorship: string;
}

export interface PlantImage {
  organ: string;
  author: string;
  license: string;
  date: {
    timestamp: number;
    string: string;
  };
  citation: string;
  url: {
    o: string;
    m: string;
    s: string;
  };
}

export interface GBIFData {
  id: string;
  scientificName: string;
  taxonRank: string;
  taxonomicStatus: string;
}

export interface PlantNetResponse {
  query: {
    project: string;
    images: string[];
    modifiers: string[];
    plantDetails: string[];
  };
  language: string;
  preferedReferential: string;
  bestMatch: string;
  results: PlantIdentificationResult[];
  version: string;
  remainingIdentificationRequests: number;
}

export interface GoogleVisionRequest {
  imageUri: string;
  features: VisionFeature[];
  maxResults?: number;
}

export interface VisionFeature {
  type: 'LABEL_DETECTION' | 'TEXT_DETECTION' | 'SAFE_SEARCH_DETECTION' | 'IMAGE_PROPERTIES';
  maxResults?: number;
}

export interface GoogleVisionResponse {
  labelAnnotations?: LabelAnnotation[];
  textAnnotations?: TextAnnotation[];
  safeSearchAnnotation?: SafeSearchAnnotation;
  imagePropertiesAnnotation?: ImagePropertiesAnnotation;
}

export interface LabelAnnotation {
  mid: string;
  description: string;
  score: number;
  confidence: number;
  topicality: number;
}

export interface TextAnnotation {
  locale?: string;
  description: string;
  boundingPoly: BoundingPoly;
}

export interface BoundingPoly {
  vertices: Vertex[];
}

export interface Vertex {
  x: number;
  y: number;
}

export interface SafeSearchAnnotation {
  adult: string;
  spoof: string;
  medical: string;
  violence: string;
  racy: string;
}

export interface ImagePropertiesAnnotation {
  dominantColors: {
    colors: ColorInfo[];
  };
}

export interface ColorInfo {
  color: {
    red: number;
    green: number;
    blue: number;
  };
  score: number;
  pixelFraction: number;
}

export interface PlantCareRecommendations {
  id: string;
  plantId: string;
  scientificName: string;
  commonName: string;
  care: {
    watering: WateringRecommendation;
    lighting: LightingRecommendation;
    temperature: TemperatureRecommendation;
    humidity: HumidityRecommendation;
    fertilizing: FertilizingRecommendation;
    repotting: RepottingRecommendation;
    pruning: PruningRecommendation;
  };
  seasonalAdjustments: SeasonalAdjustment[];
  commonProblems: PlantProblem[];
  toxicity: ToxicityInfo;
  difficulty: 'beginner' | 'intermediate' | 'expert';
  nativeHabitat: string;
  growthPattern: 'slow' | 'moderate' | 'fast';
  matureSize: {
    height: string;
    width: string;
  };
  lifespan: string;
  propagation: string[];
}

export interface WateringRecommendation {
  frequency: string;
  amount: string;
  method: string;
  indicators: string[];
  seasonalVariations: {
    season: 'spring' | 'summer' | 'autumn' | 'winter';
    adjustment: string;
  }[];
}

export interface LightingRecommendation {
  type: 'direct' | 'indirect' | 'bright' | 'medium' | 'low';
  duration: string;
  position: string;
  supplemental: boolean;
}

export interface TemperatureRecommendation {
  min: number;
  max: number;
  optimal: number;
  unit: 'celsius' | 'fahrenheit';
  tolerance: string;
}

export interface HumidityRecommendation {
  level: string;
  percentage: number;
  methods: string[];
}

export interface FertilizingRecommendation {
  frequency: string;
  type: string;
  concentration: string;
  season: string[];
}

export interface RepottingRecommendation {
  frequency: string;
  season: string[];
  soilType: string;
  potSize: string;
  drainage: string;
}

export interface PruningRecommendation {
  frequency: string;
  season: string[];
  method: string;
  tools: string[];
}

export interface SeasonalAdjustment {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  watering: string;
  fertilizing: string;
  lighting: string;
  temperature: string;
  specialCare: string[];
}

export interface PlantProblem {
  name: string;
  symptoms: string[];
  causes: string[];
  solutions: string[];
  prevention: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface ToxicityInfo {
  pets: boolean;
  humans: boolean;
  details: string;
  symptoms?: string[];
  firstAid?: string[];
}

export interface AIServiceConfig {
  plantnet: {
    enabled: boolean;
    apiKey: string;
    baseUrl: string;
    project: string;
    maxResults: number;
    timeout: number;
  };
  googleVision: {
    enabled: boolean;
    apiKey: string;
    baseUrl: string;
    maxResults: number;
    timeout: number;
  };
  openai: {
    enabled: boolean;
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
    timeout: number;
  };
}

export interface AIError {
  code: string;
  message: string;
  service: 'plantnet' | 'google-vision' | 'openai';
  details?: any;
  retryable: boolean;
}

export interface ConfidenceScore {
  overall: number;
  plantnet: number;
  googleVision: number;
  consensus: number;
  factors: {
    imageQuality: number;
    speciesRarity: number;
    featureClarity: number;
    crossValidation: number;
  };
}

export interface PlantIdentificationCache {
  key: string;
  imageHash: string;
  result: PlantIdentificationResult[];
  confidence: ConfidenceScore;
  timestamp: number;
  expiresAt: number;
  source: 'plantnet' | 'google-vision' | 'hybrid';
}

export interface AIAnalysisRequest {
  imageUri: string;
  analysisType: 'identification' | 'health' | 'care' | 'problem';
  options?: {
    includeRecommendations?: boolean;
    includeToxicity?: boolean;
    includeSeasonalCare?: boolean;
    location?: {
      latitude: number;
      longitude: number;
    };
    userExperience?: 'beginner' | 'intermediate' | 'expert';
  };
}

export interface AIAnalysisResult {
  id: string;
  type: 'identification' | 'health' | 'care' | 'problem';
  timestamp: number;
  confidence: ConfidenceScore;
  results: PlantIdentificationResult[];
  recommendations?: PlantCareRecommendations;
  healthAssessment?: PlantHealthAssessment;
  problems?: PlantProblem[];
  metadata: {
    processingTime: number;
    servicesUsed: string[];
    imageQuality: number;
    fallbackUsed: boolean;
  };
}

export interface PlantHealthAssessment {
  overall: 'healthy' | 'fair' | 'poor' | 'critical';
  score: number;
  factors: {
    leaves: HealthFactor;
    stems: HealthFactor;
    roots?: HealthFactor;
    flowers?: HealthFactor;
    overall: HealthFactor;
  };
  issues: HealthIssue[];
  recommendations: string[];
}

export interface HealthFactor {
  status: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  observations: string[];
}

export interface HealthIssue {
  type: 'disease' | 'pest' | 'nutrient' | 'environmental' | 'care';
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  symptoms: string[];
  causes: string[];
  treatment: string[];
  prevention: string[];
  timeframe: string;
}