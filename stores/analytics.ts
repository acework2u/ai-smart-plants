import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plant } from '../types/garden';
import { ActivityEntry } from '../types/activity';

export interface HealthTrendData {
  date: string;
  averageHealth: number;
  plantCount: number;
  healthByPlant: { [plantId: string]: number };
}

export interface ActivityStats {
  totalActivities: number;
  activitiesByType: { [type: string]: number };
  averagePerWeek: number;
  consistencyScore: number; // 0-100
}

export interface WateringPattern {
  dayOfWeek: string;
  averageAmount: number;
  frequency: number;
  timePreference: string; // "morning", "afternoon", "evening"
}

export interface FertilizerUsage {
  month: string;
  totalAmount: number;
  npkBreakdown: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  };
  plantCount: number;
}

export interface CareMetrics {
  wateringConsistency: number; // 0-1
  fertilizingConsistency: number; // 0-1
  healthCheckConsistency: number; // 0-1
  overallScore: number; // 0-100
}

export interface PlantSuccessMetrics {
  plantId: string;
  healthImprovement: number; // percentage change
  careFrequency: number; // activities per week
  growthRate: number; // estimated growth rate
  issuesResolved: number;
  careScore: number; // 0-100
}

export interface AnalyticsInsight {
  id: string;
  type: 'positive' | 'warning' | 'suggestion' | 'achievement';
  title: string;
  description: string;
  actionable?: boolean;
  actionText?: string;
  createdAt: Date;
}

interface AnalyticsState {
  // Cached analytics data
  healthTrends: HealthTrendData[];
  activityStats: ActivityStats | null;
  wateringPatterns: WateringPattern[];
  fertilizerUsage: FertilizerUsage[];
  careMetrics: CareMetrics | null;
  plantSuccessMetrics: PlantSuccessMetrics[];
  insights: AnalyticsInsight[];

  // Data freshness tracking
  lastCalculated: Date | null;
  calculationInProgress: boolean;

  // Actions
  calculateAnalytics: (plants: Plant[], activities: ActivityEntry[]) => Promise<void>;
  generateInsights: (plants: Plant[], activities: ActivityEntry[]) => Promise<void>;
  getHealthTrends: (timeRange: 'week' | 'month' | 'year', plantId?: string) => HealthTrendData[];
  getActivityStats: (timeRange: 'week' | 'month' | 'year', plantId?: string) => ActivityStats;
  getWateringFrequency: (plantId?: string) => WateringPattern[];
  getFertilizerUsage: (timeRange: 'month' | 'year', plantId?: string) => FertilizerUsage[];
  getCareConsistency: (plantId?: string) => CareMetrics;
  getPlantSuccessRate: (plantId?: string) => PlantSuccessMetrics[];

  // Export functionality
  exportData: (format: 'csv' | 'json', timeRange: 'week' | 'month' | 'year') => Promise<string>;

  // Utility functions
  clearCache: () => void;
  isDataFresh: () => boolean;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      // Initial state
      healthTrends: [],
      activityStats: null,
      wateringPatterns: [],
      fertilizerUsage: [],
      careMetrics: null,
      plantSuccessMetrics: [],
      insights: [],
      lastCalculated: null,
      calculationInProgress: false,

      // Calculate comprehensive analytics
      calculateAnalytics: async (plants: Plant[], activities: ActivityEntry[]) => {
        const state = get();
        if (state.calculationInProgress) return;

        set({ calculationInProgress: true });

        try {
          // Calculate health trends
          const healthTrends = calculateHealthTrends(plants, activities);

          // Calculate activity statistics
          const activityStats = calculateActivityStats(activities);

          // Calculate watering patterns
          const wateringPatterns = calculateWateringPatterns(activities);

          // Calculate fertilizer usage
          const fertilizerUsage = calculateFertilizerUsage(activities);

          // Calculate care metrics
          const careMetrics = calculateCareMetrics(plants, activities);

          // Calculate plant success metrics
          const plantSuccessMetrics = calculatePlantSuccessMetrics(plants, activities);

          set({
            healthTrends,
            activityStats,
            wateringPatterns,
            fertilizerUsage,
            careMetrics,
            plantSuccessMetrics,
            lastCalculated: new Date(),
            calculationInProgress: false,
          });

          // Generate insights based on calculated data
          await get().generateInsights(plants, activities);

        } catch (error) {
          console.error('Failed to calculate analytics:', error);
          set({ calculationInProgress: false });
        }
      },

