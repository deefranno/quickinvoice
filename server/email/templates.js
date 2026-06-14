const welcome = (user) => ({
  subject: 'Welcome to QuickInvoice Caribbean!',
  html: `
    <div style="font-family: sans-serif; color: #0D1F1A;">
      <h1 style="color: #1D9E75;">Welcome, ${user.name}!</h1>
      <p>Thank you for joining QuickInvoice Caribbean. We're excited to help you manage your business invoicing.</p>
      <p>Get started by creating your first client and invoice!</p>
      <div style="margin-top: 20px; padding: 20px; background: #F2F7F5; border-radius: 12px;">
        <p>Your current plan: <strong>${user.plan.toUpperCase()}</strong></p>
      </div>
    </div>
  `
});

const subscriptionConfirmed = (user, plan, gateway) => ({
  subject: 'Subscription Confirmed',
  html: `<p>Hi ${user.name}, your ${plan} subscription has been confirmed via ${gateway}. Thank you!</p>`
});

const paymentFailed = (user, amount, gateway) => ({
  subject: 'Payment Failed',
  html: `<p>Hi ${user.name}, your payment of ${amount} via ${gateway} failed. Please update your payment method.</p>`
});

const invoiceReminder = (client, invoice, business_name) => ({
  subject: `Invoice Reminder: ${invoice.invoice_number}`,
  html: `
    <p>Hi ${client.name},</p>
    <p>This is a reminder from <strong>${business_name}</strong> that invoice <strong>${invoice.invoice_number}</strong> for ${invoice.currency} ${invoice.total} is due on ${invoice.due_date}.</p>
  `
});

const subscriptionCancelled = (user, end_date) => ({
  subject: 'Subscription Cancelled',
  html: `<p>Hi ${user.name}, your subscription has been cancelled and will end on ${end_date}.</p>`
});

const wipayRenewalDue = (user, payment_link, amount, due_date) => ({
  subject: 'Subscription Renewal Due',
  html: `
    <p>Hi ${user.name}, your subscription renewal for ${amount} is due on ${due_date}.</p>
    <p>Click here to pay: <a href="${payment_link}">${payment_link}</a></p>
  `
});

const adminWeeklyReport = (stats) => ({
  subject: 'Weekly Platform Report',
  html: `<h1>Weekly Report</h1><pre>${JSON.stringify(stats, null, 2)}</pre>`
});

module.exports = {
  welcome,
  subscriptionConfirmed,
  paymentFailed,
  invoiceReminder,
  subscriptionCancelled,
  wipayRenewalDue,
  adminWeeklyReport
};
