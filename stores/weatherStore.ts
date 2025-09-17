import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import { immer } from 'zustand/middleware/immer';
import {
  CurrentWeather,
  WeatherForecast,
  WeatherAlert,
  Location,
  WeatherPlantImpact,
  ThailandSeason,
  WeatherServiceError,
} from '../types/weather';
import { weatherService } from '../services/WeatherService';

interface WeatherState {
  // Current state
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Weather data
  currentWeather: CurrentWeather | null;
  forecast: WeatherForecast | null;
  alerts: WeatherAlert[];
  location: Location | null;
  plantCareImpacts: WeatherPlantImpact[];

  // Seasonal context
  currentSeason: ThailandSeason | null;
  seasonThai: string | null;

  // Plant care suitability
  plantCareSuitability: {
    suitable: boolean;
    reasons: string[];
    reasonsThai: string[];
    recommendations: string[];
    recommendationsThai: string[];
  } | null;

  // Permissions
  hasLocationPermission: boolean;
  isLocationServiceEnabled: boolean;

  // Actions
  initializeWeatherData: () => Promise<void>;
  refreshWeatherData: () => Promise<void>;
  getCurrentWeather: (location?: Location) => Promise<void>;
  getWeatherForecast: (location?: Location) => Promise<void>;
  getPlantCareImpacts: (location?: Location) => Promise<void>;
  checkPlantCareSuitability: (location?: Location) => Promise<void>;
  updateLocation: (location: Location) => void;
  clearError: () => void;
  clearCache: () => Promise<void>;
  setOfflineMode: (offline: boolean) => void;
}

export const useWeatherStore = create<WeatherState>()(
  immer((set, get) => ({
    // Initial state
    isLoading: false,
    error: null,
    lastUpdated: null,
    currentWeather: null,
    forecast: null,
    alerts: [],
    location: null,
    plantCareImpacts: [],
    currentSeason: null,
    seasonThai: null,
    plantCareSuitability: null,
    hasLocationPermission: false,
    isLocationServiceEnabled: false,

    // Initialize weather data - called on app start
    initializeWeatherData: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        // Get current location and permissions
        const location = await weatherService.getCurrentLocation();

        set((state) => {
          state.location = location;
          state.hasLocationPermission = true;
          state.isLocationServiceEnabled = true;
        });

        // Get seasonal context
        const seasonalContext = weatherService.getThailandSeasonalContext();

        set((state) => {
          state.currentSeason = seasonalContext.season;
          state.seasonThai = seasonalContext.seasonThai;
        });

        // Load all weather data in parallel
        await Promise.allSettled([
          get().getCurrentWeather(location),
          get().getWeatherForecast(location),
          get().getPlantCareImpacts(location),
          get().checkPlantCareSuitability(location),
        ]);

        set((state) => {
          state.lastUpdated = new Date();
        });

      } catch (error) {
        const errorMessage = error instanceof WeatherServiceError
          ? error.message
          : 'Failed to initialize weather data';

        set((state) => {
          state.error = errorMessage;
          if (error instanceof WeatherServiceError && error.code === 'PERMISSION_ERROR') {
            state.hasLocationPermission = false;
          }
        });
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    // Refresh all weather data
    refreshWeatherData: async () => {
      const { location } = get();

      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        // Use stored location or get new one
        const targetLocation = location || await weatherService.getCurrentLocation();

        if (!location && targetLocation) {
          set((state) => {
            state.location = targetLocation;
          });
        }

        // Update seasonal context
        const seasonalContext = weatherService.getThailandSeasonalContext();
        set((state) => {
          state.currentSeason = seasonalContext.season;
          state.seasonThai = seasonalContext.seasonThai;
        });

        // Refresh all data in parallel
        await Promise.allSettled([
          get().getCurrentWeather(targetLocation),
          get().getWeatherForecast(targetLocation),
          get().getPlantCareImpacts(targetLocation),
          get().checkPlantCareSuitability(targetLocation),
        ]);

        set((state) => {
          state.lastUpdated = new Date();
        });

      } catch (error) {
        const errorMessage = error instanceof WeatherServiceError
          ? error.message
          : 'Failed to refresh weather data';

        set((state) => {
          state.error = errorMessage;
        });
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    // Get current weather
    getCurrentWeather: async (location?: Location) => {
      try {
        const currentWeather = await weatherService.getCurrentWeather(location);

        set((state) => {
          state.currentWeather = currentWeather;
          state.error = null;
        });

      } catch (error) {
        const errorMessage = error instanceof WeatherServiceError
          ? error.message
          : 'Failed to get current weather';

        set((state) => {
          state.error = errorMessage;
        });

        throw error;
      }
    },

    // Get weather forecast
    getWeatherForecast: async (location?: Location) => {
      try {
        const forecast = await weatherService.getWeatherForecast(location);

        set((state) => {
          state.forecast = forecast;
          state.error = null;
        });

      } catch (error) {
        const errorMessage = error instanceof WeatherServiceError
          ? error.message
          : 'Failed to get weather forecast';

        set((state) => {
          state.error = errorMessage;
        });

        throw error;
      }
    },

    // Get plant care impacts
    getPlantCareImpacts: async (location?: Location) => {
      try {
        const impacts = await weatherService.getPlantCareImpacts(location);

        set((state) => {
          state.plantCareImpacts = impacts;
          state.error = null;
        });

      } catch (error) {
        const errorMessage = error instanceof WeatherServiceError
          ? error.message
          : 'Failed to analyze plant care impacts';

        set((state) => {
          state.error = errorMessage;
        });

        throw error;
      }
    },

    // Check plant care suitability
    checkPlantCareSuitability: async (location?: Location) => {
      try {
        const suitability = await weatherService.isGoodForPlantCare(location);

        set((state) => {
          state.plantCareSuitability = suitability;
          state.error = null;
        });

      } catch (error) {
        const errorMessage = error instanceof WeatherServiceError
          ? error.message
          : 'Failed to check plant care suitability';

        set((state) => {
          state.error = errorMessage;
        });

        throw error;
      }
    },

    // Update location
    updateLocation: (location: Location) => {
      set((state) => {
        state.location = location;
      });

      // Automatically refresh data with new location
      get().refreshWeatherData();
    },

    // Clear error
    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },

    // Clear cache
    clearCache: async () => {
      try {
        await weatherService.clearCache();

        set((state) => {
          state.currentWeather = null;
          state.forecast = null;
          state.alerts = [];
          state.plantCareImpacts = [];
          state.plantCareSuitability = null;
          state.lastUpdated = null;
        });

      } catch (error) {
        const errorMessage = error instanceof WeatherServiceError
          ? error.message
          : 'Failed to clear weather cache';

        set((state) => {
          state.error = errorMessage;
        });
      }
    },

    // Set offline mode
    setOfflineMode: (offline: boolean) => {
      weatherService.updateConfig({ offlineMode: offline });
    },
  }))
);

