import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PlantAnalysisResult,
  PlantIssue,
  PlantRecommendation,
  AITip,
  WeatherContext,
  AnalysisConfig,
  STORAGE_KEYS
} from '../types';
import {
  SmartPlantAnalysis,
  AnalysisRequest,
  AnalysisResponse,
  AnalysisError,
  HealthAssessment,
  DetectedIssue,
  SmartRecommendation,
  WeatherImpactAnalysis,
  SeasonalCareGuide
} from '../features/ai/types';

interface AnalysisState {
  // Current analysis session
  currentAnalysis: SmartPlantAnalysis | null;
  currentImageUri: string | null;
  isAnalyzing: boolean;
  analysisProgress: number; // 0-100
  analysisStep: string | null; // Current processing step

  // Analysis history and cache
  analysisHistory: PlantAnalysisResult[];
  analysisCache: Record<string, SmartPlantAnalysis>; // imageUri hash -> analysis

  // AI tips and recommendations
  currentTips: AITip[];
  currentRecommendations: SmartRecommendation[];
  weatherContext: WeatherContext | null;
  seasonalGuide: SeasonalCareGuide | null;

  // Error handling
  error: string | null;
  lastError: AnalysisError | null;

  // Configuration and preferences
  analysisConfig: AnalysisConfig;

  // Statistics and performance
  analysisStats: {
    totalAnalyses: number;
    successfulAnalyses: number;
    averageProcessingTime: number;
    lastAnalysisDate: Date | null;
  };

  lastUpdated: Date | null;
}

interface AnalysisActions {
  // Analysis workflow
  startAnalysis: (imageUri: string, config?: Partial<AnalysisConfig>) => Promise<AnalysisResponse>;
  cancelAnalysis: () => void;
  retryAnalysis: () => Promise<AnalysisResponse>;
  clearCurrentAnalysis: () => void;

  // Analysis steps (for progress tracking)
  setAnalysisStep: (step: string, progress: number) => void;
  updateAnalysisProgress: (progress: number) => void;

  // Results management
  saveAnalysisResult: (analysis: SmartPlantAnalysis) => void;
  getAnalysisFromHistory: (analysisId: string) => PlantAnalysisResult | null;
  clearAnalysisHistory: (keepRecent?: number) => void;

  // Garden integration
  saveToGarden: (analysis: SmartPlantAnalysis, customName?: string) => void;
  updatePlantFromAnalysis: (plantId: string, analysis: SmartPlantAnalysis) => void;

  // Tips and recommendations
  generateTips: (plantName?: string, weather?: WeatherContext, issues?: PlantIssue[]) => AITip[];
  updateRecommendations: (recommendations: SmartRecommendation[]) => void;
  dismissRecommendation: (id: string) => void;

  // Context and configuration
  updateWeatherContext: (weather: WeatherContext) => void;
  updateSeasonalGuide: (guide: SeasonalCareGuide) => void;
  updateAnalysisConfig: (config: Partial<AnalysisConfig>) => void;

  // Cache management
  getCachedAnalysis: (imageUri: string) => SmartPlantAnalysis | null;
  clearAnalysisCache: () => void;
  cleanupOldCache: (maxAge?: number) => void;

  // Statistics
  updateAnalysisStats: (processingTime: number, success: boolean) => void;
  getAnalysisStats: () => AnalysisState['analysisStats'];

  // Error handling
  setError: (error: AnalysisError, message: string) => void;
  clearError: () => void;

  // Utility actions
  reset: () => void;
}

const defaultAnalysisConfig: AnalysisConfig = {
  includeIssueDetection: true,
  includeRecommendations: true,
  includeTips: true,
  confidenceThreshold: 0.6,
  maxRecommendations: 5,
  maxIssues: 3,
  contextSources: ['weather', 'seasonal'],
  language: 'th',
};

