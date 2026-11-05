import { Router, Request, Response } from 'express';
import { store } from '../store';
import crypto from 'crypto';

export const paymentsRouter = Router();

// POST /api/payments/initialize
paymentsRouter.post('/initialize', (req: Request, res: Response) => {
  const { userId = 'pat-1', patientName = 'Ada Okonkwo', amount, purpose, method, consultationId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid amount is required' });
  }

  const reference = `PRIME-PAY-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const payment = store.createPayment({
    reference,
    userId,
    patientName,
    amount: Number(amount),
    purpose: purpose || 'consultation',
    method: method || 'card',
    status: method === 'wallet' ? 'successful' : 'pending',
    consultationId,
  });

  return res.json({
    success: true,
    payment,
    checkoutUrl: `https://checkout.paystack.com/simulate/${reference}`,
  });
});

// POST /api/payments/verify
paymentsRouter.post('/verify', (req: Request, res: Response) => {
  const { reference } = req.body;

  const payments = store.getPayments();
  const payment = payments.find((p) => p.reference === reference);

  if (!payment) {
    return res.status(404).json({ success: false, error: 'Transaction reference not found' });
  }

  payment.status = 'successful';

  // If this was paying for records export, mark export as paid
  if (payment.purpose === 'records_export') {
    store.saveExportAuthorization('app-1', { isPaid: true });
  }

  return res.json({
    success: true,
    message: 'Payment verified successfully',
    payment,
  });
});

// GET /api/payments/wallet
paymentsRouter.get('/wallet', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'pat-1';
  const user = store.getUserById(userId);
  const transactions = store.getPayments(userId);

  return res.json({
    success: true,
    walletBalance: user?.walletBalance || 0,
    currency: 'NGN (₦)',
    transactions,
  });
});

// POST /api/payments/topup
paymentsRouter.post('/topup', (req: Request, res: Response) => {
  const { userId = 'pat-1', amount, method = 'card' } = req.body;

  if (!amount || amount < 1000) {
    return res.status(400).json({ success: false, error: 'Minimum topup amount is ₦1,000' });
  }

  const user = store.getUserById(userId);
  const reference = `TOPUP-${Date.now()}`;

  const payment = store.createPayment({
    reference,
    userId,
    patientName: user?.name || 'Ada Okonkwo',
    amount: Number(amount),
    purpose: 'wallet_topup',
    method,
    status: 'successful',
  });

  return res.json({
    success: true,
    message: `₦${Number(amount).toLocaleString()} added to digital health wallet`,
    newBalance: user?.walletBalance,
    payment,
  });
});

// POST /api/payments/withdraw (Doctor Earnings Payout)
paymentsRouter.post('/withdraw', (req: Request, res: Response) => {
  const { doctorId = 'doc-1', amount, bankName, accountNumber, accountName } = req.body;

  if (!amount || amount < 5000) {
    return res.status(400).json({ success: false, error: 'Minimum doctor withdrawal is ₦5,000' });
  }

  if (!bankName || !accountNumber) {
    return res.status(400).json({ success: false, error: 'Bank name and account number are required' });
  }

  const payoutReference = `PAYOUT-MDCN-${Date.now()}`;

  return res.json({
    success: true,
    message: `Payout transfer of ₦${Number(amount).toLocaleString()} queued for processing via NIBSS/Paystack to ${bankName} (${accountNumber})`,
    payoutReference,
    estimatedSettlement: 'Within 2 hours',
  });
});

