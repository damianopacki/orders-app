import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { ContractType } from '../models/contract-type';
import type { Instrument } from '../models/instrument';
import type { Order } from '../models/order';
import { API_ENDPOINTS } from './api-endpoints';
import { MarketDataApi } from './market-data-api';

describe('MarketDataApi', () => {
  let api: MarketDataApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(MarketDataApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getOrders() unwraps the response envelope and maps orders', () => {
    let result: Order[] | undefined;
    api.getOrders().subscribe((orders) => (result = orders));

    const req = httpMock.expectOne(API_ENDPOINTS.orders);
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [
        {
          id: 1,
          symbol: 'BTCUSD',
          side: 'BUY',
          size: 0.1,
          openPrice: 100,
          openTime: 1700000000000,
          swap: -0.5,
        },
      ],
    });

    expect(result).toEqual([
      {
        id: 1,
        symbol: 'BTCUSD',
        side: 'BUY',
        size: 0.1,
        openPrice: 100,
        openTime: 1700000000000,
        swap: -0.5,
      },
    ]);
  });

  it('getOrders() returns an empty array when the envelope has no data array', () => {
    let result: Order[] | undefined;
    api.getOrders().subscribe((orders) => (result = orders));

    const req = httpMock.expectOne(API_ENDPOINTS.orders);
    req.flush({ data: null });

    expect(result).toEqual([]);
  });

  it('getInstruments() returns the instrument list as-is', () => {
    const instruments: Instrument[] = [{ symbol: 'BTCUSD', contractType: 0 }];

    let result: Instrument[] | undefined;
    api.getInstruments().subscribe((value) => (result = value));

    const req = httpMock.expectOne(API_ENDPOINTS.instruments);
    req.flush(instruments);

    expect(result).toEqual(instruments);
  });

  it('getContractTypes() returns the contract type list as-is', () => {
    const contractTypes: ContractType[] = [{ contractType: 0, contractSize: 1 }];

    let result: ContractType[] | undefined;
    api.getContractTypes().subscribe((value) => (result = value));

    const req = httpMock.expectOne(API_ENDPOINTS.contractTypes);
    req.flush(contractTypes);

    expect(result).toEqual(contractTypes);
  });
});
