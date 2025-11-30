export class CreateContractorAdvanceDto {
  contractorId: string;
  projectId: string;
  amount: number | string;
  paidDate?: string;
  notes?: string;
  paidById?: string;
}
