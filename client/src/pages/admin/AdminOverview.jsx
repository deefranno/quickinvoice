import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('qi_admin_token');
      const res = await api.get('/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      setError('Failed to load stats. You may not be authenticated.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading Admin Stats...</div>;
  if (error) return <div style={{ padding: '20px', color: 'var(--danger)' }}>{error}</div>;
  if (!stats) return <div style={{ padding: '20px' }}>No data available.</div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '32px' }}>Platform Overview</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Total Users" value={stats.total_users ?? 0} />
        <StatCard label="Active Subs" value={stats.active_subscriptions ?? 0} />
        <StatCard label="MRR" value={`$${(stats.mrr ?? 0).toLocaleString()}`} />
        <StatCard label="Revenue (MoM)" value={`$${(stats.revenue_this_month ?? 0).toLocaleString()}`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Recent Signups</h3>
          {stats.recent_signups?.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No signups yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px 0' }}>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_signups?.map(u => (
                  <tr key={u.id} style={{ fontSize: '13px', borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 0' }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Gateway Performance</h3>
          {stats.gateway_breakdown && Object.entries(stats.gateway_breakdown).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{key}</span>
              <span style={{ fontSize: '14px' }}>{val.subscribers} subs · ${val.revenue?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="card" style={{ padding: '20px', marginBottom: 0 }}>
    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{label}</div>
    <div style={{ fontSize: '26px', fontWeight: '800', color: color || 'inherit' }}>{value}</div>
  </div>
);

export default AdminOverview;
