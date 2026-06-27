import type { Order } from '@repo/shared-types';

export const DEFAULT_RETURN_WINDOW_DAYS = 30;

export function computeReturnEligibility(
  order: Order,
  windowDays = DEFAULT_RETURN_WINDOW_DAYS,
): { isDelivered: boolean; isWithinWindow: boolean; remainingDays: number } {
  const isDelivered = order.status === 'DELIVERED';
  const cutoff = new Date(order.createdAt).getTime() + windowDays * 24 * 60 * 60 * 1000;
  const remainingMs = Math.max(0, cutoff - Date.now());
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  return { isDelivered, isWithinWindow: cutoff >= Date.now(), remainingDays };
}

export function isOrderReturnable(order: Order, windowDays = DEFAULT_RETURN_WINDOW_DAYS): boolean {
  const { isDelivered, isWithinWindow } = computeReturnEligibility(order, windowDays);
  return isDelivered && isWithinWindow;
}
