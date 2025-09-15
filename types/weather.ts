import { z } from 'zod';

// Weather condition types
export type WeatherCondition =
  | 'clear' | 'clouds' | 'rain' | 'drizzle' | 'thunderstorm'
  | 'snow' | 'mist' | 'fog' | 'haze' | 'dust' | 'sand' | 'smoke';

// Weather severity levels
export type WeatherSeverity = 'low' | 'moderate' | 'high' | 'extreme';

// Location schema for weather requests
export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  city: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  timezone: z.string().optional(),
});

export type Location = z.infer<typeof LocationSchema>;

// Current weather data schema
export const CurrentWeatherSchema = z.object({
  location: LocationSchema,
  temperature: z.number(), // Celsius
  feelsLike: z.number(), // Celsius
  humidity: z.number().min(0).max(100), // Percentage
  pressure: z.number().min(0), // hPa
  visibility: z.number().min(0).optional(), // km
  uvIndex: z.number().min(0).max(12).optional(),
  windSpeed: z.number().min(0), // km/h
  windDirection: z.number().min(0).max(360).optional(), // degrees
  windGust: z.number().min(0).optional(), // km/h
  cloudCover: z.number().min(0).max(100), // percentage
  condition: z.enum(['clear', 'clouds', 'rain', 'drizzle', 'thunderstorm', 'snow', 'mist', 'fog', 'haze', 'dust', 'sand', 'smoke']),
  conditionDescription: z.string(),
  conditionDescriptionThai: z.string(),
  icon: z.string(), // Weather icon code
  sunrise: z.date().optional(),
  sunset: z.date().optional(),
  timestamp: z.date(),
  dataSource: z.string().default('openweathermap'),
});

export type CurrentWeather = z.infer<typeof CurrentWeatherSchema>;

// Weather forecast item schema
export const WeatherForecastItemSchema = z.object({
  date: z.date(),
  temperature: z.object({
    min: z.number(),
    max: z.number(),
    morning: z.number().optional(),
    day: z.number().optional(),
    evening: z.number().optional(),
    night: z.number().optional(),
  }),
  humidity: z.number().min(0).max(100),
  pressure: z.number().min(0),
  uvIndex: z.number().min(0).max(12).optional(),
  windSpeed: z.number().min(0),
  windDirection: z.number().min(0).max(360).optional(),
  cloudCover: z.number().min(0).max(100),
  condition: z.enum(['clear', 'clouds', 'rain', 'drizzle', 'thunderstorm', 'snow', 'mist', 'fog', 'haze', 'dust', 'sand', 'smoke']),
  conditionDescription: z.string(),
  conditionDescriptionThai: z.string(),
  icon: z.string(),
  precipitationProbability: z.number().min(0).max(100), // percentage
  precipitationAmount: z.number().min(0).optional(), // mm
  sunrise: z.date().optional(),
  sunset: z.date().optional(),
});

export type WeatherForecastItem = z.infer<typeof WeatherForecastItemSchema>;

// 5-day weather forecast schema
export const WeatherForecastSchema = z.object({
  location: LocationSchema,
  forecast: z.array(WeatherForecastItemSchema).max(5),
  generatedAt: z.date(),
  dataSource: z.string().default('openweathermap'),
});

export type WeatherForecast = z.infer<typeof WeatherForecastSchema>;

// Weather alerts schema
export const WeatherAlertSchema = z.object({
  id: z.string(),
  title: z.string(),
  titleThai: z.string(),
  description: z.string(),
  descriptionThai: z.string(),
  severity: z.enum(['low', 'moderate', 'high', 'extreme']),
  category: z.enum(['temperature', 'wind', 'rain', 'storm', 'uv', 'air_quality', 'general']),
  startTime: z.date(),
  endTime: z.date(),
  areas: z.array(z.string()).optional(),
  instructions: z.array(z.string()).optional(),
  instructionsThai: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  source: z.string(),
});

export type WeatherAlert = z.infer<typeof WeatherAlertSchema>;

// Thailand-specific seasonal periods
export type ThailandSeason = 'hot' | 'rainy' | 'cool';

