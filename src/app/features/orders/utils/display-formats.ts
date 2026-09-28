export const QUANTITY_DECIMAL_FORMAT = '1.0-2';
// Up to 5 decimals: forex prices are quoted to 5 places, and swap/profit values are often
// fractions of a cent — rounding them to 2 would display most of them as 0.00.
export const PRICE_DECIMAL_FORMAT = '1.2-5';
export const AMOUNT_DECIMAL_FORMAT = '1.2-5';
export const ORDER_TIME_FORMAT = 'dd.MM.yyyy HH:mm:ss';
export const PROFIT_UNAVAILABLE_PLACEHOLDER = '—';
export const PROFIT_UNAVAILABLE_TITLE = 'Brak aktualnych notowań';
