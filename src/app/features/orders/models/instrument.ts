export type ContractTypeId = number;

export interface Instrument {
  readonly symbol: string;
  readonly contractType: ContractTypeId;
}
