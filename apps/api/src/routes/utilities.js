import { Router } from 'express';
import { query } from '../db.js';
import { fetchBill, payBill, rechargeMobile } from '../services/utilityProvider.js';

const router = Router();

function makeRef(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

router.get('/billers', async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM billers ORDER BY category, name');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/transactions', async (_req, res, next) => {
  try {
    const result = await query(`
      SELECT ut.*, c.name AS customer_name
      FROM utility_transactions ut
      LEFT JOIN customers c ON c.id = ut.customer_id
      ORDER BY ut.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/bill/fetch', async (req, res, next) => {
  try {
    const { billerCode, accountNumber } = req.body;
    const bill = await fetchBill({ billerCode, accountNumber });
    res.json(bill);
  } catch (error) {
    next(error);
  }
});

router.post('/bill/pay', async (req, res, next) => {
  try {
    const { customerId, billerCode, accountNumber, amountCents } = req.body;
    const providerResult = await payBill({ billerCode, accountNumber, amountCents });
    const transactionRef = makeRef('BILLPAY');

    const result = await query(
      `INSERT INTO utility_transactions
       (transaction_ref, type, customer_id, biller_code, account_number, amount_cents, currency, status, provider_reference, metadata, completed_at)
       VALUES ($1, 'bill_payment', $2, $3, $4, $5, 'inr', 'paid', $6, $7, NOW())
       RETURNING *`,
      [
        transactionRef,
        customerId || null,
        billerCode,
        accountNumber,
        amountCents,
        providerResult.providerReference,
        { source: 'simulated_bill_provider' }
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/recharge/pay', async (req, res, next) => {
  try {
    const { customerId, operatorCode, mobileNumber, amountCents } = req.body;
    const providerResult = await rechargeMobile({ operatorCode, mobileNumber, amountCents });
    const transactionRef = makeRef('RECHARGE');

    const result = await query(
      `INSERT INTO utility_transactions
       (transaction_ref, type, customer_id, operator_code, mobile_number, amount_cents, currency, status, provider_reference, metadata, completed_at)
       VALUES ($1, 'recharge', $2, $3, $4, $5, 'inr', 'paid', $6, $7, NOW())
       RETURNING *`,
      [
        transactionRef,
        customerId || null,
        operatorCode,
        mobileNumber,
        amountCents,
        providerResult.providerReference,
        { source: 'simulated_recharge_provider' }
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
