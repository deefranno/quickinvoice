const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const planGate = require('../middleware/planGate');
const router = express.Router();

router.get('/summary', auth, planGate('reports'), (req, res) => {
  const userId = req.user.id;
  try {
    const invoices = db.prepare(`
      SELECT i.*, 
      (SELECT SUM(unit_price * quantity) FROM invoice_items WHERE invoice_id = i.id) as subtotal
      FROM invoices i WHERE i.user_id = ?
    `).all(userId).map(inv => ({
      ...inv,
      total: (inv.subtotal || 0) * (1 + (inv.gct_enabled * 0.15))
    }));

    const total_billed = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const total_paid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
    const total_outstanding = invoices.filter(inv => ['pending', 'overdue'].includes(inv.status)).reduce((sum, inv) => sum + inv.total, 0);

    const invoice_by_status = {
      paid: invoices.filter(inv => inv.status === 'paid').length,
      pending: invoices.filter(inv => inv.status === 'pending').length,
      overdue: invoices.filter(inv => inv.status === 'overdue').length,
      draft: invoices.filter(inv => inv.status === 'draft').length,
    };

    // Last 12 months revenue
    const monthly_revenue = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const amount = invoices
        .filter(inv => inv.status === 'paid' && inv.issue_date.startsWith(monthKey))
        .reduce((sum, inv) => sum + inv.total, 0);
      monthly_revenue.push({ month: d.toLocaleString('default', { month: 'short' }), revenue: amount });
    }

    const currency_breakdown = [...new Set(invoices.map(inv => inv.currency))].map(curr => ({
      currency: curr,
      amount: invoices.filter(inv => inv.currency === curr).reduce((sum, inv) => sum + inv.total, 0)
    }));

    const top_clients = db.prepare(`
      SELECT c.name, c.country, SUM(ii.unit_price * ii.quantity) as total_billed
      FROM clients c
      JOIN invoices i ON c.id = i.client_id
      JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY total_billed DESC
      LIMIT 5
    `).all(userId);

    res.json({
      total_billed,
      total_paid,
      total_outstanding,
      invoice_by_status,
      monthly_revenue,
      currency_breakdown,
      top_clients
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
