import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { verifyPayment } from './payment.js';
import { estimateGasUnits, priceForGasUnits } from './pricing.js';
import { performInference } from './simulate-infer.js';

dotenv.config();

const app = express();
app.use(morgan('tiny'));
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS || '0xYourRecipientAddress';

app.post('/v1/infer', async (req, res) => {
  const idempotencyKey = req.header('Idempotency-Key') || uuidv4();
  const { model, input, max_tokens = 1024, stream = false } = req.body || {};

  if (!model || !input) {
    return res.status(400).json({ error: 'BadRequest', message: 'model and input are required' });
  }

  const gasUnits = estimateGasUnits({ model, input, max_tokens, stream });
  const amount = priceForGasUnits(gasUnits);

  const paymentHeader = req.header('X-PAYMENT');

  if (!paymentHeader) {
    return res.status(402).json({
      error: 'PaymentRequired',
      message: 'Insufficient funds; please pay and retry.',
      payment: {
        payment_id: 'pid_' + uuidv4(),
        chain: 'base',
        currency: 'USDC',
        amount: amount,
        gas_units: gasUnits,
        price_per_unit: process.env.PRICE_PER_UNIT || '0.000001',
        recipient: MERCHANT_ADDRESS,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        facilitator: {
          verify_url: process.env.FACILITATOR_VERIFY_URL || 'https://api.hyperagi.ai/pay/verify',
          settle_url: process.env.FACILITATOR_SETTLE_URL || 'https://api.hyperagi.ai/pay/settle'
        },
        checkout_url: `https://dashboard.hyperagi.ai/checkout/${idempotencyKey}`,
        memo: `infer:${model}`,
        payment_methods: ['onchain','channel','card']
      }
    });
  }

  const verified = await verifyPayment(paymentHeader);
  if (!verified.ok) {
    return res.status(402).json({
      error: 'PaymentRequired',
      message: 'Payment verification failed or expired. Please pay and retry.',
      details: verified.error || 'invalid_receipt'
    });
  }

  const result = await performInference({ model, input, max_tokens, stream });

  return res.json({
    result,
    usage: {
      gas_units: gasUnits,
      amount,
      model_version: '1.0.0'
    }
  });
});

app.post('/pay/verify', (req, res) => {
  return res.json({ status: 'success', payment_id: req.body?.payment_id || null });
});

app.post('/pay/settle', (req, res) => {
  return res.json({ status: 'settled', payment_id: req.body?.payment_id || null });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`HyperAGI Inference API listening on :${PORT}`);
  });
}

export default app;