import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { addEntity, removeEntities, removeEntity, setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, pipe, switchMap, tap } from 'rxjs';

import { MarketDataApi } from '@core/api/market-data-api';
import { withCallState } from '@shared/state/with-call-state';

import type { Order } from '../models/order';

interface OrdersAdditionalState {
  readonly expandedSymbols: string[];
  readonly availableSymbols: string[];
}

const initialState: OrdersAdditionalState = {
  expandedSymbols: [],
  availableSymbols: [],
};

export const OrdersStore = signalStore(
  { providedIn: 'root' },
  withEntities<Order>(),
  withState(initialState),
  withCallState(),
  withComputed(({ entities }) => ({
    activeSymbols: computed(() => Array.from(new Set(entities().map((order) => order.symbol)))),
  })),
  withMethods((store, marketDataApi = inject(MarketDataApi)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => store.setLoading()),
        switchMap(() =>
          marketDataApi.getOrders().pipe(
            tap((orders) => {
              patchState(store, setAllEntities(orders));
              patchState(store, { availableSymbols: Array.from(new Set(orders.map((order) => order.symbol))) });
              store.setLoaded();
            }),
            catchError(() => {
              store.setError();
              return EMPTY;
            }),
          ),
        ),
      ),
    ),
    addOrder(order: Omit<Order, 'id'>): Order {
      const nextId = Math.max(0, ...store.entities().map((existing) => existing.id)) + 1;
      const newOrder: Order = { ...order, id: nextId };
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

      patchState(store, removeEntities(idsToRemove));
      patchState(store, {
        expandedSymbols: store.expandedSymbols().filter((expanded) => expanded !== symbol),
      });

      return idsToRemove;
    },
    toggleGroup(symbol: string): void {
      const expandedSymbols = store.expandedSymbols();
      patchState(store, {
        expandedSymbols: expandedSymbols.includes(symbol)
          ? expandedSymbols.filter((expanded) => expanded !== symbol)
          : [...expandedSymbols, symbol],
      });
    },
  })),
);
