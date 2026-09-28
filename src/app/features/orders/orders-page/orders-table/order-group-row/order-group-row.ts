import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { getProfitModifier } from '@orders/utils/get-profit-modifier';
import {
  AMOUNT_DECIMAL_FORMAT,
  PROFIT_UNAVAILABLE_PLACEHOLDER,
  PROFIT_UNAVAILABLE_TITLE,
  PRICE_DECIMAL_FORMAT,
  QUANTITY_DECIMAL_FORMAT,
} from '@orders/utils/display-formats';
import type { OrderGroupViewModel } from '@orders/utils/select-order-groups';

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
    '(keydown.enter)': 'onToggleKey($event)',
    '(keydown.space)': 'onToggleKey($event)',
  },
})
export class OrderGroupRow {
  readonly group = input.required<OrderGroupViewModel>();
  readonly showDivider = input.required<boolean>();
  readonly toggled = output<void>();
  readonly closed = output<void>();

  protected readonly profitModifier = computed(() =>
    getProfitModifier(this.group().summary.totalProfit),
  );

  protected readonly quantityFormat = QUANTITY_DECIMAL_FORMAT;
  protected readonly priceFormat = PRICE_DECIMAL_FORMAT;
  protected readonly amountFormat = AMOUNT_DECIMAL_FORMAT;
  protected readonly profitPlaceholder = PROFIT_UNAVAILABLE_PLACEHOLDER;
  protected readonly profitUnavailableTitle = PROFIT_UNAVAILABLE_TITLE;

  protected onToggleKey(event: Event): void {
    // Keys pressed on the close button bubble up here — leave them to the button's
    // native activation instead of toggling (and blocking Space via preventDefault).
    if (event.target !== event.currentTarget) {
      return;
    }

    event.preventDefault();
    this.toggled.emit();
  }

  protected onClose(event: MouseEvent): void {
    event.stopPropagation();
    this.closed.emit();
  }
}