      // Generate actionable insights
      generateInsights: async (plants: Plant[], activities: ActivityEntry[]) => {
        const state = get();
        const insights: AnalyticsInsight[] = [];

        // Health improvement insights
        if (state.plantSuccessMetrics.length > 0) {
          const avgImprovement = state.plantSuccessMetrics.reduce(
            (sum, metric) => sum + metric.healthImprovement, 0
          ) / state.plantSuccessMetrics.length;

          if (avgImprovement > 10) {
            insights.push({
              id: `health-improvement-${Date.now()}`,
              type: 'positive',
              title: 'สุขภาพต้นไม้ดีขึ้นอย่างต่อเนื่อง! 🌱',
              description: `ต้นไม้ของคุณมีสุขภาพดีขึ้น ${avgImprovement.toFixed(1)}% ในช่วงที่ผ่านมา`,
              createdAt: new Date(),
            });
          }
        }

        // Watering consistency insights
        if (state.careMetrics && state.careMetrics.wateringConsistency < 0.7) {
          insights.push({
            id: `watering-consistency-${Date.now()}`,
            type: 'suggestion',
            title: 'ควรรดน้ำให้สม่ำเสมอมากขึ้น 💧',
            description: 'การรดน้ำอย่างสม่ำเสมอจะช่วยให้ต้นไม้เติบโตได้ดีขึ้น',
            actionable: true,
            actionText: 'ตั้งเตือนรดน้ำ',
            createdAt: new Date(),
          });
        }

        // Seasonal care insights
        const currentMonth = new Date().getMonth() + 1;
        if (currentMonth >= 6 && currentMonth <= 10) { // Rainy season
          insights.push({
            id: `seasonal-care-${Date.now()}`,
            type: 'warning',
            title: 'ระวังโรคเชื้อราในฤดูฝน 🌧️',
            description: 'ควรลดการรดน้ำและเพิ่มการระบายอากาศในช่วงฤดูฝน',
            actionable: true,
            actionText: 'ดูคำแนะนำเพิ่มเติม',
            createdAt: new Date(),
          });
        }

        // Achievement insights
        if (state.careMetrics && state.careMetrics.overallScore > 90) {
          insights.push({
            id: `achievement-${Date.now()}`,
            type: 'achievement',
            title: 'คุณเป็นผู้ดูแลต้นไม้ที่ยอดเยี่ยม! 🏆',
            description: `คะแนนการดูแลของคุณ ${state.careMetrics.overallScore} จาก 100`,
            createdAt: new Date(),
          });
        }

        // Fertilizer optimization insights
        const recentFertilizer = state.fertilizerUsage.slice(-3);
        if (recentFertilizer.length > 0) {
          const avgNitrogen = recentFertilizer.reduce(
            (sum, usage) => sum + usage.npkBreakdown.nitrogen, 0
          ) / recentFertilizer.length;

          if (avgNitrogen > 15) {
            insights.push({
              id: `fertilizer-optimization-${Date.now()}`,
              type: 'suggestion',
              title: 'ปรับปริมาณไนโตรเจน 🌿',
              description: 'การใส่ไนโตรเจนมากเกินไปอาจทำให้ใบเขียวมากแต่ออกดอกน้อย',
              actionable: true,
              actionText: 'ดูคำแนะนำปุ๋ย',
              createdAt: new Date(),
            });
          }
        }

        set({ insights });
      },

      // Get health trends for specific time range
      getHealthTrends: (timeRange, plantId) => {
        const state = get();
        let filteredTrends = state.healthTrends;

        // Filter by plant if specified
        if (plantId) {
          filteredTrends = state.healthTrends.filter(trend =>
            trend.healthByPlant[plantId] !== undefined
          );
        }

        // Filter by time range
        const now = new Date();
        const startDate = new Date();

        switch (timeRange) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }

