import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MarketDataApi } from '@core/api/market-data-api';
import type { Order } from '../models/order';
import { OrdersStore } from './orders-store';

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

describe('OrdersStore', () => {
  function setup(marketDataApi: Partial<MarketDataApi>) {
    TestBed.configureTestingModule({
      providers: [{ provide: MarketDataApi, useValue: marketDataApi }],
    });
    return TestBed.inject(OrdersStore);
  }

  it('loads orders and captures the initial available symbols', () => {
    const orders = [
      buildOrder({ id: 1, symbol: 'BTCUSD' }),
      buildOrder({ id: 2, symbol: 'ETHUSD' }),
    ];
    const store = setup({ getOrders: () => of(orders) });

    store.load();

    expect(store.callStatus()).toBe('loaded');
    expect(store.entities()).toEqual(orders);
    expect(store.availableSymbols()).toEqual(['BTCUSD', 'ETHUSD']);
  });

  it('sorts available symbols alphabetically', () => {
    const orders = [
      buildOrder({ id: 1, symbol: 'ETHUSD' }),
      buildOrder({ id: 2, symbol: 'AAPL.US' }),
      buildOrder({ id: 3, symbol: 'BTCUSD' }),
    ];
    const store = setup({ getOrders: () => of(orders) });

    store.load();

    expect(store.availableSymbols()).toEqual(['AAPL.US', 'BTCUSD', 'ETHUSD']);
  });

  it('sets an error status when loading fails', () => {
    const store = setup({ getOrders: () => throwError(() => new Error('boom')) });

    store.load();

    expect(store.callStatus()).toBe('error');
    expect(store.entities()).toEqual([]);
  });

  it('addOrder assigns the next id after the current maximum', () => {
    const store = setup({ getOrders: () => of([buildOrder({ id: 1 }), buildOrder({ id: 5 })]) });
    store.load();

    const created = store.addOrder({
      symbol: 'ETHUSD',
      side: 'SELL',
      size: 1,
      openPrice: 10,
      openTime: 0,
      swap: 0,
    });

    expect(created).toEqual({
      id: 6,
      symbol: 'ETHUSD',
      side: 'SELL',
      size: 1,
      openPrice: 10,
      openTime: 0,
      swap: 0,
    });
    expect(store.entities().at(-1)).toEqual(created);
  });

  it('addOrder assigns id 1 to the first order in an empty store', () => {
    const store = setup({ getOrders: () => of([]) });
    store.load();

    store.addOrder({ symbol: 'BTCUSD', side: 'BUY', size: 1, openPrice: 10, openTime: 0, swap: 0 });

    expect(store.entities()[0].id).toBe(1);
  });

  it('removeOrder removes a single order', () => {
    const store = setup({ getOrders: () => of([buildOrder({ id: 1 }), buildOrder({ id: 2 })]) });
    store.load();

    store.removeOrder(1);

    expect(store.entities().map((order) => order.id)).toEqual([2]);
  });

  it('removeGroup removes every order for a symbol and clears it from expandedSymbols', () => {
    const store = setup({
      getOrders: () =>
        of([
          buildOrder({ id: 1, symbol: 'BTCUSD' }),
          buildOrder({ id: 2, symbol: 'BTCUSD' }),
          buildOrder({ id: 3, symbol: 'ETHUSD' }),
        ]),
    });
    store.load();
    store.toggleGroup('BTCUSD');

    const removedIds = store.removeGroup('BTCUSD');

    expect(store.entities().map((order) => order.symbol)).toEqual(['ETHUSD']);
    expect(store.expandedSymbols()).toEqual([]);
    expect(removedIds).toEqual([1, 2]);
  });

  it('removeGroup does not shrink availableSymbols', () => {
    const store = setup({
      getOrders: () =>
        of([buildOrder({ id: 1, symbol: 'BTCUSD' }), buildOrder({ id: 2, symbol: 'ETHUSD' })]),
    });
    store.load();

    store.removeGroup('BTCUSD');

    expect(store.availableSymbols()).toEqual(['BTCUSD', 'ETHUSD']);
  });

  it('toggleGroup expands and collapses a symbol', () => {
    const store = setup({ getOrders: () => of([]) });

    store.toggleGroup('BTCUSD');
    expect(store.expandedSymbols()).toEqual(['BTCUSD']);

    store.toggleGroup('BTCUSD');
    expect(store.expandedSymbols()).toEqual([]);
  });
});
