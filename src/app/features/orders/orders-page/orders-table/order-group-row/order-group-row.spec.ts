import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { OrderGroupViewModel } from '@orders/utils/select-order-groups';
import { OrderGroupRow } from './order-group-row';

function buildGroup(overrides: Partial<OrderGroupViewModel> = {}): OrderGroupViewModel {
  return {
    symbol: 'BTCUSD',
    summary: {
      orderCount: 3,
      totalSize: 0.3,
      totalSwap: -1.5,
      averageOpenPrice: 105.5,
      totalProfit: 20,
    },
    expanded: false,
    rows: [],
    ...overrides,
  };
}

describe('OrderGroupRow', () => {
  let fixture: ComponentFixture<OrderGroupRow>;

  function setup(group: OrderGroupViewModel, showDivider = true): HTMLElement {
    fixture = TestBed.createComponent(OrderGroupRow);
    fixture.componentRef.setInput('group', group);
    fixture.componentRef.setInput('showDivider', showDivider);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function cellTexts(host: HTMLElement): string[] {
    return Array.from(host.querySelectorAll('td')).map((td) => td.textContent!.trim());
  }

  it('shows the symbol, order count badge and aggregated columns', () => {
    const host = setup(buildGroup());

    expect(host.textContent).toContain('BTCUSD');
    const cells = cellTexts(host);
    expect(cells[0]).toContain('3');
    expect(cells[3]).toBe('0.3');
    expect(cells[5]).toBe('105.50');
    expect(cells[6]).toBe('-1.50');
  });

  it('leaves Order ID, Side and Open Time columns empty', () => {
    const cells = cellTexts(setup(buildGroup()));

    expect(cells[1]).toBe('');
    expect(cells[2]).toBe('');
    expect(cells[4]).toBe('');
  });

  it('sets aria-expanded to match the group state', () => {
    expect(setup(buildGroup({ expanded: false })).getAttribute('aria-expanded')).toBe('false');
    expect(setup(buildGroup({ expanded: true })).getAttribute('aria-expanded')).toBe('true');
  });

  it('marks positive and negative profit, and stays neutral for zero/null', () => {
    let host = setup(buildGroup({ summary: { ...buildGroup().summary, totalProfit: 5 } }));
    let profitCell = host.querySelector('.order-group-row__profit')!;
    expect(profitCell.classList.contains('order-group-row__profit--positive')).toBe(true);

    host = setup(buildGroup({ summary: { ...buildGroup().summary, totalProfit: -5 } }));
    profitCell = host.querySelector('.order-group-row__profit')!;
    expect(profitCell.classList.contains('order-group-row__profit--negative')).toBe(true);

    host = setup(buildGroup({ summary: { ...buildGroup().summary, totalProfit: null } }));
    profitCell = host.querySelector('.order-group-row__profit')!;
    expect(profitCell.classList.contains('order-group-row__profit--positive')).toBe(false);
    expect(profitCell.classList.contains('order-group-row__profit--negative')).toBe(false);
  });

  it('shows a placeholder with an explanatory title when total profit is unavailable', () => {
    const host = setup(buildGroup({ summary: { ...buildGroup().summary, totalProfit: null } }));
    const profitCell = host.querySelector('.order-group-row__profit')!;

    expect(profitCell.textContent!.trim()).toBe('—');
    expect(profitCell.getAttribute('title')).toBe('Brak aktualnych notowań');
  });

  it('shows zero total profit as a number, without the placeholder title', () => {
    const host = setup(buildGroup({ summary: { ...buildGroup().summary, totalProfit: 0 } }));
    const profitCell = host.querySelector('.order-group-row__profit')!;

    expect(profitCell.textContent!.trim()).toBe('0.00');
    expect(profitCell.hasAttribute('title')).toBe(false);
  });

  it('emits toggle on click, Enter and Space', () => {
    const host = setup(buildGroup());
    const toggleSpy = vi.fn();
    fixture.componentInstance.toggled.subscribe(toggleSpy);

    host.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    host.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

    expect(toggleSpy).toHaveBeenCalledTimes(3);
  });

  it('does not toggle or block native activation for Enter/Space on the close button', () => {
    const host = setup(buildGroup());
    const toggleSpy = vi.fn();
    fixture.componentInstance.toggled.subscribe(toggleSpy);
    const closeButton = host.querySelector('.order-group-row__close')!;

    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    closeButton.dispatchEvent(enter);
    closeButton.dispatchEvent(space);

    expect(toggleSpy).not.toHaveBeenCalled();
    expect(enter.defaultPrevented).toBe(false);
    expect(space.defaultPrevented).toBe(false);
  });

  it('shows the divider only when showDivider is true', () => {
    expect(setup(buildGroup(), true).classList.contains('order-group-row--divider')).toBe(true);
    expect(setup(buildGroup(), false).classList.contains('order-group-row--divider')).toBe(false);
  });

  it('emits close without also emitting toggle when the close button is clicked', () => {
    const host = setup(buildGroup());
    const toggleSpy = vi.fn();
    const closeSpy = vi.fn();
    fixture.componentInstance.toggled.subscribe(toggleSpy);
    fixture.componentInstance.closed.subscribe(closeSpy);

    host
      .querySelector('.order-group-row__close')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(toggleSpy).not.toHaveBeenCalled();
  });
});
