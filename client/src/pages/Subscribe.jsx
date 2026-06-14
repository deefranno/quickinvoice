import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Subscribe = () => {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') || 'starter';
  const [step, setStep] = useState(1);
  const [gateway, setGateway] = useState('stripe');
  const navigate = useNavigate();

  const handleSubscribe = () => {
    // Mock subscription
    navigate('/subscription/success?plan=' + plan);
  };

  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: '4px', background: s <= step ? 'var(--brand)' : 'var(--border)', borderRadius: '2px' }}></div>
        ))}
      </div>

      {step === 1 ? (
        <div>
          <h1 style={{ fontSize: '20px', marginBottom: '24px' }}>Plan Summary</h1>
          <div className="card">
            <div style={{ fontWeight: '700', fontSize: '18px' }}>{plan.toUpperCase()}</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Unlimited invoices, custom branding, and detailed reports.</p>
            <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '16px' }}>$25<span style={{ fontSize: '14px', fontWeight: '400' }}>/month</span></div>
          </div>
          <button onClick={() => setStep(2)} className="btn-primary" style={{ marginTop: '24px' }}>Continue to Payment</button>
        </div>
      ) : (
        <div>
          <h1 style={{ fontSize: '20px', marginBottom: '24px' }}>Choose Payment Method</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <GatewayCard 
              id="stripe" 
              name="Card Payment" 
              desc="Visa, Mastercard accepted" 
              selected={gateway === 'stripe'} 
              onSelect={() => setGateway('stripe')} 
            />
            <GatewayCard 
              id="wipay" 
              name="WiPay" 
              desc="Caribbean bank cards" 
              selected={gateway === 'wipay'} 
              onSelect={() => setGateway('wipay')} 
            />
          </div>
          <button onClick={handleSubscribe} className="btn-primary" style={{ marginTop: '24px' }}>Pay Now</button>
        </div>
      )}
    </div>
  );
};

const GatewayCard = ({ name, desc, selected, onSelect }) => (
  <div onClick={onSelect} className="card" style={{ border: selected ? '2px solid var(--brand)' : '1px solid var(--border)', cursor: 'pointer' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontWeight: '600' }}>{name}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{desc}</div>
      </div>
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {selected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--brand)' }}></div>}
      </div>
    </div>
  </div>
);

export default Subscribe;
