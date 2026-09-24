import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

import type { Quote } from '../models/quote';

interface QuotesState {
  readonly quotes: Record<string, Quote>;
}

const initialState: QuotesState = { quotes: {} };

export const QuotesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    upsertQuotes(quotes: readonly Quote[]): void {
      patchState(store, (state) => {
        const nextQuotes = { ...state.quotes };
        for (const quote of quotes) {
          nextQuotes[quote.symbol] = quote;
        }
        return { quotes: nextQuotes };
      });
    },
    removeQuotes(symbols: readonly string[]): void {
      patchState(store, (state) => {
        const nextQuotes = { ...state.quotes };
        for (const symbol of symbols) {
          delete nextQuotes[symbol];
        }
        return { quotes: nextQuotes };
      });
    },
  })),
);