export const ThailandSeasonalDataSchema = z.object({
  season: z.enum(['hot', 'rainy', 'cool']),
  seasonThai: z.string(),
  startMonth: z.number().min(1).max(12),
  endMonth: z.number().min(1).max(12),
  characteristics: z.object({
    averageTemp: z.object({
      min: z.number(),
      max: z.number(),
    }),
    averageHumidity: z.object({
      min: z.number(),
      max: z.number(),
    }),
    averageRainfall: z.number(), // mm per month
    commonConditions: z.array(z.string()),
    commonConditionsThai: z.array(z.string()),
  }),
  plantCareAdjustments: z.object({
    watering: z.object({
      frequency: z.string(),
      frequencyThai: z.string(),
      amount: z.string(),
      amountThai: z.string(),
      tips: z.array(z.string()),
      tipsThai: z.array(z.string()),
    }),
    fertilizing: z.object({
      frequency: z.string(),
      frequencyThai: z.string(),
      type: z.string(),
      typeThai: z.string(),
      tips: z.array(z.string()),
      tipsThai: z.array(z.string()),
    }),
    protection: z.array(z.string()),
    protectionThai: z.array(z.string()),
  }),
});

export type ThailandSeasonalData = z.infer<typeof ThailandSeasonalDataSchema>;

// Weather-based plant care impact
export interface WeatherPlantImpact {
  aspect: 'watering' | 'fertilizing' | 'lighting' | 'protection' | 'growth' | 'health';
  impact: 'beneficial' | 'neutral' | 'challenging' | 'harmful';
  impactScore: number; // -100 to 100
  description: string;
  descriptionThai: string;
  recommendations: string[];
  recommendationsThai: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

// Weather data cache entry
export const WeatherCacheSchema = z.object({
  key: z.string(), // Location-based cache key
  currentWeather: CurrentWeatherSchema.optional(),
  forecast: WeatherForecastSchema.optional(),
  alerts: z.array(WeatherAlertSchema).optional(),
  cachedAt: z.date(),
  expiresAt: z.date(),
  isValid: z.boolean(),
});

export type WeatherCache = z.infer<typeof WeatherCacheSchema>;

// Weather service configuration
export interface WeatherServiceConfig {
  apiKey: string;
  baseUrl: string;
  cacheEnabled: boolean;
  cacheDurationMinutes: number;
  language: 'th' | 'en';
  units: 'metric' | 'imperial';
  includeAlerts: boolean;
  includeHourlyForecast: boolean;
  requestTimeoutMs: number;
  retryAttempts: number;
  offlineMode: boolean;
}

// Weather API response schemas for OpenWeatherMap
export const OpenWeatherCurrentResponseSchema = z.object({
  coord: z.object({
    lon: z.number(),
    lat: z.number(),
  }),
  weather: z.array(z.object({
    id: z.number(),
    main: z.string(),
    description: z.string(),
    icon: z.string(),
  })),
  base: z.string(),
  main: z.object({
    temp: z.number(),
    feels_like: z.number(),
    temp_min: z.number(),
    temp_max: z.number(),
    pressure: z.number(),
    humidity: z.number(),
    sea_level: z.number().optional(),
    grnd_level: z.number().optional(),
  }),
  visibility: z.number().optional(),
  wind: z.object({
    speed: z.number(),
    deg: z.number().optional(),
    gust: z.number().optional(),
  }).optional(),
  clouds: z.object({
    all: z.number(),
  }),
  rain: z.object({
    '1h': z.number().optional(),
    '3h': z.number().optional(),
  }).optional(),
  snow: z.object({
    '1h': z.number().optional(),
    '3h': z.number().optional(),
  }).optional(),
  dt: z.number(),
  sys: z.object({
    type: z.number().optional(),
    id: z.number().optional(),
    country: z.string(),
    sunrise: z.number(),
    sunset: z.number(),
  }),
  timezone: z.number(),
  id: z.number(),
  name: z.string(),
  cod: z.number(),
});

export const OpenWeatherForecastResponseSchema = z.object({
  cod: z.string(),
  message: z.number(),
  cnt: z.number(),
  list: z.array(z.object({
    dt: z.number(),
    main: z.object({
      temp: z.number(),
      feels_like: z.number(),
      temp_min: z.number(),
      temp_max: z.number(),
      pressure: z.number(),
      sea_level: z.number().optional(),
      grnd_level: z.number().optional(),
      humidity: z.number(),
      temp_kf: z.number(),
    }),
    weather: z.array(z.object({
      id: z.number(),
      main: z.string(),
      description: z.string(),
      icon: z.string(),
    })),
    clouds: z.object({
      all: z.number(),
    }),
    wind: z.object({
      speed: z.number(),
      deg: z.number(),
      gust: z.number().optional(),
    }),
    visibility: z.number().optional(),
    pop: z.number(), // Probability of precipitation
    rain: z.object({
      '3h': z.number(),
    }).optional(),
    snow: z.object({
      '3h': z.number(),
    }).optional(),
    sys: z.object({
      pod: z.string(), // Part of day (d/n)
    }),
    dt_txt: z.string(),
  })),
  city: z.object({
    id: z.number(),
    name: z.string(),
    coord: z.object({
      lat: z.number(),
      lon: z.number(),
    }),
    country: z.string(),
    population: z.number(),
    timezone: z.number(),
    sunrise: z.number(),
    sunset: z.number(),
  }),
});

export type OpenWeatherCurrentResponse = z.infer<typeof OpenWeatherCurrentResponseSchema>;
export type OpenWeatherForecastResponse = z.infer<typeof OpenWeatherForecastResponseSchema>;

// Weather service errors
export class WeatherServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

export class WeatherAPIError extends WeatherServiceError {
  constructor(message: string, statusCode: number, originalError?: Error) {
    super(message, 'API_ERROR', statusCode, originalError);
    this.name = 'WeatherAPIError';
  }
}

export class LocationError extends WeatherServiceError {
  constructor(message: string, originalError?: Error) {
    super(message, 'LOCATION_ERROR', 400, originalError);
    this.name = 'LocationError';
  }
}

export class CacheError extends WeatherServiceError {
  constructor(message: string, originalError?: Error) {
    super(message, 'CACHE_ERROR', 500, originalError);
    this.name = 'CacheError';
  }
}

// Validation functions
export const validateCurrentWeather = (data: unknown): CurrentWeather => {
  const result = CurrentWeatherSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid current weather data: ${result.error.message}`);
  }
  return result.data;
};

export const validateWeatherForecast = (data: unknown): WeatherForecast => {
  const result = WeatherForecastSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid weather forecast data: ${result.error.message}`);
  }
  return result.data;
};

