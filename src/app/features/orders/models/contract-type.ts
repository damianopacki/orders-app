import type { ContractTypeId } from './instrument';

export interface ContractType {
  readonly contractType: ContractTypeId;
  readonly contractSize: number;
}
