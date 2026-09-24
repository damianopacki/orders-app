import type { QuoteMessage } from './quotes-socket';
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
    this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent);
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
    const received: QuoteMessage[][] = [];
    quotesSocket.quotes$.subscribe((quotes) => received.push(quotes));
    currentSocket().simulateOpen();

    currentSocket().simulateMessage({ p: '/some/other/event', d: [] });
    currentSocket().simulateMessage({
      p: '/quotes/subscribed',
      d: [{ s: 'BTCUSD', b: 100, a: 101, t: 123 }],
    });

    expect(received).toEqual([[{ symbol: 'BTCUSD', bid: 100, ask: 101, timestamp: 123 }]]);
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
});
