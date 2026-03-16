import { unstable_cache } from 'next/cache';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

// Page data cached for 20s. Mutations in view components revalidate via tags.
// Using admin client inside cache (no request-context dependencies).

export const getCachedNotes = unstable_cache(
  async (userId: string) => {
    const admin = createAdminSupabaseClient();
    const [{ data: notes }, { data: folders }] = await Promise.all([
      admin.from('notes').select('*').eq('user_id', userId).eq('is_archived', false).order('is_pinned', { ascending: false }).order('updated_at', { ascending: false }).limit(100),
      admin.from('note_folders').select('*').eq('user_id', userId),
    ]);
    return { notes: notes || [], folders: folders || [] };
  },
  ['notes'],
  { revalidate: 20, tags: ['notes'] }
);

export const getCachedChats = unstable_cache(
  async (userId: string) => {
    const admin = createAdminSupabaseClient();
    const { data } = await admin.from('chats').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    return data || [];
  },
  ['chats'],
  { revalidate: 20, tags: ['chats'] }
);

export const getCachedDashboard = unstable_cache(
  async (userId: string) => {
    const admin = createAdminSupabaseClient();
    const [tasks, reminders, notes, chats, exports_, usage] = await Promise.all([
      admin.from('tasks').select('*').eq('user_id', userId).neq('status', 'completed').order('created_at', { ascending: false }).limit(5).then(r => r.data || []),
      admin.from('reminders').select('*').eq('user_id', userId).eq('status', 'pending').order('remind_at', { ascending: true }).limit(5).then(r => r.data || []),
      admin.from('notes').select('*').eq('user_id', userId).eq('is_archived', false).order('updated_at', { ascending: false }).limit(4).then(r => r.data || []),
      admin.from('chats').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(4).then(r => r.data || []),
      admin.from('exports').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(4).then(r => r.data || []),
      admin.from('usage_counters').select('*').eq('user_id', userId).single().then(r => r.data),
    ]);
    return { tasks, reminders, notes, chats, exports: exports_, usage };
  },
  ['dashboard'],
  { revalidate: 20, tags: ['dashboard'] }
);

export const getCachedPlanner = unstable_cache(
  async (userId: string) => {
    const admin = createAdminSupabaseClient();
    const [{ data: tasks }, { data: goals }, { data: habits }] = await Promise.all([
      admin.from('tasks').select('*').eq('user_id', userId).order('sort_order').order('created_at', { ascending: false }),
      admin.from('goals').select('*').eq('user_id', userId).eq('is_completed', false).order('created_at'),
      admin.from('habits').select('*').eq('user_id', userId).order('created_at'),
    ]);
    return { tasks: tasks || [], goals: goals || [], habits: habits || [] };
  },
  ['planner'],
  { revalidate: 20, tags: ['planner'] }
);

export const getCachedFiles = unstable_cache(
  async (userId: string) => {
    const admin = createAdminSupabaseClient();
    const { data } = await admin.from('files').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  },
  ['files'],
  { revalidate: 20, tags: ['files'] }
);

export const getCachedContent = unstable_cache(
  async (userId: string) => {
    const admin = createAdminSupabaseClient();
    const { data } = await admin.from('content_items').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    return data || [];
  },
  ['content'],
  { revalidate: 20, tags: ['content'] }
);

export const getCachedInvoices = unstable_cache(
  async (userId: string) => {
    const admin = createAdminSupabaseClient();
    const { data } = await admin.from('invoices').select('*, items:invoice_items(*)').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  },
  ['invoices'],
  { revalidate: 20, tags: ['invoices'] }
);

export const getCachedReminders = unstable_cache(
  async (userId: string) => {
    const admin = createAdminSupabaseClient();
    const { data } = await admin.from('reminders').select('*').eq('user_id', userId).order('remind_at', { ascending: true });
    return data || [];
  },
  ['reminders'],
  { revalidate: 20, tags: ['reminders'] }
);

export const getCachedSubscription = unstable_cache(
  async (userId: string) => {
    const admin = createAdminSupabaseClient();
    const { data } = await admin.from('subscriptions').select('*').eq('user_id', userId).single();
    return data;
  },
  ['subscription'],
  { revalidate: 30, tags: ['subscription'] }
);
