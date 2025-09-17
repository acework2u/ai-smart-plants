import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CurrentWeather,
  WeatherForecast as TypedWeatherForecast,
  WeatherForecastItem,
  Location as TypedLocation,
  ThailandSeason,
  getCurrentThailandSeason,
  getThailandSeasonInThai,
  getWeatherConditionInThai,
} from '../types/weather';

const CACHE_KEY = '@spa/weatherCache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const API_KEY = '8f3e4b2a1c9d6e7f0a8b5c2d1e9f8a3b'; // Mock API key for development

type InternalCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'hot' | 'cool';

interface ServiceConfig {
  offlineMode: boolean;
}

export class WeatherService {
  private static instance: WeatherService;
  private cachedWeather: CurrentWeather | null = null;
  private cacheTimestamp: number = 0;
  private config: ServiceConfig = { offlineMode: false };

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  // Get current weather data (aligned to types/CurrentWeather)
  async getCurrentWeather(location?: TypedLocation, useCache: boolean = true): Promise<CurrentWeather> {
    // Check cache first
    if (useCache && this.isCacheValid()) {
      return this.cachedWeather!;
    }

    try {
      // Get location permission if none provided
      const loc = location || await this.getCurrentLocation();

      // For development, return mock data based on location
      // In production, replace with actual OpenWeatherMap API call
      const weatherData = await this.fetchWeatherData(loc.latitude, loc.longitude, loc);

      // Cache the result
      this.cachedWeather = weatherData;
      this.cacheTimestamp = Date.now();
      await this.saveCacheToStorage();

      return weatherData;
    } catch (error) {
      console.error('Failed to fetch weather data:', error);

      // Try to return cached data even if expired
      if (this.cachedWeather) {
        return this.cachedWeather;
      }

      // Return default Bangkok weather as fallback
      return this.getDefaultWeatherData();
    }
  }

  // Get 5-day weather forecast
  async getWeatherForecast(location?: TypedLocation): Promise<TypedWeatherForecast> {
    try {
      const loc = location || await this.getCurrentLocation();
      return await this.fetchForecastData(loc.latitude, loc.longitude, loc);
    } catch (error) {
      console.error('Failed to fetch weather forecast:', error);
      return this.getDefaultForecast();
    }
  }

  // Seasonal context (Thailand-centric)
  getCurrentThaiSeason(): ThailandSeason {
    return getCurrentThailandSeason(new Date().getMonth() + 1);
  }

  getThailandSeasonalContext(): { season: ThailandSeason; seasonThai: string; month: number } {
    const season = this.getCurrentThaiSeason();
    return { season, seasonThai: getThailandSeasonInThai(season), month: new Date().getMonth() + 1 };
  }

  // Check if current weather is suitable for outdoor activities
  async isGoodForPlantCare(location?: TypedLocation): Promise<{
    suitable: boolean;
    reasons: string[];
    reasonsThai: string[];
    recommendations: string[];
    recommendationsThai: string[];
  }> {
    const weather = this.cachedWeather || await this.getCurrentWeather(location);

    const reasons: string[] = [];
    const reasonsThai: string[] = [];
    const recs: string[] = [];
    const recsTh: string[] = [];

    const tooHot = weather.temperature > 38;
    const tooCold = weather.temperature < 12;
    const highUV = (weather.uvIndex ?? 0) > 9;
    const windy = weather.windSpeed > 40;
    const stormy = ['thunderstorm'].includes(weather.condition);

    if (tooHot) { reasons.push('Temperature too high'); reasonsThai.push('อุณหภูมิสูงเกินไป'); recsTh.push('รดน้ำและย้ายไปที่ร่ม'); recs.push('Water more and provide shade'); }
    if (tooCold) { reasons.push('Temperature too low'); reasonsThai.push('อุณหภูมิต่ำเกินไป'); recsTh.push('ลดการรดน้ำและป้องกันลมหนาว'); recs.push('Reduce watering and shield from cold'); }
    if (highUV) { reasons.push('UV index is extreme'); reasonsThai.push('ดัชนี UV สูงมาก'); recsTh.push('หลบแดดช่วง 10:00-16:00'); recs.push('Avoid direct sun 10am-4pm'); }
    if (windy) { reasons.push('Wind speed is high'); reasonsThai.push('ลมแรง'); recsTh.push('ย้ายไว้ในที่อับลม'); recs.push('Move to sheltered area'); }
    if (stormy) { reasons.push('Stormy condition'); reasonsThai.push('พายุฝนฟ้าคะนอง'); recsTh.push('ย้ายต้นไม้เข้าในร่ม'); recs.push('Move plants indoors'); }

    const suitable = reasons.length === 0;
    if (suitable) {
      recs.push('Great time for routine care');
      recsTh.push('เหมาะสำหรับการดูแลทั่วไป');
    }

    return { suitable, reasons, reasonsThai, recommendations: recs, recommendationsThai: recsTh };
  }

