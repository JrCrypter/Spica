import { Router } from 'express';
const router = Router();
router.get('/', (_req, res) => res.json({ ok: true, service: 'spicapay-api-v2' }));
export default router;
