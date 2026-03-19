import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const result = await query('SELECT * FROM customers ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, whatsappNumber } = req.body;
    const result = await query(
      `INSERT INTO customers (name, email, phone, whatsapp_number)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, phone, whatsappNumber]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
