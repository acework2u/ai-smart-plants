import {
  PlantAnalysisResult,
  PlantIssue,
  PlantRecommendation,
  AnalysisMetadata,
  PlantStatus
} from '../types/ai';
// Using crypto.randomUUID() for generating IDs

export interface ScanInput {
  imageUri: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp?: Date;
}

// Mock plant database with realistic Thai and common houseplants
const MOCK_PLANTS = [
  {
    name: 'มอนสเตอร่า ดีลิชิโอซ่า',
    scientificName: 'Monstera deliciosa',
    commonIssues: ['leaf_yellowing', 'root_rot', 'insufficient_light'],
    care: {
      watering: 'รดน้ำเมื่อดินแห้ง 2-3 นิ้ว',
      light: 'แสงส่องทางอ้อมแสงจ้า',
      humidity: 'ความชื้น 50-60%',
      temperature: '18-27°C',
    }
  },
  {
    name: 'ต้นยางอินเดีย',
    scientificName: 'Ficus elastica',
    commonIssues: ['leaf_drop', 'spider_mites', 'overwatering'],
    care: {
      watering: 'รดน้ำสัปดาห์ละครั้ง',
      light: 'แสงแดดอ่อน',
      humidity: 'ความชื้นปกติ',
      temperature: '15-24°C',
    }
  },
  {
    name: 'สันสี่เวียร์เรีย',
    scientificName: 'Sansevieria trifasciata',
    commonIssues: ['root_rot', 'low_light'],
    care: {
      watering: 'รดน้ำเดือนละครั้ง',
      light: 'ทนแสงน้อย',
      humidity: 'ความชื้นต่ำ',
      temperature: '18-27°C',
    }
  },
  {
    name: 'โพธอส',
    scientificName: 'Epipremnum aureum',
    commonIssues: ['brown_tips', 'pest_infestation'],
    care: {
      watering: 'รดน้ำเมื่อดินแห้ง',
      light: 'แสงทางอ้อม',
      humidity: 'ความชื้นสูง',
      temperature: '20-30°C',
    }
  },
  {
    name: 'ไผ่น้ำ',
    scientificName: 'Dracaena sanderiana',
    commonIssues: ['chlorinated_water', 'nutrient_deficiency'],
    care: {
      watering: 'เปลี่ยนน้ำสัปดาห์ละครั้ง',
      light: 'แสงทางอ้อม',
      humidity: 'ความชื้นปกติ',
      temperature: '18-24°C',
    }
  },
];

// Mock issues database
const MOCK_ISSUES = {
  leaf_yellowing: {
    type: 'environmental' as const,
    severity: 'medium' as const,
    title: 'ใบเหลือง',
    description: 'ใบพืชมีสีเหลืองซึ่งอาจเกิดจากการให้น้ำมากเกินไปหรือขาดธาตุอาหาร',
    symptoms: ['ใบด้านล่างเป็นสีเหลือง', 'ใบอ่อนแก่และร่วง'],
    causes: ['รดน้ำมากเกินไป', 'ขาดไนโตรเจน', 'แสงไม่เพียงพอ'],
    treatments: ['ลดการรดน้ำ', 'ใส่ปุ๋ยไนโตรเจน', 'เพิ่มแสงแดด'],
  },
  root_rot: {
    type: 'disease' as const,
    severity: 'high' as const,
    title: 'รากเน่า',
    description: 'รากพืชเน่าเสียเนื่องจากการให้น้ำมากเกินไปและการระบายน้ำไม่ดี',
    symptoms: ['ใบเหี่ยวแม้ดินยังเปียก', 'กลิ่นเหม็นจากดิน', 'รากดำและนิ่ม'],
    causes: ['รดน้ำมากเกินไป', 'ดินระบายน้ำไม่ดี', 'กระถางไม่มีรูระบาย'],
    treatments: ['ตัดรากเน่าออก', 'เปลี่ยนดินใหม่', 'ลดการรดน้ำ'],
  },
  pest_infestation: {
    type: 'pest' as const,
    severity: 'medium' as const,
    title: 'แมลงศัตรูพืช',
    description: 'พบแมลงศัตรูพืชเช่น เพลี้ย ไรแดง หรือแมลงหวี่ขาว',
    symptoms: ['จุดเล็กๆ บนใบ', 'ใบซีด', 'เหนียวหรือผงขาวบนใบ'],
    causes: ['ความชื้นต่ำ', 'อากาศถ่ายเทไม่ดี', 'พืชอยู่ใกล้กันเกินไป'],
    treatments: ['ฉีดพ่นสบู่เหลว', 'แยกพืชออกจากกัน', 'เพิ่มความชื้น'],
  },
  nutrient_deficiency: {
    type: 'nutrient' as const,
    severity: 'low' as const,
    title: 'ขาดธาตุอาหาร',
    description: 'พืชแสดงสัญญาณขาดธาตุอาหารหลัก เช่น ไนโตรเจน ฟอสฟอรัส หรือโพแทสเซียม',
    symptoms: ['ใบเหลือง', 'การเจริญเติบโตช้า', 'ดอกออกน้อย'],
    causes: ['ไม่ได้ใส่ปุ๋ย', 'ดินเก่า', 'ไม่เปลี่ยนกระถาง'],
    treatments: ['ใส่ปุ๋ยสมดุล NPK', 'เปลี่ยนดินใหม่', 'ใส่ปุ๋ยคอมโพสต์'],
  },
};

