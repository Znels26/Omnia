import { Suspense } from 'react';
import { AuthForm } from '@/components/features/auth/AuthForm';

export const metadata = { title: 'Create Account — Omnia' };

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}><div className="spinner" /></div>}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
