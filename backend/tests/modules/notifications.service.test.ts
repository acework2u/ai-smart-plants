import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  listNotifications,
  markNotificationsRead,
  subscribeNotification,
  unsubscribeNotification,
  listSubscriptions
} from '../../src/modules/notifications/notifications.service';

const mockNotificationFindMany = vi.fn();
const mockNotificationUpdateMany = vi.fn();
const mockSubscriptionUpsert = vi.fn();
const mockSubscriptionFindMany = vi.fn();
const mockSubscriptionFindFirst = vi.fn();
const mockSubscriptionDelete = vi.fn();

vi.mock('../../src/config/prisma', () => ({
  prisma: {
    notification: {
      findMany: mockNotificationFindMany,
      updateMany: mockNotificationUpdateMany
    },
    notificationSubscription: {
      upsert: mockSubscriptionUpsert,
      findMany: mockSubscriptionFindMany,
      findFirst: mockSubscriptionFindFirst,
      delete: mockSubscriptionDelete
    }
  }
}));

describe('notifications.service', () => {
  const baseNotification = {
    id: 'n1',
    userId: 'u1',
    plantId: null,
    type: 'reminder',
    title: 'Water plant',
    detail: null,
    timeLabel: 'วันนี้',
    read: false,
    payload: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists notifications', async () => {
    mockNotificationFindMany.mockResolvedValue([baseNotification]);
    const result = await listNotifications('u1', {});
    expect(mockNotificationFindMany).toHaveBeenCalled();
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].title).toBe('Water plant');
  });

  it('marks notifications as read', async () => {
    mockNotificationUpdateMany.mockResolvedValue({ count: 2 });
    const result = await markNotificationsRead('u1', { ids: ['n1', 'n2'] });
    expect(result.updated).toBe(2);
  });

  it('subscribes and upserts token', async () => {
    mockSubscriptionUpsert.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      deviceId: 'd1',
      pushToken: 'expoPushToken123',
      platform: 'expo',
      locale: 'th',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const result = await subscribeNotification('u1', {
      deviceId: 'd1',
      pushToken: 'expoPushToken123'
    });

    expect(mockSubscriptionUpsert).toHaveBeenCalled();
    expect(result.deviceId).toBe('d1');
  });

  it('unsubscribes existing token', async () => {
    mockSubscriptionFindFirst.mockResolvedValue({ id: 's1', userId: 'u1' });
    mockSubscriptionDelete.mockResolvedValue({});

    const result = await unsubscribeNotification('u1', 's1');
    expect(result.success).toBe(true);
  });

  it('lists subscriptions', async () => {
    mockSubscriptionFindMany.mockResolvedValue([{ id: 's1', userId: 'u1', deviceId: 'd1' }]);
    const result = await listSubscriptions('u1');
    expect(result).toHaveLength(1);
  });
});
