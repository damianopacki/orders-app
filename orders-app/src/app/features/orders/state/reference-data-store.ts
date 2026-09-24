import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, catchError, forkJoin, pipe, switchMap, tap } from 'rxjs';

import { MarketDataApi } from '@core/api/market-data-api';
import { withCallState } from '@shared/state/with-call-state';
import { buildContractSizeMap } from '@utils/build-contract-size-map';

import type { ContractType } from '../models/contract-type';
import type { Instrument } from '../models/instrument';

interface ReferenceDataState {
  readonly instruments: Instrument[];
  readonly contractTypes: ContractType[];
}

const initialState: ReferenceDataState = {
  instruments: [],
  contractTypes: [],
};

export const ReferenceDataStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withCallState(),
  withComputed(({ instruments, contractTypes }) => ({
    contractSizeBySymbol: computed(() => buildContractSizeMap(instruments(), contractTypes())),
  })),
  withMethods((store, marketDataApi = inject(MarketDataApi)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => store.setLoading()),
        switchMap(() =>
          forkJoin({
            instruments: marketDataApi.getInstruments(),
            contractTypes: marketDataApi.getContractTypes(),
          }).pipe(
            tap(({ instruments, contractTypes }) => {
              patchState(store, { instruments, contractTypes });
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
  })),
);
