import { diffSymbols } from './diff-symbols';

describe('diffSymbols', () => {
  it('detects newly added symbols', () => {
    expect(diffSymbols(['BTCUSD'], ['BTCUSD', 'ETHUSD'])).toEqual({
      added: ['ETHUSD'],
      removed: [],
    });
  });

  it('detects removed symbols', () => {
    expect(diffSymbols(['BTCUSD', 'ETHUSD'], ['BTCUSD'])).toEqual({
      added: [],
      removed: ['ETHUSD'],
    });
  });

  it('returns empty diffs when nothing changed', () => {
    expect(diffSymbols(['BTCUSD'], ['BTCUSD'])).toEqual({ added: [], removed: [] });
  });

  it('handles empty inputs on both sides', () => {
    expect(diffSymbols([], [])).toEqual({ added: [], removed: [] });
  });
});
