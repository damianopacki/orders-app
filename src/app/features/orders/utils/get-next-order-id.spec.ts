import type { Order } from '../models/order';
import { getNextOrderId } from './get-next-order-id';

function buildOrder(id: number): Order {
  return { id, symbol: 'BTCUSD', side: 'BUY', size: 0.1, openPrice: 100, openTime: 0, swap: 0 };
}

describe('getNextOrderId', () => {
  it('returns the id after the current maximum', () => {
    expect(getNextOrderId([buildOrder(3), buildOrder(7), buildOrder(5)])).toBe(8);
  });

  it('returns 1 for no orders', () => {
    expect(getNextOrderId([])).toBe(1);
  });
});
