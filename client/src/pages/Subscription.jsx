import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { CreditCard, Calendar, CheckCircle, XCircle } from 'lucide-react';

const Subscription = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/subscriptions/current');
      setData(res.data);
    } catch (err) {} finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel? You will lose access to premium features at the end of the period.')) {
      await api.put('/subscriptions/cancel');
      fetchSubscription();
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Subscription</h1>

      <div className="hero-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>CURRENT PLAN</div>
            <div style={{ fontSize: '24px', fontWeight: '800' }}>{data?.subscription?.plan.toUpperCase()}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
            {data?.subscription?.status.toUpperCase()}
          </div>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', gap: '16px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} /> Next Billing: {data?.subscription?.current_period_end || 'N/A'}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Payment History</h2>
      {data?.payments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No payments found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data?.payments.map(p => (
            <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>{new Date(p.created_at).toLocaleDateString()}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.payment_gateway.toUpperCase()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '700' }}>{p.currency} ${p.amount}</div>
                <div style={{ fontSize: '11px', color: p.status === 'succeeded' ? 'var(--brand)' : 'var(--danger)' }}>
                  {p.status.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.subscription?.plan !== 'free' && data?.subscription?.status === 'active' && (
        <button onClick={handleCancel} className="btn-ghost" style={{ marginTop: '32px', color: 'var(--danger)', borderColor: 'var(--danger-light)' }}>
          Cancel Subscription
        </button>
      )}
    </div>
  );
};

export default Subscription;
