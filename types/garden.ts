import { z } from 'zod';
import { generateId } from '../utils/ids';

// Plant health status
export type PlantStatus = 'Healthy' | 'Warning' | 'Critical';

// Base plant schema with validation
export const PlantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  scientificName: z.string().optional(),
  status: z.enum(['Healthy', 'Warning', 'Critical']),
  imageUrl: z.string().url().optional(),
  statusColor: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// TypeScript interface derived from schema
export type Plant = z.infer<typeof PlantSchema>;

// Plant creation input (without auto-generated fields)
export type CreatePlantInput = Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>;

// Plant update input (partial fields)
export type UpdatePlantInput = Partial<Omit<Plant, 'id' | 'createdAt'>>;

// Garden filter options
export type GardenFilter = PlantStatus | 'all';

// Garden sort options
export type GardenSort = 'name' | 'date' | 'status';

// Garden view state
export interface GardenViewState {
  searchQuery: string;
  filter: GardenFilter;
  sort: GardenSort;
  viewMode: 'grid' | 'list';
}

// Garden statistics
export interface GardenStats {
  totalPlants: number;
  healthyCount: number;
  warningCount: number;
  criticalCount: number;
  recentlyAdded: number;
}

// Plant care schedule item
export interface CareScheduleItem {
  id: string;
  plantId: string;
  type: 'watering' | 'fertilizing' | 'pruning' | 'inspection';
  title: string;
  description: string;
  frequency: string; // "weekly", "bi-weekly", "monthly"
  nextDue: Date;
  isOverdue: boolean;
  priority: 1 | 2 | 3 | 4 | 5;
}

// Plant health metrics
export interface PlantHealthMetrics {
  plantId: string;
  lastWatered?: Date;
  lastFertilized?: Date;
  lastInspected?: Date;
  wateringFrequency: number; // days
  fertilizingFrequency: number; // days
  healthScore: number; // 0-100
  riskFactors: string[];
}

// Validation functions
export const validatePlant = (data: unknown): Plant => {
  const result = PlantSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid plant data: ${result.error.message}`);
  }
  return result.data;
};

export const validateCreatePlantInput = (data: unknown): CreatePlantInput => {
  const plantData = {
    ...(data as object),
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return validatePlant(plantData);
};
