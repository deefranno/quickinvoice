import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/register', { name, email, password, business_name: businessName });
      localStorage.setItem('qi_token', res.data.token);
      localStorage.setItem('qi_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      
      const plan = searchParams.get('plan');
      if (plan) {
        navigate(`/subscribe?plan=${plan}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>Create Account</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Start your 14-day free trial</p>
      </div>

      <div className="card" style={{ width: '100%' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ color: 'var(--danger)', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Full Name</label>
            <input type="text" className="input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Email Address</label>
            <input type="email" className="input" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Business Name</label>
            <input type="text" className="input" placeholder="Acme Ltd" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Password</label>
            <input type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary">Create Account</button>
        </form>
      </div>

      <p style={{ marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--brand)', fontWeight: '600', textDecoration: 'none' }}>Sign In</Link>
      </p>
    </div>
  );
};

export default Register;
