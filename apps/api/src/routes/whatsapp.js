import { Router } from 'express';
import { query } from '../db.js';
import {
  sendWhatsAppText,
  buildPaymentLinkMessage,
  buildReminderMessage,
  buildReceiptMessage,
  buildBillPaidMessage,
  buildRechargeSuccessMessage
} from '../services/whatsapp.js';

const router = Router();

router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

router.post('/webhook', async (req, res, next) => {
  try {
    await query(
      `INSERT INTO whatsapp_events (wa_message_id, from_number, event_type, payload)
       VALUES ($1, $2, $3, $4)`,
      [
        req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id ?? null,
        req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from ?? null,
        'webhook',
        req.body
      ]
    );
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

router.post('/send-link', async (req, res, next) => {
  try {
    const { invoiceId } = req.body;
    const result = await query(`
      SELECT i.*, c.name AS customer_name, c.whatsapp_number
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      WHERE i.id = $1
    `, [invoiceId]);
    const invoice = result.rows[0];
    if (!invoice || !invoice.payment_link) return res.status(400).json({ error: 'Invoice or payment link not found' });

    const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency.toUpperCase() }).format(invoice.amount_cents / 100);
    const response = await sendWhatsAppText({
      to: invoice.whatsapp_number,
      body: buildPaymentLinkMessage({
        customerName: invoice.customer_name,
        amount,
        paymentLink: invoice.payment_link,
        invoiceNumber: invoice.invoice_number
      })
    });

    await query(
      `INSERT INTO reminders (invoice_id, channel, reminder_type, status, sent_at)
       VALUES ($1, 'whatsapp', 'payment_link', 'sent', NOW())`,
      [invoice.id]
    );

    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/send-reminder', async (req, res, next) => {
  try {
    const { invoiceId } = req.body;
    const result = await query(`
      SELECT i.*, c.name AS customer_name, c.whatsapp_number
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      WHERE i.id = $1
    `, [invoiceId]);
    const invoice = result.rows[0];
    if (!invoice || !invoice.payment_link) return res.status(400).json({ error: 'Invoice or payment link not found' });

    const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency.toUpperCase() }).format(invoice.amount_cents / 100);
    const response = await sendWhatsAppText({
      to: invoice.whatsapp_number,
      body: buildReminderMessage({
        customerName: invoice.customer_name,
        amount,
        paymentLink: invoice.payment_link,
        invoiceNumber: invoice.invoice_number
      })
    });

    await query(
      `INSERT INTO reminders (invoice_id, channel, reminder_type, status, sent_at)
       VALUES ($1, 'whatsapp', 'reminder', 'sent', NOW())`,
      [invoice.id]
    );

    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/send-receipt', async (req, res, next) => {
  try {
    const { invoiceId } = req.body;
    const result = await query(`
      SELECT i.*, c.name AS customer_name, c.whatsapp_number
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      WHERE i.id = $1
    `, [invoiceId]);
    const invoice = result.rows[0];
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency.toUpperCase() }).format(invoice.amount_cents / 100);
    const response = await sendWhatsAppText({
      to: invoice.whatsapp_number,
      body: buildReceiptMessage({
        customerName: invoice.customer_name,
        amount,
        invoiceNumber: invoice.invoice_number
      })
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/send-bill-success', async (req, res, next) => {
  try {
    const { customerPhone, customerName, billerName, amount, accountNumber } = req.body;
    const response = await sendWhatsAppText({
      to: customerPhone,
      body: buildBillPaidMessage({ customerName, billerName, amount, accountNumber })
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/send-recharge-success', async (req, res, next) => {
  try {
    const { customerPhone, mobileNumber, amount, operatorCode } = req.body;
    const response = await sendWhatsAppText({
      to: customerPhone,
      body: buildRechargeSuccessMessage({ mobileNumber, amount, operatorCode })
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
