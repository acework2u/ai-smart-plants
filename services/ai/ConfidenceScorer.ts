import { PlantIdentificationResult } from './PlantNetService';

export interface ConfidenceFactors {
  apiScore: number;
  imageQuality: number;
  dataCompleteness: number;
  sourceReliability: number;
  historicalAccuracy: number;
  userFeedback: number;
}

export interface ConfidenceBreakdown {
  overall: number;
  factors: ConfidenceFactors;
  recommendations: string[];
  reliability: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
  actionable: boolean;
}

export interface ImageQualityMetrics {
  resolution: number;
  clarity: number;
  lighting: number;
  angle: number;
  focus: number;
  plantVisibility: number;
}

export class ConfidenceScorer {
  private static instance: ConfidenceScorer;
  private historicalData: Map<string, { accuracy: number; feedbackCount: number }> = new Map();

  // Confidence thresholds
  private readonly THRESHOLDS = {
    VERY_HIGH: 85,
    HIGH: 70,
    MEDIUM: 50,
    LOW: 30,
    VERY_LOW: 0,
  };

  // Scoring weights
  private readonly WEIGHTS = {
    API_SCORE: 0.35,
    IMAGE_QUALITY: 0.25,
    DATA_COMPLETENESS: 0.15,
    SOURCE_RELIABILITY: 0.15,
    HISTORICAL_ACCURACY: 0.07,
    USER_FEEDBACK: 0.03,
  };

  public static getInstance(): ConfidenceScorer {
    if (!ConfidenceScorer.instance) {
      ConfidenceScorer.instance = new ConfidenceScorer();
    }
    return ConfidenceScorer.instance;
  }

  public calculateConfidence(
    result: PlantIdentificationResult,
    imageQuality?: ImageQualityMetrics,
    userContext?: {
      location?: { latitude: number; longitude: number };
      season?: string;
      environment?: 'indoor' | 'outdoor' | 'greenhouse';
    }
  ): ConfidenceBreakdown {

    const factors: ConfidenceFactors = {
      apiScore: this.scoreApiResult(result),
      imageQuality: this.scoreImageQuality(imageQuality),
      dataCompleteness: this.scoreDataCompleteness(result),
      sourceReliability: this.scoreSourceReliability(result),
      historicalAccuracy: this.scoreHistoricalAccuracy(result),
      userFeedback: this.scoreUserFeedback(result),
    };

    const overall = this.calculateOverallScore(factors);
    const reliability = this.determineReliability(overall);
    const recommendations = this.generateRecommendations(factors, overall);
    const actionable = this.isActionable(overall, factors);

    return {
      overall,
      factors,
      recommendations,
      reliability,
      actionable,
    };
  }

  private scoreApiResult(result: PlantIdentificationResult): number {
    let score = result.confidence;

    // Boost for PlantNet vs fallback
    if (result.source === 'plantnet') {
      score *= 1.0; // Full score for PlantNet
    } else {
      score *= 0.3; // Heavily penalize fallback results
    }

    // Adjust based on scientific name quality
    if (result.scientificName && result.scientificName !== 'Unknown') {
      score *= 1.1; // Slight boost for having scientific name
    } else {
      score *= 0.7; // Penalize unknown scientific names
    }

    return Math.min(100, Math.max(0, score));
  }

  private scoreImageQuality(metrics?: ImageQualityMetrics): number {
    if (!metrics) {
      return 60; // Default neutral score if no metrics provided
    }

    const avgQuality = (
      metrics.resolution +
      metrics.clarity +
      metrics.lighting +
      metrics.angle +
      metrics.focus +
      metrics.plantVisibility
    ) / 6;

    return avgQuality;
  }

  private scoreDataCompleteness(result: PlantIdentificationResult): number {
    let score = 0;
    let maxScore = 0;

    // Check for essential data fields
    const essentialFields = [
      { field: result.scientificName, weight: 25, required: true },
      { field: result.commonName, weight: 20, required: true },
      { field: result.family, weight: 15, required: false },
      { field: result.genus, weight: 10, required: false },
    ];

    essentialFields.forEach(({ field, weight, required }) => {
      maxScore += weight;
      if (field && field !== 'Unknown' && field.trim() !== '') {
        score += weight;
      } else if (required) {
        score -= weight * 0.5; // Penalty for missing required fields
      }
    });

    // Check for additional enrichment data
    const enrichmentFields = [
      { field: result.description, weight: 15 },
      { field: result.careInstructions, weight: 15 },
    ];

    enrichmentFields.forEach(({ field, weight }) => {
      maxScore += weight;
      if (field && field.trim() !== '') {
        score += weight;
      }
    });

    // Check for images
    maxScore += 15;
    if (result.images && result.images.length > 0) {
      score += 15;
    }

    return Math.min(100, Math.max(0, (score / maxScore) * 100));
  }

  private scoreSourceReliability(result: PlantIdentificationResult): number {
    const sourceScores = {
      plantnet: 95,
      fallback: 20,
    };

    let baseScore = sourceScores[result.source] || 50;

    // Adjust based on remaining API requests (if available)
    if (result.remainingRequests !== undefined) {
      if (result.remainingRequests > 10) {
        baseScore *= 1.0; // No penalty
      } else if (result.remainingRequests > 5) {
        baseScore *= 0.95; // Slight penalty for low quota
      } else {
        baseScore *= 0.9; // Higher penalty for very low quota
      }
    }

    return baseScore;
  }

