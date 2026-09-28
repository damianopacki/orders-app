import type { Order } from '../models/order';
import { getMaxOrderId } from './get-max-order-id';

function buildOrder(id: number): Order {
  return { id, symbol: 'BTCUSD', side: 'BUY', size: 0.1, openPrice: 100, openTime: 0, swap: 0 };
}

describe('getMaxOrderId', () => {
  it('returns the highest id', () => {
    expect(getMaxOrderId([buildOrder(3), buildOrder(7), buildOrder(5)])).toBe(7);
  });

  it('returns 0 for no orders', () => {
    expect(getMaxOrderId([])).toBe(0);
  });
});
