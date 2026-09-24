import type { OrderSide } from '../models/order';

export function getSideMultiplier(side: OrderSide): number {
  return side === 'BUY' ? 1 : -1;
}
