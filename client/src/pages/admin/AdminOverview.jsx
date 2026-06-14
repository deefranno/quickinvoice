import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('qi_admin_token')}` }
      });
      setStats(res.data);
    } catch (err) {} finally { setLoading(false); }
  };

  if (loading) return <div>Loading Admin Stats...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '32px' }}>Platform Overview</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <StatCard label="Total Users" value={stats.total_users} />
        <StatCard label="Active Subs" value={stats.active_subscriptions} />
        <StatCard label="MRR" value={`$${stats.mrr.toLocaleString()}`} />
        <StatCard label="Revenue (MoM)" value={`$${stats.revenue_this_month.toLocaleString()}`} />
        <StatCard label="Failed Payments" value={stats.failed_payments} color={stats.failed_payments > 0 ? 'var(--danger)' : 'inherit'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{ height: '350px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>Signups (Last 30 Days)</h3>
          {/* Chart placeholder or LineChart */}
        </div>
        <div className="card" style={{ height: '350px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>Revenue (Last 6 Months)</h3>
          {/* Chart placeholder or BarChart */}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Recent Signups</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '8px 0' }}>Name</th>
                <th>Email</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_signups.map(u => (
                <tr key={u.id} style={{ fontSize: '13px', borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 0' }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Gateway Performance</h3>
          {Object.entries(stats.gateway_breakdown).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{key}</span>
              <span style={{ fontSize: '14px' }}>{val.subscribers} subs | ${val.revenue.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="card" style={{ padding: '20px' }}>
    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{label}</div>
    <div style={{ fontSize: '24px', fontWeight: '800', color: color || 'inherit' }}>{value}</div>
  </div>
);

export default AdminOverview;
