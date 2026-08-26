export function decodeBase64(value) {
  if (typeof value !== 'string' || value.length === 0) return value;
  try {
    if (typeof atob === 'function') {
      const binary = atob(value);
      try {
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        return new TextDecoder('utf-8').decode(bytes);
      } catch {
        return binary;
      }
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(value, 'base64').toString('utf-8');
    }
    return value;
  } catch {
    return value;
  }
}

export default decodeBase64;