// Mock recommendations database
const MOCK_RECOMMENDATIONS = {
  watering: [
    {
      title: 'ปรับการรดน้ำ',
      description: 'รดน้ำเมื่อดินแห้ง 2-3 นิ้วแรก ตรวจสอบด้วยการแหย่นิ้วลงในดิน',
      actionItems: ['ตรวจดินก่อนรดทุกครั้ง', 'รดน้ำช้าๆ จนน้ำไหลออกรูระบาย', 'เลี่ยงการรดใบ'],
      timeFrame: 'within_day' as const,
      difficulty: 'beginner' as const,
      estimatedTime: '5 นาที',
    },
    {
      title: 'ระบบรดน้ำอัตโนมัติ',
      description: 'ติดตั้งระบบรดน้ำหยดเพื่อการรดน้ำที่สม่ำเสมอ',
      actionItems: ['ซื้ออุปกรณ์รดน้ำหยด', 'ติดตั้งตามคำแนะนำ', 'ปรับจำนวนหยดต่อวัน'],
      timeFrame: 'within_week' as const,
      difficulty: 'intermediate' as const,
      estimatedTime: '30 นาที',
    }
  ],
  lighting: [
    {
      title: 'เพิ่มแสงสำหรับพืช',
      description: 'ย้ายพืชไปยังตำแหน่งที่ได้แสงแดดทางอ้อมมากขึ้น',
      actionItems: ['หาจุดที่แสงเหมาะสม', 'ย้ายพืชค่อยเป็นค่อยไป', 'สังเกตการเปลี่ยนแปลง'],
      timeFrame: 'immediate' as const,
      difficulty: 'beginner' as const,
      estimatedTime: '10 นาที',
    }
  ],
  fertilizing: [
    {
      title: 'ปุ๥ยสำหรับพืชใบ',
      description: 'ใช้ปุ๋ย NPK 20-10-10 เจือจางครึ่งหนึ่งทุก 2 สัปดาห์',
      actionItems: ['ซื้อปุ๋ย NPK 20-10-10', 'เจือจาง 1:1000', 'ใส่ทุก 2 สัปดาห์'],
      timeFrame: 'within_week' as const,
      difficulty: 'beginner' as const,
      estimatedTime: '15 นาที',
    }
  ],
};

class MockScanService {
  private simulateNetworkDelay(min: number = 1500, max: number = 3500): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private getRandomPlant() {
    return MOCK_PLANTS[Math.floor(Math.random() * MOCK_PLANTS.length)];
  }

  private generateMockIssues(plantCommonIssues: string[]): PlantIssue[] {
    const issues: PlantIssue[] = [];
    const numberOfIssues = Math.random() < 0.3 ? 0 : Math.random() < 0.7 ? 1 : 2;

    for (let i = 0; i < numberOfIssues; i++) {
      const issueType = plantCommonIssues[Math.floor(Math.random() * plantCommonIssues.length)];
      const mockIssue = MOCK_ISSUES[issueType as keyof typeof MOCK_ISSUES];

      if (mockIssue) {
        issues.push({
          id: crypto.randomUUID(),
          type: mockIssue.type,
          severity: mockIssue.severity,
          title: mockIssue.title,
          description: mockIssue.description,
          confidence: 0.7 + Math.random() * 0.25,
          treatmentUrgency: mockIssue.severity === 'high' ? 4 : mockIssue.severity === 'medium' ? 3 : 2,
          detectedAt: new Date(),
          symptoms: mockIssue.symptoms,
          causes: mockIssue.causes,
          treatments: mockIssue.treatments,
          metadata: {
            detectionMethod: 'visual_analysis',
            affectedArea: Math.random() < 0.5 ? 'leaves' : 'stems',
          }
        });
      }
    }

    return issues;
  }

