import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import type { OrderGroupViewModel } from '@utils/select-order-groups';

import { OrderGroupRow } from './order-group-row/order-group-row';
import { OrderRow } from './order-row/order-row';

@Component({
  selector: 'app-orders-table',
  templateUrl: './orders-table.html',
  styleUrl: './orders-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrderGroupRow, OrderRow],
})
export class OrdersTable {
  readonly groups = input.required<readonly OrderGroupViewModel[]>();
  readonly toggleGroup = output<string>();
  readonly closeOrder = output<number>();
  readonly closeGroup = output<string>();
}
