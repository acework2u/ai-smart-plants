import {
  PlantRecommendation,
  PlantIssue,
  AITip,
  WeatherContext,
  SeasonalContext,
} from '../types/ai';
import {
  CurrentWeather,
  WeatherForecast,
  WeatherPlantImpact,
  ThailandSeason,
  Location,
} from '../types/weather';
import { Plant, PlantStatus } from '../types/garden';
import { weatherService } from './WeatherService';

// Recommendation priority scoring system
interface RecommendationScore {
  id: string;
  score: number;
  factors: {
    weather: number;
    seasonal: number;
    plantHealth: number;
    urgency: number;
    userHistory: number;
  };
  reasoning: string;
  reasoningThai: string;
}

// Plant care context for recommendations
interface PlantCareContext {
  plant: Plant;
  currentWeather?: CurrentWeather;
  forecast?: WeatherForecast;
  season: ThailandSeason;
  location?: Location;
  userPreferences?: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    careStyle: 'minimal' | 'regular' | 'intensive';
    language: 'th' | 'en';
  };
  careHistory?: {
    lastWatering?: Date;
    lastFertilizing?: Date;
    lastPruning?: Date;
    averageInterval?: number;
  };
}

// Recommendation categories with weights
const CATEGORY_WEIGHTS = {
  immediate: 100,
  urgent: 80,
  important: 60,
  routine: 40,
  preventive: 30,
  enhancement: 20,
};

export class RecommendationEngine {
  private weatherContext: WeatherContext | null = null;
  private seasonalContext: SeasonalContext | null = null;

