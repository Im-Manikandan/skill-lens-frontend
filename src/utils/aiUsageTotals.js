// Never turn a recorded subtotal into a complete token total.
export function completeTokenTotal(totals) {
  if (!totals) return null;
  if (Number(totals.requests) === 0) return 0;
  if (Number(totals.unknown_token_requests) !== 0) return null;
  const valid = value => value != null && value !== ''
    && Number.isSafeInteger(Number(value)) && Number(value) >= 0;
  if (!valid(totals.input_tokens) || !valid(totals.output_tokens)) return null;
  const total = Number(totals.input_tokens) + Number(totals.output_tokens);
  return Number.isSafeInteger(total) ? total : null;
}
