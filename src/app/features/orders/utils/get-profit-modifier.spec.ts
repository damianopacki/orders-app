import { getProfitModifier } from './get-profit-modifier';

describe('getProfitModifier', () => {
  it('returns neutral for null', () => {
    expect(getProfitModifier(null)).toBe('neutral');
  });

  it('returns neutral for zero', () => {
    expect(getProfitModifier(0)).toBe('neutral');
  });

  it('returns positive for a positive value', () => {
    expect(getProfitModifier(0.01)).toBe('positive');
  });

  it('returns negative for a negative value', () => {
    expect(getProfitModifier(-0.01)).toBe('negative');
  });
});
