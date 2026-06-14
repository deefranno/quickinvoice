import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../utils/api';

const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await api.get('/announcements/active');
        if (res.data) setAnnouncement(res.data);
      } catch (err) {}
    };
    fetchAnnouncement();
  }, []);

  if (!announcement || dismissed) return null;

  const colors = {
    info: { bg: '#E3F2FD', text: '#0D47A1' },
    warning: { bg: '#FFF3E0', text: '#E65100' },
    success: { bg: '#E8F5E9', text: '#1B5E20' }
  };

  const style = colors[announcement.type] || colors.info;

  return (
    <div style={{
      background: style.bg,
      color: style.text,
      padding: '12px 16px',
      borderRadius: '12px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '14px'
    }}>
      <div style={{ flex: 1 }}>
        <strong>{announcement.title}</strong>: {announcement.message}
      </div>
      <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
        <X size={18} />
      </button>
    </div>
  );
};

export default AnnouncementBanner;
