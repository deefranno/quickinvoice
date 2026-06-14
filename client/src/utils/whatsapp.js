export const generateMessage = (invoice, client, business_name, type) => {
  const num = invoice.invoice_number;
  const amount = invoice.total.toLocaleString();
  const currency = invoice.currency;
  const date = invoice.due_date;

  switch (type) {
    case 'reminder':
      return `Hi ${client.name}, this is a friendly reminder from ${business_name}. Invoice #${num} for ${amount} ${currency} is due on ${date}. Thank you! 🙏`;
    case 'overdue':
      return `Hi ${client.name}, your invoice #${num} for ${amount} ${currency} from ${business_name} was due on ${date} and is now overdue. Please make payment at your earliest convenience. Thank you.`;
    case 'paid_receipt':
      return `Hi ${client.name}, we've received your payment for Invoice #${num}. Thank you for your business! 🙌`;
    case 'share':
      return `Hi ${client.name}, please find Invoice #${num} for ${amount} ${currency} from ${business_name}, due on ${date}. Thank you!`;
    default:
      return '';
  }
};

export const openWhatsApp = (phone, message) => {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};
