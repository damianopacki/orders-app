import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';

import { Notifier } from '@core/notifications/notifier';
import { QuotesSocket } from '@core/websocket/quotes-socket';
import type { CallStatus } from '@shared/state/with-call-state';

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
  let removeOrder: ReturnType<typeof vi.fn>;
  let removeGroup: ReturnType<typeof vi.fn>;
  let addOrder: ReturnType<typeof vi.fn>;
  let notifierShow: ReturnType<typeof vi.fn>;
  let ordersCallStatus: ReturnType<typeof signal<CallStatus>>;
  let referenceDataCallStatus: ReturnType<typeof signal<CallStatus>>;

  function setup(initialOrders: Order[] = [], expandedSymbols: string[] = []): void {
    ordersLoad = vi.fn();
    referenceDataLoad = vi.fn();
    toggleGroup = vi.fn();
    removeOrder = vi.fn();
    removeGroup = vi.fn(() => [1, 2]);
    addOrder = vi.fn((order: Omit<Order, 'id'>) => ({ ...order, id: 42 }));
    notifierShow = vi.fn();
    ordersCallStatus = signal('loaded');
    referenceDataCallStatus = signal('loaded');

    TestBed.configureTestingModule({
      providers: [
        {
          provide: OrdersStore,
          useValue: {
            entities: signal(initialOrders),
            expandedSymbols: signal(expandedSymbols),
            availableSymbols: signal(['BTCUSD']),
            callStatus: ordersCallStatus,
            load: ordersLoad,
            toggleGroup,
            removeOrder,
            removeGroup,
            addOrder,
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
        { provide: Notifier, useValue: { show: notifierShow } },
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

  it('closes a single order and shows a success notification', () => {
    setup([buildOrder({ id: 7 })], ['BTCUSD']);

    const closeButton = fixture.nativeElement.querySelector('tr[appOrderRow] .order-row__close');
    expect(closeButton).toBeTruthy();

    closeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(removeOrder).toHaveBeenCalledWith(7);
    expect(notifierShow).toHaveBeenCalledWith('Zamknięto zlecenie nr 7', { type: 'success' });
  });

  it('closes a group and shows a success notification listing every removed id', () => {
    setup([buildOrder({ id: 1 }), buildOrder({ id: 2 })]);

    const closeButton = fixture.nativeElement.querySelector('tr[appOrderGroupRow] .order-group-row__close');
    expect(closeButton).toBeTruthy();

    closeButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(removeGroup).toHaveBeenCalledWith('BTCUSD');
    expect(notifierShow).toHaveBeenCalledWith('Zamknięto zlecenie nr 1, 2', { type: 'success' });
  });

  it('shows the add-order form even when there are no orders', () => {
    setup([]);

    expect(fixture.nativeElement.querySelector('form.add-order-form')).toBeTruthy();
  });

  it('adds an order via the form and shows a success notification with the new id', () => {
    setup([]);

    const symbolSelect: HTMLSelectElement = fixture.nativeElement.querySelector('select[formControlName="symbol"]');
    symbolSelect.value = 'BTCUSD';
    symbolSelect.dispatchEvent(new Event('input'));
    symbolSelect.dispatchEvent(new Event('change'));

    const sizeInput: HTMLInputElement = fixture.nativeElement.querySelector('input[formControlName="size"]');
    sizeInput.value = '1';
    sizeInput.dispatchEvent(new Event('input'));

    const priceInput: HTMLInputElement = fixture.nativeElement.querySelector('input[formControlName="openPrice"]');
    priceInput.value = '100';
    priceInput.dispatchEvent(new Event('input'));

    fixture.detectChanges();
    fixture.nativeElement.querySelector('form.add-order-form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(addOrder).toHaveBeenCalledWith(expect.objectContaining({ symbol: 'BTCUSD', size: 1, openPrice: 100 }));
    expect(notifierShow).toHaveBeenCalledWith('Dodano zlecenie nr 42', { type: 'success' });
  });
});
