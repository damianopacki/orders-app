import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import {
  addEntity,
  removeEntities,
  removeEntity,
  setAllEntities,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

import { MarketDataApi } from '@orders/data/market-data-api';
import { getMaxOrderId } from '@orders/utils/get-max-order-id';
import { compareSymbols, getUniqueSymbols } from '@orders/utils/get-unique-symbols';
import { trackCallState, withCallState } from '@shared/state/with-call-state';

import type { NewOrder, Order } from '../models/order';

interface OrdersAdditionalState {
  readonly expandedSymbols: string[];
  readonly availableSymbols: string[];
  // Not derivable from the current entities: closed orders keep their ids reserved, so the
  // highest id ever assigned has to be remembered to never hand it out again.
  readonly lastOrderId: number;
}

const initialState: OrdersAdditionalState = {
  expandedSymbols: [],
  availableSymbols: [],
  lastOrderId: 0,
};

function withoutSymbol(symbols: readonly string[], symbol: string): string[] {
  return symbols.filter((existing) => existing !== symbol);
}

export const OrdersStore = signalStore(
  { providedIn: 'root' },
  withEntities<Order>(),
  withState(initialState),
  withCallState(),
  withMethods((store, marketDataApi = inject(MarketDataApi)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => store.setLoading()),
        switchMap(() =>
          marketDataApi.getOrders().pipe(
            tap((orders) => {
              patchState(store, setAllEntities(orders), {
                availableSymbols: getUniqueSymbols(orders).sort(compareSymbols),
                lastOrderId: getMaxOrderId(orders),
              });
            }),
            trackCallState(store),
          ),
        ),
      ),
    ),
    addOrder(order: NewOrder): Order {
      const newOrder: Order = { ...order, id: store.lastOrderId() + 1 };
      patchState(store, addEntity(newOrder), { lastOrderId: newOrder.id });
      return newOrder;
    },
    removeOrder(id: number): void {
      patchState(store, removeEntity(id));
    },
    removeGroup(symbol: string): number[] {
      const idsToRemove = store
        .entities()
        .filter((order) => order.symbol === symbol)
        .map((order) => order.id);

      patchState(store, removeEntities(idsToRemove), {
        expandedSymbols: withoutSymbol(store.expandedSymbols(), symbol),
      });

      return idsToRemove;
    },
    toggleGroup(symbol: string): void {
      const expandedSymbols = store.expandedSymbols();
      patchState(store, {
        expandedSymbols: expandedSymbols.includes(symbol)
          ? withoutSymbol(expandedSymbols, symbol)
          : [...expandedSymbols, symbol],
      });
    },
  })),
);
