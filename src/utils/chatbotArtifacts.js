import {chatbotRequestBody} from './chatbotScope.js';

// Never send bearer credentials to an origin supplied in assistant text.
// Extract the artifact ID, then use the application's configured API base.
export function artifactDownloadPath(artifactUrl, clientId) {
  const url = new URL(artifactUrl, 'https://artifact.invalid');
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid artifact URL');
  const match = url.pathname.match(/\/chat\/artifacts\/([A-Za-z0-9_-]{1,128})$/);
  if (!match) throw new Error('Invalid artifact URL');
  const scope = chatbotRequestBody('', clientId).client_id;
  return `/chat/artifacts/${match[1]}?client_id=${scope}`;
}

export async function validateArtifactBlob(blob, mimeType) {
  if (blob.type.toLowerCase().includes('text/html')) throw new Error('Expected a file, received HTML');
  if (mimeType === 'application/pdf' && await blob.slice(0, 5).text() !== '%PDF-') {
    throw new Error('Invalid PDF response');
  }
}
