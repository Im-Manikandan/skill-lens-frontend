'use client';

// Renders exactly what the on-screen "Infographic Report" section shows,
// for exactly one purpose: a headless Chromium instance (launched by the
// backend's /infographic/pdf endpoint) navigates here, waits for the
// `data-pdf-ready` marker below, and prints this page to PDF. This is the
// ONLY infographic renderer — the PDF is a direct screenshot of this markup,
// not a separate template, so it can never visually drift from the UI.
//
// Deliberately outside ProtectedRoute: this route carries no Redux/auth
// state and needs none. Access is gated by possession of the one-time
// `token` in the URL (see infographic_route.py's token store) — not by
// login — because the headless browser has no user session to present.
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { FileText, Loader2 } from 'lucide-react';
import InfographicController from '../../api/infographic-controller';
import {
  ProfileHeader,
  ProfessionalSummary,
  TalentRadarChart,
  SkillCapitalRadarChart,
  WorkExperienceTimeline,
} from '../../components/infographic/InfographicReportModal';

export default function InfographicPrintPage() {
  const { token } = useParams();
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let cancelled = false;
    InfographicController.getPrintData(token)
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', data: null });
      });
    return () => { cancelled = true; };
  }, [token]);

  // Signals Playwright it's safe to capture: two animation-frame ticks after
  // the data-driven tree mounts is enough for layout + first paint to settle
  // (chart animations are already disabled via printMode, so there's no
  // in-flight transition to wait out beyond that).
  const [pdfReady, setPdfReady] = useState(false);
  useEffect(() => {
    if (state.status === 'loading') return undefined;
    let raf1, raf2;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPdfReady(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [state.status]);

  if (state.status === 'loading') {
    return (
      <div style={pageStyle}>
        <div className="tw:flex tw:items-center tw:justify-center tw:gap-2" style={{ color: '#64748b', fontSize: 14, padding: '80px 0' }}>
          <Loader2 style={{ width: 18, height: 18 }} className="tw:animate-spin" />
          Loading report…
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div style={pageStyle} data-pdf-ready="true">
        <div style={{ padding: '24px', textAlign: 'center', color: '#f87171' }}>
          Failed to load report data — the download link may have expired.
        </div>
      </div>
    );
  }

  const { profile, resolvedSummary, source } = state.data;
  const reportTitle = source === 'recruitment' ? 'Recruitment Profile Report' : 'Talent Profile Report';

  return (
    <div style={pageStyle} data-pdf-ready={pdfReady ? 'true' : 'false'}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }} className="tw:space-y-5">
        <div className="tw:flex tw:items-center tw:gap-2.5 tw:mb-1">
          <div style={{
            width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(179,211,53,0.2), rgba(143,179,41,0.1))',
            border: '1px solid rgba(179,211,53,0.25)',
          }}>
            <FileText style={{ width: 16, height: 16, color: '#B3D335' }} />
          </div>
          <h1 style={{ color: '#f1f5f9', margin: 0, fontSize: 18, fontWeight: 700 }}>{reportTitle}</h1>
        </div>
        <ProfileHeader profile={profile} />
        <ProfessionalSummary profile={profile} resolvedSummary={resolvedSummary} />
        <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-5 tw:items-stretch">
          <TalentRadarChart profile={profile} printMode />
          <SkillCapitalRadarChart profile={profile} printMode />
        </div>
        <WorkExperienceTimeline profile={profile} />
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: '#0f172a',
};
