const GRAPH_BASE = 'https://graph.facebook.com/v20.0';

export async function sendWhatsAppText({ to, body }) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  const response = await fetch(`${GRAPH_BASE}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp send failed: ${errorText}`);
  }

  return response.json();
}

export function buildPaymentLinkMessage({ customerName, amount, paymentLink, invoiceNumber }) {
  return `Hi ${customerName}, your invoice ${invoiceNumber} is ready. Amount due: ${amount}. Pay securely here: ${paymentLink}`;
}

export function buildReminderMessage({ customerName, amount, paymentLink, invoiceNumber }) {
  return `Reminder: invoice ${invoiceNumber} for ${amount} is still pending. You can complete payment here: ${paymentLink}`;
}

export function buildReceiptMessage({ customerName, amount, invoiceNumber }) {
  return `Payment received. Thanks ${customerName}! Your payment for invoice ${invoiceNumber} (${amount}) is confirmed. Receipt has been generated.`;
}

export function buildBillPaidMessage({ customerName, billerName, amount, accountNumber }) {
  return `Hi ${customerName}, your ${billerName} bill for ${amount} has been paid successfully for account ${accountNumber}.`;
}

export function buildRechargeSuccessMessage({ mobileNumber, amount, operatorCode }) {
  return `Recharge successful. ${operatorCode} number ${mobileNumber} has been recharged with ${amount}.`;
}
