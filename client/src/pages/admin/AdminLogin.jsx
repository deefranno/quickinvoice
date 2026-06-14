import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [mustChange, setMustChange] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/auth/login', { email, password });
      if (res.data.must_change_password) {
        setMustChange(true);
        setTempToken(res.data.temp_token);
      } else {
        localStorage.setItem('qi_admin_token', res.data.token);
        navigate('/admin');
      }
    } catch (err) {
      setError('Invalid admin credentials');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/auth/change-password', { temp_token: tempToken, new_password: newPassword });
      localStorage.setItem('qi_admin_token', res.data.token);
      navigate('/admin');
    } catch (err) {
      setError('Failed to change password');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F9F8' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--brand)', borderRadius: '10px', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>Q</div>
          <h1 style={{ fontSize: '20px', margin: 0 }}>Admin Panel</h1>
        </div>

        {mustChange ? (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>You must change your password to continue.</p>
            <input type="password" placeholder="New Password" className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <button type="submit" className="btn-primary">Set Password & Sign In</button>
          </form>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && <div style={{ color: 'var(--danger)', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
            <input type="email" placeholder="Admin Email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="input" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="btn-primary">Sign In</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
