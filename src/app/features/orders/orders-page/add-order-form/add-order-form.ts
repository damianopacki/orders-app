import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { formatDateTimeLocal, parseDateTimeLocal } from '@orders/utils/date-time-local';

import type { NewOrder, OrderSide } from '../../models/order';
import type { Quote } from '../../models/quote';

const NEW_ORDER_SWAP = 0;

interface AddOrderFormValue {
  readonly symbol: string;
  readonly side: OrderSide;
  readonly size: number;
  readonly openPrice: number;
  readonly openTime: string;
}

function createInitialValue(): AddOrderFormValue {
  return {
    symbol: '',
    side: 'BUY',
    size: 0,
    openPrice: 0,
    openTime: formatDateTimeLocal(new Date()),
  };
}

function positiveNumberValidator(control: AbstractControl<number>): ValidationErrors | null {
  return control.value > 0 ? null : { positiveNumber: true };
}

@Component({
  selector: 'app-add-order-form',
  templateUrl: './add-order-form.html',
  styleUrl: './add-order-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class AddOrderForm {
  readonly availableSymbols = input.required<readonly string[]>();
  readonly quotesBySymbol = input.required<Readonly<Record<string, Quote>>>();
  readonly submitted = output<NewOrder>();

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly initialValue = createInitialValue();

  protected readonly form = this.formBuilder.group({
    symbol: this.formBuilder.control(this.initialValue.symbol, Validators.required),
    side: this.formBuilder.control<OrderSide>(this.initialValue.side, Validators.required),
    size: this.formBuilder.control(this.initialValue.size, [
      Validators.required,
      positiveNumberValidator,
    ]),
    openPrice: this.formBuilder.control(this.initialValue.openPrice, [
      Validators.required,
      positiveNumberValidator,
    ]),
    openTime: this.formBuilder.control(this.initialValue.openTime, Validators.required),
  });

  private readonly selectedSymbol = toSignal(this.form.controls.symbol.valueChanges, {
    initialValue: this.initialValue.symbol,
  });
  private readonly currentBid = computed(() => this.quotesBySymbol()[this.selectedSymbol()]?.bid);
  private autoFilledForSymbol: string | null = null;

  constructor() {
    // A quote for the just-picked symbol may not have arrived yet (WebSocket ticks aren't
    // instant) — react to currentBid too, not just the symbol change, so the price still
    // fills in once a quote shows up. Re-fires per symbol at most once, so it never
    // overwrites a price the user already edited by hand.
    effect(() => {
      const symbol = this.selectedSymbol();
      const bid = this.currentBid();

      if (symbol !== this.autoFilledForSymbol && bid !== undefined) {
        this.form.controls.openPrice.setValue(bid);
        this.autoFilledForSymbol = symbol;
      }
    });
  }

  protected hasError(control: AbstractControl): boolean {
    return control.invalid && (control.dirty || control.touched);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    this.submitted.emit({
      symbol: value.symbol,
      side: value.side,
      size: value.size,
      openPrice: value.openPrice,
      openTime: parseDateTimeLocal(value.openTime),
      swap: NEW_ORDER_SWAP,
    });

    this.form.reset(createInitialValue());
    // Re-arm auto-fill, so picking the same symbol again fills in its current price.
    this.autoFilledForSymbol = null;
  }
}
