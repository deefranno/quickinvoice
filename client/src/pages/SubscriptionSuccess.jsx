import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan');
  const navigate = useNavigate();

  return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <CheckCircle size={80} color="var(--brand)" style={{ marginBottom: '24px' }} />
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Payment Successful!</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        You're now on the <strong>{plan}</strong> plan.
      </p>
      <button onClick={() => navigate('/dashboard')} className="btn-primary">Go to Dashboard</button>
    </div>
  );
};

export default SubscriptionSuccess;
