import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Mail, MessageSquare, Bell, Printer, Edit2, Check, Trash2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState('');
  const [toast, setToast] = useState('');
  const printRef = useRef();

  useEffect(() => { fetchInvoice(); }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data);
    } catch (err) {} finally { setLoading(false); }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

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
      if (res.data.simulated) {
        showToast(`📧 Email simulated (SMTP not configured). Would send to ${res.data.sent_to}`);
      } else {
        showToast(`📧 Invoice emailed to ${res.data.sent_to}`);
      }
      fetchInvoice();
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.error || 'Failed to send email'));
    } finally { setSending(''); }
  };

  const remindEmail = async () => {
    setSending('remind-email');
    try {
      const res = await api.post(`/invoices/${id}/remind-email`);
      showToast(res.data.simulated ? '📧 Reminder simulated (SMTP not configured)' : `📧 Reminder sent to ${res.data.sent_to}`);
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.error || 'Failed to send reminder'));
    } finally { setSending(''); }
  };

  const openWhatsApp = async () => {
    setSending('whatsapp');
    try {
      const res = await api.get(`/invoices/${id}/whatsapp-link`);
      window.open(res.data.url, '_blank');
      if (!res.data.phone) showToast('ℹ️ No phone number on file — message pre-filled, select contact manually');
    } catch (err) {
      showToast('❌ Failed to generate WhatsApp link');
    } finally { setSending(''); }
  };

  const remindWhatsApp = async () => {
    setSending('remind-wa');
    try {
      const res = await api.get(`/invoices/${id}/whatsapp-reminder-link`);
      window.open(res.data.url, '_blank');
    } catch (err) {
      showToast('❌ Failed to generate reminder link');
    } finally { setSending(''); }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
    await api.delete(`/invoices/${id}`);
    navigate('/invoices');
  };

  if (loading) return <div style={{ padding: '32px', color: 'var(--text-secondary)' }}>Loading...</div>;
  if (!invoice) return <div style={{ padding: '32px' }}>Invoice not found.</div>;

  const flags = { JA: '🇯🇲', TT: '🇹🇹', BB: '🇧🇧', GY: '🇬🇾' };
  const statusColors = { paid: '#0F6E56', pending: '#9A5C0A', overdue: '#A32D2D', draft: '#6B7F7A' };
  const businessName = user?.business_name || user?.name;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-invoice, .print-invoice * { visibility: visible; }
          .print-invoice { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        @media (min-width: 768px) {
          .invoice-detail-wrap { padding: 32px 40px; max-width: 860px; }
          .invoice-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .invoice-content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        }
        @media (max-width: 767px) {
          .invoice-detail-wrap { padding: 0; }
          .invoice-actions-grid { display: flex; flex-direction: column; gap: 10px; }
          .invoice-content-grid { display: flex; flex-direction: column; gap: 0; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#0D1F1A', color: 'white', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', maxWidth: '90vw', textAlign: 'center' }}>
          {toast}
        </div>
      )}

      <div className="invoice-detail-wrap">
        {/* Header bar */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg)', position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            <ArrowLeft size={20} /> Back
          </button>
          <span style={{ fontWeight: '700', fontSize: '16px' }}>{invoice.invoice_number}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigate(`/invoices/${id}/edit`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', padding: '6px' }}>
              <Edit2 size={20} />
            </button>
            <button onClick={handleDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '6px' }}>
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {/* ── PRINTABLE INVOICE AREA ── */}
          <div className="print-invoice card" ref={printRef} style={{ marginBottom: '24px' }}>
            {/* Invoice header */}
            <div style={{ background: 'linear-gradient(135deg, #0F6E56, #1D9E75)', borderRadius: '12px', padding: '24px', color: 'white', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '800' }}>{businessName}</div>
                  <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '2px' }}>INVOICE</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>{invoice.invoice_number}</div>
                  <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '2px' }}>
                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', fontSize: '11px', fontWeight: '700' }}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Billed to + dates */}
            <div className="invoice-content-grid">
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '6px' }}>BILLED TO</div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>{invoice.client_name} {flags[invoice.client_country] || '🌍'}</div>
                {invoice.client_email && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{invoice.client_email}</div>}
                {invoice.client_phone && <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{invoice.client_phone}</div>}
                {invoice.client_address && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{invoice.client_address}</div>}
              </div>
              <div>
                <div style={{ display: 'flex', gap: '32px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '6px' }}>ISSUE DATE</div>
                    <div style={{ fontWeight: '600' }}>{invoice.issue_date}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '6px' }}>DUE DATE</div>
                    <div style={{ fontWeight: '600', color: invoice.status === 'overdue' ? 'var(--danger)' : 'inherit' }}>{invoice.due_date}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line items */}
            <div style={{ marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>DESCRIPTION</th>
                    <th style={{ textAlign: 'center', padding: '10px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>QTY</th>
                    <th style={{ textAlign: 'right', padding: '10px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>UNIT PRICE</th>
                    <th style={{ textAlign: 'right', padding: '10px 0', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 0', fontSize: '14px', fontWeight: '500' }}>{item.description}</td>
                      <td style={{ padding: '12px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>{item.quantity}</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', color: 'var(--text-secondary)' }}>{invoice.currency} {Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: '600' }}>{invoice.currency} {(item.quantity * item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '2px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span>{invoice.currency} {invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {invoice.gct_enabled === 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>GCT (15%)</span>
                  <span>{invoice.currency} {invoice.gct.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '22px', fontWeight: '800', color: 'var(--brand)', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <span>TOTAL DUE</span>
                <span>{invoice.currency} {invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {invoice.notes && (
              <div style={{ marginTop: '20px', padding: '14px', background: 'var(--page-bg)', borderRadius: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>Notes:</strong> {invoice.notes}
              </div>
            )}

            {/* Print footer */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: '11px', color: 'var(--text-hint)' }}>
              Generated by QuickInvoice Caribbean · quickinvoice.app
            </div>
          </div>

          {/* ── ACTION BUTTONS (no-print) ── */}
          <div className="no-print">
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '12px' }}>SEND INVOICE</div>
            <div className="invoice-actions-grid" style={{ marginBottom: '20px' }}>
              <ActionBtn icon={<Mail size={18} />} label="Send via Email" sublabel={invoice.client_email || 'No email on file'} onClick={sendEmail} loading={sending === 'email'} color="var(--brand)" disabled={!invoice.client_email} />
              <ActionBtn icon={<MessageSquare size={18} />} label="Send via WhatsApp" sublabel={invoice.client_phone || 'Opens wa.me'} onClick={openWhatsApp} loading={sending === 'whatsapp'} color="#25D366" />
            </div>

            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '12px' }}>REMINDERS</div>
            <div className="invoice-actions-grid" style={{ marginBottom: '20px' }}>
              <ActionBtn icon={<Bell size={18} />} label="Email Reminder" sublabel="Resend payment reminder" onClick={remindEmail} loading={sending === 'remind-email'} color="var(--warning)" disabled={!invoice.client_email} />
              <ActionBtn icon={<MessageSquare size={18} />} label="WhatsApp Reminder" sublabel="Send reminder via WhatsApp" onClick={remindWhatsApp} loading={sending === 'remind-wa'} color="#25D366" />
            </div>

            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.5px', marginBottom: '12px' }}>OTHER</div>
            <div className="invoice-actions-grid">
              <ActionBtn icon={<Printer size={18} />} label="Download / Print PDF" sublabel="Opens print dialog" onClick={handlePrint} color="var(--text-primary)" />
              {invoice.status !== 'paid' && (
                <ActionBtn icon={<Check size={18} />} label="Mark as Paid" sublabel="Update invoice status" onClick={markAsPaid} color="#0F6E56" />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ActionBtn = ({ icon, label, sublabel, onClick, loading, color, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '14px 16px',
      background: disabled ? 'var(--page-bg)' : 'white',
      border: `1.5px solid ${disabled ? 'var(--border)' : color + '40'}`,
      borderRadius: '14px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      textAlign: 'left',
      opacity: disabled ? 0.5 : 1,
      transition: 'box-shadow 0.15s, transform 0.1s',
      width: '100%'
    }}
    onMouseOver={e => { if (!disabled) e.currentTarget.style.boxShadow = `0 4px 16px ${color}22`; }}
    onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ width: '40px', height: '40px', background: color + '15', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
      {loading ? <span style={{ fontSize: '12px', color }}>...</span> : icon}
    </div>
    <div>
      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{label}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '1px' }}>{sublabel}</div>
    </div>
  </button>
);

export default InvoiceDetail;
