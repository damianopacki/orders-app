import type { Order } from '../models/order';
import type { Quote } from '../models/quote';
import { calculateProfit } from './calculate-profit';
import { groupOrdersBySymbol } from './group-orders-by-symbol';
import { summarizeGroup, type OrderGroupSummary } from './summarize-group';

export interface OrderRowViewModel {
  readonly order: Order;
  readonly profit: number | null;
}

export interface OrderGroupViewModel {
  readonly symbol: string;
  readonly summary: OrderGroupSummary;
  readonly expanded: boolean;
  readonly rows: readonly OrderRowViewModel[];
}

export function selectOrderGroups(
  orders: readonly Order[],
  quotesBySymbol: Readonly<Record<string, Quote>>,
  contractSizeBySymbol: Readonly<Record<string, number>>,
  expandedSymbols: readonly string[],
): OrderGroupViewModel[] {
  const expandedSymbolSet = new Set(expandedSymbols);

  return [...groupOrdersBySymbol(orders)]
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    .map(({ symbol, orders: groupOrders }) => {
      const bid = quotesBySymbol[symbol]?.bid;
      const contractSize = contractSizeBySymbol[symbol];

      const rows: OrderRowViewModel[] = groupOrders.map((order) => ({
        order,
        profit: calculateProfit(order, bid, contractSize),
      }));

      return {
        symbol,
        summary: summarizeGroup(
          groupOrders,
          rows.map((row) => row.profit),
        ),
        expanded: expandedSymbolSet.has(symbol),
        rows,
      };
    });
}
