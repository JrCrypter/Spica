import { Router } from 'express';
import { query } from '../db.js';
import { createInvoiceCheckoutSession, stripe } from '../services/stripe.js';

const router = Router();

router.post('/checkout-session', async (req, res, next) => {
  try {
    const { invoiceId } = req.body;
    const invoiceResult = await query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
    const invoice = invoiceResult.rows[0];
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const session = await createInvoiceCheckoutSession(invoice);
    await query(
      'UPDATE invoices SET stripe_session_id = $1, payment_link = $2 WHERE id = $3',
      [session.id, session.url, invoice.id]
    );

    res.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    next(error);
  }
});

router.post('/webhook', async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const payload = req.rawBody;
    const event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const invoiceId = Number(session.metadata.invoiceId);

      await query(`UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = $1`, [invoiceId]);
      await query(
        `INSERT INTO payments (invoice_id, provider, provider_payment_id, amount_cents, currency, status)
         VALUES ($1, 'stripe', $2, $3, $4, 'paid')`,
        [invoiceId, session.payment_intent, session.amount_total, session.currency]
      );
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});

export default router;
