import { getSideMultiplier } from './get-side-multiplier';

describe('getSideMultiplier', () => {
  it('returns 1 for BUY', () => {
    expect(getSideMultiplier('BUY')).toBe(1);
  });

  it('returns -1 for SELL', () => {
    expect(getSideMultiplier('SELL')).toBe(-1);
  });
});
