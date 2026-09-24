import { buildContractSizeMap } from './build-contract-size-map';

describe('buildContractSizeMap', () => {
  it('maps instrument symbols to their contract size', () => {
    const map = buildContractSizeMap(
      [
        { symbol: 'BTCUSD', contractType: 0 },
        { symbol: 'EURPLN', contractType: 5 },
      ],
      [
        { contractType: 0, contractSize: 1 },
        { contractType: 5, contractSize: 100000 },
      ],
    );

    expect(map).toEqual({ BTCUSD: 1, EURPLN: 100000 });
  });

  it('skips instruments referencing an unknown contract type', () => {
    const map = buildContractSizeMap([{ symbol: 'BTCUSD', contractType: 99 }], [{ contractType: 0, contractSize: 1 }]);

    expect(map).toEqual({});
  });

  it('returns an empty map for empty inputs', () => {
    expect(buildContractSizeMap([], [])).toEqual({});
  });
});
