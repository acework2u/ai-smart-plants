import { PlantNetService, PlantIdentificationResult } from './PlantNetService';
import { ConfidenceScorer, ConfidenceBreakdown } from './ConfidenceScorer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';

export interface FallbackProvider {
  id: string;
  name: string;
  priority: number;
  isAvailable: () => Promise<boolean>;
  identify: (imageUri: string, options?: any) => Promise<PlantIdentificationResult>;
}

export interface OfflinePlantData {
  id: string;
  scientificName: string;
  commonName: string;
  family: string;
  genus: string;
  description: string;
  careInstructions: string;
  images: string[];
  keywords: string[];
  lastUpdated: string;
}

export interface IdentificationOptions {
  preferOffline?: boolean;
  maxRetries?: number;
  timeout?: number;
  latitude?: number;
  longitude?: number;
  enableFallback?: boolean;
  cacheResults?: boolean;
}

export class PlantIdentificationService {
  private static instance: PlantIdentificationService;
  private plantNetService: PlantNetService;
  private confidenceScorer: ConfidenceScorer;
  private fallbackProviders: FallbackProvider[] = [];
  private offlinePlantDatabase: OfflinePlantData[] = [];
  private isOfflineMode = false;

  private readonly STORAGE_KEYS = {
    OFFLINE_DB: '@smart_plant_offline_db',
    CACHE_RESULTS: '@smart_plant_cache_results',
    SETTINGS: '@smart_plant_ai_settings',
  };

  private constructor() {
    this.plantNetService = PlantNetService.getInstance();
    this.confidenceScorer = ConfidenceScorer.getInstance();
    this.initializeFallbackProviders();
    this.loadOfflineDatabase();
  }

  public static getInstance(): PlantIdentificationService {
    if (!PlantIdentificationService.instance) {
      PlantIdentificationService.instance = new PlantIdentificationService();
    }
    return PlantIdentificationService.instance;
  }

  private initializeFallbackProviders(): void {
    // Local offline database provider
    this.fallbackProviders.push({
      id: 'offline_db',
      name: 'Offline Plant Database',
      priority: 1,
      isAvailable: () => Promise.resolve(this.offlinePlantDatabase.length > 0),
      identify: this.identifyOffline.bind(this),
    });

    // Mock AI provider (for development/testing)
    this.fallbackProviders.push({
      id: 'mock_ai',
      name: 'Mock AI Provider',
      priority: 2,
      isAvailable: () => Promise.resolve(true),
      identify: this.identifyMock.bind(this),
    });

    // Could add more providers like Google Vision, iNaturalist, etc.
  }

  public async identifyPlant(
    imageUri: string,
    options: IdentificationOptions = {}
  ): Promise<{
    result: PlantIdentificationResult;
    confidence: ConfidenceBreakdown;
    provider: string;
    fallbackUsed: boolean;
  }> {
    const {
      preferOffline = false,
      maxRetries = 2,
      timeout = 30000,
      enableFallback = true,
      cacheResults = true,
      ...plantNetOptions
    } = options;

    let lastError: Error | null = null;
    let result: PlantIdentificationResult | null = null;
    let providerUsed = 'none';
    let fallbackUsed = false;

    // Try primary provider (PlantNet) first unless offline mode is preferred
    if (!preferOffline && !this.isOfflineMode) {
      try {
        result = await this.tryWithTimeout(
          () => this.plantNetService.identifyPlant(imageUri, plantNetOptions),
          timeout
        );
        providerUsed = 'plantnet';
      } catch (error: any) {
        lastError = error;
        console.warn('PlantNet identification failed:', error.message);

        // Check if we should switch to offline mode
        if (this.shouldSwitchToOfflineMode(error)) {
          this.isOfflineMode = true;
          console.log('Switching to offline mode due to connectivity issues');
        }
      }
    }

    // Try fallback providers if primary failed or offline mode
    if (!result && enableFallback) {
      const sortedProviders = this.fallbackProviders.sort((a, b) => a.priority - b.priority);

      for (const provider of sortedProviders) {
        try {
          const isAvailable = await provider.isAvailable();
          if (!isAvailable) continue;

          result = await this.tryWithTimeout(
            () => provider.identify(imageUri, options),
            timeout
          );

          providerUsed = provider.id;
          fallbackUsed = true;
          break;
        } catch (error: any) {
          console.warn(`Fallback provider ${provider.id} failed:`, error.message);
          lastError = error;
        }
      }
    }

    // If all providers failed, create a basic fallback result
    if (!result) {
      result = this.createBasicFallbackResult(lastError);
      providerUsed = 'fallback';
      fallbackUsed = true;
    }

    // Calculate confidence score
    const confidence = this.confidenceScorer.calculateConfidence(result);

    // Cache result if enabled
    if (cacheResults && result.source !== 'fallback') {
      this.cacheResult(imageUri, result).catch(error =>
        console.warn('Failed to cache result:', error)
      );
    }

    return {
      result,
      confidence,
      provider: providerUsed,
      fallbackUsed,
    };
  }

