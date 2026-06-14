import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const adminHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('qi_admin_token')}` } });

const AdminSubscriptions = () => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => { fetchSubs(); }, []);

  const fetchSubs = async () => {
    try {
      const res = await api.get('/admin/subscriptions', adminHeaders());
      setSubs(res.data);
    } catch (err) {}
    finally { setLoading(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this subscription? The user will be downgraded to Free.')) return;
    setCancelling(id);
    try {
      await api.put(`/admin/subscriptions/${id}/cancel`, {}, adminHeaders());
      fetchSubs();
    } catch (err) { alert('Failed to cancel.'); }
    finally { setCancelling(null); }
  };

  const statusColor = { active: ['#E8F7F2', '#0F6E56'], cancelled: ['#FEF0F0', '#A32D2D'], expired: ['#FEF3E2', '#9A5C0A'] };

  if (loading) return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '8px' }}>Subscriptions</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>{subs.length} total records</p>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ background: 'var(--page-bg)' }}>
            <tr style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>User</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Plan</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Gateway</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Billing</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Amount</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Period End</th>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subs.length === 0 && (
              <tr><td colSpan="8" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No subscriptions yet.</td></tr>
            )}
            {subs.map(s => {
              const [bg, fg] = statusColor[s.status] || statusColor.cancelled;
              return (
                <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: '600' }}>{s.user_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.user_email}</div>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ background: 'var(--brand-light)', color: 'var(--brand-dark)', fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>{s.plan}</span>
                  </td>
                  <td style={{ padding: '14px 12px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{s.payment_gateway || '—'}</td>
                  <td style={{ padding: '14px 12px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{s.billing_cycle}</td>
                  <td style={{ padding: '14px 12px', fontWeight: '700' }}>${s.amount?.toFixed(2)}</td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{ background: bg, color: fg, fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>{s.status}</span>
                  </td>
                  <td style={{ padding: '14px 12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {s.status === 'active' && (
                      <button
                        onClick={() => handleCancel(s.id)}
                        disabled={cancelling === s.id}
                        style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        {cancelling === s.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
