export type OrderSide = 'BUY' | 'SELL';

export interface Order {
  readonly id: number;
  readonly symbol: string;
  readonly side: OrderSide;
  readonly size: number;
  readonly openPrice: number;
  readonly openTime: number;
  readonly swap: number;
}

export type NewOrder = Omit<Order, 'id'>;

export interface OrdersResponseDto {
  readonly data: readonly Order[];
}
