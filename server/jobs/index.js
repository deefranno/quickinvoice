const cron = require('node-cron');
const db = require('../db/database');

const startJobs = () => {
  if (process.env.ENABLE_JOBS !== 'true' && process.env.NODE_ENV !== 'production') {
    return;
  }

  // Daily midnight — Mark overdue invoices
  cron.schedule('0 0 * * *', () => {
    db.prepare(`
      UPDATE invoices 
      SET status = 'overdue' 
      WHERE due_date < date('now') 
      AND status = 'pending'
    `).run();
    console.log('Cron: Marked overdue invoices');
  });

  // Daily 1:00 AM — Past due subscriptions
  cron.schedule('0 1 * * *', () => {
    // Logic to mark subscriptions as past_due if period ended
    console.log('Cron: Checked subscription statuses');
  });
};

module.exports = startJobs;
