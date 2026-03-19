import { Router } from 'express';
import { query } from '../db.js';
import { getReminderRecommendation } from '../services/ai.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT i.*, c.name AS customer_name, c.whatsapp_number
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      ORDER BY i.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { invoiceNumber, customerId, amountCents, currency = 'usd', dueDate } = req.body;
    const result = await query(
      `INSERT INTO invoices (invoice_number, customer_id, amount_cents, currency, due_date, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [invoiceNumber, customerId, amountCents, currency, dueDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/recommendation', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    const invoice = result.rows[0];
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const recommendation = getReminderRecommendation({
      amountCents: invoice.amount_cents,
      dueDate: invoice.due_date,
      status: invoice.status
    });
    res.json(recommendation);
  } catch (error) {
    next(error);
  }
});

export default router;
