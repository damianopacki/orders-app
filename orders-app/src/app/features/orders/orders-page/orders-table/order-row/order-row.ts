import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { getProfitModifier } from '@utils/get-profit-modifier';
import { CURRENCY_DECIMAL_FORMAT, QUANTITY_DECIMAL_FORMAT } from '@utils/number-format';
import type { OrderRowViewModel } from '@utils/select-order-groups';

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
  protected readonly currencyFormat = CURRENCY_DECIMAL_FORMAT;
}
