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

// POST /api/payments/webhook (Paystack Real-time Webhook Receiver)
paymentsRouter.post('/webhook', (req: Request, res: Response) => {
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers['x-paystack-signature'] as string;

  // Verify HMAC-SHA512 signature if secret key is configured and signature header is present
  if (paystackSecret && signature) {
    const rawPayload = (req as any).rawBody ? (req as any).rawBody.toString('utf8') : JSON.stringify(req.body);
    const hash = crypto.createHmac('sha512', paystackSecret).update(rawPayload).digest('hex');

    if (hash !== signature) {
      console.warn('[Paystack Webhook] Invalid HMAC-SHA512 signature rejected');
      return res.status(401).json({ success: false, error: 'Invalid HMAC signature' });
    }
  }

  const event = req.body;
  const eventType = event?.event;

  console.log(`[Paystack Webhook] Event received: ${eventType || 'ping'}`);

  if (eventType === 'charge.success') {
    const data = event.data || {};
    const reference = data.reference;
    // Paystack amounts are transmitted in kobo (1 NGN = 100 kobo)
    const amount = typeof data.amount === 'number' ? data.amount / 100 : 0;
    const metadata = data.metadata || {};

    const payments = store.getPayments();
    let payment = payments.find((p) => p.reference === reference);

    if (payment) {
      payment.status = 'successful';
    } else if (reference) {
      payment = store.createPayment({
        reference,
        userId: metadata.userId || 'pat-1',
        patientName: metadata.patientName || data.customer?.first_name || 'Patient',
        amount,
        purpose: metadata.purpose || 'consultation',
        method: 'card',
        status: 'successful',
        consultationId: metadata.consultationId,
      });
    }

    // Auto-credit patient wallet if topup event
    if (metadata.purpose === 'wallet_topup' && metadata.userId) {
      const user = store.getUserById(metadata.userId);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + amount;
        store.saveUser(user);
      }
    }

    // If records export paid
    if (metadata.purpose === 'records_export') {
      store.saveExportAuthorization('app-1', { isPaid: true });
    }
  }

  // Paystack requires HTTP 200 OK acknowledgment within 5 seconds
  return res.status(200).json({ success: true, message: 'Webhook event processed successfully' });
});