// Selector hooks for better performance
export const useCurrentWeather = () => useWeatherStore((state) => state.currentWeather);
export const useWeatherForecast = () => useWeatherStore((state) => state.forecast);
export const useWeatherError = () => useWeatherStore((state) => state.error);
export const useWeatherLoading = () => useWeatherStore((state) => state.isLoading);
export const usePlantCareImpacts = () => useWeatherStore((state) => state.plantCareImpacts);
export const usePlantCareSuitability = () => useWeatherStore((state) => state.plantCareSuitability);
// Prefer selecting individual fields to avoid returning new objects each render
export const useSeasonValue = () => useWeatherStore((state) => state.currentSeason);
export const useSeasonThai = () => useWeatherStore((state) => state.seasonThai);
// Backward-compatible selector with shallow compare (avoid using in new code)
export const useCurrentSeason = () =>
  useWeatherStore(
    (state) => ({ season: state.currentSeason, seasonThai: state.seasonThai }),
    shallow
  );

// Action hooks
export const useWeatherActions = () => useWeatherStore((state) => ({
  initializeWeatherData: state.initializeWeatherData,
  refreshWeatherData: state.refreshWeatherData,
  getCurrentWeather: state.getCurrentWeather,
  getWeatherForecast: state.getWeatherForecast,
  getPlantCareImpacts: state.getPlantCareImpacts,
  checkPlantCareSuitability: state.checkPlantCareSuitability,
  updateLocation: state.updateLocation,
  clearError: state.clearError,
  clearCache: state.clearCache,
  setOfflineMode: state.setOfflineMode,
}));

// Computed selectors
export const useWeatherSummary = () => useWeatherStore((state) => {
  if (!state.currentWeather) return null;

  return {
    temperature: state.currentWeather.temperature,
    condition: state.currentWeather.condition,
    conditionDescription: state.currentWeather.conditionDescription,
    conditionDescriptionThai: state.currentWeather.conditionDescriptionThai,
    humidity: state.currentWeather.humidity,
    windSpeed: state.currentWeather.windSpeed,
    uvIndex: state.currentWeather.uvIndex,
    isGoodForPlants: state.plantCareSuitability?.suitable ?? false,
  };
}, shallow);

export const useUrgentWeatherRecommendations = () => useWeatherStore((state) => {
  const urgentImpacts = state.plantCareImpacts.filter(
    (impact) => impact.urgency === 'high' || impact.urgency === 'critical'
  );

  return urgentImpacts.map((impact) => ({
    aspect: impact.aspect,
    description: impact.description,
    descriptionThai: impact.descriptionThai,
    recommendations: impact.recommendations,
    recommendationsThai: impact.recommendationsThai,
    urgency: impact.urgency,
  }));
});

export const useWeatherAlerts = () => useWeatherStore((state) => {
  const alerts = state.alerts.filter((alert) => alert.isActive);
  const criticalImpacts = state.plantCareImpacts.filter(
    (impact) => impact.urgency === 'critical'
  );

  return {
    weatherAlerts: alerts,
    criticalPlantImpacts: criticalImpacts,
    hasAlerts: alerts.length > 0 || criticalImpacts.length > 0,
  };
});

// Utility function to format weather data for display
export const formatWeatherForDisplay = (weather: CurrentWeather | null, language: 'th' | 'en' = 'en') => {
  if (!weather) return null;

  const tempUnit = language === 'th' ? '°C' : '°C';
  const humidityUnit = '%';
  const windUnit = language === 'th' ? 'กม./ชม.' : 'km/h';

  return {
    temperature: `${Math.round(weather.temperature)}${tempUnit}`,
    feelsLike: `${Math.round(weather.feelsLike)}${tempUnit}`,
    humidity: `${weather.humidity}${humidityUnit}`,
    windSpeed: `${Math.round(weather.windSpeed)} ${windUnit}`,
    condition: language === 'th' ? weather.conditionDescriptionThai : weather.conditionDescription,
    uvIndex: weather.uvIndex ? `${weather.uvIndex}/12` : 'N/A',
    sunrise: weather.sunrise?.toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    sunset: weather.sunset?.toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
};
