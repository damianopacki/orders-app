import type { Quote } from '../../features/orders/models/quote';

const QUOTES_SUBSCRIBED_PATH = '/quotes/subscribed';

interface QuoteDto {
  readonly s: string;
  readonly b: number;
  readonly a: number;
  readonly t: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isQuoteDto(value: unknown): value is QuoteDto {
  return (
    isRecord(value) &&
    typeof value['s'] === 'string' &&
    value['s'] !== '' &&
    isFiniteNumber(value['b']) &&
    isFiniteNumber(value['a']) &&
    isFiniteNumber(value['t'])
  );
}

function mapQuoteDto(dto: QuoteDto): Quote {
  return { symbol: dto.s, bid: dto.b, ask: dto.a, timestamp: dto.t };
}

// Socket data is untrusted: anything that isn't a well-formed quotes message yields no
// quotes, and malformed entries are skipped without discarding the valid ones next to them.
export function parseQuotesMessage(message: unknown): Quote[] {
  if (!isRecord(message) || message['p'] !== QUOTES_SUBSCRIBED_PATH) {
    return [];
  }

  const entries = message['d'];
  return Array.isArray(entries) ? entries.filter(isQuoteDto).map(mapQuoteDto) : [];
}

// Replaces rxjs' default JSON.parse deserializer, which errors the stream (and so forces
// a reconnect) on a single malformed frame.
export function deserializeMessage(event: MessageEvent): unknown {
  if (typeof event.data !== 'string') {
    return null;
  }

  try {
    return JSON.parse(event.data) as unknown;
  } catch {
    return null;
  }
}
