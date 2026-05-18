import { Timestamp } from 'firebase/firestore';

// ─── Transaction Status ──────────────────────────────────────────────────────

export type TransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';

// ─── Financial Transaction (audit trail) ─────────────────────────────────────

export interface FinancialTransaction {
  id: string;
  wompiTransactionId: string;
  reference: string;
  userId: string;
  enrollmentId: string;
  institutionId: string;
  cohortId: string;

  // ─── Financial ─────────────────────────────────────────────────────────────
  amountCents: number;
  currency: 'COP';
  paymentMethod: string;

  // ─── Status ────────────────────────────────────────────────────────────────
  status: TransactionStatus;
  wompiStatus: string;
  webhookReceivedAt?: Date | Timestamp | null;

  // ─── Metadata ──────────────────────────────────────────────────────────────
  createdAt: Date | Timestamp;
  metadata?: Record<string, unknown>;
}
