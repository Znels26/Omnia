import { getUser, getProfile } from '@/lib/supabase/server';
import { ProposalView } from '@/components/features/proposals/ProposalView';
export const metadata = { title: 'Proposal Generator — Omnia' };
export default async function ProposalPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) return null;
  return <ProposalView profile={profile} />;
}