        return filteredTrends.filter(trend =>
          new Date(trend.date) >= startDate
        );
      },

      // Get activity statistics
      getActivityStats: (timeRange, plantId) => {
        const state = get();
        // For now, return cached stats
        // In a full implementation, would filter by timeRange and plantId
        return state.activityStats || {
          totalActivities: 0,
          activitiesByType: {},
          averagePerWeek: 0,
          consistencyScore: 0,
        };
      },

      // Get watering frequency patterns
      getWateringFrequency: (plantId) => {
        const state = get();
        // Filter by plant if specified
        return state.wateringPatterns;
      },

      // Get fertilizer usage data
      getFertilizerUsage: (timeRange, plantId) => {
        const state = get();
        return state.fertilizerUsage;
      },

      // Get care consistency metrics
      getCareConsistency: (plantId) => {
        const state = get();
        return state.careMetrics || {
          wateringConsistency: 0,
          fertilizingConsistency: 0,
          healthCheckConsistency: 0,
          overallScore: 0,
        };
      },

      // Get plant success rates
      getPlantSuccessRate: (plantId) => {
        const state = get();
        if (plantId) {
          return state.plantSuccessMetrics.filter(metric => metric.plantId === plantId);
        }
        return state.plantSuccessMetrics;
      },

      // Export analytics data
      exportData: async (format, timeRange) => {
        const state = get();

        if (format === 'csv') {
          // Generate CSV format
          let csv = 'Date,Plant,Activity,Amount,Unit,Notes\n';

          // Add data rows (mock implementation)
          csv += '2025-01-15,Monstera,รดน้ำ,250,ml,สุขภาพดี\n';
          csv += '2025-01-14,Fiddle Leaf,ใส่ปุ๋ย,5,g,NPK 10-10-10\n';

          return csv;
        } else {
          // Generate JSON format
          return JSON.stringify({
            exportDate: new Date().toISOString(),
            timeRange,
            healthTrends: state.healthTrends,
            activityStats: state.activityStats,
            careMetrics: state.careMetrics,
            insights: state.insights,
          }, null, 2);
        }
      },

      // Clear cached data
      clearCache: () => {
        set({
          healthTrends: [],
          activityStats: null,
          wateringPatterns: [],
          fertilizerUsage: [],
          careMetrics: null,
          plantSuccessMetrics: [],
          insights: [],
          lastCalculated: null,
        });
      },

      // Check if data is fresh (less than 1 hour old)
      isDataFresh: () => {
        const state = get();
        if (!state.lastCalculated) return false;

        const oneHour = 60 * 60 * 1000;
        return Date.now() - state.lastCalculated.getTime() < oneHour;
      },
    }),
    {
      name: '@spa/analytics',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);

// Helper functions for calculations
function calculateHealthTrends(plants: Plant[], activities: ActivityEntry[]): HealthTrendData[] {
  const trends: HealthTrendData[] = [];
  const today = new Date();

  // Generate mock health trend data for the past 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const healthByPlant: { [plantId: string]: number } = {};
    let totalHealth = 0;

    plants.forEach(plant => {
      // Mock health calculation based on recent activities
      const baseHealth = plant.status === 'Healthy' ? 90 : plant.status === 'Warning' ? 70 : 50;
      const variance = Math.random() * 20 - 10; // ±10 variance
      const health = Math.max(0, Math.min(100, baseHealth + variance));

      healthByPlant[plant.id] = health;
      totalHealth += health;
    });

    trends.push({
      date: date.toISOString().split('T')[0],
      averageHealth: plants.length > 0 ? totalHealth / plants.length : 0,
      plantCount: plants.length,
      healthByPlant,
    });
  }

  return trends;
}

function calculateActivityStats(activities: ActivityEntry[]): ActivityStats {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentActivities = activities.filter(activity =>
    new Date(activity.dateISO) >= oneWeekAgo
  );

  const activitiesByType: { [type: string]: number } = {};
  recentActivities.forEach(activity => {
    activitiesByType[activity.kind] = (activitiesByType[activity.kind] || 0) + 1;
  });

  // Calculate consistency score based on regularity
  const consistencyScore = Math.min(100, (recentActivities.length / 14) * 100); // Target: 2 activities per day

  return {
    totalActivities: activities.length,
    activitiesByType,
    averagePerWeek: recentActivities.length,
    consistencyScore,
  };
}

function calculateWateringPatterns(activities: ActivityEntry[]): WateringPattern[] {
  const wateringActivities = activities.filter(activity => activity.kind === 'รดน้ำ');
  const patterns: { [day: string]: { amounts: number[], times: string[] } } = {};

  wateringActivities.forEach(activity => {
    const date = new Date(activity.dateISO);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];

    if (!patterns[dayOfWeek]) {
      patterns[dayOfWeek] = { amounts: [], times: [] };
    }

    if (activity.quantity) {
      patterns[dayOfWeek].amounts.push(parseFloat(activity.quantity));
    }
    if (activity.time24) {
      patterns[dayOfWeek].times.push(activity.time24);
    }
  });

  return Object.entries(patterns).map(([day, data]) => ({
    dayOfWeek: day,
    averageAmount: data.amounts.length > 0
      ? data.amounts.reduce((sum, amount) => sum + amount, 0) / data.amounts.length
      : 0,
    frequency: data.amounts.length,
    timePreference: determineTimePreference(data.times),
  }));
}

