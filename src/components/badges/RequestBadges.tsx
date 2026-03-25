import { Priority, RequestStatus, RequestType } from '@/types/request';
import { getDueStatus } from '@/lib/sla';

interface StatusBadgeProps {
  status: RequestStatus;
}

const statusStyles: Record<RequestStatus, string> = {
  Draft: 'bg-muted text-muted-foreground',
  Reviewed: 'bg-accent/15 text-accent',
  Approved: 'bg-success/15 text-success',
  Finalized: 'bg-primary/10 text-primary',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase ${statusStyles[status]}`}>
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase ${priorityStyles[priority]}`}>
      {priority}
    </span>
  );
}

interface TypeBadgeProps {
  type: RequestType;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-raised text-foreground border">
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
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

interface TagBadgeProps {
  tag: string;
}

export function TagBadge({ tag }: TagBadgeProps) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-accent/10 text-accent border border-accent/20">
      {tag}
    </span>
  );
}
