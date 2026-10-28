import test from 'node:test';
import assert from 'node:assert/strict';
import {chatbotRequestBody, selectedChatClientId} from '../utils/chatbotScope.js';

test('scope comes exclusively from the selected compressed Redux client', () => {
  const decode = value => JSON.stringify({client_id: value === 'selected-A' ? 42 : 79});
  assert.equal(selectedChatClientId('selected-A', decode), 42);
  assert.equal(selectedChatClientId('selected-B', decode), 79);
  assert.equal(selectedChatClientId(null, () => {throw new Error('must not decode');}), null);
  assert.equal(selectedChatClientId('broken', () => {throw new Error('bad compression');}), null);
  assert.equal(selectedChatClientId('broken', () => 'invalid json'), null);
  for (const value of [null, {}, {company_id: 42}, {client_id: true}, {client_id: 0}]) {
    assert.equal(selectedChatClientId('state', () => JSON.stringify(value)), null);
  }
});

test('normal messages and export confirmations carry only their selected client', () => {
  for (const client of [42, 79, '123']) {
    for (const question of ['Find engineers', '__artifact_export__:{"artifact_type":"pdf"}']) {
      assert.deepEqual(chatbotRequestBody(question, client), {question, client_id: Number(client)});
    }
  }
});

test('missing, malformed, unsafe client IDs never fall back to another tenant', () => {
  for (const value of [null, undefined, false, true, '', ' ', '42x', '1e2', [], {}, 0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => chatbotRequestBody('question', value), /Select a client/);
    assert.equal(selectedChatClientId('state', () => JSON.stringify({client_id: value})), null);
  }
});
