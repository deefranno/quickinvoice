import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const adminHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('qi_admin_token')}` } });

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(null);

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/admin/payments', adminHeaders());
      setPayments(res.data);
    } catch (err) {}
    finally { setLoading(false); }
  };

  const handleRefund = async (id) => {
    if (!window.confirm('Mark this payment as refunded?')) return;
    setRefunding(id);
    try {
      await api.put(`/admin/payments/${id}/refund`, { note: 'Admin refund' }, adminHeaders());
      fetchPayments();
    } catch (err) { alert('Failed to refund.'); }
    finally { setRefunding(null); }
  };

  const total = payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + (p.amount || 0), 0);
  const refunded = payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '8px' }}>Payments</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '28px' }}>{payments.length} total transactions</p>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Revenue</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--brand)' }}>${total.toFixed(2)}</div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Refunded</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--danger)' }}>${refunded.toFixed(2)}</div>
        </div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Net Revenue</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>${(total - refunded).toFixed(2)}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ background: 'var(--page-bg)' }}>
            <tr style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>User</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Amount</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Gateway</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '14px 12px', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '14px 20px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No payments yet.</td></tr>
            )}
            {payments.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: '600' }}>{p.user_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.user_email}</div>
                </td>
                <td style={{ padding: '14px 12px', color: 'var(--text-secondary)', fontSize: '13px' }}>{p.description || '—'}</td>
                <td style={{ padding: '14px 12px', fontWeight: '700' }}>${p.amount?.toFixed(2)} <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.currency}</span></td>
                <td style={{ padding: '14px 12px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{p.payment_gateway}</td>
                <td style={{ padding: '14px 12px' }}><StatusBadge status={p.status} /></td>
                <td style={{ padding: '14px 12px', color: 'var(--text-secondary)', fontSize: '13px' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '14px 20px' }}>
                  {p.status === 'succeeded' && (
                    <button
                      onClick={() => handleRefund(p.id)}
                      disabled={refunding === p.id}
                      style={{ background: 'var(--warning-light)', color: 'var(--warning)', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {refunding === p.id ? '...' : 'Refund'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = { succeeded: ['#E8F7F2', '#0F6E56'], pending: ['#FEF3E2', '#9A5C0A'], failed: ['#FEF0F0', '#A32D2D'], refunded: ['#F2F7F5', '#6B7F7A'] };
  const [bg, fg] = map[status] || map.pending;
  return <span style={{ background: bg, color: fg, fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>{status}</span>;
};

export default AdminPayments;
