import { deserializeMessage, parseQuotesMessage } from './parse-quotes-message';

const VALID_ENTRY = { s: 'BTCUSD', b: 100, a: 101, t: 123 };
const VALID_QUOTE = { symbol: 'BTCUSD', bid: 100, ask: 101, timestamp: 123 };

function quotesMessage(d: unknown): unknown {
  return { p: '/quotes/subscribed', d };
}

describe('parseQuotesMessage', () => {
  it('maps every valid entry of a quotes message', () => {
    const ethEntry = { s: 'ETHUSD', b: 2000, a: 2001, t: 124 };

    expect(parseQuotesMessage(quotesMessage([VALID_ENTRY, ethEntry]))).toEqual([
      VALID_QUOTE,
      { symbol: 'ETHUSD', bid: 2000, ask: 2001, timestamp: 124 },
    ]);
  });

  it('ignores other message types, such as the subscription acknowledgement', () => {
    expect(parseQuotesMessage({ p: '/subscribe/addlist', i: 0 })).toEqual([]);
  });

  it.each([null, undefined, 'text', 42, [VALID_ENTRY]])(
    'ignores a non-object message: %j',
    (message) => {
      expect(parseQuotesMessage(message)).toEqual([]);
    },
  );

  it.each([undefined, null, 'BTCUSD', VALID_ENTRY])(
    'ignores a quotes message whose d is %j',
    (d) => {
      expect(parseQuotesMessage(quotesMessage(d))).toEqual([]);
    },
  );

  it.each([
    ['a missing bid', { s: 'BTCUSD', a: 101, t: 123 }],
    ['a string bid', { ...VALID_ENTRY, b: '100' }],
    ['a null ask', { ...VALID_ENTRY, a: null }],
    ['a NaN bid', { ...VALID_ENTRY, b: Number.NaN }],
    ['an infinite timestamp', { ...VALID_ENTRY, t: Number.POSITIVE_INFINITY }],
    ['an empty symbol', { ...VALID_ENTRY, s: '' }],
    ['a numeric symbol', { ...VALID_ENTRY, s: 1 }],
    ['a null entry', null],
  ])('skips an entry with %s', (_label, entry) => {
    expect(parseQuotesMessage(quotesMessage([entry]))).toEqual([]);
  });

  it('keeps the valid entries next to malformed ones', () => {
    expect(parseQuotesMessage(quotesMessage([{ ...VALID_ENTRY, b: null }, VALID_ENTRY]))).toEqual([
      VALID_QUOTE,
    ]);
  });
});

describe('deserializeMessage', () => {
  it('parses a JSON text frame', () => {
    expect(deserializeMessage({ data: '{"p":"/quotes/subscribed"}' } as MessageEvent)).toEqual({
      p: '/quotes/subscribed',
    });
  });

  it('returns null instead of throwing for malformed JSON', () => {
    expect(deserializeMessage({ data: '{not json' } as MessageEvent)).toBeNull();
  });

  it('returns null for a non-text frame', () => {
    expect(deserializeMessage({ data: new ArrayBuffer(1) } as MessageEvent)).toBeNull();
  });
});
