import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { Notifier } from '@core/notifications/notifier';
import { formatClosedOrdersMessage } from '@utils/format-closed-orders-message';
import { selectOrderGroups } from '@utils/select-order-groups';

import type { Order } from '../models/order';
import { OrdersStore } from '../state/orders-store';
import { QuotesStore } from '../state/quotes-store';
import { ReferenceDataStore } from '../state/reference-data-store';
import { startQuotesSync } from '../state/quotes-sync';
import { AddOrderDialog } from './add-order-dialog/add-order-dialog';
import { OrdersTable } from './orders-table/orders-table';

type PageStatus = 'loading' | 'error' | 'empty' | 'ready';

@Component({
  selector: 'app-orders-page',
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrdersTable, AddOrderDialog],
})
export class OrdersPage {
  protected readonly ordersStore = inject(OrdersStore);
  protected readonly quotesStore = inject(QuotesStore);
  protected readonly referenceDataStore = inject(ReferenceDataStore);
  private readonly notifier = inject(Notifier);

  protected readonly groups = computed(() =>
    selectOrderGroups(
      this.ordersStore.entities(),
      this.quotesStore.quotes(),
      this.referenceDataStore.contractSizeBySymbol(),
      this.ordersStore.expandedSymbols(),
    ),
  );

  protected readonly pageStatus = computed<PageStatus>(() => {
    if (this.ordersStore.callStatus() === 'loading' || this.referenceDataStore.callStatus() === 'loading') {
      return 'loading';
    }
    if (this.ordersStore.callStatus() === 'error' || this.referenceDataStore.callStatus() === 'error') {
      return 'error';
    }
    if (this.groups().length === 0) {
      return 'empty';
    }
    return 'ready';
  });

  constructor() {
    this.ordersStore.load();
    this.referenceDataStore.load();
    startQuotesSync();
  }

  protected closeOrder(id: number): void {
    this.ordersStore.removeOrder(id);
    this.notifier.show(formatClosedOrdersMessage([id]), { type: 'success' });
  }

  protected closeGroup(symbol: string): void {
    const removedIds = this.ordersStore.removeGroup(symbol);
    this.notifier.show(formatClosedOrdersMessage(removedIds), { type: 'success' });
  }

  protected addOrder(order: Omit<Order, 'id'>): void {
    const created = this.ordersStore.addOrder(order);
    this.notifier.show(`Dodano zlecenie nr ${created.id}`, { type: 'success' });
  }
}
