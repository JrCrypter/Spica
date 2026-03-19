import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createInvoiceCheckoutSession(invoice) {
  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: invoice.currency,
          product_data: { name: `Invoice ${invoice.invoice_number}` },
          unit_amount: invoice.amount_cents
        },
        quantity: 1
      }
    ],
    success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/cancel?invoice=${invoice.invoice_number}`,
    metadata: {
      invoiceId: String(invoice.id),
      invoiceNumber: invoice.invoice_number
    }
  });
}
