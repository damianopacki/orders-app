import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { addEntity, removeEntities, removeEntity, setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

import { MarketDataApi } from '@core/api/market-data-api';
import { trackCallState, withCallState } from '@shared/state/with-call-state';
import { getNextOrderId } from '@utils/get-next-order-id';
import { compareSymbols, getUniqueSymbols } from '@utils/get-unique-symbols';

import type { NewOrder, Order } from '../models/order';

interface OrdersAdditionalState {
  readonly expandedSymbols: string[];
  readonly availableSymbols: string[];
}

const initialState: OrdersAdditionalState = {
  expandedSymbols: [],
  availableSymbols: [],
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
              });
            }),
            trackCallState(store),
          ),
        ),
      ),
    ),
    addOrder(order: NewOrder): Order {
      const newOrder: Order = { ...order, id: getNextOrderId(store.entities()) };
      patchState(store, addEntity(newOrder));
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
