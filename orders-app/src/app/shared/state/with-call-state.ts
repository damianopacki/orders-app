import {
  patchState,
  signalStoreFeature,
  withMethods,
  withState,
  type EmptyFeatureResult,
  type SignalStoreFeature,
} from '@ngrx/signals';
import { EMPTY, catchError, tap, type MonoTypeOperatorFunction } from 'rxjs';

export type CallStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface CallState {
  readonly callStatus: CallStatus;
}

interface CallStateMethods {
  setLoading(): void;
  setLoaded(): void;
  setError(): void;
}

// signalStore requires `methods` to fit an index-signature Record, which interfaces don't
// satisfy implicitly — Pick<> turns CallStateMethods into an anonymous (mapped) type that does.
export function withCallState(): SignalStoreFeature<
  EmptyFeatureResult,
  {
    state: CallState;
    props: EmptyFeatureResult['props'];
    methods: Pick<CallStateMethods, keyof CallStateMethods>;
  }
> {
  return signalStoreFeature(
    withState<CallState>({ callStatus: 'idle' }),
    withMethods((store) => ({
      setLoading(): void {
        patchState(store, { callStatus: 'loading' });
      },
      setLoaded(): void {
        patchState(store, { callStatus: 'loaded' });
      },
      setError(): void {
        patchState(store, { callStatus: 'error' });
      },
    })),
  );
}

// Marks a request as loaded on success, or as errored (swallowing the error so the
// outer rxMethod stream stays alive) on failure.
export function trackCallState<T>(store: CallStateMethods): MonoTypeOperatorFunction<T> {
  return (source) =>
    source.pipe(
      tap(() => store.setLoaded()),
      catchError(() => {
        store.setError();
        return EMPTY;
      }),
    );
}
