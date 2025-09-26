import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';

export interface PlantNetObservation {
  project: 'the-plant-list' | 'useful' | 'k-world-flora' | 'weurope' | 'canada' | 'australia';
  images: PlantNetImage[];
  modifiers: string[];
  plant_language: string;
  plant_net_id: string;
}

export interface PlantNetImage {
  base64: string;
  datetime?: string;
  latitude?: number;
  longitude?: number;
}

export interface PlantNetSpecies {
  scientificNameWithoutAuthor: string;
  scientificNameAuthorship: string;
  genus: {
    scientificNameWithoutAuthor: string;
    scientificNameAuthorship: string;
  };
  family: {
    scientificNameWithoutAuthor: string;
    scientificNameAuthorship: string;
  };
  commonNames: string[];
}

export interface PlantNetResult {
  score: number;
  species: PlantNetSpecies;
  images: Array<{
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
  }>;
  gbif?: {
    id: string;
  };
}

export interface PlantNetResponse {
  query: PlantNetObservation;
  language: string;
  preferedReferential: string;
  switchToProject: null;
  results: PlantNetResult[];
  version: string;
  remainingIdentificationRequests: number;
}

export interface PlantIdentificationResult {
  id: string;
  confidence: number;
  scientificName: string;
  commonName: string;
  family: string;
  genus: string;
  images: string[];
  description?: string;
  careInstructions?: string;
  source: 'plantnet' | 'fallback';
  timestamp: string;
  remainingRequests?: number;
}

export interface PlantNetConfig {
  apiKey: string;
  baseUrl: string;
  defaultProject: string;
  supportedProjects: string[];
  maxImageSize: number;
  supportedImageFormats: string[];
}

export class PlantNetService {
  private static instance: PlantNetService;
  private config: PlantNetConfig;
  private requestCount: number = 0;
  private lastResetTime: number = Date.now();
  private readonly DAILY_LIMIT = 50; // PlantNet free tier limit

  private constructor() {
    this.config = {
      apiKey: process.env.EXPO_PUBLIC_PLANTNET_API_KEY || '',
      baseUrl: 'https://my-api.plantnet.org/v1',
      defaultProject: 'k-world-flora',
      supportedProjects: [
        'the-plant-list',
        'useful',
        'k-world-flora',
        'weurope',
        'canada',
        'australia'
      ],
      maxImageSize: 5 * 1024 * 1024, // 5MB
      supportedImageFormats: ['jpg', 'jpeg', 'png', 'webp'],
    };
  }

  public static getInstance(): PlantNetService {
    if (!PlantNetService.instance) {
      PlantNetService.instance = new PlantNetService();
    }
    return PlantNetService.instance;
  }

  public async identifyPlant(
    imageUri: string,
    options?: {
      project?: string;
      latitude?: number;
      longitude?: number;
      modifiers?: string[];
      language?: string;
    }
  ): Promise<PlantIdentificationResult> {
    try {
      // Check rate limiting
      this.checkRateLimit();

      // Validate and prepare image
      const base64Image = await this.prepareImage(imageUri);

      // Create observation
      const observation = this.createObservation(base64Image, options);

      // Make API request
      const response = await this.makeApiRequest(observation);

      // Process and return results
      return this.processResults(response);

    } catch (error) {
      console.error('PlantNet identification error:', error);

      // Return fallback result
      return this.createFallbackResult(error);
    }
  }

  private async prepareImage(imageUri: string): Promise<string> {
    try {
      // Validate image format
      const extension = imageUri.split('.').pop()?.toLowerCase();
      if (!extension || !this.config.supportedImageFormats.includes(extension)) {
        throw new Error(`Unsupported image format. Supported: ${this.config.supportedImageFormats.join(', ')}`);
      }

      // Get image info
      const imageInfo = await FileSystem.getInfoAsync(imageUri);
      if (!imageInfo.exists) {
        throw new Error('Image file does not exist');
      }

      // Check file size
      if (imageInfo.size && imageInfo.size > this.config.maxImageSize) {
        throw new Error(`Image too large. Maximum size: ${this.config.maxImageSize / (1024 * 1024)}MB`);
      }

      // Convert to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return base64;

    } catch (error) {
      console.error('Image preparation error:', error);
      throw new Error(`Failed to prepare image: ${error.message}`);
    }
  }

