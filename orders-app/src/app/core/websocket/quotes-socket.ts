import { Injectable } from '@angular/core';
import { Observable, filter, map, repeat, retry, timer } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import type { Quote } from '../../features/orders/models/quote';

const QUOTES_WEBSOCKET_URL = 'wss://webquotes.geeksoft.pl/websocket/quotes';
const MIN_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;

const SUBSCRIBE_ADD_LIST_PATH = '/subscribe/addlist';
const SUBSCRIBE_REMOVE_LIST_PATH = '/subscribe/removelist';
const QUOTES_SUBSCRIBED_PATH = '/quotes/subscribed';

interface SubscribeAddListMessage {
  readonly p: typeof SUBSCRIBE_ADD_LIST_PATH;
  readonly d: readonly string[];
}

interface SubscribeRemoveListMessage {
  readonly p: typeof SUBSCRIBE_REMOVE_LIST_PATH;
  readonly d: readonly string[];
}

type OutgoingQuotesMessage = SubscribeAddListMessage | SubscribeRemoveListMessage;

interface QuoteDto {
  readonly s: string;
  readonly b: number;
  readonly a: number;
  readonly t: number;
}

interface QuotesSubscribedMessage {
  readonly p: typeof QUOTES_SUBSCRIBED_PATH;
  readonly d: readonly QuoteDto[];
}

type IncomingQuotesMessage = QuotesSubscribedMessage | { readonly p: string };

function isQuotesSubscribedMessage(message: IncomingQuotesMessage): message is QuotesSubscribedMessage {
  return message.p === QUOTES_SUBSCRIBED_PATH;
}

function mapQuoteDto(dto: QuoteDto): Quote {
  return { symbol: dto.s, bid: dto.b, ask: dto.a, timestamp: dto.t };
}

function reconnectDelay(retryCount: number): Observable<number> {
  return timer(Math.min(MIN_RECONNECT_DELAY_MS * 2 ** (retryCount - 1), MAX_RECONNECT_DELAY_MS));
}

@Injectable({ providedIn: 'root' })
export class QuotesSocket {
  private readonly subscribedSymbols = new Set<string>();
  private hasConnectedOnce = false;

  private readonly socket$: WebSocketSubject<OutgoingQuotesMessage | IncomingQuotesMessage> = webSocket({
    url: QUOTES_WEBSOCKET_URL,
    openObserver: {
      next: () => {
        if (this.hasConnectedOnce) {
          this.resendSubscriptions();
        }
        this.hasConnectedOnce = true;
      },
    },
  });

  // retry() only intercepts errors, repeat() only intercepts clean completions —
  // both are needed so a "clean" WebSocket close (code 1000) reconnects too.
  readonly quotes$: Observable<Quote[]> = this.socket$.pipe(
    retry({ delay: (_error, retryCount) => reconnectDelay(retryCount) }),
    repeat({ delay: (count) => reconnectDelay(count) }),
    filter(isQuotesSubscribedMessage),
    map((message) => message.d.map(mapQuoteDto)),
  );

  subscribeToSymbols(symbols: readonly string[]): void {
    const newSymbols = symbols.filter((symbol) => !this.subscribedSymbols.has(symbol));
    if (newSymbols.length === 0) {
      return;
    }

    newSymbols.forEach((symbol) => this.subscribedSymbols.add(symbol));
    this.socket$.next({ p: SUBSCRIBE_ADD_LIST_PATH, d: newSymbols });
  }

  unsubscribeFromSymbols(symbols: readonly string[]): void {
    const existingSymbols = symbols.filter((symbol) => this.subscribedSymbols.has(symbol));
    if (existingSymbols.length === 0) {
      return;
    }

    existingSymbols.forEach((symbol) => this.subscribedSymbols.delete(symbol));
    this.socket$.next({ p: SUBSCRIBE_REMOVE_LIST_PATH, d: existingSymbols });
  }

  private resendSubscriptions(): void {
    if (this.subscribedSymbols.size > 0) {
      this.socket$.next({ p: SUBSCRIBE_ADD_LIST_PATH, d: Array.from(this.subscribedSymbols) });
    }
  }
}
