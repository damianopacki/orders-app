import type { ContractType } from '../models/contract-type';
import type { Instrument } from '../models/instrument';

export function buildContractSizeMap(
  instruments: readonly Instrument[],
  contractTypes: readonly ContractType[],
): Record<string, number> {
  const contractSizeByTypeId = new Map<number, number>(
    contractTypes.map((contractType) => [contractType.contractType, contractType.contractSize]),
  );

  const result: Record<string, number> = {};
  for (const instrument of instruments) {
    const contractSize = contractSizeByTypeId.get(instrument.contractType);
    if (contractSize !== undefined) {
      result[instrument.symbol] = contractSize;
    }
  }

  return result;
}
