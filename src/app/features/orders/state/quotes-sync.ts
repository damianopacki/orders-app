import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { QuotesSocket } from '@orders/data/quotes-socket';
import { diffSymbols } from '@orders/utils/diff-symbols';

import { OrdersStore } from './orders-store';
import { QuotesStore } from './quotes-store';

export function startQuotesSync(): void {
  const ordersStore = inject(OrdersStore);
  const quotesStore = inject(QuotesStore);
  const quotesSocket = inject(QuotesSocket);
  const destroyRef = inject(DestroyRef);

  let previousSymbols: readonly string[] = [];

  // Every symbol the add-order form can pick, not just ones with open orders — so the
  // form can prefill the current price even after a symbol's last order was closed.
  // Open orders can only use these symbols, so their profits stay covered too.
  toObservable(ordersStore.availableSymbols)
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
