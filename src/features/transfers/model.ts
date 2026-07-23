export interface TransactionSplit {
  id: string;
  categoryId: string;
  categoryName: string;
  amountCents: number;
  notes: string | null;
}

export interface TransferCandidate {
  id: string;
  accountName: string;
  date: string;
  description: string;
  amountCents: number;
}

export interface TransferLinkDetails {
  id: string;
  role: "source" | "destination";
  source: TransferCandidate;
  destination: TransferCandidate | null;
}

export interface SplitWrite {
  categoryId: string;
  amountCents: number;
  notes: string | null;
}