  // Get weather-based plant care recommendations
  async getPlantCareImpacts(location?: TypedLocation): Promise<Array<{
    aspect: 'watering' | 'fertilizing' | 'lighting' | 'protection' | 'growth' | 'health';
    impact: 'beneficial' | 'neutral' | 'challenging' | 'harmful';
    impactScore: number;
    description: string;
    descriptionThai: string;
    recommendations: string[];
    recommendationsThai: string[];
    urgency: 'low' | 'medium' | 'high' | 'critical';
  }>> {
    const w = this.cachedWeather || await this.getCurrentWeather(location);
    const impacts: Array<{
      aspect: 'watering' | 'fertilizing' | 'lighting' | 'protection' | 'growth' | 'health';
      impact: 'beneficial' | 'neutral' | 'challenging' | 'harmful';
      impactScore: number;
      description: string;
      descriptionThai: string;
      recommendations: string[];
      recommendationsThai: string[];
      urgency: 'low' | 'medium' | 'high' | 'critical';
    }> = [];

    // Watering impact
    if (w.humidity > 80) {
      impacts.push({
        aspect: 'watering', impact: 'challenging', impactScore: -30,
        description: 'High humidity increases rot risk', descriptionThai: 'ความชื้นสูงเพิ่มความเสี่ยงรากเน่า',
        recommendations: ['Reduce watering', 'Improve airflow'],
        recommendationsThai: ['ลดการรดน้ำ', 'เพิ่มการระบายอากาศ'],
        urgency: 'medium',
      });
    } else if (w.humidity < 40) {
      impacts.push({
        aspect: 'watering', impact: 'challenging', impactScore: -20,
        description: 'Low humidity stresses plants', descriptionThai: 'ความชื้นต่ำทำให้พืชเครียด',
        recommendations: ['Mist leaves', 'Group plants'],
        recommendationsThai: ['พ่นน้ำที่ใบ', 'จัดกลุ่มต้นไม้'],
        urgency: 'low',
      });
    } else {
      impacts.push({
        aspect: 'watering', impact: 'beneficial', impactScore: 15,
        description: 'Good humidity for most plants', descriptionThai: 'ความชื้นเหมาะสมสำหรับพืชส่วนใหญ่',
        recommendations: ['Maintain regular schedule'],
        recommendationsThai: ['รักษาตารางรดน้ำปกติ'],
        urgency: 'low',
      });
    }

    // Lighting/UV
    if ((w.uvIndex ?? 0) > 8) {
      impacts.push({
        aspect: 'lighting', impact: 'harmful', impactScore: -40,
        description: 'Extreme UV can scorch leaves', descriptionThai: 'UV สูงมากอาจทำให้ใบไหม้',
        recommendations: ['Provide shade', 'Move during peak sun'],
        recommendationsThai: ['ให้ร่มเงา', 'ย้ายหลบแดดช่วงเที่ยง'],
        urgency: 'high',
      });
    }

    return impacts;
  }

