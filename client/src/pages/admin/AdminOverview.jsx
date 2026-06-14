import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Users, CreditCard, TrendingUp, DollarSign, Activity } from 'lucide-react';

const adminApi = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('qi_admin_token')}` }
});

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats', adminApi());
      setStats(res.data);
    } catch (err) {
      setError('Failed to load stats.');
    } finally { setLoading(false); }
  };

  if (loading) return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'var(--danger)' }}>{error}</div>;
  if (!stats) return null;

  return (
    <div>
      <h1 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '8px' }}>Platform Overview</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px' }}>Live platform metrics</p>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Total Users" value={stats.total_users} icon={<Users size={18} />} color="#6366f1" />
        <StatCard label="Pro Subscribers" value={stats.pro_users} icon={<CreditCard size={18} />} color="var(--brand)" />
        <StatCard label="MRR" value={`$${stats.mrr?.toFixed(2)}`} icon={<TrendingUp size={18} />} color="#f59e0b" />
        <StatCard label="Revenue This Month" value={`$${stats.revenue_this_month?.toFixed(2)}`} icon={<DollarSign size={18} />} color="#10b981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Recent Signups */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Recent Signups</h3>
          {stats.recent_signups?.length === 0
            ? <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No signups yet.</p>
            : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: '600' }}>Name</th>
                    <th style={{ textAlign: 'left', fontWeight: '600' }}>Plan</th>
                    <th style={{ textAlign: 'left', fontWeight: '600' }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_signups.map(u => (
                    <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 0' }}>
                        <div style={{ fontWeight: '600' }}>{u.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{u.email}</div>
                      </td>
                      <td><span className={`badge badge-${u.plan === 'pro' ? 'paid' : 'draft'}`}>{u.plan}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>

        {/* Recent Payments */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Recent Payments</h3>
          {stats.recent_payments?.length === 0
            ? <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No payments yet.</p>
            : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: '600' }}>User</th>
                    <th style={{ textAlign: 'left', fontWeight: '600' }}>Amount</th>
                    <th style={{ textAlign: 'left', fontWeight: '600' }}>Gateway</th>
                    <th style={{ textAlign: 'left', fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_payments.map(p => (
                    <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 0' }}>
                        <div style={{ fontWeight: '600' }}>{p.user_name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{new Date(p.created_at).toLocaleDateString()}</div>
                      </td>
                      <td style={{ fontWeight: '700' }}>${p.amount?.toFixed(2)}</td>
                      <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{p.payment_gateway}</td>
                      <td><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </div>

      {/* Gateway breakdown */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Gateway Breakdown</h3>
        {stats.gateway_breakdown?.length === 0
          ? <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No payment data yet.</p>
          : <div style={{ display: 'flex', gap: '24px' }}>
              {stats.gateway_breakdown?.map(g => (
                <div key={g.payment_gateway} style={{ flex: 1, padding: '16px', background: 'var(--page-bg)', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'capitalize', marginBottom: '8px' }}>{g.payment_gateway}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--brand)' }}>${g.revenue?.toFixed(2)}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{g.transactions} transactions</div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="card" style={{ marginBottom: 0 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</span>
      <span style={{ color, background: color + '18', padding: '6px', borderRadius: '8px', display: 'flex' }}>{icon}</span>
    </div>
    <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = { succeeded: ['#E8F7F2', '#0F6E56'], pending: ['#FEF3E2', '#9A5C0A'], failed: ['#FEF0F0', '#A32D2D'], refunded: ['#F2F7F5', '#6B7F7A'] };
  const [bg, fg] = colors[status] || colors.pending;
  return <span style={{ background: bg, color: fg, fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>{status}</span>;
};

export default AdminOverview;
