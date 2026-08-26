// Flattens one education entry (string or {degree, year, ...institution}) into
// display text. Shared by TimelineItem's profile/dimension tabs and the
// Infographic Report modal so the two don't silently drift on formatting.
export function formatEducationEntry(edu) {
  if (typeof edu === 'string') return edu;
  if (edu && typeof edu === 'object') {
    const { year, degree, ...rest } = edu;
    const institution = Object.values(rest).find((v) => typeof v === 'string') || '';
    return [degree, institution, year].filter(Boolean).join(', ');
  }
  return String(edu ?? '');
}
