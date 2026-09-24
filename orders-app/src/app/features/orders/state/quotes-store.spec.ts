import { TestBed } from '@angular/core/testing';

import type { Quote } from '../models/quote';
import { QuotesStore } from './quotes-store';

function buildQuote(overrides: Partial<Quote>): Quote {
  return { symbol: 'BTCUSD', bid: 100, ask: 101, timestamp: 0, ...overrides };
}

describe('QuotesStore', () => {
  it('upsertQuotes adds new quotes and overwrites existing ones by symbol', () => {
    const store = TestBed.inject(QuotesStore);

    store.upsertQuotes([buildQuote({ symbol: 'BTCUSD', bid: 100 })]);
    store.upsertQuotes([buildQuote({ symbol: 'BTCUSD', bid: 110 }), buildQuote({ symbol: 'ETHUSD', bid: 5 })]);

    expect(store.quotes()).toEqual({
      BTCUSD: buildQuote({ symbol: 'BTCUSD', bid: 110 }),
      ETHUSD: buildQuote({ symbol: 'ETHUSD', bid: 5 }),
    });
  });

  it('removeQuotes deletes the given symbols and keeps the rest', () => {
    const store = TestBed.inject(QuotesStore);

    store.upsertQuotes([buildQuote({ symbol: 'BTCUSD' }), buildQuote({ symbol: 'ETHUSD' })]);
    store.removeQuotes(['BTCUSD']);

    expect(store.quotes()).toEqual({ ETHUSD: buildQuote({ symbol: 'ETHUSD' }) });
  });
});
