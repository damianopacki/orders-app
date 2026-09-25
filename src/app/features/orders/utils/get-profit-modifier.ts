export type ProfitModifier = 'positive' | 'negative' | 'neutral';

export function getProfitModifier(profit: number | null): ProfitModifier {
  if (profit === null || profit === 0) {
    return 'neutral';
  }

  return profit > 0 ? 'positive' : 'negative';
}
