import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Search, Phone, Mail } from 'lucide-react';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', country: 'JA', address: '' });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data);
    } catch (err) {} finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, formData);
      } else {
        await api.post('/clients', formData);
      }
      fetchClients();
      setShowModal(false);
      setEditingClient(null);
      setFormData({ name: '', email: '', phone: '', country: 'JA', address: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving client');
    }
  };

  const flags = { JA: '🇯🇲', TT: '🇹🇹', BB: '🇧🇧', GY: '🇬🇾', other: '🌍' };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', margin: 0 }}>Clients</h1>
        <button onClick={() => { setEditingClient(null); setShowModal(true); }} className="btn-primary" style={{ width: 'auto', padding: '10px 16px' }}>
          <Plus size={18} />
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-hint)' }} size={18} />
        <input className="input" style={{ paddingLeft: '40px' }} placeholder="Search clients..." />
      </div>

      {clients.map(client => (
        <div key={client.id} className="card" onClick={() => { setEditingClient(client); setFormData(client); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', background: 'var(--brand-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontWeight: 'bold' }}>
            {client.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600' }}>{client.name} {flags[client.country]}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Phone size={12} /> {client.phone}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{client.invoice_count} Invoices</div>
            <div style={{ fontWeight: '600', color: 'var(--brand)' }}>${(client.total_billed || 0).toLocaleString()}</div>
          </div>
        </div>
      ))}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '430px', borderRadius: '20px 20px 0 0', padding: '20px', animation: 'slideUp 0.3s ease-out' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input className="input" placeholder="Client Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <input className="input" placeholder="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <input className="input" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <select className="input" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})}>
                <option value="JA">Jamaica 🇯🇲</option>
                <option value="TT">Trinidad 🇹🇹</option>
                <option value="BB">Barbados 🇧🇧</option>
                <option value="GY">Guyana 🇬🇾</option>
                <option value="other">Other 🌍</option>
              </select>
              <textarea className="input" placeholder="Address" rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