const initialState: AnalysisState = {
  currentAnalysis: null,
  currentImageUri: null,
  isAnalyzing: false,
  analysisProgress: 0,
  analysisStep: null,
  analysisHistory: [],
  analysisCache: {},
  currentTips: [],
  currentRecommendations: [],
  weatherContext: null,
  seasonalGuide: null,
  error: null,
  lastError: null,
  analysisConfig: defaultAnalysisConfig,
  analysisStats: {
    totalAnalyses: 0,
    successfulAnalyses: 0,
    averageProcessingTime: 0,
    lastAnalysisDate: null,
  },
  lastUpdated: null,
};

export const useAnalysisStore = create<AnalysisState & AnalysisActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Analysis workflow
      startAnalysis: async (imageUri, config = {}) => {
        const startTime = Date.now();

        set((state) => {
          state.currentImageUri = imageUri;
          state.isAnalyzing = true;
          state.analysisProgress = 0;
          state.analysisStep = 'เริ่มการวิเคราะห์...';
          state.error = null;
          state.lastError = null;
          state.currentAnalysis = null;
        });

        try {
          // Check cache first
          const cached = get().getCachedAnalysis(imageUri);
          if (cached) {
            set((state) => {
              state.currentAnalysis = cached;
              state.isAnalyzing = false;
              state.analysisProgress = 100;
              state.analysisStep = null;
            });

            return {
              success: true,
              analysis: cached,
              processingTime: Date.now() - startTime,
              timestamp: new Date(),
            };
          }

          // Simulate analysis steps with mock service
          const finalConfig = { ...get().analysisConfig, ...config };

          get().setAnalysisStep('กำลังประมวลผลภาพ...', 20);
          await new Promise(resolve => setTimeout(resolve, 800));

          get().setAnalysisStep('กำลังระบุชนิดพืช...', 50);
          await new Promise(resolve => setTimeout(resolve, 600));

          get().setAnalysisStep('กำลังวิเคราะห์สุขภาพ...', 75);
          await new Promise(resolve => setTimeout(resolve, 500));

          get().setAnalysisStep('กำลังสร้างคำแนะนำ...', 90);
          await new Promise(resolve => setTimeout(resolve, 400));

          // Mock analysis result
          const mockAnalysis: SmartPlantAnalysis = {
            analysisId: crypto.randomUUID(),
            plantName: 'Monstera Deliciosa',
            plantNameThai: 'มอนสเตอร่า เดลิโซซา',
            scientificName: 'Monstera deliciosa',
            confidence: 0.92,
            healthStatus: 'Healthy',
            healthScore: 85,
            issues: [],
            recommendations: [
              {
                id: crypto.randomUUID(),
                category: 'watering',
                priority: 3,
                title: 'Regular Watering Schedule',
                titleThai: 'ตารางการรดน้ำที่สม่ำเสมอ',
                description: 'Water when top inch of soil feels dry',
                descriptionThai: 'รดน้ำเมื่อดินแห้งลึกประมาณ 2-3 เซนติเมตร',
                actionItems: ['Check soil moisture weekly', 'Water thoroughly but allow drainage'],
                actionItemsThai: ['ตรวจสอบความชื้นของดินทุกสัปดาห์', 'รดน้ำให้ทั่วแต่ต้องระบายน้ำได้ดี'],
                timeFrame: 'within_week',
                timeFrameThai: 'รายสัปดาห์',
                confidence: 0.9,
                source: 'ai',
                createdAt: new Date(),
                successRate: 85,
                relatedTips: ['ตรวจสอบความชื้นของดิน', 'ให้แสงแดดที่เหมาะสม'],
                relatedTipsThai: ['ตรวจสอบความชื้นของดิน', 'ให้แสงแดดที่เหมาะสม'],
              } as SmartRecommendation,
            ],
            analysisTimestamp: new Date(),
            imageUri,
            metadata: {
              imageQuality: 0.9,
              processingTime: Date.now() - startTime,
              modelVersion: '1.0.0',
              confidence: 0.92,
            },
            quickTips: [
              'ให้แสงแดดแบบกรองไม่โดนแสงแดดโดยตรง',
              'รดน้ำเมื่อดินแห้ง ประมาณสัปดาห์ละครั้ง',
              'เช็ดใบด้วยผ้าชื้นเพื่อทำความสะอาด'
            ],
            urgentActions: [],
            longTermCare: [
              'ย้ายไปกระถางใหญ่กว่าเดิมทุก 2-3 ปี',
              'ให้ปุ๋ยเหลวทุกเดือนในช่วงฤดูเจริญเติบโต'
            ],
            fertilizer: {
              npkRatio: '20-20-20',
              frequency: 'monthly',
              frequencyThai: 'รายเดือน',
              amount: '1 ช้อนชาต่อน้ำ 1 ลิตร',
              timing: 'ช่วงเช้าหรือเย็น',
              timingThai: 'ช่วงเช้าหรือเย็น',
              organicAlternatives: ['ปุ๋ยหมักจากเศษอาหาร', 'น้ำซาวข้าวหมัก'],
              warnings: ['อย่าให้ปุ๋ยเมื่อดินแห้ง', 'ลดปริมาณลงครึ่งหนึ่งในฤดูหนาว']
            },
            watering: {
              frequency: 7,
              frequencyRange: '7-10 วัน',
              frequencyThai: '7-10 วัน',
              amount: '200-300 ml',
              amountThai: '200-300 มิลลิลิตร',
              method: 'รดทีละน้อยรอบ ๆ ต้น',
              methodThai: 'รดทีละน้อยรอบ ๆ ต้น',
              indicators: ['ดินแห้ง 2-3 ซม.', 'ใบเริ่มเหี่ยว'],
              indicatorsThai: ['ดินแห้ง 2-3 ซม.', 'ใบเริ่มเหี่ยว'],
              seasonalAdjustments: {
                'ฤดูร้อน': 'รดบ่อยขึ้น ทุก 5-7 วัน',
                'ฤดูหนาว': 'รดน้อยลง ทุก 10-14 วัน'
              }
            },
            environment: {
              lightRequirement: 'bright_indirect',
              lightRequirementThai: 'แสงสว่างแบบกรอง',
              humidity: '60-70%',
              humidityThai: '60-70%',
              temperature: '20-25°C',
              temperatureThai: '20-25°C',
              airflow: 'การระบายอากาศดี',
              airflowThai: 'การระบายอากาศดี',
              placement: ['ใกล้หน้าต่าง', 'หลีกเลี่ยงแอร์โดยตรง'],
              placementThai: ['ใกล้หน้าต่าง', 'หลีกเลี่ยงแอร์โดยตรง']
            }
          };

          const processingTime = Date.now() - startTime;

          set((state) => {
            state.currentAnalysis = mockAnalysis;
            state.isAnalyzing = false;
            state.analysisProgress = 100;
            state.analysisStep = null;
            state.lastUpdated = new Date();
          });

          // Cache the result
          get().saveAnalysisResult(mockAnalysis);

          // Update stats
          get().updateAnalysisStats(processingTime, true);

          return {
            success: true,
            analysis: mockAnalysis,
            processingTime,
            timestamp: new Date(),
          };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'การวิเคราะห์ล้มเหลว';

          set((state) => {
            state.isAnalyzing = false;
            state.error = errorMessage;
            state.lastError = 'UNKNOWN_ERROR';
            state.analysisProgress = 0;
            state.analysisStep = null;
          });

          get().updateAnalysisStats(Date.now() - startTime, false);

          return {
            success: false,
            error: {
              code: 'ANALYSIS_FAILED',
              message: errorMessage,
              messageThai: errorMessage,
            },
            processingTime: Date.now() - startTime,
            timestamp: new Date(),
          };
        }
      },

      cancelAnalysis: () => {
        set((state) => {
          state.isAnalyzing = false;
          state.analysisProgress = 0;
          state.analysisStep = null;
          state.currentImageUri = null;
        });
      },

      retryAnalysis: async () => {
        const { currentImageUri } = get();
        if (currentImageUri) {
          return get().startAnalysis(currentImageUri);
        }
        throw new Error('ไม่มีภาพที่จะวิเคราะห์ซ้ำ');
      },

      clearCurrentAnalysis: () => {
        set((state) => {
          state.currentAnalysis = null;
          state.currentImageUri = null;
          state.analysisProgress = 0;
          state.analysisStep = null;
          state.error = null;
        });
      },

      // Analysis steps
      setAnalysisStep: (step, progress) => {
        set((state) => {
          state.analysisStep = step;
          state.analysisProgress = progress;
        });
      },

      updateAnalysisProgress: (progress) => {
        set({ analysisProgress: progress });
      },

      // Results management
      saveAnalysisResult: (analysis) => {
        set((state) => {
          // Add to history
          state.analysisHistory.unshift(analysis);

          // Keep only last 50 analyses
          if (state.analysisHistory.length > 50) {
            state.analysisHistory = state.analysisHistory.slice(0, 50);
          }

          // Cache the result
          if (analysis.imageUri) {
            state.analysisCache[analysis.imageUri] = analysis;
          }

          state.lastUpdated = new Date();
        });
      },

      getAnalysisFromHistory: (analysisId) => {
        return get().analysisHistory.find(a => a.analysisId === analysisId) || null;
      },

      clearAnalysisHistory: (keepRecent = 10) => {
        set((state) => {
          state.analysisHistory = state.analysisHistory.slice(0, keepRecent);
          state.lastUpdated = new Date();
        });
      },

      // Garden integration
      saveToGarden: (analysis, customName) => {
        const gardenStore = require('./garden').useGardenStore.getState();

        gardenStore.addPlant({
          name: customName || analysis.plantNameThai || analysis.plantName,
          scientificName: analysis.scientificName,
          status: analysis.healthStatus,
          imageUrl: analysis.imageUri,
        });

        console.log('Plant saved to garden:', customName || analysis.plantName);
      },

      updatePlantFromAnalysis: (plantId, analysis) => {
        const gardenStore = require('./garden').useGardenStore.getState();

        gardenStore.updatePlant(plantId, {
          status: analysis.healthStatus,
          metadata: {
            lastAnalysis: analysis.analysisTimestamp,
            healthScore: analysis.healthScore,
            analysisId: analysis.analysisId,
          },
        });

        console.log('Plant updated from analysis:', plantId);
      },

      // Tips and recommendations
      generateTips: (plantName, weather, issues) => {
        // Mock tip generation based on plant and context
        const baseTips: AITip[] = [
          {
            id: crypto.randomUUID(),
            title: 'การรดน้ำที่เหมาะสม',
            description: 'รดน้ำเมื่อดินแห้งลึกประมาณ 2-3 เซนติเมตร หลีกเลี่ยงการรดน้ำเกินไป',
            category: 'watering',
            priority: 4,
            icon: '💧',
            source: 'ai',
            confidence: 0.9,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
          },
          {
            id: crypto.randomUUID(),
            title: 'แสงแดดที่เหมาะสม',
            description: 'ให้แสงแดดแบบกรองหรือแสงแดดแผ่วๆ หลีกเลี่ยงแสงแดดโดยตรง',
            category: 'lighting',
            priority: 3,
            icon: '☀️',
            source: 'ai',
            confidence: 0.8,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
          },
        ];

        set({ currentTips: baseTips });
        return baseTips;
      },

      updateRecommendations: (recommendations) => {
        set({ currentRecommendations: recommendations });
      },

      dismissRecommendation: (id) => {
        set((state) => {
          state.currentRecommendations = state.currentRecommendations.filter(r => r.id !== id);
        });
      },

      // Context and configuration
      updateWeatherContext: (weather) => {
        set({ weatherContext: weather });
      },

      updateSeasonalGuide: (guide) => {
        set({ seasonalGuide: guide });
      },

      updateAnalysisConfig: (config) => {
        set((state) => {
          state.analysisConfig = { ...state.analysisConfig, ...config };
        });
      },

      // Cache management
      getCachedAnalysis: (imageUri) => {
        return get().analysisCache[imageUri] || null;
      },

      clearAnalysisCache: () => {
        set({ analysisCache: {} });
      },

      cleanupOldCache: (maxAge = 7 * 24 * 60 * 60 * 1000) => {
        const cutoffTime = Date.now() - maxAge;

        set((state) => {
          Object.keys(state.analysisCache).forEach(imageUri => {
            const analysis = state.analysisCache[imageUri];
            if (analysis.analysisTimestamp.getTime() < cutoffTime) {
              delete state.analysisCache[imageUri];
            }
          });
        });
      },

      // Statistics
      updateAnalysisStats: (processingTime, success) => {
        set((state) => {
          const stats = state.analysisStats;
          stats.totalAnalyses++;

          if (success) {
            stats.successfulAnalyses++;

            // Update average processing time
            const totalTime = stats.averageProcessingTime * (stats.successfulAnalyses - 1) + processingTime;
            stats.averageProcessingTime = totalTime / stats.successfulAnalyses;
          }

          stats.lastAnalysisDate = new Date();
        });
      },

      getAnalysisStats: () => get().analysisStats,

      // Error handling
      setError: (error, message) => {
        set({
          error: message,
          lastError: error,
          isAnalyzing: false,
        });
      },

      clearError: () => {
        set({
          error: null,
          lastError: null,
        });
      },

      // Utility actions
      reset: () => set(initialState),
    })),
    {
      name: STORAGE_KEYS.ANALYSIS_CACHE,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        analysisHistory: state.analysisHistory.slice(0, 20), // Keep only recent history
        analysisCache: state.analysisCache,
        analysisConfig: state.analysisConfig,
        analysisStats: state.analysisStats,
        lastUpdated: state.lastUpdated,
      }),
      version: 1,
    }
  )
);

