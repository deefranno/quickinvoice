const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/summary', auth, (req, res) => {
  const userId = req.user.id;

  try {
    const total_outstanding = db.prepare(`
      SELECT SUM(total) as amount FROM (
        SELECT i.id, (SUM(ii.unit_price * ii.quantity) * (1 + (i.gct_enabled * 0.15))) as total
        FROM invoices i
        JOIN invoice_items ii ON i.id = ii.invoice_id
        WHERE i.user_id = ? AND i.status IN ('pending', 'overdue')
        GROUP BY i.id
      )
    `).get(userId).amount || 0;

    const paid_this_month = db.prepare(`
      SELECT SUM(total) as amount FROM (
        SELECT i.id, (SUM(ii.unit_price * ii.quantity) * (1 + (i.gct_enabled * 0.15))) as total
        FROM invoices i
        JOIN invoice_items ii ON i.id = ii.invoice_id
        WHERE i.user_id = ? AND i.status = 'paid' 
        AND strftime('%m', i.issue_date) = strftime('%m', 'now')
        AND strftime('%Y', i.issue_date) = strftime('%Y', 'now')
        GROUP BY i.id
      )
    `).get(userId).amount || 0;

    const overdue_amount = db.prepare(`
      SELECT SUM(total) as amount FROM (
        SELECT i.id, (SUM(ii.unit_price * ii.quantity) * (1 + (i.gct_enabled * 0.15))) as total
        FROM invoices i
        JOIN invoice_items ii ON i.id = ii.invoice_id
        WHERE i.user_id = ? AND i.status = 'overdue'
        GROUP BY i.id
      )
    `).get(userId).amount || 0;

    const active_invoice_count = db.prepare(`
      SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND status IN ('pending', 'overdue')
    `).get(userId).count;

    const overdue_count = db.prepare(`
      SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND status = 'overdue'
    `).get(userId).count;

    const recent_invoices = db.prepare(`
      SELECT i.*, c.name as client_name, c.country as client_country,
      (SELECT SUM(unit_price * quantity) FROM invoice_items WHERE invoice_id = i.id) as subtotal
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
      LIMIT 5
    `).all(userId).map(inv => ({
      ...inv,
      total: inv.subtotal * (1 + (inv.gct_enabled * 0.15))
    }));

    // Monthly revenue last 6 months (simplified)
    const monthly_revenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStr = new Date();
      monthStr.setMonth(monthStr.getMonth() - i);
      const year = monthStr.getFullYear();
      const month = (monthStr.getMonth() + 1).toString().padStart(2, '0');
      
      const revenue = db.prepare(`
        SELECT SUM(total) as amount FROM (
          SELECT i.id, (SUM(ii.unit_price * ii.quantity) * (1 + (i.gct_enabled * 0.15))) as total
          FROM invoices i
          JOIN invoice_items ii ON i.id = ii.invoice_id
          WHERE i.user_id = ? AND i.status = 'paid'
          AND strftime('%Y-%m', i.issue_date) = ?
          GROUP BY i.id
        )
      `).get(userId, `${year}-${month}`).amount || 0;

      monthly_revenue.push({
        month: monthStr.toLocaleString('default', { month: 'short' }),
        revenue
      });
    }

    res.json({
      total_outstanding,
      paid_this_month,
      overdue_amount,
      active_invoice_count,
      overdue_count,
      recent_invoices,
      monthly_revenue
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
