import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveUsageApplication } from '../utils/aiUsageApplication.js';

test('deployment identity takes precedence over shared session mode', () => {
  assert.equal(resolveUsageApplication('admin', 'client'), 'admin');
  assert.equal(resolveUsageApplication('client', 'admin'), 'client');
});
test('shared deployments use authenticated login mode, never URL', () => {
  assert.equal(resolveUsageApplication(undefined, 'admin'), 'admin');
  assert.equal(resolveUsageApplication(undefined, 'client'), 'client');
  assert.equal(resolveUsageApplication(undefined, undefined), null);
  assert.equal(resolveUsageApplication('https://admin.example', '/admin/search'), null);
});