// Optimized selectors
export const useCurrentAnalysis = () => {
  return useAnalysisStore((state) => state.currentAnalysis);
};

export const useAnalysisProgress = () => {
  return useAnalysisStore((state) => ({
    isAnalyzing: state.isAnalyzing,
    progress: state.analysisProgress,
    step: state.analysisStep,
  }));
};

export const useAnalysisHistory = () => {
  return useAnalysisStore((state) => state.analysisHistory);
};

export const useCurrentTips = () => {
  return useAnalysisStore((state) => state.currentTips);
};

export const useCurrentRecommendations = () => {
  return useAnalysisStore((state) => state.currentRecommendations);
};

export const useAnalysisError = () => {
  return useAnalysisStore((state) => ({
    error: state.error,
    lastError: state.lastError,
  }));
};

// Actions for external use
export const analysisActions = {
  startAnalysis: (imageUri: string, config?: Partial<AnalysisConfig>) => useAnalysisStore.getState().startAnalysis(imageUri, config),
  cancelAnalysis: () => useAnalysisStore.getState().cancelAnalysis(),
  clearCurrentAnalysis: () => useAnalysisStore.getState().clearCurrentAnalysis(),
  saveToGarden: (analysis: SmartPlantAnalysis, customName?: string) => useAnalysisStore.getState().saveToGarden(analysis, customName),
  generateTips: (plantName?: string, weather?: WeatherContext, issues?: PlantIssue[]) => useAnalysisStore.getState().generateTips(plantName, weather, issues),
  reset: () => useAnalysisStore.getState().reset(),
};