import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      price: 0,
      features: ['5 Invoices', '3 Clients', 'JMD only', 'No WhatsApp reminders'],
      cta: 'Start Free',
      plan: 'free'
    },
    {
      name: 'Starter',
      price: isAnnual ? 99 : 12,
      period: isAnnual ? '/year' : '/month',
      features: ['50 Invoices', '20 Clients', 'Multi-currency', 'WhatsApp reminders'],
      cta: 'Get Started',
      plan: 'starter',
      popular: false
    },
    {
      name: 'Pro',
      price: isAnnual ? 199 : 25,
      period: isAnnual ? '/year' : '/month',
      features: ['Unlimited everything', 'All currencies', 'Detailed Reports', 'Remove branding'],
      cta: 'Get Pro',
      plan: 'pro',
      popular: true
    }
  ];

  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Simple, Caribbean-Friendly Pricing</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Pay in JMD, USD, TTD or BBD. No hidden fees.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <span style={{ fontSize: '14px', fontWeight: isAnnual ? '400' : '600' }}>Monthly</span>
        <div 
          onClick={() => setIsAnnual(!isAnnual)}
          style={{ width: '48px', height: '24px', background: 'var(--brand)', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}
        >
          <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: isAnnual ? '26px' : '2px', transition: '0.2s' }}></div>
        </div>
        <span style={{ fontSize: '14px', fontWeight: isAnnual ? '600' : '400' }}>Annual</span>
        <span style={{ background: 'var(--brand-light)', color: 'var(--brand)', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>Save 33%</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {plans.map(p => (
          <div key={p.name} className="card" style={{ border: p.popular ? '2px solid var(--brand)' : '1px solid var(--border)', position: 'relative' }}>
            {p.popular && <div style={{ position: 'absolute', top: '-12px', right: '16px', background: 'var(--brand)', color: 'white', fontSize: '10px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>MOST POPULAR</div>}
            <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{p.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px', fontWeight: '800' }}>${p.price}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{p.period}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {p.features.map(f => <li key={f} style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>✓ {f}</li>)}
            </ul>
            <button onClick={() => navigate(`/register?plan=${p.plan}`)} className={p.popular ? "btn-primary" : "btn-ghost"}>{p.cta}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
