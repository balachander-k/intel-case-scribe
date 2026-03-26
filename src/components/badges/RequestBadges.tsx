import { Priority, RequestStatus, RequestType } from '@/types/request';
import { getDueStatus } from '@/lib/sla';

interface StatusBadgeProps {
  status: RequestStatus;
}

const statusStyles: Record<RequestStatus, string> = {
  Draft: 'bg-muted text-muted-foreground',
  Reviewed: 'bg-primary/15 text-primary',
  Approved: 'bg-success/15 text-success',
  Finalized: 'bg-foreground/10 text-foreground',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase transition-colors duration-200 ${statusStyles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'Draft' ? 'bg-muted-foreground' : status === 'Reviewed' ? 'bg-primary' : status === 'Approved' ? 'bg-success' : 'bg-foreground'
      }`} />
      {status}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: Priority;
}

const priorityStyles: Record<Priority, string> = {
  Low: 'bg-muted text-muted-foreground',
  Medium: 'bg-warning/15 text-warning',
  High: 'bg-destructive/15 text-destructive',
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${priorityStyles[priority]}`}>
      {priority === 'High' && <span className="w-1.5 h-1.5 rounded-full bg-destructive mr-1.5 animate-pulse" />}
      {priority}
    </span>
  );
}

interface TypeBadgeProps {
  type: RequestType;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/15">
      {type}
    </span>
  );
}

interface DueBadgeProps {
  dueDate: string;
}

export function DueBadge({ dueDate }: DueBadgeProps) {
  const status = getDueStatus(dueDate);
  const styles = {
    overdue: 'bg-destructive/15 text-destructive',
    urgent: 'bg-warning/15 text-warning',
    normal: 'bg-muted text-muted-foreground',
  };
  const labels = { overdue: 'Overdue', urgent: 'Due Soon', normal: '' };

  if (status === 'normal') return null;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${styles[status]}`}>
      {status === 'overdue' && <span className="w-1.5 h-1.5 rounded-full bg-destructive mr-1.5 animate-pulse" />}
      {labels[status]}
    </span>
  );
}

interface TagBadgeProps {
  tag: string;
}

export function TagBadge({ tag }: TagBadgeProps) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 transition-colors duration-200 cursor-default">
      {tag}
    </span>
  );
}
