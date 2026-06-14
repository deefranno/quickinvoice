const express = require('express');
const db = require('../db/database');
const auth = require('../middleware/auth');
const PLANS = require('../config/plans');
const templates = require('../email/templates');
const router = express.Router();

// Try to load nodemailer — graceful fallback if not installed
let transporter = null;
try {
  const nodemailer = require('nodemailer');
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
} catch (e) {}

async function sendEmail(to, subject, html) {
  if (!transporter) {
    console.log(`[EMAIL] Would send to ${to}: ${subject}`);
    return { simulated: true };
  }
  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@quickinvoice.app',
    to, subject, html
  });
}

function getInvoiceWithItems(invoiceId, userId) {
  const invoice = db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email,
      c.phone as client_phone, c.country as client_country, c.address as client_address,
      u.name as business_name, u.email as business_email, u.business_name as company_name
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    JOIN users u ON i.user_id = u.id
    WHERE i.id = ? AND i.user_id = ?
  `).get(invoiceId, userId);
  if (!invoice) return null;
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoiceId);
  const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const gct = invoice.gct_enabled ? subtotal * 0.15 : 0;
  const total = subtotal + gct;
  return { ...invoice, items, subtotal, gct, total };
}

// ─── List ────────────────────────────────────────────
router.get('/', auth, (req, res) => {
  const { status, currency, search } = req.query;
  let query = `
    SELECT i.*, c.name as client_name, c.country as client_country,
    (SELECT SUM(unit_price * quantity) FROM invoice_items WHERE invoice_id = i.id) as subtotal
    FROM invoices i JOIN clients c ON i.client_id = c.id WHERE i.user_id = ?
  `;
  const params = [req.user.id];
  if (status && status !== 'all') { query += ' AND i.status = ?'; params.push(status); }
  if (currency) { query += ' AND i.currency = ?'; params.push(currency); }
  if (search) { query += ' AND (c.name LIKE ? OR i.invoice_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  query += ' ORDER BY i.created_at DESC';
  try {
    const invoices = db.prepare(query).all(...params).map(inv => ({
      ...inv,
      total: (inv.subtotal || 0) * (1 + (inv.gct_enabled * 0.15))
    }));
    res.json(invoices);
  } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

// ─── Create ──────────────────────────────────────────
router.post('/', auth, (req, res) => {
  const { client_id, currency, issue_date, due_date, notes, gct_enabled, whatsapp_reminder, items } = req.body;
  const plan = PLANS[req.user.plan];
  try {
    // Monthly limit check
    const monthCount = db.prepare(
      "SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')"
    ).get(req.user.id).count;
    if (plan.invoice_limit !== null && monthCount >= plan.invoice_limit) {
      return res.status(403).json({ error: 'PLAN_LIMIT_REACHED', message: `Free plan allows ${plan.invoice_limit} invoices/month. Upgrade to Pro for unlimited.` });
    }
    const year = new Date().getFullYear();
    const countResult = db.prepare(
      "SELECT COUNT(*) as count FROM invoices WHERE user_id = ? AND strftime('%Y', created_at) = ?"
    ).get(req.user.id, year.toString());
    const invoice_number = `INV-${year}-${(countResult.count + 1).toString().padStart(4, '0')}`;
    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO invoices (user_id, client_id, invoice_number, currency, issue_date, due_date, notes, gct_enabled, whatsapp_reminder, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
      `).run(req.user.id, client_id, invoice_number, currency, issue_date, due_date, notes, gct_enabled, whatsapp_reminder);
      const invoiceId = result.lastInsertRowid;
      const stmt = db.prepare('INSERT INTO invoice_items (invoice_id, description, quantity, unit_price) VALUES (?, ?, ?, ?)');
      for (const item of items) stmt.run(invoiceId, item.description, item.quantity || 1, item.unit_price);
      return invoiceId;
    });
    const invoiceId = transaction();
    res.status(201).json({ id: invoiceId, invoice_number });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// ─── Get one ─────────────────────────────────────────
