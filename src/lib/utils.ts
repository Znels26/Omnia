import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy') {
  try { return format(typeof date === 'string' ? parseISO(date) : date, fmt); }
  catch { return ''; }
}

export function timeAgo(date: string | Date) {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch { return ''; }
}

export function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k,i)).toFixed(1)} ${sizes[i]}`;
}

export function formatCurrency(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export function fileIcon(type: string) {
  const m: Record<string,string> = { pdf:'📄', docx:'📝', doc:'📝', xlsx:'📊', xls:'📊', pptx:'📋', ppt:'📋', txt:'📃', csv:'📊', md:'📝', png:'🖼️', jpg:'🖼️', jpeg:'🖼️' };
  return m[type.toLowerCase()] || '📄';
}

export const PLAN_LIMITS = {
  free:  { ai: 30,   notes: 20,  files: 10,  tasks: 50,  reminders: 10,  content: 15,  exports: 5,   invoices: 0  },
  plus:  { ai: 500,  notes: -1,  files: 50,  tasks: -1,  reminders: 100, content: 200, exports: 50,  invoices: 25 },
  pro:   { ai: -1,   notes: -1,  files: 250, tasks: -1,  reminders: -1,  content: -1,  exports: 500, invoices: -1 },
};
