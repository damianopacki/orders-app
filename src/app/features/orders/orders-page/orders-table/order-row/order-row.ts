import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { getProfitModifier } from '@orders/utils/get-profit-modifier';
import {
  AMOUNT_DECIMAL_FORMAT,
  ORDER_TIME_FORMAT,
  PROFIT_UNAVAILABLE_PLACEHOLDER,
  PROFIT_UNAVAILABLE_TITLE,
  PRICE_DECIMAL_FORMAT,
  QUANTITY_DECIMAL_FORMAT,
} from '@orders/utils/display-formats';
import type { OrderRowViewModel } from '@orders/utils/select-order-groups';

import { TrashIcon } from '@shared/ui/trash-icon/trash-icon';

@Component({
  selector: 'tr[appOrderRow]',
  templateUrl: './order-row.html',
  styleUrl: './order-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, TrashIcon],
  host: {
    class: 'order-row',
    '[class.order-row--divider]': 'showDivider()',
  },
})
export class OrderRow {
  readonly row = input.required<OrderRowViewModel>();
  readonly showDivider = input.required<boolean>();
  readonly closed = output<void>();

  protected readonly profitModifier = computed(() => getProfitModifier(this.row().profit));

  protected readonly quantityFormat = QUANTITY_DECIMAL_FORMAT;
  protected readonly priceFormat = PRICE_DECIMAL_FORMAT;
  protected readonly amountFormat = AMOUNT_DECIMAL_FORMAT;
  protected readonly timeFormat = ORDER_TIME_FORMAT;
  protected readonly profitPlaceholder = PROFIT_UNAVAILABLE_PLACEHOLDER;
  protected readonly profitUnavailableTitle = PROFIT_UNAVAILABLE_TITLE;
}
