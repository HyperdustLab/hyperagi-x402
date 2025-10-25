const PRICE = parseFloat(process.env.PRICE_PER_UNIT || '0.000001');
const DEFAULT_GAS = parseInt(process.env.ESTIMATE_GAS_UNITS_DEFAULT || '5000', 10);

export function estimateGasUnits({ model, input, max_tokens, stream }) {
  const base = DEFAULT_GAS;
  const lenFactor = Math.min(2.0, (input?.length || 100) / 500);
  const tokenFactor = Math.min(2.0, (max_tokens || 1024) / 1024);
  return Math.ceil(base * (0.5 + 0.5 * lenFactor) * (0.5 + 0.5 * tokenFactor));
}

export function priceForGasUnits(units) {
  return (units * PRICE).toFixed(6);
}