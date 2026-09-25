import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChild } from '@angular/core';

import type { Order } from '../../models/order';
import type { Quote } from '../../models/quote';
import { AddOrderForm } from '../add-order-form/add-order-form';

@Component({
  selector: 'app-add-order-dialog',
  templateUrl: './add-order-dialog.html',
  styleUrl: './add-order-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AddOrderForm],
})
export class AddOrderDialog {
  readonly availableSymbols = input.required<readonly string[]>();
  readonly quotesBySymbol = input.required<Readonly<Record<string, Quote>>>();
  readonly submitted = output<Omit<Order, 'id'>>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  protected onSubmitted(order: Omit<Order, 'id'>): void {
    this.submitted.emit(order);
    this.close();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }
}
