import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { QuotesSocket } from '@core/websocket/quotes-socket';
import { diffSymbols } from '@utils/diff-symbols';

import { OrdersStore } from './orders-store';
import { QuotesStore } from './quotes-store';

export function startQuotesSync(): void {
  const ordersStore = inject(OrdersStore);
  const quotesStore = inject(QuotesStore);
  const quotesSocket = inject(QuotesSocket);
  const destroyRef = inject(DestroyRef);

  let previousSymbols: readonly string[] = [];

  toObservable(ordersStore.activeSymbols)
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe((currentSymbols) => {
      const { added, removed } = diffSymbols(previousSymbols, currentSymbols);
      previousSymbols = currentSymbols;

      if (added.length > 0) {
        quotesSocket.subscribeToSymbols(added);
      }
      if (removed.length > 0) {
        quotesSocket.unsubscribeFromSymbols(removed);
        quotesStore.removeQuotes(removed);
      }
    });

  quotesSocket.quotes$.pipe(takeUntilDestroyed(destroyRef)).subscribe((quotes) => {
    quotesStore.upsertQuotes(quotes);
  });
}
