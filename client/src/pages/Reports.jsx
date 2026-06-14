import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.plan !== 'free') {
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      const res = await api.get('/reports/summary');
      setData(res.data);
    } catch (err) {} finally { setLoading(false); }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  if (user?.plan === 'free') {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Detailed Reports</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Reports are available on Starter and Pro plans.</p>
        <button className="btn-primary">Upgrade Now</button>
      </div>
    );
  }

  const COLORS = ['#1D9E75', '#C47C1A', '#D84040', '#A8B8B4'];
  const statusData = data ? [
    { name: 'Paid', value: data.invoice_by_status.paid },
    { name: 'Pending', value: data.invoice_by_status.pending },
    { name: 'Overdue', value: data.invoice_by_status.overdue },
    { name: 'Draft', value: data.invoice_by_status.draft },
  ] : [];

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Reports</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <MetricCard label="Total Billed" value={`$${data?.total_billed?.toLocaleString()}`} />
        <MetricCard label="Total Paid" value={`$${data?.total_paid?.toLocaleString()}`} />
        <MetricCard label="Outstanding" value={`$${data?.total_outstanding?.toLocaleString()}`} />
        <MetricCard label="Invoices" value={data?.total_billed ? Object.values(data.invoice_by_status).reduce((a,b)=>a+b) : 0} />
      </div>

      <div className="card" style={{ height: '300px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>Monthly Revenue</h3>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={data?.monthly_revenue}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} />
            <YAxis fontSize={10} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="revenue" fill="var(--brand)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ height: '300px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>Invoice Status</h3>
        <ResponsiveContainer width="100%" height="80%">
          <PieChart>
            <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>Top 5 Clients</h3>
        {data?.top_clients.map((c, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < data.top_clients.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontSize: '14px' }}>{c.name}</span>
            <span style={{ fontSize: '14px', fontWeight: '700' }}>${c.total_billed.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MetricCard = ({ label, value }) => (
  <div className="card" style={{ padding: '12px' }}>
    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '16px', fontWeight: '700' }}>{value}</div>
  </div>
);

export default Reports;