  /**
   * Generate comprehensive plant care recommendations
   */
  async generateRecommendations(context: PlantCareContext): Promise<PlantRecommendation[]> {
    try {
      // Update weather and seasonal context
      await this.updateContext(context.location);

      // Generate recommendations from multiple sources
      const weatherRecommendations = await this.getWeatherBasedRecommendations(context);
      const seasonalRecommendations = this.getSeasonalRecommendations(context);
      const healthRecommendations = this.getHealthBasedRecommendations(context);
      const routineRecommendations = this.getRoutineRecommendations(context);
      const preventiveRecommendations = this.getPreventiveRecommendations(context);

      // Combine and deduplicate recommendations
      const allRecommendations = [
        ...weatherRecommendations,
        ...seasonalRecommendations,
        ...healthRecommendations,
        ...routineRecommendations,
        ...preventiveRecommendations,
      ];

      // Score and prioritize recommendations
      const scoredRecommendations = this.scoreRecommendations(allRecommendations, context);

      // Sort by score and limit to top recommendations
      return scoredRecommendations
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 10); // Limit to top 10 recommendations

    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return this.getFallbackRecommendations(context);
    }
  }

  /**
   * Generate weather-specific recommendations
   */
  private async getWeatherBasedRecommendations(context: PlantCareContext): Promise<PlantRecommendation[]> {
    if (!context.currentWeather) return [];

    const recommendations: PlantRecommendation[] = [];
    const { currentWeather, forecast, plant } = context;

    // Temperature-based recommendations
    if (currentWeather.temperature > 35) {
      recommendations.push(this.createRecommendation({
        category: 'environmental',
        priority: 5,
        title: 'Protect from extreme heat',
        titleThai: 'ป้องกันจากความร้อนจัด',
        description: 'Move plant to shade or provide protection from intense heat',
        descriptionThai: 'ย้ายต้นไม้ไปไว้ในที่ร่มหรือป้องกันจากความร้อนจัด',
        actionItems: [
          'Move to shaded area during peak hours',
          'Increase watering frequency',
          'Mist leaves in evening'
        ],
        actionItemsThai: [
          'ย้ายไปในที่ร่มในช่วงเวลาที่แสงแดดจัด',
          'เพิ่มความถี่ในการรดน้ำ',
          'พ่นน้ำใส่ใบในตอนเย็น'
        ],
        timeFrame: 'immediate',
        plant,
      }));
    }

    if (currentWeather.temperature < 15) {
      recommendations.push(this.createRecommendation({
        category: 'environmental',
        priority: 4,
        title: 'Protect from cold',
        titleThai: 'ป้องกันจากความหนาว',
        description: 'Bring sensitive plants indoors or provide cold protection',
        descriptionThai: 'นำต้นไม้ที่บอบบางเข้าในบ้านหรือป้องกันความหนาว',
        actionItems: [
          'Move tender plants indoors',
          'Cover with protective cloth',
          'Reduce watering frequency'
        ],
        actionItemsThai: [
          'นำต้นไม้ที่บอบบางเข้าในบ้าน',
          'คลุมด้วยผ้าป้องกัน',
          'ลดความถี่ในการรดน้ำ'
        ],
        timeFrame: 'immediate',
        plant,
      }));
    }

    // Rain-based recommendations
    const upcomingRain = forecast?.forecast.some(day =>
      ['rain', 'drizzle', 'thunderstorm'].includes(day.condition) &&
      day.precipitationProbability > 70
    );

    if (upcomingRain) {
      recommendations.push(this.createRecommendation({
        category: 'watering',
        priority: 3,
        title: 'Adjust watering for rain',
        titleThai: 'ปรับการรดน้ำเนื่องจากฝนตก',
        description: 'Rain is expected - skip or reduce next watering session',
        descriptionThai: 'คาดว่าจะมีฝนตก - ข้ามหรือลดการรดน้ำครั้งถัดไป',
        actionItems: [
          'Skip next scheduled watering',
          'Check drainage system',
          'Monitor for overwatering signs'
        ],
        actionItemsThai: [
          'ข้ามการรดน้ำที่กำหนดไว้ครั้งถัดไป',
          'ตรวจสอบระบบระบายน้ำ',
          'สังเกตอาการรดน้ำมากเกินไป'
        ],
        timeFrame: 'within_day',
        plant,
      }));
    }

    // UV Index recommendations
    if (currentWeather.uvIndex && currentWeather.uvIndex > 8) {
      recommendations.push(this.createRecommendation({
        category: 'environmental',
        priority: 3,
        title: 'UV protection needed',
        titleThai: 'ต้องการป้องกัน UV',
        description: 'High UV levels can damage sensitive plants',
        descriptionThai: 'ระดับ UV สูงอาจทำให้ต้นไม้บอบบางเสียหาย',
        actionItems: [
          'Provide shade during 10 AM - 4 PM',
          'Water early morning or evening',
          'Watch for leaf burn signs'
        ],
        actionItemsThai: [
          'ให้ร่มเงาในช่วง 10.00-16.00 น.',
          'รดน้ำในตอนเช้าตรู่หรือเย็น',
          'สังเกตอาการใบไหม้'
        ],
        timeFrame: 'within_day',
        plant,
      }));
    }

    // High humidity recommendations
    if (currentWeather.humidity > 80) {
      recommendations.push(this.createRecommendation({
        category: 'environmental',
        priority: 2,
        title: 'Improve air circulation',
        titleThai: 'เพิ่มการระบายอากาศ',
        description: 'High humidity increases disease risk - improve ventilation',
        descriptionThai: 'ความชื้นสูงเพิ่มความเสี่ยงโรค - เพิ่มการระบายอากาศ',
        actionItems: [
          'Space plants further apart',
          'Use fan for air circulation',
          'Avoid watering leaves'
        ],
        actionItemsThai: [
          'เพิ่มระยะห่างระหว่างต้นไม้',
          'ใช้พัดลมเพื่อระบายอากาศ',
          'หลีกเลี่ยงการรดน้ำใส่ใบ'
        ],
        timeFrame: 'within_day',
        plant,
      }));
    }

    return recommendations;
  }

  /**
   * Generate seasonal recommendations
   */
  private getSeasonalRecommendations(context: PlantCareContext): PlantRecommendation[] {
    const recommendations: PlantRecommendation[] = [];
    const { season, plant } = context;

    switch (season) {
      case 'hot':
        recommendations.push(this.createRecommendation({
          category: 'watering',
          priority: 3,
          title: 'Increase watering frequency',
          titleThai: 'เพิ่มความถี่ในการรดน้ำ',
          description: 'Hot season requires more frequent watering',
          descriptionThai: 'ฤดูร้อนต้องการการรดน้ำบ่อยขึ้น',
          actionItems: [
            'Water every 2-3 days instead of weekly',
            'Check soil moisture daily',
            'Water in early morning or late evening'
          ],
          actionItemsThai: [
            'รดน้ำทุก 2-3 วัน แทนที่จะรดทุกสัปดาห์',
            'ตรวจสอบความชื้นของดินทุกวัน',
            'รดน้ำในตอนเช้าตรู่หรือเย็น'
          ],
          timeFrame: 'weekly',
          plant,
        }));

        recommendations.push(this.createRecommendation({
          category: 'environmental',
          priority: 3,
          title: 'Provide shade protection',
          titleThai: 'ป้องกันแสงแดด',
          description: 'Use shade cloth or move plants to partial shade',
          descriptionThai: 'ใช้ผ้าคลุมหรือย้ายต้นไม้ไปไว้ในที่ร่มบางส่วน',
          actionItems: [
            'Install 50% shade cloth',
            'Move containers to morning sun only',
            'Mulch around plants'
          ],
          actionItemsThai: [
            'ติดตั้งผ้าคลุมกันแดด 50%',
            'ย้ายกระถางให้โดนแสงแดดเช้าเท่านั้น',
            'คลุมโคนต้นไม้'
          ],
          timeFrame: 'within_week',
          plant,
        }));
        break;

      case 'rainy':
        recommendations.push(this.createRecommendation({
          category: 'fertilizing',
          priority: 4,
          title: 'Apply slow-release fertilizer',
          titleThai: 'ใส่ปุ๋ยชนิดปล่อยช้า',
          description: 'Rainy season is ideal for fertilizing and growth',
          descriptionThai: 'ฤดูฝนเหมาะสำหรับการใส่ปุ๋ยและการเจริญเติบโต',
          actionItems: [
            'Apply balanced NPK fertilizer',
            'Use organic compost',
            'Monitor for nutrient leaching'
          ],
          actionItemsThai: [
            'ใส่ปุ๋ย NPK ที่สมดุล',
            'ใช้ปุ๋ยหมักอินทรีย์',
            'ตรวจสอบการชะล้างธาตุอาหาร'
          ],
          timeFrame: 'monthly',
          plant,
        }));

        recommendations.push(this.createRecommendation({
          category: 'environmental',
          priority: 3,
          title: 'Improve drainage',
          titleThai: 'ปรับปรุงระบบระบายน้ำ',
          description: 'Prevent root rot from excess water',
          descriptionThai: 'ป้องกันรากเน่าจากน้ำมากเกินไป',
          actionItems: [
            'Check drainage holes',
            'Add drainage layer',
            'Elevate containers'
          ],
          actionItemsThai: [
            'ตรวจสอบรูระบายน้ำ',
            'เพิ่มชั้นระบายน้ำ',
            'ยกกระถางให้สูงขึ้น'
          ],
          timeFrame: 'within_week',
          plant,
        }));
        break;

      case 'cool':
        recommendations.push(this.createRecommendation({
          category: 'watering',
          priority: 2,
          title: 'Reduce watering frequency',
          titleThai: 'ลดความถี่ในการรดน้ำ',
          description: 'Plants need less water in cool season',
          descriptionThai: 'ต้นไม้ต้องการน้ำน้อยลงในฤดูหนาว',
          actionItems: [
            'Water only when soil is dry',
            'Reduce frequency by 30-50%',
            'Water during warmer part of day'
          ],
          actionItemsThai: [
            'รดน้ำเฉพาะเมื่อดินแห้ง',
            'ลดความถี่ 30-50%',
            'รดน้ำในช่วงเวลาที่อบอุ่น'
          ],
          timeFrame: 'weekly',
          plant,
        }));

        recommendations.push(this.createRecommendation({
          category: 'pruning',
          priority: 3,
          title: 'Prune and shape plants',
          titleThai: 'ตัดแต่งและจัดทรงต้นไม้',
          description: 'Cool season is ideal for pruning and maintenance',
          descriptionThai: 'ฤดูหนาวเหมาะสำหรับการตัดแต่งและบำรุงรักษา',
          actionItems: [
            'Remove dead or diseased branches',
            'Shape plants for spring growth',
            'Clean up fallen leaves'
          ],
          actionItemsThai: [
            'ตัดกิ่งที่ตายหรือเป็นโรค',
            'จัดทรงต้นไม้เพื่อการเจริญเติบโตในฤดูใบไม้ผลิ',
            'เก็บใบที่ร่วงหล่น'
          ],
          timeFrame: 'monthly',
          plant,
        }));
        break;
    }

    return recommendations;
  }

  /**
   * Generate health-based recommendations
   */
  private getHealthBasedRecommendations(context: PlantCareContext): PlantRecommendation[] {
    const recommendations: PlantRecommendation[] = [];
    const { plant } = context;

    switch (plant.status) {
      case PlantStatus.Critical:
        recommendations.push(this.createRecommendation({
          category: 'treatment',
          priority: 5,
          title: 'Emergency plant care needed',
          titleThai: 'ต้องการการดูแลด่วน',
          description: 'Plant is in critical condition and needs immediate attention',
          descriptionThai: 'ต้นไม้อยู่ในสภาพวิกฤติและต้องการการดูแลทันที',
          actionItems: [
            'Check for root rot or pest infestation',
            'Isolate from healthy plants',
            'Adjust watering and lighting immediately'
          ],
          actionItemsThai: [
            'ตรวจสอบรากเน่าหรือแมลงศัตรูพืช',
            'แยกจากต้นไม้ที่แข็งแรง',
            'ปรับการรดน้ำและแสงทันที'
          ],
          timeFrame: 'immediate',
          plant,
        }));
        break;

      case PlantStatus.Warning:
        recommendations.push(this.createRecommendation({
          category: 'treatment',
          priority: 4,
          title: 'Monitor plant health closely',
          titleThai: 'ติดตามสุขภาพต้นไม้อย่างใกล้ชิด',
          description: 'Plant shows warning signs - take preventive action',
          descriptionThai: 'ต้นไม้แสดงอาการเตือน - ดำเนินการป้องกัน',
          actionItems: [
            'Check leaves for discoloration or spots',
            'Examine roots if possible',
            'Adjust care routine based on symptoms'
          ],
          actionItemsThai: [
            'ตรวจสอบใบที่เปลี่ยนสีหรือมีจุด',
            'ตรวจสอบรากหากเป็นไปได้',
            'ปรับการดูแลตามอาการ'
          ],
          timeFrame: 'within_day',
          plant,
        }));
        break;

      case PlantStatus.Healthy:
        recommendations.push(this.createRecommendation({
          category: 'enhancement',
          priority: 2,
          title: 'Maintain optimal care',
          titleThai: 'รักษาการดูแลที่เหมาะสม',
          description: 'Plant is healthy - continue current care routine',
          descriptionThai: 'ต้นไม้แข็งแรง - ดำเนินการดูแลตามเดิม',
          actionItems: [
            'Continue regular watering schedule',
            'Monitor for any changes',
            'Consider propagation if desired'
          ],
          actionItemsThai: [
            'รดน้ำตามกำหนดการปกติ',
            'สังเกตการเปลี่ยนแปลงใดๆ',
            'พิจารณาขยายพันธุ์หากต้องการ'
          ],
          timeFrame: 'weekly',
          plant,
        }));
        break;

      case PlantStatus.Thriving:
        recommendations.push(this.createRecommendation({
          category: 'enhancement',
          priority: 1,
          title: 'Consider propagation or repotting',
          titleThai: 'พิจารณาขยายพันธุ์หรือเปลี่ยนกระถาง',
          description: 'Plant is thriving - perfect time for expansion',
          descriptionThai: 'ต้นไม้เจริญเติบโตดี - เวลาที่เหมาะสำหรับขยาย',
          actionItems: [
            'Take cuttings for propagation',
            'Check if repotting is needed',
            'Share care success with community'
          ],
          actionItemsThai: [
            'ตัดยอดเพื่อขยายพันธุ์',
            'ตรวจสอบว่าต้องเปลี่ยนกระถางหรือไม่',
            'แบ่งปันความสำเร็จในการดูแลกับชุมชน'
          ],
          timeFrame: 'monthly',
          plant,
        }));
        break;
    }

    return recommendations;
  }

  /**
   * Generate routine care recommendations
   */
  private getRoutineRecommendations(context: PlantCareContext): PlantRecommendation[] {
    const recommendations: PlantRecommendation[] = [];
    const { plant, careHistory } = context;
    const now = new Date();

    // Watering recommendations based on history
    if (careHistory?.lastWatering) {
      const daysSinceWatering = Math.floor(
        (now.getTime() - careHistory.lastWatering.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceWatering >= 7) {
        recommendations.push(this.createRecommendation({
          category: 'watering',
          priority: 4,
          title: 'Watering overdue',
          titleThai: 'ถึงเวลารดน้ำแล้ว',
          description: `Last watered ${daysSinceWatering} days ago - check if watering is needed`,
          descriptionThai: `รดน้ำครั้งสุดท้าย ${daysSinceWatering} วันที่แล้ว - ตรวจสอบว่าต้องรดน้ำหรือไม่`,
          actionItems: [
            'Check soil moisture with finger test',
            'Water thoroughly if soil is dry',
            'Adjust watering schedule if needed'
          ],
          actionItemsThai: [
            'ตรวจสอบความชื้นดินด้วยนิ้ว',
            'รดน้ำให้ทั่วหากดินแห้ง',
            'ปรับตารางรดน้ำหากจำเป็น'
          ],
          timeFrame: 'immediate',
          plant,
        }));
      }
    }

    // Fertilizing recommendations
    if (careHistory?.lastFertilizing) {
      const daysSinceFertilizing = Math.floor(
        (now.getTime() - careHistory.lastFertilizing.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceFertilizing >= 30) {
        recommendations.push(this.createRecommendation({
          category: 'fertilizing',
          priority: 3,
          title: 'Monthly fertilizing due',
          titleThai: 'ถึงเวลาใส่ปุ๋ยรายเดือน',
          description: 'Apply balanced fertilizer for healthy growth',
          descriptionThai: 'ใส่ปุ๋ยสมดุลเพื่อการเจริญเติบโตที่แข็งแรง',
          actionItems: [
            'Use balanced NPK fertilizer (10-10-10)',
            'Dilute to half strength',
            'Apply to moist soil'
          ],
          actionItemsThai: [
            'ใช้ปุ๋ย NPK สมดุล (10-10-10)',
            'เจือจางให้เหลือครึ่งความเข้มข้น',
            'ใส่ในดินที่ชื้น'
          ],
          timeFrame: 'within_week',
          plant,
        }));
      }
    }

    return recommendations;
  }

  /**
   * Generate preventive care recommendations
   */
  private getPreventiveRecommendations(context: PlantCareContext): PlantRecommendation[] {
    const recommendations: PlantRecommendation[] = [];
    const { plant } = context;

    // General preventive care
    recommendations.push(this.createRecommendation({
      category: 'environmental',
      priority: 2,
      title: 'Check for pest signs',
      titleThai: 'ตรวจสอบอาการแมลงศัตรูพืช',
      description: 'Regular inspection helps catch problems early',
      descriptionThai: 'การตรวจสอบเป็นประจำช่วยตรวจจับปัญหาได้เร็ว',
      actionItems: [
        'Inspect leaves weekly for pests',
        'Check undersides of leaves',
        'Look for sticky honeydew or webbing'
      ],
      actionItemsThai: [
        'ตรวจสอบใบหาแมลงทุกสัปดาห์',
        'ดูใต้ใบด้วย',
        'หาน้ำหวานเหนียวหรือใยแมงมุม'
      ],
      timeFrame: 'weekly',
      plant,
    }));

    recommendations.push(this.createRecommendation({
      category: 'environmental',
      priority: 1,
      title: 'Maintain plant hygiene',
      titleThai: 'รักษาความสะอาดของต้นไม้',
      description: 'Clean leaves and remove debris regularly',
      descriptionThai: 'ทำความสะอาดใบและเอาเศษซากออกเป็นประจำ',
      actionItems: [
        'Wipe leaves with damp cloth',
        'Remove dead or yellowing leaves',
        'Clean around plant base'
      ],
      actionItemsThai: [
        'เช็ดใบด้วยผ้าชื้น',
        'เอาใบที่ตายหรือเหลืองออก',
        'ทำความสะอาดรอบโคนต้น'
      ],
      timeFrame: 'weekly',
      plant,
    }));

    return recommendations;
  }

  /**
   * Score and prioritize recommendations
   */
  private scoreRecommendations(
    recommendations: PlantRecommendation[],
    context: PlantCareContext
  ): PlantRecommendation[] {
    return recommendations.map(rec => {
      let finalPriority = rec.priority;

      // Boost priority based on plant health
      if (context.plant.status === PlantStatus.Critical) {
        finalPriority = Math.min(5, finalPriority + 2);
      } else if (context.plant.status === PlantStatus.Warning) {
        finalPriority = Math.min(5, finalPriority + 1);
      }

      // Boost priority for immediate timeframes
      if (rec.timeFrame === 'immediate') {
        finalPriority = Math.min(5, finalPriority + 1);
      }

      return {
        ...rec,
        priority: finalPriority,
      };
    });
  }

  /**
   * Get fallback recommendations when main system fails
   */
  private getFallbackRecommendations(context: PlantCareContext): PlantRecommendation[] {
    const { plant } = context;

    return [
      this.createRecommendation({
        category: 'watering',
        priority: 3,
        title: 'Check soil moisture',
        titleThai: 'ตรวจสอบความชื้นของดิน',
        description: 'Test soil moisture before watering',
        descriptionThai: 'ทดสอบความชื้นของดินก่อนรดน้ำ',
        actionItems: ['Insert finger 2 inches into soil', 'Water if dry'],
        actionItemsThai: ['เสียบนิ้วลงดิน 2 นิ้ว', 'รดน้ำหากแห้ง'],
        timeFrame: 'within_day',
        plant,
      }),
      this.createRecommendation({
        category: 'lighting',
        priority: 2,
        title: 'Ensure adequate lighting',
        titleThai: 'ให้แสงเพียงพอ',
        description: 'Make sure plant gets proper light exposure',
        descriptionThai: 'ให้ต้นไม้ได้รับแสงที่เหมาะสม',
        actionItems: ['Check light requirements', 'Adjust placement if needed'],
        actionItemsThai: ['ตรวจสอบความต้องการแสง', 'ปรับตำแหน่งหากจำเป็น'],
        timeFrame: 'within_week',
        plant,
      }),
    ];
  }

  /**
   * Helper to create recommendation object
   */
  private createRecommendation(params: {
    category: any;
    priority: number;
    title: string;
    titleThai: string;
    description: string;
    descriptionThai: string;
    actionItems: string[];
    actionItemsThai: string[];
    timeFrame: any;
    plant: Plant;
    requiredSupplies?: string[];
    requiredSuppliesThai?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime?: string;
  }): PlantRecommendation {
    return {
      id: crypto.randomUUID(),
      category: params.category,
      priority: params.priority,
      title: params.title,
      description: params.description,
      actionItems: params.actionItems,
      timeFrame: params.timeFrame,
      requiredSupplies: params.requiredSupplies,
      difficulty: params.difficulty || 'beginner',
      estimatedTime: params.estimatedTime,
      confidence: 0.85,
      source: 'ai',
      createdAt: new Date(),
    };
  }

  /**
   * Update weather and seasonal context
   */
  private async updateContext(location?: Location): Promise<void> {
    try {
      if (location) {
        const currentWeather = await weatherService.getCurrentWeather(location);
        this.weatherContext = {
          temperature: currentWeather.temperature,
          humidity: currentWeather.humidity,
          condition: currentWeather.condition as any,
          uvIndex: currentWeather.uvIndex,
          windSpeed: currentWeather.windSpeed,
        };

        const seasonalData = weatherService.getThailandSeasonalContext();
        this.seasonalContext = {
          season: seasonalData.season as any,
          month: seasonalData.month,
          region: 'Thailand',
        };
      }
    } catch (error) {
      // Don't throw error - just work without weather context
      console.warn('Failed to update weather context:', error);
    }
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();