const bcrypt = require('bcryptjs');
const db = require('./database');

const seed = async () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  if (userCount > 0) return;

  const adminPasswordHash = await bcrypt.hash('AdminSecure2025!', 10);
  db.prepare(`
    INSERT INTO admins (name, email, password_hash, must_change_password)
    VALUES (?, ?, ?, ?)
  `).run('Platform Admin', 'admin@quickinvoice.ky', adminPasswordHash, 1);

  const demoUserPasswordHash = await bcrypt.hash('demo1234', 10);
  const demoUserResult = db.prepare(`
    INSERT INTO users (name, email, password_hash, business_name, plan, default_currency)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Demo User', 'demo@quickinvoice.ky', demoUserPasswordHash, 'QuickInvoice Demo Co.', 'pro', 'JMD');

  const demoUserId = demoUserResult.lastInsertRowid;

  const clients = [
    { name: "Marcia's Salon", email: 'marcia@example.com', phone: '+18761234567', country: 'JA' },
    { name: 'Blue Bay Guesthouse', email: 'bluebay@example.com', phone: '+18687654321', country: 'TT' },
    { name: 'Bajan Build Ltd', email: 'bajan@example.com', phone: '+12464567890', country: 'BB' }
  ];

  const clientIds = {};
  for (const client of clients) {
    const result = db.prepare(`
      INSERT INTO clients (user_id, name, email, phone, country)
      VALUES (?, ?, ?, ?, ?)
    `).run(demoUserId, client.name, client.email, client.phone, client.country);
    clientIds[client.name] = result.lastInsertRowid;
  }

  const invoices = [
    { client: "Marcia's Salon", status: 'paid', currency: 'JMD', issue_date: '2025-05-20', due_date: '2025-06-03', gct: 1, items: [['Web Design', 45000], ['Logo Design', 15000]] },
    { client: 'Blue Bay Guesthouse', status: 'pending', currency: 'JMD', issue_date: '2025-06-08', due_date: '2025-06-22', gct: 1, items: [['Web Design', 55000], ['SEO Setup', 18500], ['Hosting', 5000]] },
    { client: 'Blue Bay Guesthouse', status: 'overdue', currency: 'USD', issue_date: '2025-05-15', due_date: '2025-06-01', gct: 0, items: [['Social Media Management', 1200]] },
    { client: 'Bajan Build Ltd', status: 'draft', currency: 'BBD', issue_date: '2025-06-10', due_date: '2025-07-05', gct: 0, items: [['Website Audit', 3400]] },
    { client: "Marcia's Salon", status: 'paid', currency: 'JMD', issue_date: '2024-04-01', due_date: '2024-04-15', gct: 1, items: [['Monthly Maintenance', 32000]] }
  ];

  let invCount = 1;
  for (const inv of invoices) {
    const invNum = `INV-2025-${invCount.toString().padStart(4, '0')}`;
    const result = db.prepare(`
      INSERT INTO invoices (user_id, client_id, invoice_number, status, currency, issue_date, due_date, gct_enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(demoUserId, clientIds[inv.client], invNum, inv.status, inv.currency, inv.issue_date, inv.due_date, inv.gct);
    
    const invoiceId = result.lastInsertRowid;
    const stmt = db.prepare('INSERT INTO invoice_items (invoice_id, description, unit_price) VALUES (?, ?, ?)');
    for (const item of inv.items) {
      stmt.run(invoiceId, item[0], item[1]);
    }
    invCount++;
  }

  const settings = [
    ['free_invoice_limit', '5'],
    ['free_client_limit', '3'],
    ['trial_days', '14'],
    ['maintenance_mode', 'false'],
    ['platform_name', 'QuickInvoice Caribbean'],
    ['support_email', 'support@quickinvoice.app']
  ];

  const settingsStmt = db.prepare('INSERT INTO platform_settings (key, value) VALUES (?, ?)');
  for (const [key, value] of settings) {
    settingsStmt.run(key, value);
  }
};

module.exports = seed;
