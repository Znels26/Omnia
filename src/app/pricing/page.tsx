import Link from 'next/link';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
export const metadata = { title: 'Pricing — Omnia' };
const PLANS = [
  { tier:'free', name:'Free', price:{m:0,y:0}, features:['20 AI messages/month','10 notes','5 file uploads','3 exports','Basic planner','5 reminders'] },
  { tier:'plus', name:'Plus', price:{m:9,y:79}, features:['150 AI messages/month','100 notes','25 uploads','25 exports/month','All AI modes','Document builder','Full planner','50 reminders'], highlight:true },
  { tier:'pro', name:'Pro', price:{m:19,y:169}, features:['500 AI messages/month','Unlimited notes & tasks','100 uploads','100 exports','Invoice generation','Priority support','Advanced AI','5GB storage'] },
];
export default function PricingPage() {
  return (
    <div style={{ minHeight:'100dvh', background:'hsl(240 10% 4%)' }}>
      <nav style={{ borderBottom:'1px solid hsl(240 6% 14%)', padding:'0 24px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:'8px', textDecoration:'none' }}>
          <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'hsl(205 90% 48% / 0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}><Sparkles size={14} color="hsl(205, 90%, 48%)" /></div>
          <span style={{ fontWeight:700, color:'hsl(0 0% 90%)' }}>Omnia</span>
        </Link>
        <Link href="/signup" style={{ padding:'8px 16px', background:'hsl(205 90% 48%)', color:'white', borderRadius:'10px', fontSize:'14px', fontWeight:600, textDecoration:'none' }}>Get Started</Link>
      </nav>
      <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'60px 24px' }}>
        <div style={{ textAlign:'center', marginBottom:'48px' }}>
          <h1 style={{ fontSize:'40px', fontWeight:800, marginBottom:'12px' }}>Simple, transparent pricing</h1>
          <p style={{ fontSize:'18px', color:'hsl(240 5% 55%)' }}>Start free. Upgrade when you need more.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'20px' }}>
          {PLANS.map(p => (
            <div key={p.tier} className="card" style={{ padding:'28px', display:'flex', flexDirection:'column', borderColor:p.highlight?'hsl(205 90% 48% / 0.4)':undefined, boxShadow:p.highlight?'0 0 30px hsl(205 90% 48% / 0.1)':undefined, position:'relative' }}>
              {p.highlight && <div style={{ position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', padding:'4px 14px', borderRadius:'999px', background:'hsl(205, 90%, 48%)', color:'white', fontSize:'11px', fontWeight:700, whiteSpace:'nowrap' }}>Most Popular</div>}
              <h2 style={{ fontSize:'20px', fontWeight:700, marginBottom:'8px' }}>{p.name}</h2>
              <div style={{ marginBottom:'20px' }}>
                <span style={{ fontSize:'36px', fontWeight:800 }}>{p.price.m === 0 ? 'Free' : `$${p.price.m}`}</span>
                {p.price.m > 0 && <span style={{ color:'hsl(240 5% 55%)', fontSize:'14px' }}>/month</span>}
                {p.price.y > 0 && <p style={{ fontSize:'12px', color:'#34d399', marginTop:'4px' }}>or ${p.price.y}/year</p>}
              </div>
              <ul style={{ listStyle:'none', padding:0, margin:'0 0 24px', flex:1, display:'flex', flexDirection:'column', gap:'8px' }}>
                {p.features.map(f => <li key={f} style={{ display:'flex', gap:'8px', fontSize:'13px', alignItems:'flex-start' }}><Check size={14} color="#34d399" style={{ flexShrink:0, marginTop:'1px' }} /><span style={{ color:'hsl(240 5% 65%)' }}>{f}</span></li>)}
              </ul>
              <Link href="/signup" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'11px', borderRadius:'10px', background:p.highlight?'hsl(205, 90%, 48%)':'transparent', border:`1px solid ${p.highlight?'transparent':'hsl(240 6% 20%)'}`, color:p.highlight?'white':'hsl(0 0% 80%)', textDecoration:'none', fontWeight:600, fontSize:'14px' }}>
                {p.tier === 'free' ? 'Get Started Free' : 'Start 7-Day Trial'} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
