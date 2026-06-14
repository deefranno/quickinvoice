import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('qi_admin_token')}` }
      });
      setUsers(res.data);
    } catch (err) {} finally { setLoading(false); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '32px' }}>Users</h1>
      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#F9FAFB' }}>
            <tr style={{ textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '16px' }}>User</th>
              <th>Plan</th>
              <th>Invoices</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--border)', fontSize: '14px' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: '600' }}>{u.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</div>
                </td>
                <td><span className="badge" style={{ background: '#E8F7F2', color: '#0F6E56' }}>{u.plan.toUpperCase()}</span></td>
                <td>{u.invoice_count}</td>
                <td><span style={{ fontSize: '12px', color: 'var(--brand)', fontWeight: '600' }}>{u.subscription_status || 'Active'}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <button style={{ color: 'var(--brand)', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer' }}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
