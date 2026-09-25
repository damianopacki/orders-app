import type { Order } from '../models/order';
import { summarizeGroup } from './summarize-group';

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

describe('summarizeGroup', () => {
  it('sums size/swap, averages openPrice and sums defined profits', () => {
    const orders = [
      buildOrder({ size: 0.1, openPrice: 100, swap: -1 }),
      buildOrder({ size: 0.2, openPrice: 200, swap: -2 }),
    ];

    const summary = summarizeGroup(orders, [10, 20]);

    expect(summary).toEqual({
      orderCount: 2,
      totalSize: 0.30000000000000004,
      totalSwap: -3,
      averageOpenPrice: 150,
      totalProfit: 30,
    });
  });

  it('treats null profits as absent, summing only defined ones', () => {
    const orders = [buildOrder({}), buildOrder({})];

    const summary = summarizeGroup(orders, [10, null]);

    expect(summary.totalProfit).toBe(10);
  });

  it('returns null total profit only when every order lacks a profit', () => {
    const orders = [buildOrder({}), buildOrder({})];

    const summary = summarizeGroup(orders, [null, null]);

    expect(summary.totalProfit).toBeNull();
  });

  it('summarizes a single-order group', () => {
    const orders = [buildOrder({ size: 1, openPrice: 50, swap: 0.5 })];

    const summary = summarizeGroup(orders, [5]);

    expect(summary).toEqual({
      orderCount: 1,
      totalSize: 1,
      totalSwap: 0.5,
      averageOpenPrice: 50,
      totalProfit: 5,
    });
  });

  it('returns a zeroed summary for an empty group', () => {
    expect(summarizeGroup([], [])).toEqual({
      orderCount: 0,
      totalSize: 0,
      totalSwap: 0,
      averageOpenPrice: 0,
      totalProfit: null,
    });
  });
});
