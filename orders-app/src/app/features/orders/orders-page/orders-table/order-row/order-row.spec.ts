import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { OrderRowViewModel } from '@utils/select-order-groups';
import { OrderRow } from './order-row';

function buildRow(orderOverrides: Partial<OrderRowViewModel['order']> = {}, profit: number | null = 10): OrderRowViewModel {
  return {
    order: {
      id: 1,
      symbol: 'BTCUSD',
      side: 'BUY',
      size: 0.1,
      openPrice: 100,
      openTime: 0,
      swap: -0.5,
      ...orderOverrides,
    },
    profit,
  };
}

describe('OrderRow', () => {
  let fixture: ComponentFixture<OrderRow>;

  function setup(row: OrderRowViewModel, showDivider = true): HTMLElement {
    fixture = TestBed.createComponent(OrderRow);
    fixture.componentRef.setInput('row', row);
    fixture.componentRef.setInput('showDivider', showDivider);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function cellTexts(host: HTMLElement): string[] {
    return Array.from(host.querySelectorAll('td')).map((td) => td.textContent!.trim());
  }

  it('renders order details in the expected columns', () => {
    const cells = cellTexts(setup(buildRow({ id: 42, side: 'SELL', size: 0.25, openPrice: 123.456, swap: -0.5 })));

    expect(cells[0]).toBe('');
    expect(cells[1]).toBe('42');
    expect(cells[2]).toBe('SELL');
    expect(cells[3]).toBe('0.25');
    expect(cells[5]).toBe('123.46');
    expect(cells[6]).toBe('-0.50');
  });

  it('formats openTime as dd.MM.yyyy HH:mm:ss', () => {
    const openTime = new Date(2025, 5, 20, 18, 30, 22).getTime();

    expect(cellTexts(setup(buildRow({ openTime })))[4]).toBe('20.06.2025 18:30:22');
  });

  it('marks positive and negative profit, and stays neutral for zero/null', () => {
    let host = setup(buildRow({}, 10));
    let profitCell = host.querySelector('.order-row__profit')!;
    expect(profitCell.classList.contains('order-row__profit--positive')).toBe(true);

    host = setup(buildRow({}, -10));
    profitCell = host.querySelector('.order-row__profit')!;
    expect(profitCell.classList.contains('order-row__profit--negative')).toBe(true);

    host = setup(buildRow({}, 0));
    profitCell = host.querySelector('.order-row__profit')!;
    expect(profitCell.classList.contains('order-row__profit--positive')).toBe(false);
    expect(profitCell.classList.contains('order-row__profit--negative')).toBe(false);

    host = setup(buildRow({}, null));
    profitCell = host.querySelector('.order-row__profit')!;
    expect(profitCell.classList.contains('order-row__profit--positive')).toBe(false);
    expect(profitCell.classList.contains('order-row__profit--negative')).toBe(false);
  });

  it('shows a placeholder with an explanatory title when profit is unavailable', () => {
    const profitCell = setup(buildRow({}, null)).querySelector('.order-row__profit')!;

    expect(profitCell.textContent!.trim()).toBe('—');
    expect(profitCell.getAttribute('title')).toBe('Brak aktualnych notowań');
  });

  it('shows zero profit as a number, without the placeholder title', () => {
    const profitCell = setup(buildRow({}, 0)).querySelector('.order-row__profit')!;

    expect(profitCell.textContent!.trim()).toBe('0.00');
    expect(profitCell.hasAttribute('title')).toBe(false);
  });

  it('shows the divider only when showDivider is true', () => {
    expect(setup(buildRow(), true).classList.contains('order-row--divider')).toBe(true);
    expect(setup(buildRow(), false).classList.contains('order-row--divider')).toBe(false);
  });

  it('emits close with an aria-label containing the order id', () => {
    const host = setup(buildRow({ id: 7 }));
    const closeSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closeSpy);

    const button = host.querySelector('.order-row__close') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toContain('7');

    button.click();
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });
});
