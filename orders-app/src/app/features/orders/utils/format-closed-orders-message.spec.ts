import { formatClosedOrdersMessage } from './format-closed-orders-message';

describe('formatClosedOrdersMessage', () => {
  it('formats a single order id', () => {
    expect(formatClosedOrdersMessage([5])).toBe('Zamknięto zlecenie nr 5');
  });

  it('formats multiple order ids separated by commas', () => {
    expect(formatClosedOrdersMessage([1, 2, 3])).toBe('Zamknięto zlecenie nr 1, 2, 3');
  });
});
