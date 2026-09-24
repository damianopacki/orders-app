import { patchState, signalStoreFeature, withMethods, withState } from '@ngrx/signals';

export type CallStatus = 'idle' | 'loading' | 'loaded' | 'error';

export function withCallState() {
  return signalStoreFeature(
    withState<{ callStatus: CallStatus }>({ callStatus: 'idle' }),
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
