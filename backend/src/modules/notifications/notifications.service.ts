import { Prisma, NotificationType } from '@prisma/client';

import { prisma } from '@config/prisma';
import { HttpError } from '@middleware/errorHandler';
import type {
  ListNotificationsQueryInput,
  MarkReadInput,
  SubscribeInput
} from './notifications.schemas';

const serializeNotification = (notification: Prisma.NotificationGetPayload<{}>) => ({
  ...notification,
  payload: notification.payload as Record<string, unknown> | null
});

const serializeSubscription = (
  subscription: Prisma.NotificationSubscriptionGetPayload<{}>
) => subscription;

export const listNotifications = async (
  userId: string,
  query: ListNotificationsQueryInput
) => {
  const { type, unread, updatedSince, limit = 50, cursor } = query;

  const where: Prisma.NotificationWhereInput = {
    userId
  };

  if (type) {
    where.type = type as NotificationType;
  }

  if (typeof unread === 'boolean') {
    where.read = unread ? false : true;
  }

  if (updatedSince) {
    where.updatedAt = { gte: new Date(updatedSince) };
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined
  });

  const hasNextPage = notifications.length > limit;
  const nodesRaw = hasNextPage ? notifications.slice(0, -1) : notifications;

  return {
    nodes: nodesRaw.map(serializeNotification),
    pageInfo: {
      hasNextPage,
      nextCursor: hasNextPage ? nodesRaw[nodesRaw.length - 1].id : null
    }
  };
};

export const markNotificationsRead = async (userId: string, payload: MarkReadInput) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      id: { in: payload.ids }
    },
    data: { read: true }
  });

  return { updated: result.count };
};

export const subscribeNotification = async (userId: string, payload: SubscribeInput) => {
  const subscription = await prisma.notificationSubscription.upsert({
    where: {
      userId_deviceId: { userId, deviceId: payload.deviceId }
    },
    create: {
      userId,
      deviceId: payload.deviceId,
      pushToken: payload.pushToken,
      platform: payload.platform ?? 'expo',
      locale: payload.locale ?? 'th'
    },
    update: {
      pushToken: payload.pushToken,
      platform: payload.platform ?? 'expo',
      locale: payload.locale ?? 'th'
    }
  });

  return serializeSubscription(subscription);
};

export const unsubscribeNotification = async (userId: string, subscriptionId: string) => {
  const subscription = await prisma.notificationSubscription.findFirst({
    where: { id: subscriptionId, userId }
  });

  if (!subscription) {
    throw new HttpError(404, {
      code: 'notifications/subscription-not-found',
      message: 'Subscription not found'
    });
  }

  await prisma.notificationSubscription.delete({ where: { id: subscriptionId } });
  return { success: true };
};

export const listSubscriptions = async (userId: string) => {
  const subscriptions = await prisma.notificationSubscription.findMany({ where: { userId } });
  return subscriptions.map(serializeSubscription);
};

export const __test__ = {
  serializeNotification
};
