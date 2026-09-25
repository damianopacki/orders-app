import { formatAddedOrderMessage } from './format-added-order-message';

describe('formatAddedOrderMessage', () => {
  it('formats the added order id', () => {
    expect(formatAddedOrderMessage(42)).toBe('Dodano zlecenie nr 42');
  });
});
