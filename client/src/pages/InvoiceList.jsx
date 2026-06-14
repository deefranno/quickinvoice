import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Search, MessageSquare, Share2 } from 'lucide-react';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      const res = await api.get(`/invoices?status=${statusFilter}`);
      setInvoices(res.data);
    } catch (err) {} finally { setLoading(false); }
  };

  const flags = { JA: '🇯🇲', TT: '🇹🇹', BB: '🇧🇧', GY: '🇬🇾', other: '🌍' };

  const filteredInvoices = invoices.filter(inv => 
    inv.client_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Invoices</h1>

      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-hint)' }} size={18} />
        <input className="input" style={{ paddingLeft: '40px' }} placeholder="Search invoices..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '4px', scrollbarWidth: 'none' }}>
        {['all', 'paid', 'pending', 'overdue', 'draft'].map(status => (
          <button 
            key={status} 
            onClick={() => setStatusFilter(status)}
            style={{ 
              padding: '6px 16px', 
              borderRadius: '20px', 
              border: '1px solid var(--border)', 
              background: statusFilter === status ? 'var(--brand)' : 'white',
              color: statusFilter === status ? 'white' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div>Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredInvoices.map(inv => (
            <div key={inv.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <Link to={`/invoices/${inv.id}`} style={{ display: 'block', padding: '16px', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '600' }}>{inv.client_name} {flags[inv.client_country]}</div>
                  <div className={`badge badge-${inv.status}`}>{inv.status}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{inv.invoice_number}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-hint)' }}>Due {inv.due_date}</div>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>{inv.currency} ${inv.total.toLocaleString()}</div>
                </div>
              </Link>
              <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    // Open WhatsApp logic here
                  }} 
                  style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: 'var(--brand)', fontWeight: '600', cursor: 'pointer' }}
                >
                  {inv.status === 'paid' ? <Share2 size={14} /> : <MessageSquare size={14} />}
                  {inv.status === 'paid' ? 'Share' : inv.status === 'overdue' ? 'Chase' : 'Remind'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
