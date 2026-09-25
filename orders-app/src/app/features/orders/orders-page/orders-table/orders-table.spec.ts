import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { Order } from '../../models/order';
import type { OrderGroupViewModel } from '@utils/select-order-groups';
import { OrdersTable } from './orders-table';

function buildOrder(overrides: Partial<Order> = {}): Order {
  return { id: 1, symbol: 'BTCUSD', side: 'BUY', size: 0.1, openPrice: 100, openTime: 0, swap: 0, ...overrides };
}

function buildGroup(overrides: Partial<OrderGroupViewModel> = {}): OrderGroupViewModel {
  const order = buildOrder({ symbol: overrides.symbol ?? 'BTCUSD' });
  return {
    symbol: 'BTCUSD',
    summary: { orderCount: 1, totalSize: 0.1, totalSwap: 0, averageOpenPrice: 100, totalProfit: 10 },
    expanded: false,
    rows: [{ order, profit: 10 }],
    ...overrides,
  };
}

describe('OrdersTable', () => {
  let fixture: ComponentFixture<OrdersTable>;

  function setup(groups: OrderGroupViewModel[]): HTMLElement {
    fixture = TestBed.createComponent(OrdersTable);
    fixture.componentRef.setInput('groups', groups);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders one tbody per group', () => {
    const host = setup([buildGroup({ symbol: 'BTCUSD' }), buildGroup({ symbol: 'ETHUSD' })]);

    expect(host.querySelectorAll('tbody').length).toBe(2);
  });

  it('shows detail rows only for expanded groups', () => {
    const host = setup([
      buildGroup({ symbol: 'BTCUSD', expanded: false }),
      buildGroup({ symbol: 'ETHUSD', expanded: true }),
    ]);

    expect(host.querySelectorAll('tr[appOrderRow]').length).toBe(1);
  });

  it('emits toggleGroup with the symbol when a group row is toggled', () => {
    const host = setup([buildGroup({ symbol: 'BTCUSD' })]);
    const emitted: string[] = [];
    fixture.componentInstance.toggleGroup.subscribe((symbol) => emitted.push(symbol));

    host.querySelector('tr[appOrderGroupRow]')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(emitted).toEqual(['BTCUSD']);
  });

  it('emits closeGroup with the symbol when the group close button is clicked', () => {
    const host = setup([buildGroup({ symbol: 'BTCUSD' })]);
    const emitted: string[] = [];
    fixture.componentInstance.closeGroup.subscribe((symbol) => emitted.push(symbol));

    host.querySelector('tr[appOrderGroupRow] button')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(emitted).toEqual(['BTCUSD']);
  });

  it('emits closeOrder with the order id when a detail row close button is clicked', () => {
    const host = setup([buildGroup({ symbol: 'BTCUSD', expanded: true })]);
    const emitted: number[] = [];
    fixture.componentInstance.closeOrder.subscribe((id) => emitted.push(id));

    host.querySelector('tr[appOrderRow] button')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(emitted).toEqual([1]);
  });

  it('shows the divider only on the last row of each group', () => {
    const collapsedGroup = buildGroup({ symbol: 'BTCUSD', expanded: false });
    const expandedGroup = buildGroup({
      symbol: 'ETHUSD',
      expanded: true,
      rows: [
        { order: buildOrder({ id: 1, symbol: 'ETHUSD' }), profit: 1 },
        { order: buildOrder({ id: 2, symbol: 'ETHUSD' }), profit: 2 },
      ],
    });
    const host = setup([collapsedGroup, expandedGroup]);

    const groupRows = host.querySelectorAll('tr[appOrderGroupRow]');
    expect(groupRows[0].classList.contains('order-group-row--divider')).toBe(true);
    expect(groupRows[1].classList.contains('order-group-row--divider')).toBe(false);

    const orderRows = host.querySelectorAll('tr[appOrderRow]');
    expect(orderRows[0].classList.contains('order-row--divider')).toBe(false);
    expect(orderRows[1].classList.contains('order-row--divider')).toBe(true);
  });
});
