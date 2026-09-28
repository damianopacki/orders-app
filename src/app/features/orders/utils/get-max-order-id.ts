import type { Order } from '../models/order';

const NO_ORDER_ID = 0;

export function getMaxOrderId(orders: readonly Order[]): number {
  return orders.reduce((maxId, order) => Math.max(maxId, order.id), NO_ORDER_ID);
}
