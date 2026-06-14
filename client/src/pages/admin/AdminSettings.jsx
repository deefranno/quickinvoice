import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const AdminSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('qi_admin_token')}` }
      });
      setSettings(res.data);
    } catch (err) {} finally { setLoading(false); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '32px' }}>Platform Settings</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>General Config</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Platform Name</label>
              <input className="input" value={settings.platform_name || ''} readOnly />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Support Email</label>
              <input className="input" value={settings.support_email || ''} readOnly />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Plan Limits</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Free Invoice Limit</label>
              <input className="input" type="number" value={settings.free_invoice_limit || ''} readOnly />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Free Client Limit</label>
              <input className="input" type="number" value={settings.free_client_limit || ''} readOnly />
            </div>
          </div>
        </div>
      </div>

      <button className="btn-primary" style={{ marginTop: '24px', width: '200px' }}>Save All Settings</button>
    </div>
  );
};

export default AdminSettings;
