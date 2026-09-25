import type { Order } from '../models/order';

export interface OrderGroupSummary {
  readonly orderCount: number;
  readonly totalSize: number;
  readonly totalSwap: number;
  readonly averageOpenPrice: number;
  readonly totalProfit: number | null;
}

export function summarizeGroup(
  orders: readonly Order[],
  profits: readonly (number | null)[],
): OrderGroupSummary {
  if (orders.length === 0) {
    return { orderCount: 0, totalSize: 0, totalSwap: 0, averageOpenPrice: 0, totalProfit: null };
  }

  const totalSize = orders.reduce((sum, order) => sum + order.size, 0);
  const totalSwap = orders.reduce((sum, order) => sum + order.swap, 0);
  const totalOpenPrice = orders.reduce((sum, order) => sum + order.openPrice, 0);
  const averageOpenPrice = totalOpenPrice / orders.length;

  const definedProfits = profits.filter((profit): profit is number => profit !== null);
  const totalProfit =
    definedProfits.length > 0 ? definedProfits.reduce((sum, profit) => sum + profit, 0) : null;

  return {
    orderCount: orders.length,
    totalSize,
    totalSwap,
    averageOpenPrice,
    totalProfit,
  };
}
