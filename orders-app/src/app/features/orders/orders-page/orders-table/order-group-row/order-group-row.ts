import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { getProfitModifier } from '@utils/get-profit-modifier';
import { CURRENCY_DECIMAL_FORMAT, QUANTITY_DECIMAL_FORMAT } from '@utils/number-format';
import type { OrderGroupViewModel } from '@utils/select-order-groups';

import { TrashIcon } from '@shared/ui/trash-icon/trash-icon';

@Component({
  selector: 'tr[appOrderGroupRow]',
  templateUrl: './order-group-row.html',
  styleUrl: './order-group-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, TrashIcon],
  host: {
    class: 'order-group-row',
    tabindex: '0',
    '[class.order-group-row--divider]': 'showDivider()',
    '[attr.aria-expanded]': 'group().expanded',
    '(click)': 'toggled.emit()',
    '(keydown.enter)': 'toggled.emit()',
    '(keydown.space)': 'onSpace($event)',
  },
})
export class OrderGroupRow {
  readonly group = input.required<OrderGroupViewModel>();
  readonly showDivider = input.required<boolean>();
  readonly toggled = output<void>();
  readonly closed = output<void>();

  protected readonly profitModifier = computed(() => getProfitModifier(this.group().summary.totalProfit));

  protected readonly quantityFormat = QUANTITY_DECIMAL_FORMAT;
  protected readonly currencyFormat = CURRENCY_DECIMAL_FORMAT;

  protected onSpace(event: Event): void {
    event.preventDefault();
    this.toggled.emit();
  }

  protected onClose(event: MouseEvent): void {
    event.stopPropagation();
    this.closed.emit();
  }
}
