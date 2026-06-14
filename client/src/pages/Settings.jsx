import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Settings = () => {
  const { user, setUser, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    business_name: user?.business_name || '',
    default_currency: user?.default_currency || 'JMD',
    gct_enabled: user?.gct_enabled || 0,
    whatsapp_reminders: user?.whatsapp_reminders || 1
  });

  const handleSave = async () => {
    try {
      await api.put('/settings', formData);
      setUser({ ...user, ...formData });
      alert('Settings saved!');
    } catch (err) {
      alert('Error saving settings');
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Settings</h1>

      <div className="hero-card" style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>YOUR PLAN</div>
        <div style={{ fontSize: '24px', fontWeight: '800' }}>{user?.plan.toUpperCase()}</div>
        <p style={{ fontSize: '13px', opacity: 0.9, margin: '8px 0' }}>Manage your subscription and features.</p>
      </div>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px' }}>BUSINESS INFO</h2>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input className="input" placeholder="Owner Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input className="input" placeholder="Business Name" value={formData.business_name} onChange={e => setFormData({...formData, business_name: e.target.value})} />
        </div>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px' }}>DEFAULT CURRENCY</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {['JMD', 'USD', 'TTD', 'BBD'].map(curr => (
            <button key={curr} onClick={() => setFormData({...formData, default_currency: curr})} style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: formData.default_currency === curr ? 'var(--brand)' : 'white', color: formData.default_currency === curr ? 'white' : 'inherit', fontWeight: '600' }}>
              {curr}
            </button>
          ))}
        </div>
      </section>

      <button onClick={handleSave} className="btn-primary" style={{ marginBottom: '24px' }}>Save Settings</button>
      
      <div style={{ textAlign: 'center' }}>
        <button onClick={logout} style={{ color: 'var(--danger)', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Sign Out</button>
      </div>
    </div>
  );
};

export default Settings;
