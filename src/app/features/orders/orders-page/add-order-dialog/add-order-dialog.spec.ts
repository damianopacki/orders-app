import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { Quote } from '../../models/quote';
import { AddOrderDialog } from './add-order-dialog';

describe('AddOrderDialog', () => {
  let fixture: ComponentFixture<AddOrderDialog>;

  function setup(
    availableSymbols: string[] = ['BTCUSD'],
    quotesBySymbol: Record<string, Quote> = {},
  ): void {
    fixture = TestBed.createComponent(AddOrderDialog);
    fixture.componentRef.setInput('availableSymbols', availableSymbols);
    fixture.componentRef.setInput('quotesBySymbol', quotesBySymbol);
    fixture.detectChanges();
  }

  function dialogElement(): HTMLDialogElement {
    return fixture.nativeElement.querySelector('dialog');
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the native dialog as a modal', () => {
    setup();
    const showModalSpy = vi.spyOn(HTMLDialogElement.prototype, 'showModal');

    fixture.componentInstance.open();

    expect(showModalSpy).toHaveBeenCalledTimes(1);
  });

  it('closes the dialog when the close button is clicked', () => {
    setup();
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close');

    fixture.nativeElement
      .querySelector('.add-order-dialog__close')
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop (the dialog element itself) is clicked', () => {
    setup();
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close');

    dialogElement().dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking inside the panel', () => {
    setup();
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close');

    fixture.nativeElement
      .querySelector('.add-order-dialog__panel')
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('re-emits submitted from the inner form and closes the dialog', () => {
    setup(['BTCUSD'], { BTCUSD: { symbol: 'BTCUSD', bid: 100, ask: 101, timestamp: 0 } });
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, 'close');
    const submittedSpy = vi.fn();
    fixture.componentInstance.submitted.subscribe(submittedSpy);

    const select: HTMLSelectElement = fixture.nativeElement.querySelector(
      'select[formControlName="symbol"]',
    );
    select.value = 'BTCUSD';
    select.dispatchEvent(new Event('input'));
    select.dispatchEvent(new Event('change'));

    const sizeInput: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[formControlName="size"]',
    );
    sizeInput.value = '1';
    sizeInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(submittedSpy).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'BTCUSD', size: 1 }),
    );
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });
});
