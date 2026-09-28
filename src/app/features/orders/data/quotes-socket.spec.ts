import type { Quote } from '../models/quote';
import { QuotesSocket } from './quotes-socket';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];

  readyState = 0;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  readonly sent: unknown[] = [];

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }

  close(): void {
    // Required by the WebSocket interface; unused directly by these tests.
  }

  simulateOpen(): void {
    this.readyState = 1;
    this.onopen?.(new Event('open'));
  }

  simulateClose(wasClean: boolean): void {
    this.readyState = 3;
    this.onclose?.({ wasClean, code: wasClean ? 1000 : 1006 } as CloseEvent);
  }

  simulateMessage(payload: unknown): void {
    this.simulateRawMessage(JSON.stringify(payload));
  }

  simulateRawMessage(data: string): void {
    this.onmessage?.({ data } as MessageEvent);
  }
}

function currentSocket(): FakeWebSocket {
  return FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
}

describe('QuotesSocket', () => {
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    originalWebSocket = globalThis.WebSocket;
    FakeWebSocket.instances = [];
    globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
    vi.useFakeTimers();
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    vi.useRealTimers();
  });

  it('sends a well-formed JSON addlist message for new symbols', () => {
    const quotesSocket = new QuotesSocket();
    quotesSocket.quotes$.subscribe();
    currentSocket().simulateOpen();

    quotesSocket.subscribeToSymbols(['BTCUSD', 'ETHUSD']);

    expect(currentSocket().sent).toEqual([{ p: '/subscribe/addlist', d: ['BTCUSD', 'ETHUSD'] }]);
  });

  it('sends a removelist message only for symbols that were actually subscribed', () => {
    const quotesSocket = new QuotesSocket();
    quotesSocket.quotes$.subscribe();
    currentSocket().simulateOpen();
    quotesSocket.subscribeToSymbols(['BTCUSD']);

    quotesSocket.unsubscribeFromSymbols(['BTCUSD', 'ETHUSD']);

    expect(currentSocket().sent).toEqual([
      { p: '/subscribe/addlist', d: ['BTCUSD'] },
      { p: '/subscribe/removelist', d: ['BTCUSD'] },
    ]);
  });

  it('does not resend anything on the very first connection', () => {
    const quotesSocket = new QuotesSocket();
    quotesSocket.quotes$.subscribe();

    currentSocket().simulateOpen();

    expect(currentSocket().sent).toEqual([]);
  });

  it('emits mapped quotes only for /quotes/subscribed messages, ignoring others', () => {
    const quotesSocket = new QuotesSocket();
    const received: Quote[][] = [];
    quotesSocket.quotes$.subscribe((quotes) => received.push(quotes));
    currentSocket().simulateOpen();

    currentSocket().simulateMessage({ p: '/some/other/event', d: [] });
    currentSocket().simulateMessage({
      p: '/quotes/subscribed',
      d: [{ s: 'BTCUSD', b: 100, a: 101, t: 123 }],
    });

    expect(received).toEqual([[{ symbol: 'BTCUSD', bid: 100, ask: 101, timestamp: 123 }]]);
  });

  it('survives a malformed JSON frame without reconnecting', () => {
    const quotesSocket = new QuotesSocket();
    const received: Quote[][] = [];
    quotesSocket.quotes$.subscribe((quotes) => received.push(quotes));
    currentSocket().simulateOpen();

    currentSocket().simulateRawMessage('{not json');
    vi.advanceTimersByTime(1000);
    currentSocket().simulateMessage({
      p: '/quotes/subscribed',
      d: [{ s: 'BTCUSD', b: 100, a: 101, t: 123 }],
    });

    expect(FakeWebSocket.instances.length).toBe(1);
    expect(received).toEqual([[{ symbol: 'BTCUSD', bid: 100, ask: 101, timestamp: 123 }]]);
  });

  it('skips malformed quote entries and emits nothing when none are valid', () => {
    const quotesSocket = new QuotesSocket();
    const received: Quote[][] = [];
    quotesSocket.quotes$.subscribe((quotes) => received.push(quotes));
    currentSocket().simulateOpen();

    currentSocket().simulateMessage({ p: '/quotes/subscribed', d: [{ s: 'BTCUSD', b: 'oops' }] });
    currentSocket().simulateMessage({ p: '/quotes/subscribed', d: 'oops' });
    currentSocket().simulateMessage({
      p: '/quotes/subscribed',
      d: [
        { s: 'BTCUSD', b: null, a: 101, t: 123 },
        { s: 'ETHUSD', b: 2000, a: 2001, t: 124 },
      ],
    });

    expect(FakeWebSocket.instances.length).toBe(1);
    expect(received).toEqual([[{ symbol: 'ETHUSD', bid: 2000, ask: 2001, timestamp: 124 }]]);
  });

  it('reconnects with a growing delay after an unclean close and resubscribes tracked symbols', () => {
    const quotesSocket = new QuotesSocket();
    quotesSocket.quotes$.subscribe();
    currentSocket().simulateOpen();
    quotesSocket.subscribeToSymbols(['BTCUSD']);

    currentSocket().simulateClose(false);
    expect(FakeWebSocket.instances.length).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(FakeWebSocket.instances.length).toBe(2);

    currentSocket().simulateOpen();

    expect(currentSocket().sent).toEqual([{ p: '/subscribe/addlist', d: ['BTCUSD'] }]);
  });

  it('reconnects after a clean close too', () => {
    const quotesSocket = new QuotesSocket();
    quotesSocket.quotes$.subscribe();
    currentSocket().simulateOpen();
    quotesSocket.subscribeToSymbols(['ETHUSD']);

    currentSocket().simulateClose(true);
    expect(FakeWebSocket.instances.length).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(FakeWebSocket.instances.length).toBe(2);

    currentSocket().simulateOpen();

    expect(currentSocket().sent).toEqual([{ p: '/subscribe/addlist', d: ['ETHUSD'] }]);
  });

  describe('reconnect backoff', () => {
    const QUOTES_FRAME = { p: '/quotes/subscribed', d: [{ s: 'BTCUSD', b: 100, a: 101, t: 123 }] };

    function expectReconnectAfter(delayMs: number): void {
      const socketCount = FakeWebSocket.instances.length;

      vi.advanceTimersByTime(delayMs - 1);
      expect(FakeWebSocket.instances.length).toBe(socketCount);

      vi.advanceTimersByTime(1);
      expect(FakeWebSocket.instances.length).toBe(socketCount + 1);
    }

    it('doubles the delay while reconnect attempts keep failing', () => {
      new QuotesSocket().quotes$.subscribe();

      currentSocket().simulateClose(false);
      expectReconnectAfter(1000);

      currentSocket().simulateClose(false);
      expectReconnectAfter(2000);
    });

    it('starts again from the minimum delay after a connection that received data', () => {
      new QuotesSocket().quotes$.subscribe();

      currentSocket().simulateClose(false);
      expectReconnectAfter(1000);
      currentSocket().simulateClose(false);
      expectReconnectAfter(2000);

      currentSocket().simulateOpen();
      currentSocket().simulateMessage(QUOTES_FRAME);
      currentSocket().simulateClose(false);

      expectReconnectAfter(1000);
    });

    it('shares one backoff between clean and unclean closes, and resets it the same way', () => {
      new QuotesSocket().quotes$.subscribe();

      currentSocket().simulateClose(true);
      expectReconnectAfter(1000);
      currentSocket().simulateClose(false);
      expectReconnectAfter(2000);

      currentSocket().simulateOpen();
      currentSocket().simulateMessage(QUOTES_FRAME);
      currentSocket().simulateClose(true);

      expectReconnectAfter(1000);
    });
  });
});
