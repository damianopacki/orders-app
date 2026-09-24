import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';

import { withCallState } from './with-call-state';

describe('withCallState', () => {
  const TestStore = signalStore({ providedIn: 'root' }, withCallState());

  it('starts as idle', () => {
    const store = TestBed.inject(TestStore);

    expect(store.callStatus()).toBe('idle');
  });

  it('transitions through loading, loaded and error', () => {
    const store = TestBed.inject(TestStore);

    store.setLoading();
    expect(store.callStatus()).toBe('loading');

    store.setLoaded();
    expect(store.callStatus()).toBe('loaded');

    store.setError();
    expect(store.callStatus()).toBe('error');
  });
});