  private createObservation(
    base64Image: string,
    options?: {
      project?: string;
      latitude?: number;
      longitude?: number;
      modifiers?: string[];
      language?: string;
    }
  ): PlantNetObservation {
    const project = options?.project || this.config.defaultProject;

    if (!this.config.supportedProjects.includes(project)) {
      throw new Error(`Unsupported project: ${project}. Supported: ${this.config.supportedProjects.join(', ')}`);
    }

    const image: PlantNetImage = {
      base64: base64Image,
      datetime: new Date().toISOString(),
    };

    if (options?.latitude && options?.longitude) {
      image.latitude = options.latitude;
      image.longitude = options.longitude;
    }

    return {
      project: project as any,
      images: [image],
      modifiers: options?.modifiers || ['auto'],
      plant_language: options?.language || 'en',
      plant_net_id: `smartplant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  private async makeApiRequest(observation: PlantNetObservation): Promise<PlantNetResponse> {
    const url = `${this.config.baseUrl}/identify/${observation.project}`;
    const params = new URLSearchParams({
      'api-key': this.config.apiKey,
      'lang': observation.plant_language,
      'type': 'kt',
    });

    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SmartPlantApp/1.0.0',
      },
      body: JSON.stringify({
        images: observation.images.map(img => ({
          base64: img.base64,
          datetime: img.datetime,
          latitude: img.latitude,
          longitude: img.longitude,
        })),
        modifiers: observation.modifiers,
        plant_language: observation.plant_language,
        plant_net_id: observation.plant_net_id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PlantNet API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    this.requestCount++;

    return data;
  }

  private processResults(response: PlantNetResponse): PlantIdentificationResult {
    if (!response.results || response.results.length === 0) {
      throw new Error('No plant identification results found');
    }

    const topResult = response.results[0];
    const species = topResult.species;

    // Calculate confidence score (PlantNet scores are 0-1, convert to percentage)
    const confidence = Math.round(topResult.score * 100);

    // Get common name (prefer first available)
    const commonName = species.commonNames && species.commonNames.length > 0
      ? species.commonNames[0]
      : species.scientificNameWithoutAuthor;

    // Extract image URLs
    const images = topResult.images.slice(0, 3).map(img => img.url.m); // Get medium-sized images

    return {
      id: `plantnet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      confidence,
      scientificName: `${species.scientificNameWithoutAuthor} ${species.scientificNameAuthorship}`.trim(),
      commonName,
      family: species.family.scientificNameWithoutAuthor,
      genus: species.genus.scientificNameWithoutAuthor,
      images,
      source: 'plantnet',
      timestamp: new Date().toISOString(),
      remainingRequests: response.remainingIdentificationRequests,
    };
  }

  private createFallbackResult(error: any): PlantIdentificationResult {
    return {
      id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      confidence: 0,
      scientificName: 'Unknown',
      commonName: 'Unidentified Plant',
      family: 'Unknown',
      genus: 'Unknown',
      images: [],
      description: `Plant identification failed: ${error.message}`,
      source: 'fallback',
      timestamp: new Date().toISOString(),
    };
  }

  private checkRateLimit(): void {
    const now = Date.now();
    const timeElapsed = now - this.lastResetTime;
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Reset counter if a day has passed
    if (timeElapsed >= oneDayMs) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    // Check if daily limit exceeded
    if (this.requestCount >= this.DAILY_LIMIT) {
      throw new Error(`Daily PlantNet API limit of ${this.DAILY_LIMIT} requests exceeded. Try again tomorrow.`);
    }
  }

  public async getProjectInfo(project: string): Promise<any> {
    try {
      const url = `${this.config.baseUrl}/projects/${project}`;
      const params = new URLSearchParams({
        'api-key': this.config.apiKey,
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to get project info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Project info error:', error);
      throw error;
    }
  }

  public getRemainingRequests(): number {
    return Math.max(0, this.DAILY_LIMIT - this.requestCount);
  }

  public getUsageStats(): { used: number; limit: number; resetTime: string } {
    return {
      used: this.requestCount,
      limit: this.DAILY_LIMIT,
      resetTime: new Date(this.lastResetTime + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  public getSupportedProjects(): string[] {
    return [...this.config.supportedProjects];
  }

  public isConfigured(): boolean {
    return !!this.config.apiKey;
  }
}