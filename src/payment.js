export async function verifyPayment(xPaymentHeader) {
  try {
    const decoded = Buffer.from(xPaymentHeader, 'base64').toString();
    const payload = JSON.parse(decoded);
    if (!payload || !payload.payment_id || !payload.signature) {
      return { ok: false, error: 'missing_fields' };
    }
    if (payload.signature === 'ok') {
      return { ok: true, payment_id: payload.payment_id };
    }
    return { ok: false, error: 'bad_signature' };
  } catch (e) {
    return { ok: false, error: 'decode_error' };
  }
}