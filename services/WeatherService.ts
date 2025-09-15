import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WeatherData {
  temperature: number; // Celsius
  humidity: number; // Percentage
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'hot' | 'cool';
  uvIndex: number; // 0-11+
  windSpeed: number; // km/h
  pressure: number; // hPa
  rainProbability: number; // Percentage
  sunrise: string; // ISO string
  sunset: string; // ISO string
  location: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  fetchedAt: string; // ISO string
}

export interface WeatherForecast {
  date: string; // YYYY-MM-DD
  minTemp: number;
  maxTemp: number;
  condition: WeatherData['condition'];
  rainProbability: number;
  humidity: number;
}

export interface ThaiSeason {
  season: 'hot' | 'rainy' | 'cool'; // ฤดูร้อน, ฤดูฝน, ฤดูหนาว
  monthRange: string; // "มีนาคม - พฤษภาคม"
  characteristics: string[];
  plantCareAdvice: string[];
}

const CACHE_KEY = '@spa/weatherCache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const API_KEY = '8f3e4b2a1c9d6e7f0a8b5c2d1e9f8a3b'; // Mock API key for development

export class WeatherService {
  private static instance: WeatherService;
  private cachedWeather: WeatherData | null = null;
  private cacheTimestamp: number = 0;

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  // Get current weather data
  async getCurrentWeather(useCache: boolean = true): Promise<WeatherData> {
    // Check cache first
    if (useCache && this.isCacheValid()) {
      return this.cachedWeather!;
    }

    try {
      // Get location permission
      const location = await this.getCurrentLocation();

      // For development, return mock data based on location
      // In production, replace with actual OpenWeatherMap API call
      const weatherData = await this.fetchWeatherData(location.latitude, location.longitude);

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
  async getWeatherForecast(): Promise<WeatherForecast[]> {
    try {
      const location = await this.getCurrentLocation();
      return await this.fetchForecastData(location.latitude, location.longitude);
    } catch (error) {
      console.error('Failed to fetch weather forecast:', error);
      return this.getDefaultForecast();
    }
  }

  // Get current Thai season information
  getCurrentThaiSeason(): ThaiSeason {
    const month = new Date().getMonth() + 1; // 1-12

    if (month >= 3 && month <= 5) {
      return {
        season: 'hot',
        monthRange: 'มีนาคม - พฤษภาคม',
        characteristics: [
          'อุณหภูมิสูง 35-40°C',
          'ความชื้นต่ำ',
          'แสงแดดจัด',
          'ลมร้อนแห้ง'
        ],
        plantCareAdvice: [
          'รดน้ำบ่อยขึ้น เช้า-เย็น',
          'หลีกเลี่ยงแสงแดดตรงช่วงเที่ยง',
          'เพิ่มความชื้นด้วยการพ่นน้ำ',
          'ระวังโรคแมลงที่เกิดจากความร้อน'
        ]
      };
    } else if (month >= 6 && month <= 10) {
      return {
        season: 'rainy',
        monthRange: 'มิถุนายน - ตุลาคม',
        characteristics: [
          'ฝนตกบ่อย',
          'ความชื้นสูง 80-90%',
          'อุณหภูมิ 25-32°C',
          'แสงแดดน้อย'
        ],
        plantCareAdvice: [
          'ลดการรดน้ำลง',
          'ระบายน้ำให้ดี ป้องกันน้ำขัง',
          'ระวังโรคเชื้อราและแบคทีเรีย',
          'เพิ่มการระบายอากาศ'
        ]
      };
    } else {
      return {
        season: 'cool',
        monthRange: 'พฤศจิกายน - กุมภาพันธ์',
        characteristics: [
          'อุณหภูมิต่ำ 15-25°C',
          'ความชื้นปานกลาง',
          'อากาศแห้ง',
          'แสงแดดอ่อน'
        ],
        plantCareAdvice: [
          'ลดการรดน้ำ รดแค่เมื่อดินแห้ง',
          'ปกป้องจากลมหนาว',
          'เพิ่มแสงสำหรับพืชใบเขียว',
          'หลีกเลี่ยงการใส่ปุ๋ยมากเกินไป'
        ]
      };
    }
  }

  // Check if current weather is suitable for outdoor activities
  isGoodWeatherForPlantCare(): boolean {
    if (!this.cachedWeather) return true;

    const { temperature, condition, rainProbability, uvIndex } = this.cachedWeather;

    // Avoid outdoor plant care if:
    // - Too hot (>38°C)
    // - High rain probability (>70%)
    // - Extreme UV (>9)
    // - Stormy conditions
    return !(
      temperature > 38 ||
      rainProbability > 70 ||
      uvIndex > 9 ||
      condition === 'stormy'
    );
  }

  // Get weather-based plant care recommendations
  getWeatherBasedRecommendations(): string[] {
    if (!this.cachedWeather) return [];

    const { temperature, humidity, condition, rainProbability, uvIndex } = this.cachedWeather;
    const recommendations: string[] = [];

    // Temperature-based recommendations
    if (temperature > 35) {
      recommendations.push('🌡️ อากาศร้อนมาก - เพิ่มการรดน้ำและหลีกเลี่ยงแสงแดดตรง');
      recommendations.push('💧 พ่นน้ำใส่ใบเพื่อเพิ่มความชื้น');
    } else if (temperature < 18) {
      recommendations.push('❄️ อากาศเย็น - ลดการรดน้ำและป้องกันลมหนาว');
      recommendations.push('🏠 ย้ายต้นไม้เข้าในร่มถ้าจำเป็น');
    }

    // Humidity-based recommendations
    if (humidity > 80) {
      recommendations.push('💨 ความชื้นสูง - เพิ่มการระบายอากาศป้องกันเชื้อรา');
    } else if (humidity < 40) {
      recommendations.push('🌿 ความชื้นต่ำ - พ่นน้ำเพิ่มความชื้น');
    }

    // Rain-based recommendations
    if (rainProbability > 60) {
      recommendations.push('☔ มีฝนตก - ไม่ต้องรดน้ำวันนี้');
      recommendations.push('🌧️ ตรวจสอบการระบายน้ำในกระถาง');
    }

    // UV-based recommendations
    if (uvIndex > 7) {
      recommendations.push('☀️ แสงแดดจัด - ย้ายต้นไม้ที่บอบบางหลบร่ม');
    }

    // Weather condition-based recommendations
    switch (condition) {
      case 'stormy':
        recommendations.push('⛈️ พายุฝนฟ้าคะนอง - ย้ายต้นไม้เข้าในร่ม');
        break;
      case 'rainy':
        recommendations.push('🌧️ ฝนตก - ตรวจสอบน้ำไม่ขังในถาด');
        break;
      case 'sunny':
        recommendations.push('🌞 แสงแดดดี - เหมาะกับการดูแลต้นไม้');
        break;
    }

    return recommendations;
  }

  // Private methods
  private async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
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
      };
    } catch (error) {
      console.error('Failed to get location:', error);
      // Return Bangkok coordinates as default
      return {
        latitude: 13.7563,
        longitude: 100.5018,
      };
    }
  }

  private async fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
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
    let condition: WeatherData['condition'] = 'sunny';

    // Adjust based on season
    switch (season.season) {
      case 'hot':
        baseTemp = 32 + Math.random() * 8; // 32-40°C
        humidity = 50 + Math.random() * 20; // 50-70%
        condition = Math.random() > 0.7 ? 'hot' : 'sunny';
        break;
      case 'rainy':
        baseTemp = 26 + Math.random() * 6; // 26-32°C
        humidity = 75 + Math.random() * 15; // 75-90%
        condition = Math.random() > 0.4 ? 'rainy' : 'cloudy';
        break;
      case 'cool':
        baseTemp = 20 + Math.random() * 8; // 20-28°C
        humidity = 60 + Math.random() * 20; // 60-80%
        condition = Math.random() > 0.6 ? 'cool' : 'cloudy';
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

    return {
      temperature: Math.round(baseTemp * 10) / 10,
      humidity: Math.round(humidity),
      condition,
      uvIndex: condition === 'sunny' || condition === 'hot' ? 6 + Math.random() * 5 : Math.random() * 4,
      windSpeed: 5 + Math.random() * 15,
      pressure: 1010 + Math.random() * 20,
      rainProbability: condition === 'rainy' ? 70 + Math.random() * 30 : Math.random() * 40,
      sunrise: new Date().toISOString().split('T')[0] + 'T06:00:00.000Z',
      sunset: new Date().toISOString().split('T')[0] + 'T18:30:00.000Z',
      location: {
        city: 'Bangkok',
        country: 'Thailand',
        latitude: lat,
        longitude: lon,
      },
      fetchedAt: new Date().toISOString(),
    };
  }

  private async fetchForecastData(lat: number, lon: number): Promise<WeatherForecast[]> {
    // Mock 5-day forecast based on current season
    const forecast: WeatherForecast[] = [];
    const season = this.getCurrentThaiSeason();

    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      let minTemp = 25;
      let maxTemp = 32;
      let condition: WeatherData['condition'] = 'sunny';
      let rainProbability = 20;

      switch (season.season) {
        case 'hot':
          minTemp = 28 + Math.random() * 4;
          maxTemp = 35 + Math.random() * 6;
          condition = Math.random() > 0.6 ? 'hot' : 'sunny';
          rainProbability = Math.random() * 30;
          break;
        case 'rainy':
          minTemp = 24 + Math.random() * 3;
          maxTemp = 30 + Math.random() * 4;
          condition = Math.random() > 0.3 ? 'rainy' : 'cloudy';
          rainProbability = 60 + Math.random() * 40;
          break;
        case 'cool':
          minTemp = 18 + Math.random() * 4;
          maxTemp = 26 + Math.random() * 5;
          condition = Math.random() > 0.5 ? 'cool' : 'cloudy';
          rainProbability = Math.random() * 40;
          break;
      }

      forecast.push({
        date: date.toISOString().split('T')[0],
        minTemp: Math.round(minTemp),
        maxTemp: Math.round(maxTemp),
        condition,
        rainProbability: Math.round(rainProbability),
        humidity: 60 + Math.random() * 30,
      });
    }

    return forecast;
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

  private getDefaultWeatherData(): WeatherData {
    return {
      temperature: 30,
      humidity: 70,
      condition: 'sunny',
      uvIndex: 6,
      windSpeed: 10,
      pressure: 1013,
      rainProbability: 20,
      sunrise: new Date().toISOString().split('T')[0] + 'T06:00:00.000Z',
      sunset: new Date().toISOString().split('T')[0] + 'T18:30:00.000Z',
      location: {
        city: 'Bangkok',
        country: 'Thailand',
        latitude: 13.7563,
        longitude: 100.5018,
      },
      fetchedAt: new Date().toISOString(),
    };
  }

  private getDefaultForecast(): WeatherForecast[] {
    const forecast: WeatherForecast[] = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        date: date.toISOString().split('T')[0],
        minTemp: 26,
        maxTemp: 32,
        condition: 'sunny',
        rainProbability: 20,
        humidity: 70,
      });
    }
    return forecast;
  }

  // Initialize weather service
  async initialize(): Promise<void> {
    await this.loadCacheFromStorage();
    // Fetch fresh weather data in background
    this.getCurrentWeather(false).catch(console.error);
  }
}

export const weatherService = WeatherService.getInstance();