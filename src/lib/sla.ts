import { isAfter, isBefore, parseISO, differenceInDays } from 'date-fns';

export function isOverdue(dueDate: string): boolean {
  return isBefore(parseISO(dueDate), new Date());
}

export function daysUntilDue(dueDate: string): number {
  return differenceInDays(parseISO(dueDate), new Date());
}

export function getDueStatus(dueDate: string): 'overdue' | 'urgent' | 'normal' {
  const days = daysUntilDue(dueDate);
  if (days < 0) return 'overdue';
  if (days <= 1) return 'urgent';
  return 'normal';
}
