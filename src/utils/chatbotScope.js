// Redux selection is a request scope, never proof of authorization.
// The backend rechecks the selected client's active membership on every request.
export function selectedChatClientId(compressedClientInfo, decompress) {
  if (!compressedClientInfo) return null;
  try {
    const client = JSON.parse(decompress(compressedClientInfo));
    return validClientId(client?.client_id);
  } catch {
    return null;
  }
}

function validClientId(value) {
  if (typeof value !== 'number' && !(typeof value === 'string' && /^[1-9]\d*$/.test(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function chatbotRequestBody(question, selectedClientId) {
  const clientId = validClientId(selectedClientId);
  if (clientId === null) throw new Error('Select a client before using the chatbot.');
  return {question, client_id: clientId};
}
