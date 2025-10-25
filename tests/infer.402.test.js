import request from 'supertest';
import app from '../src/server.js';

describe('Inference 402 flow', () => {
  it('returns 402 with payment payload', async () => {
    const res = await request(app)
      .post('/v1/infer')
      .send({ model: 'hyperagi-70b', input: 'hello' })
      .expect(402);
    expect(res.body.error).toBe('PaymentRequired');
    expect(res.body.payment.payment_id).toBeDefined();
    expect(res.body.payment.amount).toBeDefined();
  });
});