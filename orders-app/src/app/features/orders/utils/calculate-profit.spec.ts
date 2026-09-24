import type { Order } from '../models/order';
import { calculateProfit } from './calculate-profit';

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 1,
    symbol: 'BTCUSD',
    side: 'BUY',
    size: 0.1,
    openPrice: 100,
    openTime: 0,
    swap: 0,
    ...overrides,
  };
}

describe('calculateProfit', () => {
  it('computes profit for a BUY order', () => {
    const order = buildOrder({ side: 'BUY', size: 0.1, openPrice: 100 });

    expect(calculateProfit(order, 110, 10)).toBeCloseTo(10);
  });

  it('computes profit for a SELL order (inverted sign)', () => {
    const order = buildOrder({ side: 'SELL', size: 0.1, openPrice: 100 });

    expect(calculateProfit(order, 90, 10)).toBeCloseTo(10);
  });

  it('returns null when there is no quote', () => {
    const order = buildOrder();

    expect(calculateProfit(order, undefined, 10)).toBeNull();
  });

  it('returns null when there is no contract size', () => {
    const order = buildOrder();

    expect(calculateProfit(order, 110, undefined)).toBeNull();
  });
});