  // Private methods
  async getCurrentLocation(): Promise<TypedLocation> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city: 'Bangkok',
        country: 'Thailand',
      };
    } catch (error) {
      console.error('Failed to get location:', error);
      // Return Bangkok coordinates as default
      return {
        latitude: 13.7563,
        longitude: 100.5018,
        city: 'Bangkok',
        country: 'Thailand',
      };
    }
  }

  private mapInternalToTypedCondition(c: InternalCondition): { condition: CurrentWeather['condition']; description: string; descriptionThai: string; icon: string } {
    const map: Record<InternalCondition, CurrentWeather['condition']> = {
      sunny: 'clear',
      cloudy: 'clouds',
      rainy: 'rain',
      stormy: 'thunderstorm',
      hot: 'clear',
      cool: 'clouds',
    };
    const condition = map[c];
    const description = condition;
    const descriptionThai = getWeatherConditionInThai(condition);
    const icon = '01d';
    return { condition, description, descriptionThai, icon };
  }

  private async fetchWeatherData(lat: number, lon: number, loc?: TypedLocation): Promise<CurrentWeather> {
    // In production, replace with actual OpenWeatherMap API call
    // const response = await fetch(
    //   `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    // );
    // const data = await response.json();

    // For development, return realistic mock data based on Thai weather patterns
    const season = this.getCurrentThaiSeason();
    const hour = new Date().getHours();

    let baseTemp = 28;
    let humidity = 70;
    let internalCondition: InternalCondition = 'sunny';

    // Adjust based on season
    switch (season.season) {
      case 'hot':
        baseTemp = 32 + Math.random() * 8; // 32-40°C
        humidity = 50 + Math.random() * 20; // 50-70%
        internalCondition = Math.random() > 0.7 ? 'hot' : 'sunny';
        break;
      case 'rainy':
        baseTemp = 26 + Math.random() * 6; // 26-32°C
        humidity = 75 + Math.random() * 15; // 75-90%
        internalCondition = Math.random() > 0.4 ? 'rainy' : 'cloudy';
        break;
      case 'cool':
        baseTemp = 20 + Math.random() * 8; // 20-28°C
        humidity = 60 + Math.random() * 20; // 60-80%
        internalCondition = Math.random() > 0.6 ? 'cool' : 'cloudy';
        break;
    }

    // Adjust temperature based on time of day
    if (hour >= 6 && hour <= 18) {
      // Daytime - slightly warmer
      baseTemp += Math.random() * 3;
    } else {
      // Nighttime - cooler
      baseTemp -= Math.random() * 5;
    }

    const { condition, description, descriptionThai, icon } = this.mapInternalToTypedCondition(internalCondition);
    const uvIndex = (condition === 'clear') ? 6 + Math.random() * 5 : Math.random() * 4;
    const windSpeed = 5 + Math.random() * 15;
    const pressure = 1010 + Math.random() * 20;
    const cloudCover = condition === 'clear' ? Math.round(Math.random() * 20) : Math.round(40 + Math.random() * 60);

    const now = new Date();
    const sunrise = new Date(`${now.toISOString().split('T')[0]}T06:00:00.000Z`);
    const sunset = new Date(`${now.toISOString().split('T')[0]}T18:30:00.000Z`);

    const typedLoc: TypedLocation = {
      latitude: lat,
      longitude: lon,
      city: loc?.city || 'Bangkok',
      country: loc?.country || 'Thailand',
    };

    const cw: CurrentWeather = {
      location: typedLoc,
      temperature: Math.round(baseTemp * 10) / 10,
      feelsLike: Math.round((baseTemp + (humidity - 50) * 0.05) * 10) / 10,
      humidity: Math.round(humidity),
      pressure: Math.round(pressure),
      visibility: 10,
      uvIndex: Math.round(uvIndex),
      windSpeed: Math.round(windSpeed),
      windDirection: Math.round(Math.random() * 360),
      cloudCover,
      condition,
      conditionDescription: description,
      conditionDescriptionThai: descriptionThai,
      icon,
      sunrise,
      sunset,
      timestamp: now,
      dataSource: 'mock',
    };

    return cw;
  }

  private async fetchForecastData(lat: number, lon: number, loc?: TypedLocation): Promise<TypedWeatherForecast> {
    // Mock 5-day forecast based on current season
    const season = this.getCurrentThaiSeason();
    const items: WeatherForecastItem[] = [];

    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      let minTemp = 25;
      let maxTemp = 32;
      let internal: InternalCondition = 'sunny';
      let humidity = 65;
      let cloudCover = 20;

      switch (season.season) {
        case 'hot':
          minTemp = 28 + Math.random() * 4;
          maxTemp = 35 + Math.random() * 6;
          internal = Math.random() > 0.6 ? 'hot' : 'sunny';
          humidity = 50 + Math.random() * 20;
          cloudCover = 10 + Math.random() * 30;
          break;
        case 'rainy':
          minTemp = 24 + Math.random() * 3;
          maxTemp = 30 + Math.random() * 4;
          internal = Math.random() > 0.3 ? 'rainy' : 'cloudy';
          humidity = 70 + Math.random() * 20;
          cloudCover = 60 + Math.random() * 30;
          break;
        case 'cool':
          minTemp = 18 + Math.random() * 4;
          maxTemp = 26 + Math.random() * 5;
          internal = Math.random() > 0.5 ? 'cool' : 'cloudy';
          humidity = 55 + Math.random() * 20;
          cloudCover = 40 + Math.random() * 40;
          break;
      }

      const mapped = this.mapInternalToTypedCondition(internal);

      items.push({
        date,
        temperature: {
          min: Math.round(minTemp),
          max: Math.round(maxTemp),
        },
        humidity: Math.round(humidity),
        pressure: 1010 + Math.round(Math.random() * 20),
        uvIndex: mapped.condition === 'clear' ? Math.round(6 + Math.random() * 4) : Math.round(Math.random() * 4),
        windSpeed: Math.round(5 + Math.random() * 15),
        windDirection: Math.round(Math.random() * 360),
        cloudCover: Math.round(cloudCover),
        condition: mapped.condition,
        conditionDescription: mapped.description,
        conditionDescriptionThai: mapped.descriptionThai,
        icon: mapped.icon,
        precipitationProbability: mapped.condition === 'rain' ? Math.round(60 + Math.random() * 40) : Math.round(Math.random() * 40),
      });
    }

    return {
      location: {
        latitude: lat,
        longitude: lon,
        city: loc?.city || 'Bangkok',
        country: loc?.country || 'Thailand',
      },
      forecast: items,
      generatedAt: new Date(),
      dataSource: 'mock',
    };
  }

  private isCacheValid(): boolean {
    return (
      this.cachedWeather !== null &&
      Date.now() - this.cacheTimestamp < CACHE_DURATION
    );
  }

  private async saveCacheToStorage(): Promise<void> {
    try {
      const cacheData = {
        weather: this.cachedWeather,
        timestamp: this.cacheTimestamp,
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save weather cache:', error);
    }
  }

  private async loadCacheFromStorage(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { weather, timestamp } = JSON.parse(cached);
        this.cachedWeather = weather;
        this.cacheTimestamp = timestamp;
      }
    } catch (error) {
      console.error('Failed to load weather cache:', error);
    }
  }

  private getDefaultWeatherData(): CurrentWeather {
    const now = new Date();
    return {
      location: {
        city: 'Bangkok',
        country: 'Thailand',
        latitude: 13.7563,
        longitude: 100.5018,
      },
      temperature: 30,
      feelsLike: 32,
      humidity: 70,
      pressure: 1013,
      visibility: 10,
      uvIndex: 6,
      windSpeed: 10,
      windDirection: 90,
      cloudCover: 20,
      condition: 'clear',
      conditionDescription: 'clear',
      conditionDescriptionThai: getWeatherConditionInThai('clear'),
      icon: '01d',
      sunrise: new Date(`${now.toISOString().split('T')[0]}T06:00:00.000Z`),
      sunset: new Date(`${now.toISOString().split('T')[0]}T18:30:00.000Z`),
      timestamp: now,
      dataSource: 'mock',
    };
  }

  private getDefaultForecast(): TypedWeatherForecast {
    const now = new Date();
    const items: WeatherForecastItem[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      items.push({
        date: d,
        temperature: { min: 26, max: 32 },
        humidity: 70,
        pressure: 1013,
        uvIndex: 6,
        windSpeed: 10,
        windDirection: 90,
        cloudCover: 20,
        condition: 'clear',
        conditionDescription: 'clear',
        conditionDescriptionThai: getWeatherConditionInThai('clear'),
        icon: '01d',
        precipitationProbability: 20,
      });
    }
    return {
      location: {
        city: 'Bangkok',
        country: 'Thailand',
        latitude: 13.7563,
        longitude: 100.5018,
      },
      forecast: items,
      generatedAt: now,
      dataSource: 'mock',
    };
  }

  // Initialize weather service
  async initialize(): Promise<void> {
    await this.loadCacheFromStorage();
    // Fetch fresh weather data in background
    this.getCurrentWeather(undefined, false).catch(console.error);
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch {}
    this.cachedWeather = null;
    this.cacheTimestamp = 0;
  }

  updateConfig(cfg: Partial<ServiceConfig>) {
    this.config = { ...this.config, ...cfg };
  }
}

export const weatherService = WeatherService.getInstance();
