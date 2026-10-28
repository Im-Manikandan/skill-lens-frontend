import test from 'node:test';
import assert from 'node:assert/strict';
import { completeTokenTotal } from '../utils/aiUsageTotals.js';

test('mixed known and missing usage stays unknown', () => {
  assert.equal(completeTokenTotal({requests: 2, unknown_token_requests: 1, input_tokens: 10, output_tokens: 5}), null);
});
test('complete usage excludes cached tokens from additional total', () => {
  assert.equal(completeTokenTotal({requests: 1, unknown_token_requests: 0, input_tokens: 10, output_tokens: 5, cached_tokens: 8}), 15);
});
test('empty, absent, invalid, overflowing counters', () => {
  assert.equal(completeTokenTotal({requests: 0}), 0);
  assert.equal(completeTokenTotal(undefined), null);
  for (const value of [null, '', -1, 1.5, 'bad', Number.MAX_SAFE_INTEGER]) {
    assert.equal(completeTokenTotal({requests: 1, unknown_token_requests: 0, input_tokens: value, output_tokens: 5}), null);
  }
});


test('provider total wins over input/output and overlapping categories, including zero', () => {
  const counts = {requests: 1, unknown_token_requests: 0, input_tokens: 20, output_tokens: 7,
    cached_tokens: 12, reasoning_tokens: 5, thought_tokens: 2};
  assert.equal(completeTokenTotal({...counts, total_tokens: 29}), 29);
  assert.equal(completeTokenTotal({...counts, total_tokens: '29'}), 29);
  assert.equal(completeTokenTotal({...counts, total_tokens: 0}), 0);
  assert.equal(completeTokenTotal({...counts, total_tokens: null}), 27);
  assert.equal(completeTokenTotal(counts), 27);
  assert.equal(completeTokenTotal({requests: 1, unknown_token_requests: 1, total_tokens: 29}), 29);
});

test('invalid provider totals stay unknown; incomplete fallback data cannot invent totals', () => {
  const counts = {requests: 1, unknown_token_requests: 0, input_tokens: 20, output_tokens: 7};
  for (const total_tokens of ['', ' ', false, true, [], {}, -1, 1.5, 'bad', Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(completeTokenTotal({...counts, total_tokens}), null);
  }
  for (const value of [null, undefined, false, true, '', ' ', [], {}, -1]) {
    assert.equal(completeTokenTotal({...counts, input_tokens: value}), null);
    assert.equal(completeTokenTotal({...counts, unknown_token_requests: value}), null);
  }
  assert.equal(completeTokenTotal({...counts, requests: null}), null);
  assert.equal(completeTokenTotal({...counts, total_tokens: null, total_tokens_complete: false}), null);
});
