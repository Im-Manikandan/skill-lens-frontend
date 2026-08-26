import { getJSON, postJSON, postBlob } from './fetch-helpers';

const InfographicController = {
  generateSummary: (req) => postJSON('/infographic/summary', req, { suppressLogout: true }),
  generatePDF: (req) => postBlob('/infographic/pdf', req, { suppressLogout: true }),
  // Standalone fetch — durable profile fields only (no query-relative composite_score).
  // Lets the report modal rebuild itself after a refresh or direct link, instead of
  // depending entirely on the in-memory profile object from a prior search result.
  getProfile: (profileId) => getJSON(`/infographic/profile/${profileId}`, { suppressLogout: true }),
  // Used only by the headless-browser print route (InfographicPrintPage) — fetches
  // the one-time payload a /infographic/pdf call stashed server-side. Deliberately
  // unauthenticated (the token itself is the credential); `suppressLogout` also
  // matters here since this page never has an auth session to begin with.
  getPrintData: (token) => getJSON(`/infographic/print-data/${token}`, { suppressLogout: true }),
};

export default InfographicController;
