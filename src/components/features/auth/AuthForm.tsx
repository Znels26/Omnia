'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

type FormMode = 'login' | 'signup' | 'reset';

export function AuthForm({ mode: initialMode }: { mode: 'login' | 'signup' }) {
  const [mode, setMode] = useState<FormMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
        setResetSent(true);
        return;
      }

      if (!password) return;

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
              display_name: name.trim().split(' ')[0] || email.split('@')[0],
            },
          },
        });
        if (error) throw error;
        toast.success('Account created! Signing you in…');
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          toast.success('Account created! Please sign in.');
          router.push('/login');
          return;
        }
        router.push('/dashboard');
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        // If "remember me" is off, mark session as session-only
        if (!rememberMe) {
          sessionStorage.setItem('omnia-session-only', '1');
        } else {
          sessionStorage.removeItem('omnia-session-only');
        }

        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    paddingLeft: '36px',
    width: '100%',
    background: 'hsl(240 10% 6%)',
    border: '1px solid hsl(240 6% 18%)',
    borderRadius: '10px',
    padding: '11px 12px 11px 36px',
    color: 'hsl(0 0% 90%)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'hsl(240 10% 4%)' }}>
      <nav style={{ padding: '16px 24px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', width: 'fit-content' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'hsl(205 90% 48% / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={14} color="hsl(205, 90%, 48%)" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '16px', color: 'hsl(0 0% 90%)' }}>Omnia</span>
        </Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>

          {/* Forgot password — reset sent state */}
          {mode === 'reset' && resetSent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'hsl(142 70% 40% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Mail size={24} color="hsl(142, 70%, 55%)" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>Check your email</h2>
              <p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', lineHeight: 1.6, marginBottom: '24px' }}>
                We sent a password reset link to <strong style={{ color: 'hsl(0 0% 80%)' }}>{email}</strong>. Check your inbox and follow the link.
              </p>
              <button
                onClick={() => { setMode('login'); setResetSent(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(205,90%,60%)', fontSize: '14px', fontWeight: 600, margin: '0 auto' }}
              >
                <ArrowLeft size={14} /> Back to sign in
              </button>
            </div>
          ) : mode === 'reset' ? (
            /* Forgot password form */
            <>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'hsl(205 90% 48% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Lock size={20} color="hsl(205, 90%, 48%)" />
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Reset password</h1>
                <p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)' }}>
                  Enter your email and we&apos;ll send a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 55%)', pointerEvents: 'none' }} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required style={inputStyle} />
                </div>
                <button type="submit" disabled={loading || !email} className="btn btn-primary" style={{ marginTop: '4px', height: '44px', fontSize: '15px', fontWeight: 600 }}>
                  {loading ? (
                    <span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    <>Send reset link <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <button
                onClick={() => setMode('login')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 55%)', fontSize: '13px', marginTop: '20px', width: '100%' }}
              >
                <ArrowLeft size={13} /> Back to sign in
              </button>
            </>
          ) : (
            /* Login / Signup */
            <>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'hsl(205 90% 48% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Sparkles size={22} color="hsl(205, 90%, 48%)" />
                </div>
                <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>
                  {mode === 'signup' ? 'Create your account' : 'Welcome back'}
                </h1>
                <p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)' }}>
                  {mode === 'signup' ? 'Start your free Omnia account' : 'Sign in to your Omnia account'}
                </p>
              </div>

              {/* Mode tabs */}
              <div style={{ display: 'flex', background: 'hsl(240 6% 11%)', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
                {(['login', 'signup'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.15s', background: mode === m ? 'hsl(240 8% 7%)' : 'transparent', color: mode === m ? 'hsl(0 0% 90%)' : 'hsl(240 5% 55%)' }}>
                    {m === 'login' ? 'Sign In' : 'Sign Up'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {mode === 'signup' && (
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 55%)', pointerEvents: 'none' }} />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
                  </div>
                )}
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 55%)', pointerEvents: 'none' }} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required style={inputStyle} />
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(240 5% 55%)', pointerEvents: 'none' }} />
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required minLength={6} style={{ ...inputStyle, paddingRight: '40px' }} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 55%)', display: 'flex' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Remember me + Forgot password row (login only) */}
                {mode === 'login' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                      <div
                        onClick={() => setRememberMe(!rememberMe)}
                        style={{
                          width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                          border: `1.5px solid ${rememberMe ? 'hsl(205,90%,48%)' : 'hsl(240 6% 24%)'}`,
                          background: rememberMe ? 'hsl(205,90%,48%)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                      >
                        {rememberMe && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: '13px', color: 'hsl(240 5% 60%)' }}>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(205,90%,60%)', fontSize: '13px', fontWeight: 500, padding: 0 }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button type="submit" disabled={loading || !email || !password} className="btn btn-primary" style={{ marginTop: '4px', height: '44px', fontSize: '15px', fontWeight: 600 }}>
                  {loading ? (
                    <span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    <>{mode === 'signup' ? 'Create Account' : 'Sign In'} <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '13px', color: 'hsl(240 5% 55%)', marginTop: '20px' }}>
                {mode === 'signup' ? (
                  <>Already have an account?{' '}
                    <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'hsl(205, 90%, 48%)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Sign in</button>
                  </>
                ) : (
                  <>No account yet?{' '}
                    <button onClick={() => setMode('signup')} style={{ background: 'none', border: 'none', color: 'hsl(205, 90%, 48%)', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Sign up free</button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
