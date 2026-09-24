import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import type { ContractType } from '../../features/orders/models/contract-type';
import type { Instrument } from '../../features/orders/models/instrument';
import type { Order, OrdersResponseDto } from '../../features/orders/models/order';
import { API_ENDPOINTS } from './api-endpoints';

@Injectable({ providedIn: 'root' })
export class MarketDataApi {
  private readonly http = inject(HttpClient);

  getOrders(): Observable<Order[]> {
    return this.http
      .get<OrdersResponseDto>(API_ENDPOINTS.orders)
      .pipe(map((response) => (Array.isArray(response.data) ? response.data : [])));
  }

  getInstruments(): Observable<Instrument[]> {
    return this.http.get<Instrument[]>(API_ENDPOINTS.instruments);
  }

  getContractTypes(): Observable<ContractType[]> {
    return this.http.get<ContractType[]>(API_ENDPOINTS.contractTypes);
  }
}
