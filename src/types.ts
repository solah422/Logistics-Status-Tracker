export type Status = string;

export interface StatusHistory {
  status: Status;
  timestamp: string;
  notes?: string;
}

export type CustomFieldType = 'text' | 'number' | 'date' | 'checkbox' | 'dropdown' | 'boolean' | 'select';

export interface CustomFieldDef {
  id: string;
  name: string;
  type: CustomFieldType;
  options?: string[]; // For dropdowns
  required?: boolean;
}

export interface SavedFilter {
  id: string;
  name: string;
  statuses?: string[];
  dateRange?: { start: string; end: string };
  missingDocuments?: boolean | null;
  criteria?: any;
  filters?: any;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  colorClass?: string;
}

export interface Package {
  id: string; // Internal UUID
  trackingNumber: string; // Secondary identifier, entered first
  rNumberIdNumber?: string; // Primary identifier (R Number / ID Number)
  
  dateSubmitted?: string; // ISO date
  dateReleased?: string; // ISO date
  
  status: Status;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  
  // Conditional fields based on status
  expectedDutyAmount?: number; // For 'Customs Processed'
  clarificationDetails?: string; // For 'Clarification Required'
  cancellationReason?: string; // For 'Submitted to Cancel'
  
  // Other fields
  documentsUploaded: boolean;
  readySystemStatusUpdated?: boolean; // New checkbox
  brokerFormStatus?: string; // Manually triggered
  notes?: string; // General notes or Info Needed details
  tags?: string[]; // Array of tag IDs
  
  customFields?: Record<string, any>; // Dynamic fields
  
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // For soft delete
  archivedAt?: string; // For auto-archive
  history: StatusHistory[];
}

export const DEFAULT_STATUSES = [
  "Pending",
  "Info Needed",
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

export const DEFAULT_STATUS_COLORS: Record<string, string> = {
  "Pending": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  "Info Needed": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Customs Checking": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Customs Processed": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  "Clarification Required": "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  "Submitted for Valuation": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "Allowance Given": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Submitted to Cancel": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "Cancelled": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "Payment Received": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  "Bond & Released": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
};
