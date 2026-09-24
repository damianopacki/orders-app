export function formatClosedOrdersMessage(ids: readonly number[]): string {
  return `Zamknięto zlecenie nr ${ids.join(', ')}`;
}
