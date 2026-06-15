import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Mail, MessageSquare, Bell, Printer, Edit2, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { fetchInvoice(); }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data);
    } catch (err) {} finally { setLoading(false); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const markAsPaid = async () => {
    if (!window.confirm('Mark this invoice as paid?')) return;
    await api.put(`/invoices/${id}/status`, { status: 'paid' });
    fetchInvoice();
    showToast('✅ Invoice marked as paid');
  };

  const sendEmail = async () => {
    setSending('email');
    try {
      const res = await api.post(`/invoices/${id}/send-email`);
      showToast(res.data.simulated ? `📧 Email simulated — would send to ${res.data.sent_to}` : `📧 Invoice emailed to ${res.data.sent_to}`);
      fetchInvoice();
    } catch (err) { showToast('❌ ' + (err.response?.data?.error || 'Failed to send email')); }
    finally { setSending(''); }
  };

  const remindEmail = async () => {
    setSending('remind-email');
    try {
      const res = await api.post(`/invoices/${id}/remind-email`);
      showToast(res.data.simulated ? '📧 Reminder simulated (SMTP not configured)' : `📧 Reminder sent to ${res.data.sent_to}`);
    } catch (err) { showToast('❌ ' + (err.response?.data?.error || 'Failed')); }
    finally { setSending(''); }
  };

  const openWhatsApp = async () => {
    setSending('whatsapp');
    try {
      const res = await api.get(`/invoices/${id}/whatsapp-link`);
      window.open(res.data.url, '_blank');
      if (!res.data.phone) showToast('ℹ️ No phone on file — select contact in WhatsApp');
    } catch (err) { showToast('❌ Failed'); }
    finally { setSending(''); }
  };

  const remindWhatsApp = async () => {
    setSending('remind-wa');
    try {
      const res = await api.get(`/invoices/${id}/whatsapp-reminder-link`);
      window.open(res.data.url, '_blank');
    } catch (err) { showToast('❌ Failed'); }
    finally { setSending(''); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
    await api.delete(`/invoices/${id}`);
    navigate('/invoices');
  };

  if (loading) return <div style={{ padding: '32px', color: 'var(--text-secondary)' }}>Loading...</div>;
  if (!invoice) return <div style={{ padding: '32px' }}>Invoice not found.</div>;

  const flags = { JA: '🇯🇲', TT: '🇹🇹', BB: '🇧🇧', GY: '🇬🇾' };
  const businessName = user?.company_name || user?.business_name || user?.name || 'My Business';
  const fmt = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      {/* ── PRINT STYLES ── */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm 20mm;
          }
          html, body {
            width: 210mm;
            font-size: 12pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Hide everything except the print invoice */
          body > * { display: none !important; }
          #root { display: block !important; }
          #root > * { display: none !important; }
          .print-invoice-wrapper { display: block !important; position: fixed; top: 0; left: 0; width: 100%; z-index: 99999; background: white; }
          .no-print { display: none !important; }
          /* Remove browser header/footer URL lines */
          html { overflow: hidden; }
        }

        .print-invoice-wrapper { display: none; }

        @media (min-width: 768px) {
          .invoice-detail-wrap { padding: 32px 40px; max-width: 860px; }
          .invoice-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        }
        @media (max-width: 767px) {
          .invoice-detail-wrap { padding: 0; }
          .invoice-actions-grid { display: flex; flex-direction: column; gap: 10px; }
        }
      `}</style>

      {/* ── PRINT-ONLY INVOICE (hidden on screen, shown on print) ── */}
      <div className="print-invoice-wrapper">
        <PrintInvoice invoice={invoice} businessName={businessName} user={user} flags={flags} fmt={fmt} />
      </div>

      {/* ── SCREEN UI ── */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#0D1F1A', color: 'white', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', maxWidth: '90vw', textAlign: 'center' }}>
          {toast}
        </div>
      )}

      <div className="invoice-detail-wrap no-print">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            <ArrowLeft size={20} /> Back
          </button>
          <span style={{ fontWeight: '700', fontSize: '16px' }}>{invoice.invoice_number}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigate(`/invoices/${id}/edit`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', padding: '6px' }}><Edit2 size={20} /></button>
            <button onClick={handleDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '6px' }}><Trash2 size={20} /></button>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Invoice preview card */}
          <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
            {/* Mini header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--brand)' }}>{businessName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>INVOICE</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '15px', fontWeight: '700' }}>{invoice.invoice_number}</div>
                <span className={`badge badge-${invoice.status}`} style={{ marginTop: '4px', display: 'inline-block' }}>{invoice.status}</span>
              </div>
            </div>

            {/* Client + dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '6px' }}>BILLED TO</div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>{invoice.client_name} {flags[invoice.client_country] || '🌍'}</div>
                {invoice.client_email && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{invoice.client_email}</div>}
                {invoice.client_phone && <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{invoice.client_phone}</div>}
                {invoice.client_address && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{invoice.client_address}</div>}
              </div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '6px' }}>ISSUE DATE</div>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{invoice.issue_date}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '6px' }}>DUE DATE</div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: invoice.status === 'overdue' ? 'var(--danger)' : 'inherit' }}>{invoice.due_date}</div>
                </div>
              </div>
            </div>

            {/* Line items */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--page-bg)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', width: '50%' }}>DESCRIPTION</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', width: '10%' }}>QTY</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', width: '20%' }}>UNIT PRICE</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', width: '20%' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{item.description}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>{item.quantity}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '14px' }}>{invoice.currency} {fmt(item.unit_price)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}>{invoice.currency} {fmt(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '2px solid var(--border)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>{invoice.currency} {fmt(invoice.subtotal)}</span>
              </div>
              {invoice.gct_enabled === 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>GCT (15%)</span>
                  <span>{invoice.currency} {fmt(invoice.gct)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '800', color: 'var(--brand)', paddingTop: '10px', borderTop: '1px solid var(--border)', marginTop: '4px' }}>
                <span>TOTAL DUE</span>
                <span>{invoice.currency} {fmt(invoice.total)}</span>
              </div>
            </div>

            {invoice.notes && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--page-bg)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>Notes:</strong> {invoice.notes}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <SectionLabel>SEND INVOICE</SectionLabel>
          <div className="invoice-actions-grid" style={{ marginBottom: '20px' }}>
            <ActionBtn icon={<Mail size={18} />} label="Send via Email" sublabel={invoice.client_email || 'No email on file'} onClick={sendEmail} loading={sending === 'email'} color="var(--brand)" disabled={!invoice.client_email} />
            <ActionBtn icon={<MessageSquare size={18} />} label="Send via WhatsApp" sublabel={invoice.client_phone || 'Opens wa.me'} onClick={openWhatsApp} loading={sending === 'whatsapp'} color="#25D366" />
          </div>

          <SectionLabel>REMINDERS</SectionLabel>
          <div className="invoice-actions-grid" style={{ marginBottom: '20px' }}>
            <ActionBtn icon={<Bell size={18} />} label="Email Reminder" sublabel="Resend payment reminder" onClick={remindEmail} loading={sending === 'remind-email'} color="var(--warning)" disabled={!invoice.client_email} />
            <ActionBtn icon={<MessageSquare size={18} />} label="WhatsApp Reminder" sublabel="Send reminder via WhatsApp" onClick={remindWhatsApp} loading={sending === 'remind-wa'} color="#25D366" />
          </div>

          <SectionLabel>OTHER</SectionLabel>
          <div className="invoice-actions-grid">
            <ActionBtn icon={<Printer size={18} />} label="Download / Print PDF" sublabel="Clean A4 invoice layout" onClick={() => window.print()} color="var(--text-primary)" />
            {invoice.status !== 'paid' && (
              <ActionBtn icon={<Check size={18} />} label="Mark as Paid" sublabel="Update invoice status" onClick={markAsPaid} color="#0F6E56" />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

/* ── Clean A4 print invoice ── */
const PrintInvoice = ({ invoice, businessName, user, flags, fmt }) => (
  <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: '#0D1F1A', background: 'white', padding: '0', margin: '0', width: '100%' }}>
    {/* Header bar */}
    <div style={{ background: 'linear-gradient(135deg, #0F6E56, #1D9E75)', padding: '28px 32px', color: 'white', marginBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '24pt', fontWeight: '800', letterSpacing: '-0.5px' }}>{businessName}</div>
          <div style={{ fontSize: '10pt', opacity: 0.85, marginTop: '4px', letterSpacing: '2px' }}>INVOICE</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16pt', fontWeight: '700' }}>{invoice.invoice_number}</div>
          <div style={{ fontSize: '10pt', opacity: 0.85, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>{invoice.status}</div>
        </div>
      </div>
    </div>

    <div style={{ padding: '0 32px' }}>
      {/* Billed to + dates */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px' }}>
        <tbody>
          <tr>
            <td style={{ width: '55%', verticalAlign: 'top', paddingRight: '20px' }}>
              <div style={{ fontSize: '8pt', fontWeight: '700', color: '#6B7F7A', letterSpacing: '1.5px', marginBottom: '8px' }}>BILLED TO</div>
              <div style={{ fontSize: '14pt', fontWeight: '700' }}>{invoice.client_name}</div>
              {invoice.client_email && <div style={{ fontSize: '10pt', color: '#6B7F7A', marginTop: '4px' }}>{invoice.client_email}</div>}
              {invoice.client_phone && <div style={{ fontSize: '10pt', color: '#6B7F7A', marginTop: '2px' }}>{invoice.client_phone}</div>}
              {invoice.client_address && <div style={{ fontSize: '10pt', color: '#6B7F7A', marginTop: '2px' }}>{invoice.client_address}</div>}
            </td>
            <td style={{ width: '22%', verticalAlign: 'top', paddingRight: '12px' }}>
              <div style={{ fontSize: '8pt', fontWeight: '700', color: '#6B7F7A', letterSpacing: '1.5px', marginBottom: '8px' }}>ISSUE DATE</div>
              <div style={{ fontSize: '11pt', fontWeight: '600' }}>{invoice.issue_date}</div>
            </td>
            <td style={{ width: '23%', verticalAlign: 'top' }}>
              <div style={{ fontSize: '8pt', fontWeight: '700', color: '#6B7F7A', letterSpacing: '1.5px', marginBottom: '8px' }}>DUE DATE</div>
              <div style={{ fontSize: '11pt', fontWeight: '600', color: invoice.status === 'overdue' ? '#D84040' : '#0D1F1A' }}>{invoice.due_date}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Line items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <thead>
          <tr style={{ background: '#F7F9F8', borderBottom: '2px solid #E4EDEA' }}>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '8pt', fontWeight: '700', color: '#6B7F7A', letterSpacing: '1.5px', width: '52%' }}>DESCRIPTION</th>
            <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: '8pt', fontWeight: '700', color: '#6B7F7A', letterSpacing: '1.5px', width: '8%' }}>QTY</th>
            <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '8pt', fontWeight: '700', color: '#6B7F7A', letterSpacing: '1.5px', width: '20%' }}>UNIT PRICE</th>
            <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '8pt', fontWeight: '700', color: '#6B7F7A', letterSpacing: '1.5px', width: '20%' }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #E4EDEA' }}>
              <td style={{ padding: '12px', fontSize: '10pt', lineHeight: '1.4' }}>{item.description}</td>
              <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '10pt', color: '#6B7F7A' }}>{item.quantity}</td>
              <td style={{ padding: '12px', textAlign: 'right', fontSize: '10pt', color: '#6B7F7A', whiteSpace: 'nowrap' }}>{invoice.currency} {fmt(item.unit_price)}</td>
              <td style={{ padding: '12px', textAlign: 'right', fontSize: '10pt', fontWeight: '700', whiteSpace: 'nowrap' }}>{invoice.currency} {fmt(item.quantity * item.unit_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals — right aligned */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <table style={{ width: '280px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '6px 12px', fontSize: '10pt', color: '#6B7F7A' }}>Subtotal</td>
              <td style={{ padding: '6px 12px', fontSize: '10pt', textAlign: 'right', whiteSpace: 'nowrap' }}>{invoice.currency} {fmt(invoice.subtotal)}</td>
            </tr>
            {invoice.gct_enabled === 1 && (
              <tr>
                <td style={{ padding: '6px 12px', fontSize: '10pt', color: '#6B7F7A' }}>GCT (15%)</td>
                <td style={{ padding: '6px 12px', fontSize: '10pt', textAlign: 'right', whiteSpace: 'nowrap' }}>{invoice.currency} {fmt(invoice.gct)}</td>
              </tr>
            )}
            <tr style={{ borderTop: '2px solid #1D9E75' }}>
              <td style={{ padding: '12px', fontSize: '14pt', fontWeight: '800', color: '#1D9E75' }}>TOTAL DUE</td>
              <td style={{ padding: '12px', fontSize: '14pt', fontWeight: '800', color: '#1D9E75', textAlign: 'right', whiteSpace: 'nowrap' }}>{invoice.currency} {fmt(invoice.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div style={{ background: '#F7F9F8', borderRadius: '8px', padding: '14px 16px', fontSize: '10pt', color: '#6B7F7A', marginBottom: '24px' }}>
          <strong style={{ color: '#0D1F1A' }}>Notes:</strong> {invoice.notes}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #E4EDEA', paddingTop: '14px', textAlign: 'center', fontSize: '8pt', color: '#A8B8B4' }}>
        Generated by QuickInvoice Caribbean · quickinvoice.app
      </div>
    </div>
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '10px' }}>{children}</div>
);

const ActionBtn = ({ icon, label, sublabel, onClick, loading, color, disabled }) => (
  <button onClick={onClick} disabled={disabled || loading} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: disabled ? 'var(--page-bg)' : 'white', border: `1.5px solid ${disabled ? 'var(--border)' : color + '40'}`, borderRadius: '14px', cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: disabled ? 0.5 : 1, transition: 'box-shadow 0.15s', width: '100%' }}
    onMouseOver={e => { if (!disabled) e.currentTarget.style.boxShadow = `0 4px 16px ${color}22`; }}
    onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ width: '40px', height: '40px', background: color + '15', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
      {loading ? '...' : icon}
    </div>
    <div>
      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{label}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>{sublabel}</div>
    </div>
  </button>
);

export default InvoiceDetail;
