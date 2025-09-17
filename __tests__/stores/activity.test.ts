import { activityActions, useActivityStore } from '../../stores/activity';
import { ActivityKind, CreateActivityInput } from '../../types/activity';

const getState = () => useActivityStore.getState();

const makeActivityInput = (
  plantId: string,
  kind: ActivityKind,
  overrides: Partial<CreateActivityInput> = {}
): CreateActivityInput => ({
  plantId,
  kind,
  quantity: overrides.quantity,
  unit: overrides.unit,
  npk: overrides.npk,
  note: overrides.note,
  dateISO: overrides.dateISO ?? new Date().toISOString().slice(0, 10),
  time24: overrides.time24 ?? '10:00',
  confidence: overrides.confidence,
  source: overrides.source ?? 'user',
});

const addSampleActivity = (
  plantId: string,
  kind: ActivityKind,
  overrides: Partial<CreateActivityInput> = {}
) => {
  activityActions.addActivity(makeActivityInput(plantId, kind, overrides));
};

describe('Activity Store', () => {
  beforeEach(() => {
    activityActions.reset();
  });

  it('initializes with empty state', () => {
    const state = getState();
    expect(state.activities).toEqual({});
    expect(state.stats).toEqual({});
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('adds activities per plant and keeps most recent first', () => {
    addSampleActivity('11111111-1111-1111-1111-111111111111', 'รดน้ำ', { quantity: '200', unit: 'ml' });
    addSampleActivity('11111111-1111-1111-1111-111111111111', 'ใส่ปุ๋ย', { quantity: '5', unit: 'g' });

    const activities = getState().getActivities('11111111-1111-1111-1111-111111111111');
    expect(activities).toHaveLength(2);
    expect(activities[0].kind).toBe('ใส่ปุ๋ย');
    expect(activities[1].kind).toBe('รดน้ำ');
  });

  it('updates and deletes activities correctly', () => {
    const plantId = '22222222-2222-2222-2222-222222222222';
    addSampleActivity(plantId, 'รดน้ำ', { quantity: '250', unit: 'ml' });
    const [activity] = getState().getActivities(plantId);

    getState().updateActivity(plantId, activity.id, {
      quantity: '300',
      note: 'Updated watering amount',
    });

    let refreshed = getState().getActivities(plantId)[0];
    expect(refreshed.quantity).toBe('300');
    expect(refreshed.note).toBe('Updated watering amount');

    getState().deleteActivity(plantId, activity.id);
    refreshed = getState().getActivities(plantId)[0];
    expect(refreshed).toBeUndefined();
  });

  it('filters activities by date range', () => {
    const plantId = '33333333-3333-3333-3333-333333333333';
    addSampleActivity(plantId, 'รดน้ำ', { dateISO: '2025-01-10' });
    addSampleActivity(plantId, 'ใส่ปุ๋ย', { dateISO: '2025-01-15' });
    addSampleActivity(plantId, 'ตรวจใบ', { dateISO: '2025-01-20' });

    const filtered = getState().getFilteredActivities(plantId, {
      dateRange: {
        start: new Date('2025-01-12'),
        end: new Date('2025-01-18'),
      },
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].dateISO).toBe('2025-01-15');
  });

  it('calculates stats after adding activities', () => {
    const plantId = '44444444-4444-4444-4444-444444444444';
    addSampleActivity(plantId, 'รดน้ำ', { quantity: '250', unit: 'ml' });
    addSampleActivity(plantId, 'รดน้ำ', { quantity: '300', unit: 'ml' });
    addSampleActivity(plantId, 'ใส่ปุ๋ย', { quantity: '10', unit: 'g' });

    activityActions.calculateStats(plantId);
    const stats = getState().stats[plantId];
    expect(stats?.totalActivities).toBe(3);
    expect(stats?.byKind['รดน้ำ']).toBe(2);
    expect(stats?.byKind['ใส่ปุ๋ย']).toBe(1);
  });
});
