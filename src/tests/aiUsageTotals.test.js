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
