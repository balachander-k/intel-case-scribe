export type RequestType = 'Access' | 'Issue' | 'Information' | 'Change' | 'Other';
export type SourceChannel = 'Email' | 'Portal' | 'Chat';
export type Priority = 'Low' | 'Medium' | 'High';
export type RequestStatus = 'Draft' | 'Reviewed' | 'Approved' | 'Finalized';

export interface FollowUp {
  id: string;
  content: string;
  createdAt: string;
  completed: boolean;
  completedAt?: string;
}

export interface AINotes {
  summary: string;
  details: string;
  proposedAction: string;
  suggestedTags: string[];
}

export interface Request {
  id: string;
  requestorName: string;
  requestorEmail: string;
  requestorId: string;
  requestType: RequestType;
  sourceChannel: SourceChannel;
  priority: Priority;
  status: RequestStatus;
  rawDescription: string;
  aiNotes?: AINotes;
  tags: string[];
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  followUps: FollowUp[];
}

export const REQUEST_TYPE_OPTIONS: RequestType[] = ['Access', 'Issue', 'Information', 'Change', 'Other'];
export const SOURCE_CHANNEL_OPTIONS: SourceChannel[] = ['Email', 'Portal', 'Chat'];
export const PRIORITY_OPTIONS: Priority[] = ['Low', 'Medium', 'High'];
export const STATUS_OPTIONS: RequestStatus[] = ['Draft', 'Reviewed', 'Approved', 'Finalized'];

export const SLA_DAYS: Record<RequestType, Record<Priority, number>> = {
  Access: { Low: 5, Medium: 3, High: 1 },
  Issue: { Low: 7, Medium: 3, High: 1 },
  Information: { Low: 10, Medium: 5, High: 2 },
  Change: { Low: 14, Medium: 7, High: 3 },
  Other: { Low: 10, Medium: 5, High: 2 },
};
