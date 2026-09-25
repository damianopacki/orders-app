import type { Order } from '../models/order';

export interface OrderGroup {
  readonly symbol: string;
  readonly orders: readonly Order[];
}

export function groupOrdersBySymbol(orders: readonly Order[]): OrderGroup[] {
  const groupsBySymbol = new Map<string, Order[]>();

  for (const order of orders) {
    const group = groupsBySymbol.get(order.symbol);
    if (group) {
      group.push(order);
    } else {
      groupsBySymbol.set(order.symbol, [order]);
    }
  }

  return Array.from(groupsBySymbol, ([symbol, groupOrders]) => ({ symbol, orders: groupOrders }));
}
