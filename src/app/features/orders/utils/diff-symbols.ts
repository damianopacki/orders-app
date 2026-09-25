export interface SymbolsDiff {
  readonly added: string[];
  readonly removed: string[];
}

export function diffSymbols(previous: readonly string[], current: readonly string[]): SymbolsDiff {
  const previousSet = new Set(previous);
  const currentSet = new Set(current);

  return {
    added: current.filter((symbol) => !previousSet.has(symbol)),
    removed: previous.filter((symbol) => !currentSet.has(symbol)),
  };
}
