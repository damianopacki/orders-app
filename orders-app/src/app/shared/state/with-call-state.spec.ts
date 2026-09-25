import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';
import { of, throwError } from 'rxjs';

import { trackCallState, withCallState } from './with-call-state';

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

describe('trackCallState', () => {
  const TestStore = signalStore({ providedIn: 'root' }, withCallState());

  it('sets loaded and passes values through on success', () => {
    const store = TestBed.inject(TestStore);
    const received: number[] = [];

    of(1)
      .pipe(trackCallState(store))
      .subscribe((value) => received.push(value));

    expect(received).toEqual([1]);
    expect(store.callStatus()).toBe('loaded');
  });

  it('sets error and completes without rethrowing on failure', () => {
    const store = TestBed.inject(TestStore);
    const error = vi.fn();
    const complete = vi.fn();

    throwError(() => new Error('boom'))
      .pipe(trackCallState(store))
      .subscribe({ error, complete });

    expect(store.callStatus()).toBe('error');
    expect(error).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalled();
  });
});
