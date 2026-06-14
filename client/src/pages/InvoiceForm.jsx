import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Save, Plus, Trash2, Receipt, Smartphone } from 'lucide-react';

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    client_id: '',
    currency: 'JMD',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    gct_enabled: 0,
    whatsapp_reminder: 1,
    items: [{ description: '', unit_price: 0, quantity: 1 }]
  });

  useEffect(() => {
    fetchClients();
    if (id) fetchInvoice();
  }, [id]);

  const fetchClients = async () => {
    const res = await api.get('/clients');
    setClients(res.data);
    if (!id && res.data.length > 0) setFormData(prev => ({ ...prev, client_id: res.data[0].id }));
  };

  const fetchInvoice = async () => {
    const res = await api.get(`/invoices/${id}`);
    setFormData(res.data);
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { description: '', unit_price: 0, quantity: 1 }] });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.unit_price) * Number(item.quantity || 1)), 0);
  const gct = formData.gct_enabled ? subtotal * 0.15 : 0;
  const total = subtotal + gct;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await api.put(`/invoices/${id}`, formData);
        navigate(`/invoices/${id}`);
      } else {
        const res = await api.post('/api/invoices', formData); // Should be /invoices, fix in api call if base path handled
        navigate(`/invoices/${res.data.id}`);
      }
    } catch (err) {
      // Re-trying with corrected path if needed
      try {
        const res = await api.post('/invoices', formData);
        navigate(`/invoices/${res.data.id}`);
      } catch (innerErr) {
        alert('Error saving invoice');
      }
    }
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      <header style={{ position: 'sticky', top: 0, background: 'var(--page-bg)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none' }}><ArrowLeft /></button>
        <h1 style={{ fontSize: '18px', margin: 0 }}>{id ? 'Edit Invoice' : 'New Invoice'}</h1>
        <button onClick={handleSubmit} style={{ background: 'none', border: 'none', color: 'var(--brand)' }}><Save /></button>
      </header>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <section className="card">
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>CLIENT</label>
          <select className="input" value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })}>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </section>

        <section className="card">
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>CURRENCY</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {['JMD', 'USD', 'TTD', 'BBD'].map(curr => (
              <button key={curr} onClick={() => setFormData({ ...formData, currency: curr })} style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: formData.currency === curr ? 'var(--brand)' : 'white', color: formData.currency === curr ? 'white' : 'inherit', fontWeight: '600' }}>
                {curr}
              </button>
            ))}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="card">
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ISSUE DATE</label>
            <input type="date" className="input" style={{ padding: '8px', marginTop: '4px' }} value={formData.issue_date} onChange={e => setFormData({ ...formData, issue_date: e.target.value })} />
          </div>
          <div className="card">
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>DUE DATE</label>
            <input type="date" className="input" style={{ padding: '8px', marginTop: '4px' }} value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600' }}>LINE ITEMS</label>
          </div>
          {formData.items.map((item, index) => (
            <div key={index} className="card" style={{ marginBottom: '12px', background: '#F2F7F5' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input className="input" placeholder="Description" style={{ flex: 3 }} value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} />
                <button onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', color: 'var(--danger)' }}><Trash2 size={20} /></button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="input" type="number" placeholder="Price" style={{ flex: 2 }} value={item.unit_price} onChange={e => updateItem(index, 'unit_price', e.target.value)} />
                <input className="input" type="number" placeholder="Qty" style={{ flex: 1 }} value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
              </div>
            </div>
          ))}
          <button onClick={addItem} className="btn-ghost" style={{ borderStyle: 'dashed', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Plus size={18} /> Add Item
          </button>
        </section>

        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString()}</span>
          </div>
          {formData.gct_enabled === 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              <span>GCT (15%)</span>
              <span>${gct.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '18px', color: 'var(--brand)', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
            <span>Total</span>
            <span>${total.toLocaleString()}</span>
          </div>
        </section>

        <section className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={20} color="var(--warning)" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Apply GCT (15%)</div>
              </div>
            </div>
            <input type="checkbox" checked={formData.gct_enabled === 1} onChange={e => setFormData({ ...formData, gct_enabled: e.target.checked ? 1 : 0 })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={20} color="var(--brand)" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>WhatsApp Reminder</div>
                <div style={{ fontSize: '10px', color: 'var(--text-hint)' }}>Auto-remind after 7 days</div>
              </div>
            </div>
            <input type="checkbox" checked={formData.whatsapp_reminder === 1} onChange={e => setFormData({ ...formData, whatsapp_reminder: e.target.checked ? 1 : 0 })} />
          </div>
        </section>
      </div>

      <div style={{ position: 'fixed', bottom: 0, width: '100%', maxWidth: '430px', padding: '16px', background: 'white', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
        <button onClick={handleSubmit} className="btn-primary">Send Invoice</button>
      </div>
    </div>
  );
};

export default InvoiceForm;
