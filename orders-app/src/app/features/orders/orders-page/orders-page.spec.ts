import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';

import { QuotesSocket } from '@core/websocket/quotes-socket';

import type { Order } from '../models/order';
import { OrdersStore } from '../state/orders-store';
import { QuotesStore } from '../state/quotes-store';
import { ReferenceDataStore } from '../state/reference-data-store';
import { OrdersPage } from './orders-page';

function buildOrder(overrides: Partial<Order> = {}): Order {
  return { id: 1, symbol: 'BTCUSD', side: 'BUY', size: 0.1, openPrice: 100, openTime: 0, swap: 0, ...overrides };
}

describe('OrdersPage', () => {
  let fixture: ComponentFixture<OrdersPage>;
  let ordersLoad: ReturnType<typeof vi.fn>;
  let referenceDataLoad: ReturnType<typeof vi.fn>;
  let toggleGroup: ReturnType<typeof vi.fn>;
  let ordersCallStatus: ReturnType<typeof signal<'idle' | 'loading' | 'loaded' | 'error'>>;
  let referenceDataCallStatus: ReturnType<typeof signal<'idle' | 'loading' | 'loaded' | 'error'>>;

  function setup(initialOrders: Order[] = []): void {
    ordersLoad = vi.fn();
    referenceDataLoad = vi.fn();
    toggleGroup = vi.fn();
    ordersCallStatus = signal('loaded');
    referenceDataCallStatus = signal('loaded');

    TestBed.configureTestingModule({
      providers: [
        {
          provide: OrdersStore,
          useValue: {
            entities: signal(initialOrders),
            expandedSymbols: signal<string[]>([]),
            activeSymbols: signal<string[]>([]),
            callStatus: ordersCallStatus,
            load: ordersLoad,
            toggleGroup,
          },
        },
        {
          provide: QuotesStore,
          useValue: { quotes: signal({}), upsertQuotes: vi.fn(), removeQuotes: vi.fn() },
        },
        {
          provide: ReferenceDataStore,
          useValue: {
            contractSizeBySymbol: signal({}),
            callStatus: referenceDataCallStatus,
            load: referenceDataLoad,
          },
        },
        {
          provide: QuotesSocket,
          useValue: { quotes$: new Subject(), subscribeToSymbols: vi.fn(), unsubscribeFromSymbols: vi.fn() },
        },
      ],
    });

    fixture = TestBed.createComponent(OrdersPage);
    fixture.detectChanges();
  }

  it('loads orders and reference data on init', () => {
    setup();

    expect(ordersLoad).toHaveBeenCalled();
    expect(referenceDataLoad).toHaveBeenCalled();
  });

  it('shows a loading message while data is loading', () => {
    setup();
    ordersCallStatus.set('loading');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ładowanie');
  });

  it('shows an error message when loading fails', () => {
    setup();
    referenceDataCallStatus.set('error');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('shows an empty message when there are no orders', () => {
    setup([]);

    expect(fixture.nativeElement.textContent).toContain('Brak zleceń');
  });

  it('renders the orders table and delegates group toggling to the store', () => {
    setup([buildOrder()]);

    const groupRow = fixture.nativeElement.querySelector('tr[appOrderGroupRow]');
    expect(groupRow).toBeTruthy();

    groupRow.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(toggleGroup).toHaveBeenCalledWith('BTCUSD');
  });
});
