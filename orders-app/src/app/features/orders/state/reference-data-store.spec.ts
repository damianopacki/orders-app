import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { MarketDataApi } from '@core/api/market-data-api';
import type { ContractType } from '../models/contract-type';
import type { Instrument } from '../models/instrument';
import { ReferenceDataStore } from './reference-data-store';

describe('ReferenceDataStore', () => {
  function setup(marketDataApi: Partial<MarketDataApi>) {
    TestBed.configureTestingModule({
      providers: [{ provide: MarketDataApi, useValue: marketDataApi }],
    });
    return TestBed.inject(ReferenceDataStore);
  }

  it('loads instruments and contract types, and builds the contract size map', () => {
    const instruments: Instrument[] = [{ symbol: 'BTCUSD', contractType: 0 }];
    const contractTypes: ContractType[] = [{ contractType: 0, contractSize: 1 }];

    const store = setup({
      getInstruments: () => of(instruments),
      getContractTypes: () => of(contractTypes),
    });

    store.load();

    expect(store.callStatus()).toBe('loaded');
    expect(store.instruments()).toEqual(instruments);
    expect(store.contractTypes()).toEqual(contractTypes);
    expect(store.contractSizeBySymbol()).toEqual({ BTCUSD: 1 });
  });

  it('sets an error status when loading fails', () => {
    const store = setup({
      getInstruments: () => throwError(() => new Error('network error')),
      getContractTypes: () => of([]),
    });

    store.load();

    expect(store.callStatus()).toBe('error');
    expect(store.instruments()).toEqual([]);
  });
});
