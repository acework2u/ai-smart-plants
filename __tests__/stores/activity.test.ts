import { act, renderHook } from '@testing-library/react-native';
import { useActivityStore } from '../../stores/activity';
import { ActivityEntry } from '../../types/activity';

describe('Activity Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useActivityStore());
    act(() => {
      result.current.clearAllActivities();
    });
  });

  it('should initialize with empty activities', () => {
    const { result } = renderHook(() => useActivityStore());

    expect(result.current.activities).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should add watering activity', () => {
    const { result } = renderHook(() => useActivityStore());

    const activityData = {
      plantId: 'plant-1',
      kind: 'รดน้ำ' as const,
      quantity: '250',
      unit: 'ml' as const,
      note: 'Regular watering',
    };

    let activityId: string;
    act(() => {
      activityId = result.current.addActivity(activityData);
    });

    expect(result.current.activities).toHaveLength(1);
    expect(result.current.activities[0].kind).toBe('รดน้ำ');
    expect(result.current.activities[0].quantity).toBe('250');
    expect(result.current.activities[0].unit).toBe('ml');
    expect(result.current.activities[0].id).toBe(activityId);
  });

  it('should add fertilizing activity with NPK values', () => {
    const { result } = renderHook(() => useActivityStore());

    const activityData = {
      plantId: 'plant-1',
      kind: 'ใส่ปุ๋ย' as const,
      quantity: '5',
      unit: 'g' as const,
      npk: { n: '10', p: '10', k: '10' },
      note: 'Monthly fertilizing',
    };

    act(() => {
      result.current.addActivity(activityData);
    });

    const activity = result.current.activities[0];
    expect(activity.kind).toBe('ใส่ปุ๋ย');
    expect(activity.npk).toEqual({ n: '10', p: '10', k: '10' });
  });

  it('should get activities by plant ID', () => {
    const { result } = renderHook(() => useActivityStore());

    // Add activities for different plants
    const activities = [
      { plantId: 'plant-1', kind: 'รดน้ำ' as const },
      { plantId: 'plant-1', kind: 'ใส่ปุ๋ย' as const },
      { plantId: 'plant-2', kind: 'รดน้ำ' as const },
      { plantId: 'plant-2', kind: 'ตรวจใบ' as const },
    ];

    act(() => {
      activities.forEach(activity => result.current.addActivity(activity));
    });

    const plant1Activities = result.current.getActivitiesByPlant('plant-1');
    const plant2Activities = result.current.getActivitiesByPlant('plant-2');

    expect(plant1Activities).toHaveLength(2);
    expect(plant2Activities).toHaveLength(2);
    expect(plant1Activities.every(a => a.plantId === 'plant-1')).toBe(true);
    expect(plant2Activities.every(a => a.plantId === 'plant-2')).toBe(true);
  });

  it('should get recent activities', () => {
    const { result } = renderHook(() => useActivityStore());

    // Mock current date
    const now = new Date('2025-01-15T10:00:00.000Z');
    const yesterday = new Date('2025-01-14T10:00:00.000Z');
    const lastWeek = new Date('2025-01-08T10:00:00.000Z');

    // Add activities with different dates
    const activities = [
      {
        plantId: 'plant-1',
        kind: 'รดน้ำ' as const,
        dateISO: now.toISOString().split('T')[0]
      },
      {
        plantId: 'plant-1',
        kind: 'ใส่ปุ๋ย' as const,
        dateISO: yesterday.toISOString().split('T')[0]
      },
      {
        plantId: 'plant-1',
        kind: 'ตรวจใบ' as const,
        dateISO: lastWeek.toISOString().split('T')[0]
      },
    ];

    act(() => {
      activities.forEach(activity => result.current.addActivity(activity));
    });

    const recentActivities = result.current.getRecentActivities(2);
    expect(recentActivities).toHaveLength(2);

    // Should be sorted by date (most recent first)
    expect(recentActivities[0].dateISO).toBe(now.toISOString().split('T')[0]);
    expect(recentActivities[1].dateISO).toBe(yesterday.toISOString().split('T')[0]);
  });

  it('should get activities by type', () => {
    const { result } = renderHook(() => useActivityStore());

    const activities = [
      { plantId: 'plant-1', kind: 'รดน้ำ' as const },
      { plantId: 'plant-2', kind: 'รดน้ำ' as const },
      { plantId: 'plant-1', kind: 'ใส่ปุ๋ย' as const },
      { plantId: 'plant-2', kind: 'ตรวจใบ' as const },
    ];

    act(() => {
      activities.forEach(activity => result.current.addActivity(activity));
    });

    const wateringActivities = result.current.getActivitiesByType('รดน้ำ');
    const fertilizingActivities = result.current.getActivitiesByType('ใส่ปุ๋ย');
    const checkingActivities = result.current.getActivitiesByType('ตรวจใบ');

    expect(wateringActivities).toHaveLength(2);
    expect(fertilizingActivities).toHaveLength(1);
    expect(checkingActivities).toHaveLength(1);
  });

  it('should calculate activity statistics', () => {
    const { result } = renderHook(() => useActivityStore());

    const activities = [
      { plantId: 'plant-1', kind: 'รดน้ำ' as const, quantity: '250', unit: 'ml' as const },
      { plantId: 'plant-1', kind: 'รดน้ำ' as const, quantity: '300', unit: 'ml' as const },
      { plantId: 'plant-1', kind: 'ใส่ปุ๋ย' as const, quantity: '5', unit: 'g' as const },
      { plantId: 'plant-1', kind: 'ตรวจใบ' as const },
    ];

    act(() => {
      activities.forEach(activity => result.current.addActivity(activity));
    });

    const stats = result.current.getActivityStats('plant-1');

    expect(stats.totalActivities).toBe(4);
    expect(stats.wateringCount).toBe(2);
    expect(stats.fertilizingCount).toBe(1);
    expect(stats.totalWaterAmount).toBe(550); // 250 + 300
    expect(stats.averageWaterAmount).toBe(275); // 550 / 2
  });

  it('should update activity', () => {
    const { result } = renderHook(() => useActivityStore());

    let activityId: string;
    act(() => {
      activityId = result.current.addActivity({
        plantId: 'plant-1',
        kind: 'รดน้ำ',
        quantity: '250',
        unit: 'ml',
      });
    });

    act(() => {
      result.current.updateActivity(activityId, {
        quantity: '300',
        note: 'Updated watering amount',
      });
    });

    const updatedActivity = result.current.activities.find(a => a.id === activityId);
    expect(updatedActivity?.quantity).toBe('300');
    expect(updatedActivity?.note).toBe('Updated watering amount');
  });

  it('should delete activity', () => {
    const { result } = renderHook(() => useActivityStore());

    let activityId: string;
    act(() => {
      activityId = result.current.addActivity({
        plantId: 'plant-1',
        kind: 'รดน้ำ',
      });
    });

    expect(result.current.activities).toHaveLength(1);

    act(() => {
      result.current.deleteActivity(activityId);
    });

    expect(result.current.activities).toHaveLength(0);
  });

  it('should handle Thai units correctly', () => {
    const { result } = renderHook(() => useActivityStore());

    const activities = [
      { plantId: 'plant-1', kind: 'รดน้ำ' as const, quantity: '1', unit: 'ล.' as const },
      { plantId: 'plant-1', kind: 'รดน้ำ' as const, quantity: '500', unit: 'ml' as const },
      { plantId: 'plant-1', kind: 'ใส่ปุ๋ย' as const, quantity: '10', unit: 'g' as const },
      { plantId: 'plant-1', kind: 'พ่นยา' as const, quantity: '2', unit: 'pcs' as const },
    ];

    act(() => {
      activities.forEach(activity => result.current.addActivity(activity));
    });

    // Check that all activities are stored with correct units
    const storedActivities = result.current.getActivitiesByPlant('plant-1');

    expect(storedActivities.find(a => a.unit === 'ล.')).toBeDefined();
    expect(storedActivities.find(a => a.unit === 'ml')).toBeDefined();
    expect(storedActivities.find(a => a.unit === 'g')).toBeDefined();
    expect(storedActivities.find(a => a.unit === 'pcs')).toBeDefined();
  });

  it('should filter activities by date range', () => {
    const { result } = renderHook(() => useActivityStore());

    const activities = [
      {
        plantId: 'plant-1',
        kind: 'รดน้ำ' as const,
        dateISO: '2025-01-10'
      },
      {
        plantId: 'plant-1',
        kind: 'ใส่ปุ๋ย' as const,
        dateISO: '2025-01-15'
      },
      {
        plantId: 'plant-1',
        kind: 'ตรวจใบ' as const,
        dateISO: '2025-01-20'
      },
    ];

    act(() => {
      activities.forEach(activity => result.current.addActivity(activity));
    });

    const filteredActivities = result.current.getActivitiesByDateRange(
      '2025-01-12',
      '2025-01-18'
    );

    expect(filteredActivities).toHaveLength(1);
    expect(filteredActivities[0].dateISO).toBe('2025-01-15');
  });

  it('should clear all activities', () => {
    const { result } = renderHook(() => useActivityStore());

    // Add some activities
    const activities = [
      { plantId: 'plant-1', kind: 'รดน้ำ' as const },
      { plantId: 'plant-2', kind: 'ใส่ปุ๋ย' as const },
    ];

    act(() => {
      activities.forEach(activity => result.current.addActivity(activity));
    });

    expect(result.current.activities).toHaveLength(2);

    act(() => {
      result.current.clearAllActivities();
    });

    expect(result.current.activities).toHaveLength(0);
  });
});