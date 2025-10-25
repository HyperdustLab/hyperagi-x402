import request from 'supertest';
import app from '../src/server.js';

describe('Successful inference with payment', () => {
  it('accepts mocked X-PAYMENT and returns 200', async () => {
    const fakeReceipt = Buffer.from(JSON.stringify({ payment_id: 'pid_ok', signature: 'ok' })).toString('base64');
    const res = await request(app)
      .post('/v1/infer')
      .set('X-PAYMENT', fakeReceipt)
      .send({ model: 'hyperagi-70b', input: 'hello' })
      .expect(200);
    expect(res.body.result).toBeDefined();
    expect(res.body.usage.gas_units).toBeGreaterThan(0);
  });
});