  private async identifyOffline(imageUri: string): Promise<PlantIdentificationResult> {
    // Simple keyword-based matching (in real implementation, you'd use image analysis)
    const keywords = await this.extractImageKeywords(imageUri);
    const matches = this.searchOfflineDatabase(keywords);

    if (matches.length === 0) {
      throw new Error('No offline matches found');
    }

    const bestMatch = matches[0];

    return {
      id: `offline_${bestMatch.id}`,
      confidence: Math.min(85, matches.length * 20), // Simple scoring
      scientificName: bestMatch.scientificName,
      commonName: bestMatch.commonName,
      family: bestMatch.family,
      genus: bestMatch.genus,
      images: bestMatch.images,
      description: bestMatch.description,
      careInstructions: bestMatch.careInstructions,
      source: 'fallback',
      timestamp: new Date().toISOString(),
    };
  }

  private async identifyMock(imageUri: string): Promise<PlantIdentificationResult> {
    // Mock implementation for development
    const mockPlants = [
      {
        scientificName: 'Monstera deliciosa',
        commonName: 'Swiss Cheese Plant',
        family: 'Araceae',
        genus: 'Monstera',
      },
      {
        scientificName: 'Sansevieria trifasciata',
        commonName: 'Snake Plant',
        family: 'Asparagaceae',
        genus: 'Sansevieria',
      },
      {
        scientificName: 'Pothos aureus',
        commonName: 'Golden Pothos',
        family: 'Araceae',
        genus: 'Epipremnum',
      },
    ];

    const randomPlant = mockPlants[Math.floor(Math.random() * mockPlants.length)];

    return {
      id: `mock_${Date.now()}`,
      confidence: Math.floor(Math.random() * 40) + 40, // 40-80% confidence
      scientificName: randomPlant.scientificName,
      commonName: randomPlant.commonName,
      family: randomPlant.family,
      genus: randomPlant.genus,
      images: [],
      description: 'This is a mock identification result for development purposes.',
      careInstructions: 'Mock care instructions - water when soil is dry.',
      source: 'fallback',
      timestamp: new Date().toISOString(),
    };
  }

  private async extractImageKeywords(imageUri: string): Promise<string[]> {
    // In a real implementation, this would analyze the image
    // For now, return some common plant keywords
    return ['green', 'leaves', 'plant', 'indoor'];
  }

  private searchOfflineDatabase(keywords: string[]): OfflinePlantData[] {
    return this.offlinePlantDatabase
      .filter(plant =>
        keywords.some(keyword =>
          plant.keywords.some(plantKeyword =>
            plantKeyword.toLowerCase().includes(keyword.toLowerCase())
          )
        )
      )
      .slice(0, 5); // Return top 5 matches
  }

  private shouldSwitchToOfflineMode(error: any): boolean {
    const networkErrors = [
      'NETWORK_ERROR',
      'FETCH_ERROR',
      'TIMEOUT',
      'CONNECTION_FAILED',
      'RATE_LIMIT_EXCEEDED',
    ];

    return networkErrors.some(errorType =>
      error.code?.includes(errorType) || error.message?.includes(errorType)
    );
  }

  private createBasicFallbackResult(error: Error | null): PlantIdentificationResult {
    return {
      id: `fallback_${Date.now()}`,
      confidence: 0,
      scientificName: 'Unknown',
      commonName: 'Unidentified Plant',
      family: 'Unknown',
      genus: 'Unknown',
      images: [],
      description: error
        ? `Plant identification failed: ${error.message}. Please check your internet connection and try again.`
        : 'Unable to identify this plant. Please try with a clearer image or check your internet connection.',
      careInstructions: 'Provide basic plant care: adequate light, water when soil is dry, and monitor for pests.',
      source: 'fallback',
      timestamp: new Date().toISOString(),
    };
  }