function calculateFertilizerUsage(activities: ActivityEntry[]): FertilizerUsage[] {
  const fertilizerActivities = activities.filter(activity => activity.kind === 'ใส่ปุ๋ย');
  const monthlyUsage: { [month: string]: { amounts: number[], npk: any[] } } = {};

  fertilizerActivities.forEach(activity => {
    const date = new Date(activity.dateISO);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    if (!monthlyUsage[monthKey]) {
      monthlyUsage[monthKey] = { amounts: [], npk: [] };
    }

    if (activity.quantity) {
      monthlyUsage[monthKey].amounts.push(parseFloat(activity.quantity));
    }
    if (activity.npk) {
      monthlyUsage[monthKey].npk.push(activity.npk);
    }
  });

  return Object.entries(monthlyUsage).map(([month, data]) => ({
    month,
    totalAmount: data.amounts.reduce((sum, amount) => sum + amount, 0),
    npkBreakdown: calculateNPKBreakdown(data.npk),
    plantCount: new Set(fertilizerActivities.map(a => a.plantId)).size,
  }));
}

function calculateCareMetrics(plants: Plant[], activities: ActivityEntry[]): CareMetrics {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentActivities = activities.filter(activity =>
    new Date(activity.dateISO) >= thirtyDaysAgo
  );

  // Calculate consistency for each care type
  const wateringActivities = recentActivities.filter(a => a.kind === 'รดน้ำ');
  const fertilizingActivities = recentActivities.filter(a => a.kind === 'ใส่ปุ๋ย');
  const healthCheckActivities = recentActivities.filter(a => a.kind === 'ตรวจใบ');

  // Simple consistency calculation based on frequency
  const wateringConsistency = Math.min(1, wateringActivities.length / (plants.length * 15)); // Target: every other day
  const fertilizingConsistency = Math.min(1, fertilizingActivities.length / (plants.length * 2)); // Target: twice per month
  const healthCheckConsistency = Math.min(1, healthCheckActivities.length / (plants.length * 4)); // Target: weekly

  const overallScore = Math.round(
    (wateringConsistency * 0.5 + fertilizingConsistency * 0.3 + healthCheckConsistency * 0.2) * 100
  );

  return {
    wateringConsistency,
    fertilizingConsistency,
    healthCheckConsistency,
    overallScore,
  };
}

function calculatePlantSuccessMetrics(plants: Plant[], activities: ActivityEntry[]): PlantSuccessMetrics[] {
  return plants.map(plant => {
    const plantActivities = activities.filter(a => a.plantId === plant.id);
    const recentActivities = plantActivities.filter(a =>
      new Date(a.dateISO) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    // Mock health improvement calculation
    const healthImprovement = Math.random() * 20 - 5; // -5% to +15%

    // Calculate care frequency
    const careFrequency = recentActivities.length / 4; // per week

    // Mock growth rate
    const growthRate = Math.random() * 0.1; // 0-10% per month

    // Issues resolved (mock)
    const issuesResolved = Math.floor(Math.random() * 3);

    // Calculate care score
    const careScore = Math.min(100,
      (careFrequency * 20) +
      (Math.max(0, healthImprovement) * 2) +
      (issuesResolved * 10) +
      60 // Base score
    );

    return {
      plantId: plant.id,
      healthImprovement,
      careFrequency,
      growthRate,
      issuesResolved,
      careScore: Math.round(careScore),
    };
  });
}

function determineTimePreference(times: string[]): string {
  if (times.length === 0) return 'morning';

  const morningCount = times.filter(time => {
    const hour = parseInt(time.split(':')[0]);
    return hour >= 6 && hour < 12;
  }).length;

  const afternoonCount = times.filter(time => {
    const hour = parseInt(time.split(':')[0]);
    return hour >= 12 && hour < 18;
  }).length;

  const eveningCount = times.filter(time => {
    const hour = parseInt(time.split(':')[0]);
    return hour >= 18 || hour < 6;
  }).length;

  if (morningCount >= afternoonCount && morningCount >= eveningCount) return 'morning';
  if (afternoonCount >= eveningCount) return 'afternoon';
  return 'evening';
}

function calculateNPKBreakdown(npkData: any[]): { nitrogen: number, phosphorus: number, potassium: number } {
  if (npkData.length === 0) {
    return { nitrogen: 0, phosphorus: 0, potassium: 0 };
  }

  const total = npkData.reduce((acc, npk) => ({
    nitrogen: acc.nitrogen + (parseFloat(npk.n) || 0),
    phosphorus: acc.phosphorus + (parseFloat(npk.p) || 0),
    potassium: acc.potassium + (parseFloat(npk.k) || 0),
  }), { nitrogen: 0, phosphorus: 0, potassium: 0 });

  return {
    nitrogen: total.nitrogen / npkData.length,
    phosphorus: total.phosphorus / npkData.length,
    potassium: total.potassium / npkData.length,
  };
}