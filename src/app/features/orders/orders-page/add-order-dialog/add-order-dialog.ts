import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

import type { NewOrder } from '../../models/order';
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
  readonly submitted = output<NewOrder>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private pointerDownOnBackdrop = false;

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  protected onSubmitted(order: NewOrder): void {
    this.submitted.emit(order);
    this.close();
  }

  protected onBackdropPointerDown(event: PointerEvent): void {
    this.pointerDownOnBackdrop = event.target === this.dialog().nativeElement;
  }

  // A press that starts inside the panel and is released on the backdrop still fires a
  // click whose target is the <dialog> (the nearest common ancestor), so the target check
  // alone would close the dialog — the press has to have started on the backdrop too.
  protected onBackdropClick(event: MouseEvent): void {
    const startedOnBackdrop = this.pointerDownOnBackdrop;
    this.pointerDownOnBackdrop = false;

    if (startedOnBackdrop && event.target === this.dialog().nativeElement) {
      this.close();
    }
  }
}
