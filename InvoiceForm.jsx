import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Save, Plus, Trash2, Receipt, Smartphone } from 'lucide-react';

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    currency: 'JMD',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    gct_enabled: 0,
    whatsapp_reminder: 1,
    items: [{ description: '', unit_price: '', quantity: 1 }]
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
    setFormData({ ...formData, items: [...formData.items, { description: '', unit_price: '', quantity: 1 }] });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 1), 0);
  const gct = formData.gct_enabled ? subtotal * 0.15 : 0;
  const total = subtotal + gct;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      if (id) {
        await api.put(`/invoices/${id}`, formData);
        navigate(`/invoices/${id}`);
      } else {
        const res = await api.post('/invoices', formData);
        navigate(`/invoices/${res.data.id}`);
      }
    } catch (err) {
      alert('Error saving invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .invoice-form-wrap { padding-bottom: 100px; }
        .invoice-form-inner { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
        .invoice-save-bar { position: fixed; bottom: 0; left: 0; right: 0; max-width: 430px; margin: 0 auto; padding: 16px; background: white; border-top: 1px solid var(--border); }

        @media (min-width: 768px) {
          .invoice-form-wrap { padding-bottom: 0; }
          .invoice-form-inner { padding: 32px 40px; max-width: 860px; gap: 20px; }
          .invoice-save-bar { display: none; }
          .invoice-desktop-save { display: flex !important; }
          .invoice-header { padding: 20px 40px !important; }
        }
        .invoice-desktop-save { display: none; }

        /* Line items table on desktop */
        .line-item-row { display: flex; flex-direction: column; gap: 8px; }
        @media (min-width: 768px) {
          .line-item-row { flex-direction: row; align-items: center; gap: 12px; }
          .line-item-desc { flex: 4 !important; }
          .line-item-price { flex: 2 !important; }
          .line-item-qty { flex: 1 !important; }
          .line-item-total { flex: 1 !important; text-align: right; font-weight: 700; color: var(--brand); }
        }
      `}</style>

      <div className="invoice-form-wrap">
        {/* Header */}
        <header className="invoice-header" style={{ position: 'sticky', top: 0, background: 'var(--page-bg)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            <ArrowLeft size={20} /> Back
          </button>
          <h1 style={{ fontSize: '18px', margin: 0, fontWeight: '700' }}>{id ? 'Edit Invoice' : 'New Invoice'}</h1>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="invoice-desktop-save"
            style={{ alignItems: 'center', gap: '8px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Invoice'}
          </button>
          {/* Mobile save icon */}
          <button onClick={handleSubmit} disabled={saving} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer' }} className="mobile-save-icon">
            <Save size={22} />
          </button>
        </header>

        <div className="invoice-form-inner">
          {/* Client */}
          <section className="card">
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>CLIENT</label>
            <select className="input" value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })}>
              <option value="">— Select a client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </section>

          {/* Currency */}
          <section className="card">
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px', letterSpacing: '0.5px' }}>CURRENCY</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['JMD', 'USD', 'TTD', 'BBD'].map(curr => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => setFormData({ ...formData, currency: curr })}
                  style={{ padding: '10px', borderRadius: '10px', border: `2px solid ${formData.currency === curr ? 'var(--brand)' : 'var(--border)'}`, background: formData.currency === curr ? 'var(--brand)' : 'white', color: formData.currency === curr ? 'white' : 'var(--text-primary)', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  {curr}
                </button>
              ))}
            </div>
          </section>

          {/* Dates */}
          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="card">
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>ISSUE DATE</label>
              <input type="date" className="input" style={{ padding: '8px', marginTop: '4px' }} value={formData.issue_date} onChange={e => setFormData({ ...formData, issue_date: e.target.value })} />
            </div>
            <div className="card">
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>DUE DATE</label>
              <input type="date" className="input" style={{ padding: '8px', marginTop: '4px' }} value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
            </div>
          </section>

          {/* Line Items */}
          <section className="card">
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '14px', letterSpacing: '0.5px' }}>LINE ITEMS</label>

            {/* Column headers — desktop only */}
            <div style={{ display: 'none' }} className="line-item-headers">
              <span style={{ flex: 4, fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>DESCRIPTION</span>
              <span style={{ flex: 2, fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>UNIT PRICE ({formData.currency})</span>
              <span style={{ flex: 1, fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>QTY</span>
              <span style={{ flex: 1, fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>TOTAL</span>
              <span style={{ width: '32px' }}></span>
            </div>

            <style>{`
              @media (min-width: 768px) {
                .line-item-headers { display: flex !important; padding: 0 0 8px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
                .mobile-save-icon { display: none !important; }
              }
            `}</style>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {formData.items.map((item, index) => (
                <div key={index} style={{ padding: '12px', background: 'var(--page-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  {/* Mobile: stacked layout */}
                  <div className="line-item-row">
                    <div className="line-item-desc" style={{ flex: 4 }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Description</label>
                      <input
                        className="input"
                        placeholder="e.g. Web Design, Consulting..."
                        value={item.description}
                        onChange={e => updateItem(index, 'description', e.target.value)}
                        style={{ background: 'white' }}
                      />
                    </div>
                    <div className="line-item-price" style={{ flex: 2 }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Price ({formData.currency})</label>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.unit_price}
                        onChange={e => updateItem(index, 'unit_price', e.target.value)}
                        style={{ background: 'white' }}
                      />
                    </div>
                    <div className="line-item-qty" style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Qty</label>
                      <input
                        className="input"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', e.target.value)}
                        style={{ background: 'white' }}
                      />
                    </div>
                    <div className="line-item-total" style={{ flex: 1 }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Total</label>
                      <div style={{ padding: '13px 0', fontWeight: '700', color: 'var(--brand)', fontSize: '15px' }}>
                        {formData.currency} {((Number(item.unit_price) || 0) * (Number(item.quantity) || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                      style={{ background: 'none', border: 'none', color: formData.items.length === 1 ? 'var(--border)' : 'var(--danger)', cursor: formData.items.length === 1 ? 'default' : 'pointer', alignSelf: 'flex-end', paddingBottom: '14px' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              style={{ marginTop: '12px', width: '100%', padding: '12px', background: 'none', border: '2px dashed var(--border)', borderRadius: '12px', color: 'var(--brand)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'border-color 0.15s' }}
            >
              <Plus size={16} /> Add Item
            </button>
          </section>

          {/* Totals */}
          <section className="card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span style={{ fontWeight: '600' }}>{formData.currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {formData.gct_enabled === 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>GCT (15%)</span>
                  <span style={{ color: 'var(--warning)', fontWeight: '600' }}>{formData.currency} {gct.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '20px', color: 'var(--brand)', borderTop: '2px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                <span>Total</span>
                <span>{formData.currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </section>

          {/* Options */}
          <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Receipt size={20} color="var(--warning)" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Apply GCT (15%)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-hint)' }}>General Consumption Tax</div>
                </div>
              </div>
              <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer' }} checked={formData.gct_enabled === 1} onChange={e => setFormData({ ...formData, gct_enabled: e.target.checked ? 1 : 0 })} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={20} color="var(--brand)" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>WhatsApp Reminder</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-hint)' }}>Auto-remind after 7 days</div>
                </div>
              </div>
              <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer' }} checked={formData.whatsapp_reminder === 1} onChange={e => setFormData({ ...formData, whatsapp_reminder: e.target.checked ? 1 : 0 })} />
            </div>
          </section>

          {/* Notes */}
          <section className="card">
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>NOTES (OPTIONAL)</label>
            <textarea
              className="input"
              placeholder="Payment terms, bank details, thank you note..."
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              style={{ resize: 'vertical' }}
            />
          </section>
        </div>

        {/* Mobile fixed save bar */}
        <div className="invoice-save-bar">
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </div>
    </>
  );
};

export default InvoiceForm;