  private scoreHistoricalAccuracy(result: PlantIdentificationResult): number {
    const key = result.scientificName || result.commonName;
    const historical = this.historicalData.get(key);

    if (!historical || historical.feedbackCount < 3) {
      return 60; // Neutral score for insufficient data
    }

    return historical.accuracy;
  }

  private scoreUserFeedback(result: PlantIdentificationResult): number {
    const key = result.scientificName || result.commonName;
    const historical = this.historicalData.get(key);

    if (!historical || historical.feedbackCount === 0) {
      return 50; // Neutral score for no feedback
    }

    // Weight feedback count (more feedback = more reliable)
    const feedbackScore = Math.min(100, (historical.feedbackCount / 10) * 100);
    return (historical.accuracy + feedbackScore) / 2;
  }

  private calculateOverallScore(factors: ConfidenceFactors): number {
    const weightedScore =
      factors.apiScore * this.WEIGHTS.API_SCORE +
      factors.imageQuality * this.WEIGHTS.IMAGE_QUALITY +
      factors.dataCompleteness * this.WEIGHTS.DATA_COMPLETENESS +
      factors.sourceReliability * this.WEIGHTS.SOURCE_RELIABILITY +
      factors.historicalAccuracy * this.WEIGHTS.HISTORICAL_ACCURACY +
      factors.userFeedback * this.WEIGHTS.USER_FEEDBACK;

    return Math.round(weightedScore);
  }

  private determineReliability(score: number): 'very-high' | 'high' | 'medium' | 'low' | 'very-low' {
    if (score >= this.THRESHOLDS.VERY_HIGH) return 'very-high';
    if (score >= this.THRESHOLDS.HIGH) return 'high';
    if (score >= this.THRESHOLDS.MEDIUM) return 'medium';
    if (score >= this.THRESHOLDS.LOW) return 'low';
    return 'very-low';
  }

  private generateRecommendations(factors: ConfidenceFactors, overall: number): string[] {
    const recommendations: string[] = [];

    if (factors.imageQuality < 60) {
      recommendations.push(
        "Try taking a clearer photo with better lighting and focus on the plant's distinctive features"
      );
    }

    if (factors.apiScore < 50) {
      recommendations.push(
        "The identification confidence is low. Consider taking photos of different plant parts (leaves, flowers, bark)"
      );
    }

    if (factors.dataCompleteness < 60) {
      recommendations.push(
        "Limited information available. Try cross-referencing with other plant identification sources"
      );
    }

    if (overall < this.THRESHOLDS.MEDIUM) {
      recommendations.push(
        "Consider consulting a plant expert or using additional identification methods for verification"
      );
    }

    if (factors.sourceReliability < 80) {
      recommendations.push(
        "Result from fallback source. For better accuracy, ensure you have internet connectivity for PlantNet API"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("Great identification! This result appears highly reliable.");
    }

    return recommendations;
  }

  private isActionable(overall: number, factors: ConfidenceFactors): boolean {
    return overall >= this.THRESHOLDS.MEDIUM && factors.sourceReliability >= 50;
  }

  public updateHistoricalData(
    scientificName: string,
    commonName: string,
    userFeedback: { correct: boolean; confidence: number }
  ): void {
    const key = scientificName || commonName;
    const current = this.historicalData.get(key) || { accuracy: 50, feedbackCount: 0 };

    // Update accuracy with weighted average
    const newAccuracy = userFeedback.correct ? userFeedback.confidence : 100 - userFeedback.confidence;
    const totalWeight = current.feedbackCount + 1;
    const updatedAccuracy = (current.accuracy * current.feedbackCount + newAccuracy) / totalWeight;

    this.historicalData.set(key, {
      accuracy: updatedAccuracy,
      feedbackCount: totalWeight,
    });
  }

  public getReliabilityDescription(reliability: string): string {
    const descriptions = {
      'very-high': 'Excellent identification with high confidence. Safe to act on this result.',
      'high': 'Good identification with solid confidence. Generally reliable for decision making.',
      'medium': 'Moderate identification confidence. Consider additional verification.',
      'low': 'Low identification confidence. Verification strongly recommended.',
      'very-low': 'Very low identification confidence. Do not rely on this result without expert consultation.',
    };

    return descriptions[reliability] || 'Unknown reliability level';
  }

  public getConfidenceAdvice(overall: number): {
    canTrustResult: boolean;
    shouldSeekVerification: boolean;
    isSafeForCareActions: boolean;
    advice: string;
  } {
    const canTrustResult = overall >= this.THRESHOLDS.HIGH;
    const shouldSeekVerification = overall < this.THRESHOLDS.MEDIUM;
    const isSafeForCareActions = overall >= this.THRESHOLDS.VERY_HIGH;

    let advice = '';
    if (isSafeForCareActions) {
      advice = 'High confidence result. Safe to use for plant care decisions.';
    } else if (canTrustResult) {
      advice = 'Good confidence result. Suitable for general information but verify before critical care decisions.';
    } else if (shouldSeekVerification) {
      advice = 'Low confidence result. Seek expert verification before making any plant care decisions.';
    } else {
      advice = 'Moderate confidence result. Use as a starting point but cross-reference with other sources.';
    }

    return {
      canTrustResult,
      shouldSeekVerification,
      isSafeForCareActions,
      advice,
    };
  }
}