export const validateLocation = (data: unknown): Location => {
  const result = LocationSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid location data: ${result.error.message}`);
  }
  return result.data;
};

// Helper functions
export const getWeatherConditionInThai = (condition: WeatherCondition): string => {
  const conditionMap: Record<WeatherCondition, string> = {
    clear: 'แจ่มใส',
    clouds: 'มีเมฆ',
    rain: 'ฝนตก',
    drizzle: 'ฝนปรอยๆ',
    thunderstorm: 'ฟ้าร้องฝนตก',
    snow: 'หิมะตก',
    mist: 'หมอกเบา',
    fog: 'หมอกหนา',
    haze: 'หมอกควัน',
    dust: 'ฝุ่น',
    sand: 'พายุทราย',
    smoke: 'ควัน',
  };
  return conditionMap[condition] || condition;
};

export const getCurrentThailandSeason = (month: number): ThailandSeason => {
  // Hot season: March - May
  if (month >= 3 && month <= 5) return 'hot';
  // Rainy season: June - October
  if (month >= 6 && month <= 10) return 'rainy';
  // Cool season: November - February
  return 'cool';
};

export const getThailandSeasonInThai = (season: ThailandSeason): string => {
  const seasonMap: Record<ThailandSeason, string> = {
    hot: 'ฤดูร้อน',
    rainy: 'ฤดูฝน',
    cool: 'ฤดูหนาว',
  };
  return seasonMap[season];
};

export const isWeatherGoodForPlants = (weather: CurrentWeather): boolean => {
  const { temperature, humidity, condition, windSpeed } = weather;

  // Ideal conditions for most plants
  const tempGood = temperature >= 18 && temperature <= 28;
  const humidityGood = humidity >= 40 && humidity <= 70;
  const conditionGood = !['thunderstorm', 'snow', 'dust', 'sand', 'smoke'].includes(condition);
  const windGood = windSpeed < 30; // km/h

  return tempGood && humidityGood && conditionGood && windGood;
};

export const getUVIndexLevel = (uvIndex: number): { level: string, levelThai: string } => {
  if (uvIndex <= 2) return { level: 'Low', levelThai: 'ต่ำ' };
  if (uvIndex <= 5) return { level: 'Moderate', levelThai: 'ปานกลาง' };
  if (uvIndex <= 7) return { level: 'High', levelThai: 'สูง' };
  if (uvIndex <= 10) return { level: 'Very High', levelThai: 'สูงมาก' };
  return { level: 'Extreme', levelThai: 'อันตราย' };
};

export const formatTemperature = (temp: number, unit: 'celsius' | 'fahrenheit' = 'celsius'): string => {
  if (unit === 'fahrenheit') {
    return `${Math.round((temp * 9/5) + 32)}°F`;
  }
  return `${Math.round(temp)}°C`;
};

export const formatHumidity = (humidity: number): string => {
  return `${Math.round(humidity)}%`;
};

export const formatWindSpeed = (speed: number, unit: 'kmh' | 'mph' = 'kmh'): string => {
  if (unit === 'mph') {
    return `${Math.round(speed * 0.621371)} mph`;
  }
  return `${Math.round(speed)} km/h`;
};