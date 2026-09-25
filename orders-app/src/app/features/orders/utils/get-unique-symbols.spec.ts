import type { Order } from '../models/order';
import { compareSymbols, getUniqueSymbols } from './get-unique-symbols';

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

describe('getUniqueSymbols', () => {
  it('returns each symbol once, preserving first-appearance order', () => {
    const orders = [
      buildOrder({ id: 1, symbol: 'ETHUSD' }),
      buildOrder({ id: 2, symbol: 'BTCUSD' }),
      buildOrder({ id: 3, symbol: 'ETHUSD' }),
    ];

    expect(getUniqueSymbols(orders)).toEqual(['ETHUSD', 'BTCUSD']);
  });

  it('returns an empty array for no orders', () => {
    expect(getUniqueSymbols([])).toEqual([]);
  });
});

describe('compareSymbols', () => {
  it('sorts symbols alphabetically', () => {
    expect(['ETHUSD', 'AAPL.US', 'BTCUSD'].sort(compareSymbols)).toEqual([
      'AAPL.US',
      'BTCUSD',
      'ETHUSD',
    ]);
  });
});