router.get('/:id', auth, (req, res) => {
  try {
    const invoice = getInvoiceWithItems(req.params.id, req.user.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

// ─── Update ──────────────────────────────────────────
router.put('/:id', auth, (req, res) => {
  const { client_id, currency, issue_date, due_date, notes, gct_enabled, whatsapp_reminder, items, status } = req.body;
  try {
    db.transaction(() => {
      db.prepare(`
        UPDATE invoices SET client_id=?, currency=?, issue_date=?, due_date=?, notes=?, gct_enabled=?, whatsapp_reminder=?, status=?
        WHERE id=? AND user_id=?
      `).run(client_id, currency, issue_date, due_date, notes, gct_enabled, whatsapp_reminder, status || 'draft', req.params.id, req.user.id);
      db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(req.params.id);
      const stmt = db.prepare('INSERT INTO invoice_items (invoice_id, description, quantity, unit_price) VALUES (?, ?, ?, ?)');
      for (const item of items) stmt.run(req.params.id, item.description, item.quantity || 1, item.unit_price);
    })();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

// ─── Delete ──────────────────────────────────────────
router.delete('/:id', auth, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

// ─── Status update ───────────────────────────────────
router.put('/:id/status', auth, (req, res) => {
  try {
    db.prepare('UPDATE invoices SET status = ? WHERE id = ? AND user_id = ?').run(req.body.status, req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

// ─── Send via Email ──────────────────────────────────
router.post('/:id/send-email', auth, async (req, res) => {
  try {
    const invoice = getInvoiceWithItems(req.params.id, req.user.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (!invoice.client_email) return res.status(400).json({ error: 'Client has no email address on file.' });

    const businessName = invoice.company_name || invoice.business_name;
    const html = buildInvoiceEmailHtml(invoice, businessName);
    await sendEmail(invoice.client_email, `Invoice ${invoice.invoice_number} from ${businessName}`, html);

    // Mark as sent/pending
    if (invoice.status === 'draft') {
      db.prepare("UPDATE invoices SET status = 'pending' WHERE id = ?").run(req.params.id);
    }
    res.json({ success: true, sent_to: invoice.client_email, simulated: !transporter });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send email.' });
  }
});

// ─── Send Reminder via Email ─────────────────────────
router.post('/:id/remind-email', auth, async (req, res) => {
  try {
    const invoice = getInvoiceWithItems(req.params.id, req.user.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (!invoice.client_email) return res.status(400).json({ error: 'Client has no email address.' });

    const businessName = invoice.company_name || invoice.business_name;
    const template = templates.invoiceReminder(
      { name: invoice.client_name },
      { invoice_number: invoice.invoice_number, currency: invoice.currency, total: invoice.total, due_date: invoice.due_date },
      businessName
    );
    await sendEmail(invoice.client_email, template.subject, template.html);
    res.json({ success: true, sent_to: invoice.client_email, simulated: !transporter });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reminder.' });
  }
});

// ─── WhatsApp link (client-side opens wa.me) ─────────
router.get('/:id/whatsapp-link', auth, (req, res) => {
  try {
    const invoice = getInvoiceWithItems(req.params.id, req.user.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const businessName = invoice.company_name || invoice.business_name;
    const message = encodeURIComponent(
      `Hi ${invoice.client_name},\n\nThis is a message from ${businessName}.\n\nInvoice ${invoice.invoice_number} for ${invoice.currency} $${invoice.total.toLocaleString()} is due on ${invoice.due_date}.\n\nPlease let us know if you have any questions.\n\nThank you!`
    );
    const phone = invoice.client_phone?.replace(/\D/g, '');
    const url = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    res.json({ url, phone: phone || null });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── WhatsApp Reminder link ───────────────────────────
router.get('/:id/whatsapp-reminder-link', auth, (req, res) => {
  try {
    const invoice = getInvoiceWithItems(req.params.id, req.user.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const businessName = invoice.company_name || invoice.business_name;
    const message = encodeURIComponent(
      `Hi ${invoice.client_name},\n\nKind reminder from ${businessName} — Invoice ${invoice.invoice_number} for ${invoice.currency} $${invoice.total.toLocaleString()} was due on ${invoice.due_date}.\n\nPlease arrange payment at your earliest convenience.\n\nThank you!`
    );
    const phone = invoice.client_phone?.replace(/\D/g, '');
    const url = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Invoice HTML for email ───────────────────────────
function buildInvoiceEmailHtml(invoice, businessName) {
  const itemRows = invoice.items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #E4EDEA;">${item.description}</td>
      <td style="padding:10px 0;border-bottom:1px solid #E4EDEA;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #E4EDEA;text-align:right;">${invoice.currency} ${Number(item.unit_price).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
      <td style="padding:10px 0;border-bottom:1px solid #E4EDEA;text-align:right;font-weight:600;">${invoice.currency} ${(item.quantity * item.unit_price).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F9F8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#0D1F1A;">
  <div style="max-width:600px;margin:32px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0F6E56,#1D9E75);padding:32px;color:white;">
      <div style="font-size:22px;font-weight:700;margin-bottom:4px;">${businessName}</div>
      <div style="font-size:13px;opacity:0.85;">INVOICE</div>
    </div>
    <!-- Invoice meta -->
    <div style="padding:28px 32px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:28px;">
        <div>
          <div style="font-size:12px;color:#6B7F7A;font-weight:600;letter-spacing:0.5px;margin-bottom:4px;">BILLED TO</div>
          <div style="font-size:16px;font-weight:700;">${invoice.client_name}</div>
          ${invoice.client_address ? `<div style="font-size:13px;color:#6B7F7A;margin-top:2px;">${invoice.client_address}</div>` : ''}
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;color:#6B7F7A;font-weight:600;letter-spacing:0.5px;margin-bottom:4px;">INVOICE #</div>
          <div style="font-size:16px;font-weight:700;">${invoice.invoice_number}</div>
          <div style="font-size:12px;color:#6B7F7A;margin-top:6px;">Issue: ${invoice.issue_date}</div>
          <div style="font-size:12px;color:#6B7F7A;">Due: <strong style="color:#D84040;">${invoice.due_date}</strong></div>
        </div>
      </div>

      <!-- Items table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#F7F9F8;">
            <th style="padding:10px 0;text-align:left;font-size:12px;color:#6B7F7A;font-weight:600;letter-spacing:0.5px;">DESCRIPTION</th>
            <th style="padding:10px 0;text-align:center;font-size:12px;color:#6B7F7A;font-weight:600;letter-spacing:0.5px;">QTY</th>
            <th style="padding:10px 0;text-align:right;font-size:12px;color:#6B7F7A;font-weight:600;letter-spacing:0.5px;">UNIT PRICE</th>
            <th style="padding:10px 0;text-align:right;font-size:12px;color:#6B7F7A;font-weight:600;letter-spacing:0.5px;">TOTAL</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <!-- Totals -->
      <div style="border-top:2px solid #E4EDEA;padding-top:16px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">
          <span style="color:#6B7F7A;">Subtotal</span>
          <span>${invoice.currency} ${invoice.subtotal.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        </div>
        ${invoice.gct_enabled ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">
          <span style="color:#6B7F7A;">GCT (15%)</span>
          <span>${invoice.currency} ${invoice.gct.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;font-size:20px;font-weight:800;color:#1D9E75;margin-top:12px;padding-top:12px;border-top:1px solid #E4EDEA;">
          <span>TOTAL DUE</span>
          <span>${invoice.currency} ${invoice.total.toLocaleString(undefined,{minimumFractionDigits:2})}</span>
        </div>
      </div>

      ${invoice.notes ? `<div style="margin-top:24px;padding:16px;background:#F7F9F8;border-radius:10px;font-size:13px;color:#6B7F7A;"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}
    </div>

    <!-- Footer -->
    <div style="background:#F7F9F8;padding:20px 32px;text-align:center;font-size:12px;color:#A8B8B4;">
      Generated by QuickInvoice Caribbean · quickinvoice.app
    </div>
  </div>
</body>
</html>`;
}

module.exports = router;
