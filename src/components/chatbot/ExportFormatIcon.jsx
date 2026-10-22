// Compact format marks matching the export controls; no external image requests.
export default function ExportFormatIcon({ format }) {
  const key = String(format || 'pdf').toLowerCase();
  const presentation = key === 'ppt' || key === 'pptx';
  const spreadsheet = key === 'xlsx' || key === 'excel';
  const color = presentation ? '#d64b18' : spreadsheet ? '#16834b' : key === 'csv' ? '#2563eb' : '#ef3838';

  return (
    <svg className="skill-lens-format-icon" width="20" height="22" viewBox="0 0 24 26" fill="none" aria-hidden="true" focusable="false">
      <path d="M6 2h10l5 5v16H6V2Z" fill={color} />
      <path d="M16 2v6h5" fill="white" fillOpacity=".5" />
      <rect x="2" y="9" width="13" height="13" rx="2" fill={color} stroke="white" strokeWidth="1.2" />
      {presentation ? (
        <path d="M6 19v-7h3a2 2 0 0 1 0 4H6" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
      ) : spreadsheet ? (
        <path d="m6 12 5 7m0-7-5 7" stroke="white" strokeWidth="1.5" />
      ) : key === 'csv' ? (
        <path d="M5 13h7M5 16h7M8 11v9" stroke="white" strokeWidth="1.2" />
      ) : (
        <path d="M6 19c3-5 3-8 2-7-2 2 2 7 4 5 1-2-5 0-6 2Z" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
      )}
    </svg>
  );
}
