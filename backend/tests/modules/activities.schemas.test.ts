import { describe, it, expect } from 'vitest';

import { createActivitySchema } from '../../src/modules/activities/activities.schemas';

describe('createActivitySchema', () => {
  it('requires NPK when kind is fertilizer', () => {
    expect(() =>
      createActivitySchema.parse({
        kind: 'ใส่ปุ๋ย',
        quantity: '100',
        unit: 'ml'
      })
    ).toThrowError(/NPK/);
  });

  it('rejects NPK when kind is not fertilizer', () => {
    expect(() =>
      createActivitySchema.parse({
        kind: 'รดน้ำ',
        quantity: '200',
        unit: 'ml',
        npk: { n: '10', p: '10', k: '10' }
      })
    ).toThrowError(/NPK/);
  });

  it('accepts valid fertilizer payload', () => {
    const payload = createActivitySchema.parse({
      kind: 'ใส่ปุ๋ย',
      quantity: '50',
      unit: 'g',
      npk: { n: '15', p: '5', k: '10' },
      note: 'test'
    });

    expect(payload.kind).toBe('ใส่ปุ๋ย');
  });
});
