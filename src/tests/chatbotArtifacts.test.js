import test from 'node:test';
import assert from 'node:assert/strict';
import {artifactDownloadPath, validateArtifactBlob} from '../utils/chatbotArtifacts.js';

test('relative, absolute and mounted artifact links use configured API path and selected scope', () => {
  for (const url of ['/routes/v1/chat/artifacts/abc123', 'https://backend.example/service/routes/v1/chat/artifacts/abc123', '/api/chat/artifacts/abc123?client_id=79']) {
    assert.equal(artifactDownloadPath(url, 42), '/chat/artifacts/abc123?client_id=42');
  }
  // Origin in generated text is never used for the authenticated request.
  assert.equal(artifactDownloadPath('https://untrusted.example/chat/artifacts/abc123', 42), '/chat/artifacts/abc123?client_id=42');
});

test('unsafe paths and missing client scope cannot produce downloads', () => {
  for (const url of ['javascript:alert(1)', '/chat/artifacts/../private', '/chat/artifacts/a%2Fb', '/other/file.pdf', '/chat/artifacts/']) {
    assert.throws(() => artifactDownloadPath(url, 42));
  }
  assert.throws(() => artifactDownloadPath('/chat/artifacts/abc', null), /Select a client/);
});

test('HTML and invalid PDF content are rejected before saving', async () => {
  await assert.rejects(validateArtifactBlob(new Blob(['<html>SPA</html>'], {type: 'text/html'}), 'application/pdf'));
  await assert.rejects(validateArtifactBlob(new Blob(['<html>SPA</html>'], {type: 'application/pdf'}), 'application/pdf'));
  await validateArtifactBlob(new Blob(['%PDF-1.7\nsynthetic'], {type: 'application/pdf'}), 'application/pdf');
});
