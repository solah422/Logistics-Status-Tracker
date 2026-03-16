export type Status = string;

export interface StatusHistory {
  status: Status;
  timestamp: string;
  notes?: string;
}

export interface Package {
  id: string; // Internal UUID
  trackingNumber: string; // Secondary identifier, entered first
  rNumberIdNumber?: string; // Primary identifier (R Number / ID Number)
  
  dateSubmitted?: string; // ISO date
  dateReleased?: string; // ISO date
  
  status: Status;
  
  // Conditional fields based on status
  expectedDutyAmount?: number; // For 'Customs Processed'
  clarificationDetails?: string; // For 'Clarification Required'
  cancellationReason?: string; // For 'Submitted to Cancel'
  
  // Other fields
  documentsUploaded: boolean;
  brokerFormStatus?: string; // Manually triggered
  
  createdAt: string;
  updatedAt: string;
  history: StatusHistory[];
}

export const DEFAULT_STATUSES = [
  "Pending",
  "Customs Checking",
  "Customs Processed",
  "Clarification Required",
  "Submitted for Valuation",
  "Allowance Given",
  "Submitted to Cancel",
  "Cancelled",
  "Payment Received",
  "Bond & Released"
];

export const FINAL_STATUSES = [
  "Allowance Given",
  "Cancelled",
  "Bond & Released"
];
