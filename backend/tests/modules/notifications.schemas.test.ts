import { describe, expect, it } from 'vitest';

import { markReadSchema, subscribeSchema } from '../../src/modules/notifications/notifications.schemas';

describe('notifications schemas', () => {
  it('requires at least one id to mark read', () => {
    expect(() => markReadSchema.parse({ ids: [] })).toThrowError();
  });

  it('validates subscription payload', () => {
    const result = subscribeSchema.parse({
      deviceId: 'device-123',
      pushToken: 'expoPushToken1234567890',
      platform: 'expo'
    });
    expect(result.deviceId).toBe('device-123');
  });
});
