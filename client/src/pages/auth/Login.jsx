import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  const handleDemo = async () => {
    try {
      await login('demo@quickinvoice.ky', 'demo1234');
      navigate('/dashboard');
    } catch (err) {
      setError('Demo login failed');
    }
  };

  return (
    <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', background: 'var(--brand)', borderRadius: '12px', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '24px' }}>Q</div>
        <h1 style={{ fontSize: '24px', margin: 0 }}>QuickInvoice</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Caribbean</p>
      </div>

      <div className="card" style={{ width: '100%' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ color: 'var(--danger)', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Email Address</label>
            <input type="email" className="input" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Password</label>
            <input type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary">Sign In</button>
        </form>
      </div>

      <p style={{ marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--brand)', fontWeight: '600', textDecoration: 'none' }}>Register</Link>
      </p>
      <button onClick={handleDemo} style={{ marginTop: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}>
        Continue as Demo
      </button>
    </div>
  );
};

export default Login;
