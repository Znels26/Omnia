export const metadata = { title: 'Code Studio — Coming Soon | Omnia' };

export default function CodeStudioPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'hsl(262 83% 58% / 0.12)', border: '1px solid hsl(262 83% 58% / 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(262,83%,75%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '999px', background: 'hsl(262 83% 58% / 0.1)', border: '1px solid hsl(262 83% 58% / 0.2)', marginBottom: '16px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(262,83%,75%)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coming Soon</span>
      </div>
      <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '10px' }}>Code Studio</h1>
      <p style={{ fontSize: '14px', color: 'hsl(240 5% 52%)', maxWidth: '400px', lineHeight: 1.65, margin: '0 auto' }}>
        A full AI-powered IDE with live preview, multi-file projects, npm packages, and one-click deployment. We&apos;re building something special — check back soon.
      </p>
    </div>
  );
}
