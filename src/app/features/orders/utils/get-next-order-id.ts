import type { Order } from '../models/order';

export function getNextOrderId(orders: readonly Order[]): number {
  return Math.max(0, ...orders.map((order) => order.id)) + 1;
}
