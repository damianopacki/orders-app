import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { QuotesSocket } from '@core/websocket/quotes-socket';

import { OrdersStore } from './orders-store';
import { QuotesStore } from './quotes-store';
import { startQuotesSync } from './quotes-sync';

describe('startQuotesSync', () => {
  function setup() {
    const activeSymbols = signal<string[]>([]);
    const upsertQuotes = vi.fn();
    const removeQuotes = vi.fn();
    const subscribeToSymbols = vi.fn();
    const unsubscribeFromSymbols = vi.fn();
    const quotes$ = new Subject<{ symbol: string; bid: number; ask: number; timestamp: number }[]>();

    TestBed.configureTestingModule({
      providers: [
        { provide: OrdersStore, useValue: { activeSymbols } },
        { provide: QuotesStore, useValue: { upsertQuotes, removeQuotes } },
        { provide: QuotesSocket, useValue: { subscribeToSymbols, unsubscribeFromSymbols, quotes$ } },
      ],
    });

    TestBed.runInInjectionContext(() => startQuotesSync());

    return { activeSymbols, upsertQuotes, removeQuotes, subscribeToSymbols, unsubscribeFromSymbols, quotes$ };
  }

  it('subscribes to symbols that become active', () => {
    const { activeSymbols, subscribeToSymbols } = setup();

    activeSymbols.set(['BTCUSD', 'ETHUSD']);
    TestBed.tick();

    expect(subscribeToSymbols).toHaveBeenCalledWith(['BTCUSD', 'ETHUSD']);
  });

  it('unsubscribes and clears quotes for symbols that are no longer active', () => {
    const { activeSymbols, unsubscribeFromSymbols, removeQuotes } = setup();

    activeSymbols.set(['BTCUSD', 'ETHUSD']);
    TestBed.tick();

    activeSymbols.set(['ETHUSD']);
    TestBed.tick();

    expect(unsubscribeFromSymbols).toHaveBeenCalledWith(['BTCUSD']);
    expect(removeQuotes).toHaveBeenCalledWith(['BTCUSD']);
  });

  it('does not resubscribe to symbols that were already active', () => {
    const { activeSymbols, subscribeToSymbols } = setup();

    activeSymbols.set(['BTCUSD']);
    TestBed.tick();
    activeSymbols.set(['BTCUSD']);
    TestBed.tick();

    expect(subscribeToSymbols).toHaveBeenCalledTimes(1);
  });

  it('forwards incoming quotes to the QuotesStore', () => {
    const { quotes$, upsertQuotes } = setup();
    const quotes = [{ symbol: 'BTCUSD', bid: 100, ask: 101, timestamp: 0 }];

    quotes$.next(quotes);

    expect(upsertQuotes).toHaveBeenCalledWith(quotes);
  });
});
