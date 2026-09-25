import type { Order } from '../models/order';

export function getUniqueSymbols(orders: readonly Order[]): string[] {
  return Array.from(new Set(orders.map((order) => order.symbol)));
}

export function compareSymbols(a: string, b: string): number {
  return a.localeCompare(b);
}
