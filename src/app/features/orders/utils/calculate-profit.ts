import type { Order } from '../models/order';
import { getSideMultiplier } from './get-side-multiplier';

export function calculateProfit(
  order: Order,
  bid: number | undefined,
  contractSize: number | undefined,
): number | null {
  if (bid === undefined || contractSize === undefined) {
    return null;
  }

  return (bid - order.openPrice) * order.size * contractSize * getSideMultiplier(order.side);
}
