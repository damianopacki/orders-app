import { Injectable } from '@angular/core';
import { Observable, concatWith, filter, map, retry, throwError, timer } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import type { Quote } from '../models/quote';
import { deserializeMessage, parseQuotesMessage } from './parse-quotes-message';

const QUOTES_WEBSOCKET_URL = 'wss://webquotes.geeksoft.pl/websocket/quotes';
const MIN_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
const CONNECTION_CLOSED_MESSAGE = 'Quotes WebSocket connection closed';

const SUBSCRIBE_ADD_LIST_PATH = '/subscribe/addlist';
const SUBSCRIBE_REMOVE_LIST_PATH = '/subscribe/removelist';

interface SubscribeAddListMessage {
  readonly p: typeof SUBSCRIBE_ADD_LIST_PATH;
  readonly d: readonly string[];
}

interface SubscribeRemoveListMessage {
  readonly p: typeof SUBSCRIBE_REMOVE_LIST_PATH;
  readonly d: readonly string[];
}

type OutgoingQuotesMessage = SubscribeAddListMessage | SubscribeRemoveListMessage;

function reconnectDelay(retryCount: number): Observable<number> {
  return timer(Math.min(MIN_RECONNECT_DELAY_MS * 2 ** (retryCount - 1), MAX_RECONNECT_DELAY_MS));
}

@Injectable({ providedIn: 'root' })
export class QuotesSocket {
  private readonly subscribedSymbols = new Set<string>();
  private hasConnectedOnce = false;

  // Incoming frames are untrusted, hence `unknown`; outgoing ones stay typed via send().
  private readonly socket$: WebSocketSubject<unknown> = webSocket<unknown>({
    url: QUOTES_WEBSOCKET_URL,
    deserializer: deserializeMessage,
    openObserver: {
      next: () => {
        if (this.hasConnectedOnce) {
          this.resendSubscriptions();
        }
        this.hasConnectedOnce = true;
      },
    },
  });

  // A "clean" WebSocket close (code 1000) completes the stream instead of erroring it —
  // turning it into an error lets a single retry() handle every kind of disconnect with one
  // backoff. resetOnSuccess restarts that backoff on the first frame after a reconnect, so
  // occasional drops in a long session don't leave every later reconnect at the max delay.
  readonly quotes$: Observable<Quote[]> = this.socket$.pipe(
    concatWith(throwError(() => new Error(CONNECTION_CLOSED_MESSAGE))),
    retry({ delay: (_error, retryCount) => reconnectDelay(retryCount), resetOnSuccess: true }),
    map(parseQuotesMessage),
    filter((quotes) => quotes.length > 0),
  );

  subscribeToSymbols(symbols: readonly string[]): void {
    const newSymbols = symbols.filter((symbol) => !this.subscribedSymbols.has(symbol));
    if (newSymbols.length === 0) {
      return;
    }

    newSymbols.forEach((symbol) => this.subscribedSymbols.add(symbol));
    this.send({ p: SUBSCRIBE_ADD_LIST_PATH, d: newSymbols });
  }

  unsubscribeFromSymbols(symbols: readonly string[]): void {
    const existingSymbols = symbols.filter((symbol) => this.subscribedSymbols.has(symbol));
    if (existingSymbols.length === 0) {
      return;
    }

    existingSymbols.forEach((symbol) => this.subscribedSymbols.delete(symbol));
    this.send({ p: SUBSCRIBE_REMOVE_LIST_PATH, d: existingSymbols });
  }

  private resendSubscriptions(): void {
    if (this.subscribedSymbols.size > 0) {
      this.send({ p: SUBSCRIBE_ADD_LIST_PATH, d: Array.from(this.subscribedSymbols) });
    }
  }

  private send(message: OutgoingQuotesMessage): void {
    this.socket$.next(message);
  }
}
