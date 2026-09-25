import { ComponentFixture, TestBed } from '@angular/core/testing';

import { parseDateTimeLocal } from '@utils/date-time-local';

import type { Quote } from '../../models/quote';
import { AddOrderForm } from './add-order-form';

describe('AddOrderForm', () => {
  let fixture: ComponentFixture<AddOrderForm>;

  function setup(availableSymbols: string[] = ['BTCUSD', 'ETHUSD'], quotesBySymbol: Record<string, Quote> = {}): void {
    fixture = TestBed.createComponent(AddOrderForm);
    fixture.componentRef.setInput('availableSymbols', availableSymbols);
    fixture.componentRef.setInput('quotesBySymbol', quotesBySymbol);
    fixture.detectChanges();
  }

  function select(name: string): HTMLSelectElement {
    return fixture.nativeElement.querySelector(`select[formControlName="${name}"]`);
  }

  function input(name: string): HTMLInputElement {
    return fixture.nativeElement.querySelector(`input[formControlName="${name}"]`);
  }

  function submitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[type="submit"]');
  }

  function setValue(el: HTMLInputElement | HTMLSelectElement, value: string): void {
    el.value = value;
    el.dispatchEvent(new Event('input'));
    el.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('lists the available symbols as options', () => {
    setup(['BTCUSD', 'ETHUSD']);

    const options = Array.from(select('symbol').options)
      .map((option) => option.value)
      .filter(Boolean);

    expect(options).toEqual(['BTCUSD', 'ETHUSD']);
  });

  it('disables the submit button while the form is invalid', () => {
    setup();

    expect(submitButton().disabled).toBe(true);
  });

  it('fills openPrice with the current bid when the symbol changes', () => {
    setup(['BTCUSD'], { BTCUSD: { symbol: 'BTCUSD', bid: 71000.5, ask: 71010, timestamp: 0 } });

    setValue(select('symbol'), 'BTCUSD');

    expect(input('openPrice').value).toBe('71000.5');
  });

  it('leaves openPrice untouched when there is no quote for the chosen symbol', () => {
    setup(['BTCUSD'], {});

    setValue(select('symbol'), 'BTCUSD');

    expect(input('openPrice').value).toBe('0');
  });

  it('fills openPrice once a quote arrives after the symbol was already selected', () => {
    setup(['BTCUSD'], {});

    setValue(select('symbol'), 'BTCUSD');
    expect(input('openPrice').value).toBe('0');

    fixture.componentRef.setInput('quotesBySymbol', {
      BTCUSD: { symbol: 'BTCUSD', bid: 71500, ask: 71510, timestamp: 0 },
    });
    fixture.detectChanges();

    expect(input('openPrice').value).toBe('71500');
  });

  it('does not overwrite a manually edited price on later quote ticks for the same symbol', () => {
    setup(['BTCUSD'], { BTCUSD: { symbol: 'BTCUSD', bid: 100, ask: 101, timestamp: 0 } });

    setValue(select('symbol'), 'BTCUSD');
    expect(input('openPrice').value).toBe('100');

    setValue(input('openPrice'), '150');

    fixture.componentRef.setInput('quotesBySymbol', {
      BTCUSD: { symbol: 'BTCUSD', bid: 200, ask: 201, timestamp: 1 },
    });
    fixture.detectChanges();

    expect(input('openPrice').value).toBe('150');
  });

  it('re-arms auto-fill when the symbol changes again', () => {
    setup(['BTCUSD', 'ETHUSD'], {
      BTCUSD: { symbol: 'BTCUSD', bid: 100, ask: 101, timestamp: 0 },
      ETHUSD: { symbol: 'ETHUSD', bid: 3000, ask: 3001, timestamp: 0 },
    });

    setValue(select('symbol'), 'BTCUSD');
    expect(input('openPrice').value).toBe('100');

    setValue(select('symbol'), 'ETHUSD');
    expect(input('openPrice').value).toBe('3000');
  });

  it('shows a validation error for a non-positive size once touched', () => {
    setup();

    setValue(input('size'), '0');
    input('size').dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Podaj wartość większą od zera.');
  });

  it('emits submitted with the order shape and resets the form', () => {
    setup(['BTCUSD'], { BTCUSD: { symbol: 'BTCUSD', bid: 100, ask: 101, timestamp: 0 } });
    const submittedSpy = vi.fn();
    fixture.componentInstance.submitted.subscribe(submittedSpy);

    setValue(select('symbol'), 'BTCUSD');
    setValue(select('side'), 'SELL');
    setValue(input('size'), '2');
    setValue(input('openPrice'), '105');
    setValue(input('openTime'), '2025-06-20T18:30');

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(submittedSpy).toHaveBeenCalledWith({
      symbol: 'BTCUSD',
      side: 'SELL',
      size: 2,
      openPrice: 105,
      openTime: parseDateTimeLocal('2025-06-20T18:30'),
      swap: 0,
    });
    expect(select('symbol').value).toBe('');
    expect(select('side').value).toBe('BUY');
  });

  it('fills openPrice again when the same symbol is picked after a submit', () => {
    setup(['BTCUSD'], { BTCUSD: { symbol: 'BTCUSD', bid: 100, ask: 101, timestamp: 0 } });

    setValue(select('symbol'), 'BTCUSD');
    setValue(input('size'), '1');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(input('openPrice').value).toBe('0');

    setValue(select('symbol'), 'BTCUSD');

    expect(input('openPrice').value).toBe('100');
  });

  it('does not emit when the form is invalid', () => {
    setup();
    const submittedSpy = vi.fn();
    fixture.componentInstance.submitted.subscribe(submittedSpy);

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(submittedSpy).not.toHaveBeenCalled();
  });
});
