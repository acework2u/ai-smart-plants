import { act, renderHook } from '@testing-library/react-native';
import { useGardenStore } from '../../stores/garden';
import { Plant } from '../../types/garden';

describe('Garden Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useGardenStore());
    act(() => {
      result.current.clearGarden();
    });
  });

  it('should initialize with empty garden', () => {
    const { result } = renderHook(() => useGardenStore());

    expect(result.current.plants).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.activePlant).toBeNull();
  });

  it('should add plant to garden', () => {
    const { result } = renderHook(() => useGardenStore());

    const newPlant: Omit<Plant, 'id'> = {
      name: 'Test Plant',
      scientificName: 'Testus plantus',
      status: 'Healthy',
      imageUrl: 'https://example.com/plant.jpg',
    };

    act(() => {
      result.current.addPlant(newPlant);
    });

    expect(result.current.plants).toHaveLength(1);
    expect(result.current.plants[0].name).toBe('Test Plant');
    expect(result.current.plants[0].id).toBeDefined();
  });

  it('should remove plant from garden', () => {
    const { result } = renderHook(() => useGardenStore());

    // Add a plant first
    const newPlant: Omit<Plant, 'id'> = {
      name: 'Test Plant',
      status: 'Healthy',
    };

    let plantId: string;
    act(() => {
      plantId = result.current.addPlant(newPlant);
    });

    expect(result.current.plants).toHaveLength(1);

    // Remove the plant
    act(() => {
      result.current.removePlant(plantId);
    });

    expect(result.current.plants).toHaveLength(0);
  });

  it('should update plant information', () => {
    const { result } = renderHook(() => useGardenStore());

    // Add a plant first
    const newPlant: Omit<Plant, 'id'> = {
      name: 'Test Plant',
      status: 'Healthy',
    };

    let plantId: string;
    act(() => {
      plantId = result.current.addPlant(newPlant);
    });

    // Update the plant
    const updates = {
      name: 'Updated Plant Name',
      status: 'Warning' as const,
    };

    act(() => {
      result.current.updatePlant(plantId, updates);
    });

    const updatedPlant = result.current.plants.find(p => p.id === plantId);
    expect(updatedPlant?.name).toBe('Updated Plant Name');
    expect(updatedPlant?.status).toBe('Warning');
  });

  it('should set and get active plant', () => {
    const { result } = renderHook(() => useGardenStore());

    // Add a plant first
    const newPlant: Omit<Plant, 'id'> = {
      name: 'Test Plant',
      status: 'Healthy',
    };

    let plantId: string;
    act(() => {
      plantId = result.current.addPlant(newPlant);
    });

    // Set active plant
    act(() => {
      result.current.setActivePlant(plantId);
    });

    expect(result.current.activePlant).not.toBeNull();
    expect(result.current.activePlant?.id).toBe(plantId);
  });

  it('should search plants by name', () => {
    const { result } = renderHook(() => useGardenStore());

    // Add multiple plants
    const plants = [
      { name: 'Monstera Deliciosa', status: 'Healthy' as const },
      { name: 'Fiddle Leaf Fig', status: 'Warning' as const },
      { name: 'Snake Plant', status: 'Critical' as const },
    ];

    act(() => {
      plants.forEach(plant => result.current.addPlant(plant));
    });

    // Search for plants
    const searchResults = result.current.searchPlants('Monstera');
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].name).toBe('Monstera Deliciosa');
  });

  it('should get plants by status', () => {
    const { result } = renderHook(() => useGardenStore());

    // Add plants with different statuses
    const plants = [
      { name: 'Healthy Plant 1', status: 'Healthy' as const },
      { name: 'Healthy Plant 2', status: 'Healthy' as const },
      { name: 'Warning Plant', status: 'Warning' as const },
      { name: 'Critical Plant', status: 'Critical' as const },
    ];

    act(() => {
      plants.forEach(plant => result.current.addPlant(plant));
    });

    const healthyPlants = result.current.getPlantsByStatus('Healthy');
    const warningPlants = result.current.getPlantsByStatus('Warning');
    const criticalPlants = result.current.getPlantsByStatus('Critical');

    expect(healthyPlants).toHaveLength(2);
    expect(warningPlants).toHaveLength(1);
    expect(criticalPlants).toHaveLength(1);
  });

  it('should calculate garden statistics', () => {
    const { result } = renderHook(() => useGardenStore());

    // Add plants with different statuses
    const plants = [
      { name: 'Plant 1', status: 'Healthy' as const },
      { name: 'Plant 2', status: 'Healthy' as const },
      { name: 'Plant 3', status: 'Warning' as const },
      { name: 'Plant 4', status: 'Critical' as const },
    ];

    act(() => {
      plants.forEach(plant => result.current.addPlant(plant));
    });

    const stats = result.current.getGardenStats();

    expect(stats.total).toBe(4);
    expect(stats.healthy).toBe(2);
    expect(stats.warning).toBe(1);
    expect(stats.critical).toBe(1);
    expect(stats.healthyPercentage).toBe(50);
  });

  it('should add plant from scan result', () => {
    const { result } = renderHook(() => useGardenStore());

    const scanResult = {
      plantName: 'Scanned Plant',
      confidence: 0.95,
      healthScore: 85,
      issues: [],
      recommendations: [],
    };

    act(() => {
      result.current.addPlantFromScan('https://example.com/image.jpg', scanResult);
    });

    expect(result.current.plants).toHaveLength(1);
    expect(result.current.plants[0].name).toBe('Scanned Plant');
    expect(result.current.plants[0].imageUrl).toBe('https://example.com/image.jpg');
  });

  it('should clear entire garden', () => {
    const { result } = renderHook(() => useGardenStore());

    // Add some plants first
    const plants = [
      { name: 'Plant 1', status: 'Healthy' as const },
      { name: 'Plant 2', status: 'Warning' as const },
    ];

    act(() => {
      plants.forEach(plant => result.current.addPlant(plant));
    });

    expect(result.current.plants).toHaveLength(2);

    // Clear garden
    act(() => {
      result.current.clearGarden();
    });

    expect(result.current.plants).toHaveLength(0);
    expect(result.current.activePlant).toBeNull();
  });

  it('should handle invalid plant operations gracefully', () => {
    const { result } = renderHook(() => useGardenStore());

    // Try to update non-existent plant
    act(() => {
      result.current.updatePlant('non-existent-id', { name: 'Updated' });
    });

    expect(result.current.plants).toHaveLength(0);

    // Try to remove non-existent plant
    act(() => {
      result.current.removePlant('non-existent-id');
    });

    expect(result.current.plants).toHaveLength(0);

    // Try to set non-existent active plant
    act(() => {
      result.current.setActivePlant('non-existent-id');
    });

    expect(result.current.activePlant).toBeNull();
  });
});