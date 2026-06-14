import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { Plus, Users, FileText, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '32px' }}>Loading...</div>;

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const flags = { JA: '🇯🇲', TT: '🇹🇹', BB: '🇧🇧', GY: '🇬🇾', other: '🌍' };

  return (
    <>
      <style>{`
        .dash-wrap { padding: 16px; }
        .dash-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .dash-title { display: none; }

        @media (min-width: 768px) {
          .dash-wrap { padding: 36px 40px; }
          .dash-topbar { display: none; }
          .dash-title { display: block; font-size: 28px; font-weight: 700; margin: 0 0 28px; color: var(--text-primary); }

          .dash-top-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 28px;
            align-items: start;
          }

          .metrics-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 28px;
          }

          .bottom-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 24px;
          }

          .quick-actions-desktop {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .quick-actions-mobile { display: none !important; }
        }

        @media (max-width: 767px) {
          .dash-top-grid { margin-bottom: 20px; }
          .metrics-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 20px;
          }
          .bottom-grid {}
          .quick-actions-desktop { display: none !important; }
          .quick-actions-mobile {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding-bottom: 8px;
            margin-bottom: 20px;
            scrollbar-width: none;
          }
        }
      `}</style>

      <div className="dash-wrap">
        {/* Mobile top bar */}
        <div className="dash-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', background: 'var(--brand)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>Q</div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: 1 }}>QuickInvoice</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Caribbean</div>
            </div>
          </div>
          <div style={{ width: '36px', height: '36px', background: 'var(--brand)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600' }}>
            {user?.name?.[0]}
          </div>
        </div>

        <h1 className="dash-title">Dashboard</h1>

        <AnnouncementBanner />

        {/* Top section: hero + quick actions side by side on desktop */}
        <div className="dash-top-grid">
          {/* Hero Card */}
          <div className="hero-card">
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>Good {getTimeOfDay()}, {user?.name?.split(' ')[0]}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Outstanding Balance</div>
                <div style={{ fontSize: '38px', fontWeight: '700', lineHeight: 1 }}>
                  ${data?.total_outstanding?.toLocaleString() || '0'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}>
                {user?.default_currency || 'JMD'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '28px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.75, marginBottom: '2px' }}>Active Invoices</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>{data?.active_invoice_count || 0}</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.75, marginBottom: '2px' }}>Overdue</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>{data?.overdue_count || 0}</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.75, marginBottom: '2px' }}>Total Clients</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>{data?.client_count || 0}</div>
              </div>
            </div>
          </div>

          {/* Quick Actions — desktop column layout */}
          <div className="quick-actions-desktop">
            <QuickActionCard to="/invoices/new" icon={<Plus size={20} />} label="New Invoice" desc="Create and send an invoice" color="var(--brand)" />
            <QuickActionCard to="/clients" icon={<Users size={20} />} label="Manage Clients" desc="View and edit your clients" color="#6366f1" />
            <QuickActionCard to="/reports" icon={<BarChart3 size={20} />} label="View Reports" desc="Revenue and invoice analytics" color="#f59e0b" />
          </div>
        </div>

        {/* Mobile Quick Actions */}
        <div className="quick-actions-mobile">
          <MobileQuickAction to="/invoices/new" icon={<Plus size={20} />} label="New Invoice" />
          <MobileQuickAction to="/clients" icon={<Users size={20} />} label="Clients" />
          <MobileQuickAction to="/reports" icon={<BarChart3 size={20} />} label="Reports" />
        </div>

        {/* Metrics Row */}
        <div className="metrics-row">
          <MetricCard label="Paid This Month" value={`$${data?.paid_this_month?.toLocaleString() || '0'}`} color="var(--brand)" icon={<TrendingUp size={16} />} />
          <MetricCard label="Overdue Amount" value={`$${data?.overdue_amount?.toLocaleString() || '0'}`} color="var(--danger)" icon={<AlertCircle size={16} />} />
          <MetricCard label="Active Invoices" value={data?.active_invoice_count || 0} color="#6366f1" icon={<FileText size={16} />} />
          <MetricCard label="Total Clients" value={data?.client_count || 0} color="#f59e0b" icon={<Users size={16} />} />
        </div>

        {/* Recent Invoices — full width */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Recent Invoices</h2>
            <Link to="/invoices" style={{ fontSize: '13px', color: 'var(--brand)', textDecoration: 'none', fontWeight: '600' }}>See all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data?.recent_invoices?.map(inv => (
              <Link key={inv.id} to={`/invoices/${inv.id}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', color: 'inherit', marginBottom: 0, transition: 'box-shadow 0.15s' }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(13,31,26,0.1)'}
                onMouseOut={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
              >
                <div style={{ width: '44px', height: '44px', background: 'var(--brand-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                  {flags[inv.client_country] || '🌍'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.client_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{inv.invoice_number} · Due {inv.due_date}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '16px', fontWeight: '700' }}>{inv.currency} ${inv.total?.toLocaleString()}</div>
                  <div className={`badge badge-${inv.status}`} style={{ marginTop: '4px' }}>{inv.status}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

const MetricCard = ({ label, value, color, icon }) => (
  <div className="card" style={{ marginBottom: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</span>
    </div>
    <div style={{ fontSize: '24px', fontWeight: '700', color }}>{value}</div>
  </div>
);

const QuickActionCard = ({ to, icon, label, desc, color }) => (
  <Link to={to} style={{ textDecoration: 'none' }}>
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: 0, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
      onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(13,31,26,0.1)'}
      onMouseOut={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
    >
      <div style={{ width: '44px', height: '44px', background: color + '18', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{desc}</div>
      </div>
    </div>
  </Link>
);

const MobileQuickAction = ({ to, icon, label }) => (
  <Link to={to} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '80px', textDecoration: 'none', color: 'inherit' }}>
    <div style={{ width: '48px', height: '48px', background: 'white', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', boxShadow: 'var(--shadow)' }}>
      {icon}
    </div>
    <span style={{ fontSize: '11px', fontWeight: '500' }}>{label}</span>
  </Link>
);

export default Dashboard;
