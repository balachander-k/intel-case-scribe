import { create } from 'zustand';
import { Request, RequestStatus, Priority, RequestType, SLA_DAYS, AINotes, FollowUp } from '@/types/request';
import { addDays, format } from 'date-fns';

const generateId = () => `REQ-${String(Math.floor(Math.random() * 90000) + 10000)}`;
const generateFollowUpId = () => `FU-${String(Math.floor(Math.random() * 90000) + 10000)}`;

function calculateDueDate(type: RequestType, priority: Priority, createdAt: string): string {
  const days = SLA_DAYS[type][priority];
  return format(addDays(new Date(createdAt), days), 'yyyy-MM-dd');
}

const SEED_DATA: Request[] = [
  {
    id: 'REQ-10001', requestorName: 'Sarah Chen', requestorEmail: 'sarah.chen@company.com', requestorId: 'EMP-2041',
    requestType: 'Access', sourceChannel: 'Email', priority: 'High', status: 'Draft',
    rawDescription: 'hey i need access to the prod db asap, got a critical deployment tmrw and cant get in. tried resetting pw but no luck. pls help!!',
    aiNotes: undefined, tags: [], dueDate: '2026-03-26', createdAt: '2026-03-25T08:30:00Z', updatedAt: '2026-03-25T08:30:00Z', followUps: [],
  },
  {
    id: 'REQ-10002', requestorName: 'James Morton', requestorEmail: 'j.morton@company.com', requestorId: 'EMP-1587',
    requestType: 'Issue', sourceChannel: 'Chat', priority: 'Medium', status: 'Reviewed',
    rawDescription: 'The reporting dashboard keeps timing out when I try to load Q4 data. Been happening since yesterday. Other quarters load fine.',
    aiNotes: {
      summary: 'Reporting dashboard timeout when loading Q4 data',
      details: 'User reports persistent timeout errors when accessing Q4 data on the reporting dashboard. The issue began on March 24, 2026. Other quarterly data loads without issue, suggesting a data volume or query optimization problem specific to Q4.',
      proposedAction: 'Investigate Q4 dataset size and query performance. Check for indexing issues on the reporting database. Review recent schema changes.',
      suggestedTags: ['Performance', 'Dashboard', 'Database'],
    },
    tags: ['Performance', 'Dashboard'], dueDate: '2026-03-28', createdAt: '2026-03-24T14:15:00Z', updatedAt: '2026-03-25T09:00:00Z',
    followUps: [{ id: 'FU-10001', content: 'Confirmed issue reproduces on staging environment.', createdAt: '2026-03-25T09:00:00Z', completed: false }],
  },
  {
    id: 'REQ-10003', requestorName: 'Priya Sharma', requestorEmail: 'priya.s@company.com', requestorId: 'EMP-3201',
    requestType: 'Change', sourceChannel: 'Portal', priority: 'Low', status: 'Approved',
    rawDescription: 'We need to update the email notification template for the onboarding workflow. New copy has been approved by marketing. Can you schedule the change for next sprint?',
    aiNotes: {
      summary: 'Update onboarding email notification template with approved copy',
      details: 'Request to update the email notification template used in the employee onboarding workflow. New copy has been reviewed and approved by the marketing department. Requestor asks for the change to be scheduled in the next sprint cycle.',
      proposedAction: 'Schedule template update in next sprint. Coordinate with marketing for final copy assets. Implement and test in staging before deployment.',
      suggestedTags: ['Email', 'Onboarding', 'Scheduled'],
    },
    tags: ['Email', 'Onboarding', 'Scheduled'], dueDate: '2026-04-08', createdAt: '2026-03-20T10:00:00Z', updatedAt: '2026-03-23T16:30:00Z', followUps: [],
  },
  {
    id: 'REQ-10004', requestorName: 'Alex Rivera', requestorEmail: 'a.rivera@company.com', requestorId: 'EMP-0892',
    requestType: 'Information', sourceChannel: 'Email', priority: 'Low', status: 'Finalized',
    rawDescription: 'Can someone explain the process for requesting a new software license? I need Figma for my team.',
    aiNotes: {
      summary: 'Inquiry regarding software license request process for Figma',
      details: 'User is requesting information on the standard procedure for obtaining a new software license, specifically for Figma, for their team. This is an informational request with no system changes required.',
      proposedAction: 'Provide documentation link for the software procurement process. Direct user to the IT procurement portal for Figma license requests.',
      suggestedTags: ['Licensing', 'Informational'],
    },
    tags: ['Licensing', 'Informational'], dueDate: '2026-04-04', createdAt: '2026-03-18T11:00:00Z', updatedAt: '2026-03-19T14:00:00Z', followUps: [],
  },
  {
    id: 'REQ-10005', requestorName: 'Marcus Lee', requestorEmail: 'm.lee@company.com', requestorId: 'EMP-4455',
    requestType: 'Issue', sourceChannel: 'Chat', priority: 'High', status: 'Draft',
    rawDescription: 'vpn keeps dropping every 10 mins, cant work from home at all. super frustrating. my whole team is affected',
    aiNotes: undefined, tags: [], dueDate: '2026-03-26', createdAt: '2026-03-25T07:45:00Z', updatedAt: '2026-03-25T07:45:00Z', followUps: [],
  },
];

interface RequestStore {
  requests: Request[];
  addRequest: (data: Omit<Request, 'id' | 'createdAt' | 'updatedAt' | 'dueDate' | 'followUps' | 'status' | 'tags' | 'aiNotes'>) => string;
  updateRequest: (id: string, data: Partial<Request>) => void;
  updateStatus: (id: string, status: RequestStatus) => void;
  setAINotes: (id: string, notes: AINotes) => void;
  addFollowUp: (id: string, content: string) => void;
  toggleFollowUp: (requestId: string, followUpId: string) => void;
  getRequest: (id: string) => Request | undefined;
}

export const useRequestStore = create<RequestStore>((set, get) => ({
  requests: SEED_DATA,

  addRequest: (data) => {
    const now = new Date().toISOString();
    const id = generateId();
    const dueDate = calculateDueDate(data.requestType, data.priority, now);
    const newRequest: Request = {
      ...data, id, status: 'Draft', tags: [], aiNotes: undefined,
      dueDate, createdAt: now, updatedAt: now, followUps: [],
    };
    set((state) => ({ requests: [newRequest, ...state.requests] }));
    return id;
  },

  updateRequest: (id, data) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
      ),
    }));
  },

  updateStatus: (id, status) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
      ),
    }));
  },

  setAINotes: (id, notes) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id ? { ...r, aiNotes: notes, tags: notes.suggestedTags, updatedAt: new Date().toISOString() } : r
      ),
    }));
  },

  addFollowUp: (id, content) => {
    const followUp: FollowUp = { id: generateFollowUpId(), content, createdAt: new Date().toISOString(), completed: false };
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === id ? { ...r, followUps: [...r.followUps, followUp], updatedAt: new Date().toISOString() } : r
      ),
    }));
  },

  toggleFollowUp: (requestId, followUpId) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              followUps: r.followUps.map((f) =>
                f.id === followUpId ? { ...f, completed: !f.completed, completedAt: !f.completed ? new Date().toISOString() : undefined } : f
              ),
              updatedAt: new Date().toISOString(),
            }
          : r
      ),
    }));
  },

  getRequest: (id) => get().requests.find((r) => r.id === id),
}));
