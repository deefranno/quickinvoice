import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, MoreVertical, MessageSquare, Printer, Check } from 'lucide-react';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data);
    } catch (err) {} finally { setLoading(false); }
  };

  const markAsPaid = async () => {
    if (window.confirm('Mark this invoice as paid?')) {
      await api.put(`/invoices/${id}/status`, { status: 'paid' });
      fetchInvoice();
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (!invoice) return <div>Invoice not found</div>;

  const flags = { JA: '🇯🇲', TT: '🇹🇹', BB: '🇧🇧', GY: '🇬🇾', other: '🌍' };

  return (
    <div>
      <div className="hero-card" style={{ borderRadius: '0 0 20px 20px', paddingBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white' }}><ArrowLeft /></button>
          <div style={{ fontWeight: '600' }}>Invoice Detail</div>
          <button style={{ background: 'none', border: 'none', color: 'white' }}><MoreVertical /></button>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>{invoice.client_name} {flags[invoice.client_country]}</div>
          <div style={{ fontSize: '36px', fontWeight: '700', margin: '8px 0' }}>{invoice.currency} ${invoice.total.toLocaleString()}</div>
          <div className={`badge badge-${invoice.status}`} style={{ background: 'rgba(0,0,0,0.3)', color: 'white' }}>{invoice.status.toUpperCase()}</div>
        </div>
      </div>

      <div style={{ margin: '-20px 16px 0', padding: '20px', background: 'white', borderRadius: '20px', boxShadow: 'var(--shadow)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ISSUE DATE</div>
            <div style={{ fontWeight: '600' }}>{invoice.issue_date}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>DUE DATE</div>
            <div style={{ fontWeight: '600' }}>{invoice.due_date}</div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>ITEMS</div>
          {invoice.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.description}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Qty: {item.quantity} × ${item.unit_price.toLocaleString()}</div>
              </div>
              <div style={{ fontWeight: '600' }}>${(item.quantity * item.unit_price).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
            <span>${invoice.subtotal.toLocaleString()}</span>
          </div>
          {invoice.gct_enabled === 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>GCT (15%)</span>
              <span>${(invoice.subtotal * 0.15).toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700', color: 'var(--brand)', marginTop: '8px' }}>
            <span>Total</span>
            <span>{invoice.currency} ${invoice.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <MessageSquare size={18} /> Remind via WhatsApp
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => window.print()} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Printer size={18} /> PDF
          </button>
          <button onClick={() => navigate(`/invoices/${id}/edit`)} className="btn-ghost">Edit</button>
        </div>
        {invoice.status !== 'paid' && (
          <button onClick={markAsPaid} className="btn-primary" style={{ background: '#0F6E56', marginTop: '12px' }}>
            <Check size={18} style={{ marginRight: '8px' }} /> Mark as Paid
          </button>
        )}
      </div>

      {/* Hidden Print Area */}
      <div className="invoice-print-area" style={{ display: 'none' }}>
        <h1>INVOICE</h1>
        <p>Number: {invoice.invoice_number}</p>
        <p>Client: {invoice.client_name}</p>
        {/* ... more print details ... */}
      </div>
    </div>
  );
};

export default InvoiceDetail;
