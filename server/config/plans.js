module.exports = {
  free: {
    name: 'Free',
    price_monthly_usd: 0,
    price_annual_usd: 0,
    invoice_limit: 5,
    client_limit: 3,
    currencies: ['JMD'],
    whatsapp_reminders: false,
    pdf_export: false,
    reports: false,
    multi_currency: false
  },
  starter: {
    name: 'Starter',
    price_monthly_usd: 12,
    price_annual_usd: 99,
    invoice_limit: 50,
    client_limit: 20,
    currencies: ['JMD', 'USD', 'TTD', 'BBD'],
    whatsapp_reminders: true,
    pdf_export: true,
    reports: false,
    multi_currency: true
  },
  pro: {
    name: 'Pro',
    price_monthly_usd: 25,
    price_annual_usd: 199,
    invoice_limit: null,
    client_limit: null,
    currencies: ['JMD', 'USD', 'TTD', 'BBD', 'GYD', 'XCD'],
    whatsapp_reminders: true,
    pdf_export: true,
    reports: true,
    multi_currency: true
  }
};
