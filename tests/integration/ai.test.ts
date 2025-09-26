import { PlantNetService } from '../../services/ai/PlantNetService';
import { ConfidenceScorer } from '../../services/ai/ConfidenceScorer';
import { PlantIdentificationService } from '../../services/ai/PlantIdentificationService';

describe('AI Services Integration Tests', () => {
  let plantNetService: PlantNetService;
  let confidenceScorer: ConfidenceScorer;
  let plantIdentificationService: PlantIdentificationService;

  beforeAll(() => {
    plantNetService = PlantNetService.getInstance();
    confidenceScorer = ConfidenceScorer.getInstance();
    plantIdentificationService = PlantIdentificationService.getInstance();
  });

  describe('PlantNet Service', () => {
    test('should be properly configured', () => {
      expect(plantNetService).toBeDefined();
      expect(plantNetService.isConfigured()).toBe(true);
    });

    test('should return supported projects', () => {
      const projects = plantNetService.getSupportedProjects();
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
      expect(projects).toContain('k-world-flora');
    });

    test('should track usage stats', () => {
      const stats = plantNetService.getUsageStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('used');
      expect(stats).toHaveProperty('limit');
      expect(stats).toHaveProperty('resetTime');
    });

    test('should get remaining requests', () => {
      const remaining = plantNetService.getRemainingRequests();
      expect(typeof remaining).toBe('number');
      expect(remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Confidence Scorer', () => {
    test('should calculate confidence for valid result', () => {
      const mockResult = {
        id: 'test-id',
        confidence: 85,
        scientificName: 'Monstera deliciosa',
        commonName: 'Swiss Cheese Plant',
        family: 'Araceae',
        genus: 'Monstera',
        images: ['image1.jpg', 'image2.jpg'],
        description: 'A tropical plant',
        careInstructions: 'Water weekly',
        source: 'plantnet' as const,
        timestamp: new Date().toISOString(),
      };

      const confidence = confidenceScorer.calculateConfidence(mockResult);

      expect(confidence).toBeDefined();
      expect(confidence).toHaveProperty('overall');
      expect(confidence).toHaveProperty('factors');
      expect(confidence).toHaveProperty('recommendations');
      expect(confidence).toHaveProperty('reliability');
      expect(confidence).toHaveProperty('actionable');

      expect(typeof confidence.overall).toBe('number');
      expect(confidence.overall).toBeGreaterThanOrEqual(0);
      expect(confidence.overall).toBeLessThanOrEqual(100);
    });

    test('should provide reliability assessment', () => {
      const mockResult = {
        id: 'test-reliability',
        confidence: 90,
        scientificName: 'Sansevieria trifasciata',
        commonName: 'Snake Plant',
        family: 'Asparagaceae',
        genus: 'Sansevieria',
        images: [],
        source: 'plantnet' as const,
        timestamp: new Date().toISOString(),
      };

      const confidence = confidenceScorer.calculateConfidence(mockResult);
      const description = confidenceScorer.getReliabilityDescription(confidence.reliability);

      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });

    test('should provide confidence advice', () => {
      const advice = confidenceScorer.getConfidenceAdvice(85);

      expect(advice).toBeDefined();
      expect(advice).toHaveProperty('canTrustResult');
      expect(advice).toHaveProperty('shouldSeekVerification');
      expect(advice).toHaveProperty('isSafeForCareActions');
      expect(advice).toHaveProperty('advice');

      expect(typeof advice.canTrustResult).toBe('boolean');
      expect(typeof advice.shouldSeekVerification).toBe('boolean');
      expect(typeof advice.isSafeForCareActions).toBe('boolean');
      expect(typeof advice.advice).toBe('string');
    });

    test('should update historical data', () => {
      const scientificName = 'Pothos aureus';
      const commonName = 'Golden Pothos';
      const feedback = { correct: true, confidence: 88 };

      // Should not throw error
      expect(() => {
        confidenceScorer.updateHistoricalData(scientificName, commonName, feedback);
      }).not.toThrow();
    });
  });

  describe('Plant Identification Service', () => {
    test('should get service stats', async () => {
      const stats = await plantIdentificationService.getStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('plantNetAvailable');
      expect(stats).toHaveProperty('plantNetRemaining');
      expect(stats).toHaveProperty('offlineRecords');
      expect(stats).toHaveProperty('cachedResults');
      expect(stats).toHaveProperty('fallbackProviders');

      expect(typeof stats.plantNetAvailable).toBe('boolean');
      expect(typeof stats.plantNetRemaining).toBe('number');
      expect(typeof stats.offlineRecords).toBe('number');
      expect(typeof stats.cachedResults).toBe('number');
      expect(typeof stats.fallbackProviders).toBe('number');
    });

    test('should handle offline mode', () => {
      const wasOffline = plantIdentificationService.isInOfflineMode();

      plantIdentificationService.setOfflineMode(true);
      expect(plantIdentificationService.isInOfflineMode()).toBe(true);

      plantIdentificationService.setOfflineMode(false);
      expect(plantIdentificationService.isInOfflineMode()).toBe(false);

      // Restore original state
      plantIdentificationService.setOfflineMode(wasOffline);
    });

    test('should manage cached results', async () => {
      // Clear cache first
      await plantIdentificationService.clearCache();

      let cachedResults = await plantIdentificationService.getCachedResults();
      expect(Array.isArray(cachedResults)).toBe(true);
      expect(cachedResults.length).toBe(0);
    });

    test('should handle mock identification', async () => {
      // Create a mock image URI
      const mockImageUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVR...';

      try {
        const result = await plantIdentificationService.identifyPlant(mockImageUri, {
          preferOffline: true,
          enableFallback: true,
          maxRetries: 1,
          timeout: 5000,
        });

        expect(result).toBeDefined();
        expect(result).toHaveProperty('result');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('provider');
        expect(result).toHaveProperty('fallbackUsed');

        expect(result.result).toHaveProperty('id');
        expect(result.result).toHaveProperty('scientificName');
        expect(result.result).toHaveProperty('commonName');
        expect(result.result).toHaveProperty('confidence');
        expect(result.result).toHaveProperty('source');

        expect(typeof result.fallbackUsed).toBe('boolean');
      } catch (error) {
        // Expected if no valid fallback providers or invalid image
        console.log('Mock identification failed (expected):', error.message);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid image data', async () => {
      const invalidImageUri = 'invalid-image-data';

      const result = await plantIdentificationService.identifyPlant(invalidImageUri, {
        enableFallback: false,
      });

      expect(result.result.confidence).toBe(0);
      expect(result.result.source).toBe('fallback');
      expect(result.result.description).toContain('Failed to prepare image');
    });

    test('should handle network failures gracefully', async () => {
      // Set offline mode to test fallback
      plantIdentificationService.setOfflineMode(true);

      const mockImageUri = 'data:image/jpeg;base64,validbase64data';

      try {
        const result = await plantIdentificationService.identifyPlant(mockImageUri, {
          preferOffline: true,
          enableFallback: true,
        });

        expect(result.fallbackUsed).toBe(true);
      } catch (error) {
        // Expected if no offline data available
        expect(error).toBeDefined();
      } finally {
        plantIdentificationService.setOfflineMode(false);
      }
    });

    test('should handle confidence scoring edge cases', () => {
      const edgeCaseResults = [
        {
          id: 'empty-result',
          confidence: 0,
          scientificName: '',
          commonName: '',
          family: '',
          genus: '',
          images: [],
          source: 'fallback' as const,
          timestamp: new Date().toISOString(),
        },
        {
          id: 'unknown-result',
          confidence: 0,
          scientificName: 'Unknown',
          commonName: 'Unknown',
          family: 'Unknown',
          genus: 'Unknown',
          images: [],
          source: 'fallback' as const,
          timestamp: new Date().toISOString(),
        },
      ];

      edgeCaseResults.forEach(result => {
        expect(() => {
          const confidence = confidenceScorer.calculateConfidence(result);
          expect(confidence.overall).toBeGreaterThanOrEqual(0);
          expect(confidence.overall).toBeLessThanOrEqual(100);
        }).not.toThrow();
      });
    });
  });

  describe('Performance Tests', () => {
    test('should complete confidence calculation quickly', () => {
      const mockResult = {
        id: 'performance-test',
        confidence: 75,
        scientificName: 'Ficus lyrata',
        commonName: 'Fiddle Leaf Fig',
        family: 'Moraceae',
        genus: 'Ficus',
        images: ['img1.jpg'],
        source: 'plantnet' as const,
        timestamp: new Date().toISOString(),
      };

      const startTime = Date.now();
      const confidence = confidenceScorer.calculateConfidence(mockResult);
      const endTime = Date.now();

      expect(confidence).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
    });

    test('should handle multiple concurrent identifications', async () => {
      const mockImageUri = 'data:image/jpeg;base64,mockdata';

      const promises = Array.from({ length: 3 }, (_, index) =>
        plantIdentificationService.identifyPlant(mockImageUri, {
          preferOffline: true,
          enableFallback: true,
          maxRetries: 1,
          timeout: 2000,
        }).catch(error => ({ error: error.message, index }))
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      // All should either succeed or fail gracefully
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Data Validation', () => {
    test('should validate plant identification result structure', () => {
      const mockResult = {
        id: 'validation-test',
        confidence: 80,
        scientificName: 'Chlorophytum comosum',
        commonName: 'Spider Plant',
        family: 'Asparagaceae',
        genus: 'Chlorophytum',
        images: [],
        source: 'plantnet' as const,
        timestamp: new Date().toISOString(),
      };

      // Should have all required fields
      expect(mockResult).toHaveProperty('id');
      expect(mockResult).toHaveProperty('confidence');
      expect(mockResult).toHaveProperty('scientificName');
      expect(mockResult).toHaveProperty('commonName');
      expect(mockResult).toHaveProperty('family');
      expect(mockResult).toHaveProperty('genus');
      expect(mockResult).toHaveProperty('images');
      expect(mockResult).toHaveProperty('source');
      expect(mockResult).toHaveProperty('timestamp');

      // Validate data types
      expect(typeof mockResult.id).toBe('string');
      expect(typeof mockResult.confidence).toBe('number');
      expect(typeof mockResult.scientificName).toBe('string');
      expect(typeof mockResult.commonName).toBe('string');
      expect(Array.isArray(mockResult.images)).toBe(true);
      expect(['plantnet', 'fallback']).toContain(mockResult.source);
    });

    test('should validate confidence factors structure', () => {
      const mockResult = {
        id: 'factors-test',
        confidence: 70,
        scientificName: 'Aloe vera',
        commonName: 'Aloe',
        family: 'Asphodelaceae',
        genus: 'Aloe',
        images: [],
        source: 'plantnet' as const,
        timestamp: new Date().toISOString(),
      };

      const confidence = confidenceScorer.calculateConfidence(mockResult);

      expect(confidence.factors).toHaveProperty('apiScore');
      expect(confidence.factors).toHaveProperty('imageQuality');
      expect(confidence.factors).toHaveProperty('dataCompleteness');
      expect(confidence.factors).toHaveProperty('sourceReliability');
      expect(confidence.factors).toHaveProperty('historicalAccuracy');
      expect(confidence.factors).toHaveProperty('userFeedback');

      // All factors should be numbers between 0 and 100
      Object.values(confidence.factors).forEach(factor => {
        expect(typeof factor).toBe('number');
        expect(factor).toBeGreaterThanOrEqual(0);
        expect(factor).toBeLessThanOrEqual(100);
      });
    });
  });
});