  private generateMockRecommendations(plant: any, issues: PlantIssue[]): PlantRecommendation[] {
    const recommendations: PlantRecommendation[] = [];
    const categories = ['watering', 'lighting', 'fertilizing'] as const;

    // Add general care recommendations
    categories.forEach(category => {
      const mockRecs = MOCK_RECOMMENDATIONS[category];
      if (mockRecs.length > 0) {
        const rec = mockRecs[Math.floor(Math.random() * mockRecs.length)];
        recommendations.push({
          id: crypto.randomUUID(),
          category,
          priority: Math.floor(Math.random() * 3) + 1,
          title: rec.title,
          description: rec.description,
          actionItems: rec.actionItems,
          timeFrame: rec.timeFrame,
          difficulty: rec.difficulty,
          estimatedTime: rec.estimatedTime,
          confidence: 0.8 + Math.random() * 0.15,
          source: 'ai' as const,
          createdAt: new Date(),
        });
      }
    });

    // Add issue-specific treatment recommendations
    issues.forEach(issue => {
      if (issue.treatments && issue.treatments.length > 0) {
        recommendations.push({
          id: crypto.randomUUID(),
          category: 'treatment' as const,
          priority: issue.severity === 'critical' ? 5 : issue.severity === 'high' ? 4 : 3,
          title: `รักษา${issue.title}`,
          description: `แนวทางการรักษา: ${issue.treatments[0]}`,
          actionItems: issue.treatments,
          timeFrame: issue.severity === 'critical' ? 'immediate' : 'within_day',
          confidence: issue.confidence,
          source: 'ai' as const,
          createdAt: new Date(),
        });
      }
    });

    return recommendations;
  }

  private generateHealthStatus(issues: PlantIssue[]): { status: PlantStatus; score: number } {
    if (issues.length === 0) {
      return { status: 'Healthy', score: 85 + Math.random() * 15 };
    }

    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;

    let score = 100;
    score -= criticalIssues * 50;
    score -= highIssues * 30;
    score -= mediumIssues * 15;
    score -= (issues.length - criticalIssues - highIssues - mediumIssues) * 5;

    score = Math.max(0, Math.min(100, score));

    let status: PlantStatus;
    if (score >= 70) status = 'Healthy';
    else if (score >= 40) status = 'Warning';
    else status = 'Critical';

    return { status, score };
  }

  private generateAnalysisMetadata(): AnalysisMetadata {
    const currentDate = new Date();
    const season = currentDate.getMonth() >= 3 && currentDate.getMonth() <= 5 ? 'summer' :
                  currentDate.getMonth() >= 6 && currentDate.getMonth() <= 8 ? 'autumn' :
                  currentDate.getMonth() >= 9 && currentDate.getMonth() <= 11 ? 'winter' : 'spring';

    return {
      imageQuality: 0.7 + Math.random() * 0.25,
      processingTime: 1200 + Math.random() * 2000,
      modelVersion: 'PlantAI-v2.1.0',
      confidence: 0.75 + Math.random() * 0.2,
      weatherContext: {
        temperature: 28 + Math.random() * 8,
        humidity: 60 + Math.random() * 30,
        condition: Math.random() < 0.5 ? 'sunny' : Math.random() < 0.7 ? 'cloudy' : 'rain',
      },
      seasonalContext: {
        season,
        month: currentDate.getMonth() + 1,
        region: 'Southeast Asia',
        dayLength: season === 'summer' ? 13 : season === 'winter' ? 11 : 12,
      },
      userContext: {
        experienceLevel: 'beginner',
        careHistory: [],
        preferences: {
          language: 'th',
          notification_frequency: 'weekly',
        }
      }
    };
  }

  async analyzePlant(input: ScanInput): Promise<PlantAnalysisResult> {
    // Simulate AI processing time
    await this.simulateNetworkDelay();

    const plant = this.getRandomPlant();
    const issues = this.generateMockIssues(plant.commonIssues);
    const recommendations = this.generateMockRecommendations(plant, issues);
    const { status, score } = this.generateHealthStatus(issues);
    const metadata = this.generateAnalysisMetadata();

    const result: PlantAnalysisResult = {
      analysisId: crypto.randomUUID(),
      plantName: plant.name,
      scientificName: plant.scientificName,
      confidence: 0.85 + Math.random() * 0.1,
      healthStatus: status,
      healthScore: score,
      issues,
      recommendations,
      analysisTimestamp: new Date(),
      imageUri: input.imageUri,
      metadata,
      tags: ['houseplant', 'indoor', 'tropical'],
      notes: `ต้นไม้ชนิดนี้เหมาะสำหรับปลูกในบ้าน ${plant.care.light.toLowerCase()} และ${plant.care.watering.toLowerCase()}`,
    };

    return result;
  }

  // Additional helper methods for testing
  async getRandomPlantData() {
    return this.getRandomPlant();
  }

  async simulateAnalysisSteps(): Promise<Array<{ step: string; progress: number; message: string }>> {
    const steps = [
      { step: 'image_processing', progress: 25, message: 'กำลังประมวลผลภาพ...' },
      { step: 'plant_identification', progress: 50, message: 'กำลังระบุชนิดพืช...' },
      { step: 'health_analysis', progress: 75, message: 'กำลังวิเคราะห์สุขภาพ...' },
      { step: 'recommendations', progress: 100, message: 'กำลังสร้างคำแนะนำ...' },
    ];

    const results = [];
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      results.push(step);
    }
    return results;
  }
}

// Export singleton instance
export const mockScanService = new MockScanService();
export default mockScanService;
export { MockScanService };