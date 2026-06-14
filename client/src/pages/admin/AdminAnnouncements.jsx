import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>Announcements</h1>
        <button className="btn-primary" style={{ width: 'auto' }}>Create New</button>
      </div>

      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No active announcements found.
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncements;
