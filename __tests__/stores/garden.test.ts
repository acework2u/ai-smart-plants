import { gardenActions, useGardenStore } from '../../stores/garden';
import { CreatePlantInput } from '../../types/garden';

const getState = () => useGardenStore.getState();

const makePlantInput = (overrides: Partial<CreatePlantInput> = {}): CreatePlantInput => ({
  name: overrides.name ?? 'Test Plant',
  status: overrides.status ?? 'Healthy',
  scientificName: overrides.scientificName,
  description: overrides.description,
  imageUrl: overrides.imageUrl,
  humidityPreference: overrides.humidityPreference,
  lightPreference: overrides.lightPreference,
  wateringFrequency: overrides.wateringFrequency,
});

describe('Garden Store', () => {
  beforeEach(() => {
    gardenActions.reset();
  });

  it('initializes with empty garden', () => {
    const state = getState();
    expect(state.plants).toEqual([]);
    expect(state.selectedPlant).toBeNull();
    expect(state.filter).toBe('all');
  });

  it('adds, updates, and removes plants', () => {
    gardenActions.addPlant(makePlantInput({ name: 'Monstera' }));
    const [plant] = getState().plants;
    expect(plant.name).toBe('Monstera');

    gardenActions.updatePlant(plant.id, { status: 'Warning' });
    const updated = getState().plants.find(p => p.id === plant.id);
    expect(updated?.status).toBe('Warning');

    gardenActions.deletePlant(plant.id);
    expect(getState().plants).toHaveLength(0);
  });

  it('selects active plant and updates stats', () => {
    gardenActions.addPlant(makePlantInput({ name: 'Healthy Plant', status: 'Healthy' }));
    gardenActions.addPlant(makePlantInput({ name: 'Alert Plant', status: 'Warning' }));

    const firstPlant = getState().plants[0];
    gardenActions.selectPlant(firstPlant.id);
    expect(getState().selectedPlant?.id).toBe(firstPlant.id);

    const stats = getState().stats;
    expect(stats?.totalPlants).toBe(2);
    expect(stats?.healthyCount).toBe(1);
    expect(stats?.warningCount).toBe(1);
  });

  it('searches plants by name fragment', () => {
    gardenActions.addPlant(makePlantInput({ name: 'Monstera Deliciosa' }));
    gardenActions.addPlant(makePlantInput({ name: 'Snake Plant' }));

    const results = getState().searchPlants('monstera');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Monstera Deliciosa');
  });
});
