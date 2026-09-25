import type { Order } from '../models/order';
import { groupOrdersBySymbol } from './group-orders-by-symbol';

function buildOrder(overrides: Partial<Order>): Order {
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

describe('groupOrdersBySymbol', () => {
  it('groups orders by symbol, preserving first-appearance order', () => {
    const orders = [
      buildOrder({ id: 1, symbol: 'ETHUSD' }),
      buildOrder({ id: 2, symbol: 'BTCUSD' }),
      buildOrder({ id: 3, symbol: 'ETHUSD' }),
    ];

    expect(groupOrdersBySymbol(orders)).toEqual([
      { symbol: 'ETHUSD', orders: [orders[0], orders[2]] },
      { symbol: 'BTCUSD', orders: [orders[1]] },
    ]);
  });

  it('returns an empty array for no orders', () => {
    expect(groupOrdersBySymbol([])).toEqual([]);
  });
});
