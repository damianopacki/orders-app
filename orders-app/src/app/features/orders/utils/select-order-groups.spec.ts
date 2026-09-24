import type { Order } from '../models/order';
import type { Quote } from '../models/quote';
import { selectOrderGroups } from './select-order-groups';

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

function buildQuote(overrides: Partial<Quote>): Quote {
  return { symbol: 'BTCUSD', bid: 100, ask: 100, timestamp: 0, ...overrides };
}

describe('selectOrderGroups', () => {
  it('builds a group view model with rows, profits and the expanded flag', () => {
    const orders = [
      buildOrder({ id: 1, symbol: 'BTCUSD', openPrice: 100 }),
      buildOrder({ id: 2, symbol: 'ETHUSD', openPrice: 200 }),
    ];
    const quotesBySymbol = { BTCUSD: buildQuote({ symbol: 'BTCUSD', bid: 110 }) };
    const contractSizeBySymbol = { BTCUSD: 10, ETHUSD: 1 };

    const groups = selectOrderGroups(orders, quotesBySymbol, contractSizeBySymbol, ['BTCUSD']);

    expect(groups).toEqual([
      {
        symbol: 'BTCUSD',
        summary: {
          orderCount: 1,
          totalSize: 0.1,
          totalSwap: 0,
          averageOpenPrice: 100,
          totalProfit: 10,
        },
        expanded: true,
        rows: [{ order: orders[0], profit: 10 }],
      },
      {
        symbol: 'ETHUSD',
        summary: {
          orderCount: 1,
          totalSize: 0.1,
          totalSwap: 0,
          averageOpenPrice: 200,
          totalProfit: null,
        },
        expanded: false,
        rows: [{ order: orders[1], profit: null }],
      },
    ]);
  });

  it('returns an empty array when there are no orders', () => {
    expect(selectOrderGroups([], {}, {}, [])).toEqual([]);
  });
});
