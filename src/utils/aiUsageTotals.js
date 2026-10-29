const tokenCount = value => {
  if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+$/.test(value))) return null;
  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
};

// Prefer the backend's complete provider total. Extra token categories overlap
// input/output; cached/reasoning counters must never be added again.
export function completeTokenTotal(totals) {
  if (!totals) return null;
  const requests = tokenCount(totals.requests);
  if (requests === 0) return 0;
  // A merged report must not replace an incomplete total with a subtotal.
  if (totals.total_tokens_complete === false) return null;
  if (totals.total_tokens != null) return tokenCount(totals.total_tokens);
  if (requests === null || tokenCount(totals.unknown_token_requests) !== 0) return null;
  const input = tokenCount(totals.input_tokens), output = tokenCount(totals.output_tokens);
  if (input === null || output === null) return null;
  const total = input + output;
  return Number.isSafeInteger(total) ? total : null;
}
