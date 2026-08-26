// Local shim for @devopsthink/react-security-util
import { decompressSync, compressSync, strFromU8, strToU8 } from 'fflate';

// ── Compression ───────────────────────────────────────────────────────────────

export function decompressFflate(base64Data) {
  const normalized = base64Data.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return strFromU8(decompressSync(bytes));
}

export function compressFflate(str) {
  const compressed = compressSync(strToU8(str));
  let binary = '';
  for (let i = 0; i < compressed.length; i++) binary += String.fromCharCode(compressed[i]);
  return btoa(binary);
}

// ── Custom Errors ─────────────────────────────────────────────────────────────

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

export class UnprocessableEntityError extends Error {
  constructor(message = 'Unprocessable Entity') {
    super(message);
    this.name = 'UnprocessableEntityError';
    this.status = 422;
  }
}

// ── Error Classification ──────────────────────────────────────────────────────

export function classifyError(error) {
  if (
    error instanceof UnauthorizedError ||
    error instanceof NotFoundError ||
    error instanceof UnprocessableEntityError
  ) return error;

  const status = error?.status ?? error?.response?.status;
  if (status === 401) return new UnauthorizedError(error.message);
  if (status === 404) return new NotFoundError(error.message);
  if (status === 422) return new UnprocessableEntityError(error.message);
  return error;
}

// ── FetchUtils ────────────────────────────────────────────────────────────────

async function parseResponseError(response) {
  let message = response.statusText;
  let errors = null;
  try {
    const body = await response.clone().json();
    // FastAPI validation errors (422) send `detail` as an array of
    // {type, loc, msg, input} objects; some handlers instead send
    // `detail: { errors: ["...", "..."] }` — normalize both into a
    // joined string for `message` and keep the raw list on `errors`
    // for callers that want to render each item individually.
    let detail;
    if (Array.isArray(body.detail)) {
      errors = body.detail.map((d) => d.msg || JSON.stringify(d));
      detail = errors.join('; ');
    } else if (body.detail && typeof body.detail === 'object' && Array.isArray(body.detail.errors)) {
      errors = body.detail.errors;
      detail = errors.join('; ');
    } else {
      detail = body.detail;
    }
    message = body.message || detail || body.error || message;
  } catch {}

  switch (response.status) {
    case 401: return new UnauthorizedError(message);
    case 404: return new NotFoundError(message);
    case 422: {
      const err = new UnprocessableEntityError(message);
      if (errors) err.errors = errors;
      return err;
    }
    default: {
      const err = new Error(message);
      err.status = response.status;
      if (errors) err.errors = errors;
      return err;
    }
  }
}

export const FetchUtils = {
  checkStatus: async function (response) {
    if (response.ok) {
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) return response.json();
      return response;
    }
    throw await parseResponseError(response);
  },

  checkResponse: async function (response) {
    return FetchUtils.checkStatus(response);
  },

  queryString: function (params) {
    return new URLSearchParams(params).toString();
  },
};

// ── CryptoEncryption ──────────────────────────────────────────────────────────

export const CryptoEncryption = {
  decrypt: function (encryptedStr) {
    if (!encryptedStr) return '{}';
    try {
      return atob(encryptedStr);
    } catch {
      return '{}';
    }
  },
  encrypt: function (str) {
    return btoa(str);
  },
};

export const AESEncryption = CryptoEncryption;