  private async tryWithTimeout<T>(fn: () => Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeout)
      ),
    ]);
  }

  private async loadOfflineDatabase(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.OFFLINE_DB);
      if (stored) {
        this.offlinePlantDatabase = JSON.parse(stored);
        console.log(`Loaded ${this.offlinePlantDatabase.length} offline plant records`);
      } else {
        // Load default offline database
        this.offlinePlantDatabase = this.getDefaultOfflineDatabase();
        await this.saveOfflineDatabase();
      }
    } catch (error) {
      console.error('Failed to load offline database:', error);
      this.offlinePlantDatabase = this.getDefaultOfflineDatabase();
    }
  }

  private async saveOfflineDatabase(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.OFFLINE_DB,
        JSON.stringify(this.offlinePlantDatabase)
      );
    } catch (error) {
      console.error('Failed to save offline database:', error);
    }
  }

  private getDefaultOfflineDatabase(): OfflinePlantData[] {
    return [
      {
        id: 'monstera_deliciosa',
        scientificName: 'Monstera deliciosa',
        commonName: 'Swiss Cheese Plant',
        family: 'Araceae',
        genus: 'Monstera',
        description: 'A tropical plant with large, perforated leaves.',
        careInstructions: 'Bright indirect light, water weekly, high humidity.',
        images: [],
        keywords: ['monstera', 'swiss cheese', 'holes', 'large leaves', 'tropical', 'climbing'],
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'sansevieria_trifasciata',
        scientificName: 'Sansevieria trifasciata',
        commonName: 'Snake Plant',
        family: 'Asparagaceae',
        genus: 'Sansevieria',
        description: 'A hardy plant with upright, sword-like leaves.',
        careInstructions: 'Low to bright light, water every 2-3 weeks, drought tolerant.',
        images: [],
        keywords: ['snake plant', 'sansevieria', 'upright', 'thick leaves', 'hardy', 'yellow edges'],
        lastUpdated: new Date().toISOString(),
      },
      {
        id: 'pothos_aureus',
        scientificName: 'Epipremnum aureum',
        commonName: 'Golden Pothos',
        family: 'Araceae',
        genus: 'Epipremnum',
        description: 'A trailing vine with heart-shaped leaves.',
        careInstructions: 'Medium to bright indirect light, water when soil is dry.',
        images: [],
        keywords: ['pothos', 'golden', 'heart shaped', 'trailing', 'vine', 'variegated'],
        lastUpdated: new Date().toISOString(),
      },
    ];
  }

  private async cacheResult(imageUri: string, result: PlantIdentificationResult): Promise<void> {
    try {
      const cacheKey = `result_${Date.now()}`;
      const cacheData = {
        imageUri,
        result,
        timestamp: new Date().toISOString(),
      };

      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.CACHE_RESULTS);
      const cache = stored ? JSON.parse(stored) : {};

      cache[cacheKey] = cacheData;

      // Keep only last 100 results to manage storage
      const cacheKeys = Object.keys(cache);
      if (cacheKeys.length > 100) {
        const sortedKeys = cacheKeys.sort((a, b) =>
          new Date(cache[b].timestamp).getTime() - new Date(cache[a].timestamp).getTime()
        );

        // Keep only the 100 most recent
        const keysToKeep = sortedKeys.slice(0, 100);
        const newCache = {};
        keysToKeep.forEach(key => {
          newCache[key] = cache[key];
        });

        await AsyncStorage.setItem(this.STORAGE_KEYS.CACHE_RESULTS, JSON.stringify(newCache));
      } else {
        await AsyncStorage.setItem(this.STORAGE_KEYS.CACHE_RESULTS, JSON.stringify(cache));
      }
    } catch (error) {
      console.error('Failed to cache result:', error);
    }
  }

  public async getCachedResults(limit = 10): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.CACHE_RESULTS);
      if (!stored) return [];

      const cache = JSON.parse(stored);
      const results = Object.values(cache)
        .sort((a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Failed to get cached results:', error);
      return [];
    }
  }

  public async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.CACHE_RESULTS);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  public setOfflineMode(offline: boolean): void {
    this.isOfflineMode = offline;
  }

  public isInOfflineMode(): boolean {
    return this.isOfflineMode;
  }

  public async getStats(): Promise<{
    plantNetAvailable: boolean;
    plantNetRemaining: number;
    offlineRecords: number;
    cachedResults: number;
    fallbackProviders: number;
  }> {
    const cachedResults = await this.getCachedResults(1000);

    return {
      plantNetAvailable: this.plantNetService.isConfigured(),
      plantNetRemaining: this.plantNetService.getRemainingRequests(),
      offlineRecords: this.offlinePlantDatabase.length,
      cachedResults: cachedResults.length,
      fallbackProviders: this.fallbackProviders.length,
    };
  }
}