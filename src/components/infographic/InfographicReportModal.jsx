'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Briefcase, Building2, Check, CreditCard, Download, ExternalLink, FileText, Gem, GraduationCap, Info, Link, Loader2, Mail, MapPin, Phone, Radar as RadarIcon, User, X } from 'lucide-react';
import Chart from 'react-apexcharts';
import Avatar from '../Avatar';
import InfographicController from '../../api/infographic-controller';
import useInfographicProfile from '../../hooks/query/useInfographicProfile';
import { formatEducationEntry } from '../../utils/formatEducationEntry';

/* ── shared helpers ── */

export const glass = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
};

const scoreColor = (s) => {
  if (s >= 60) return { text: '#2dd4bf', bg: 'rgba(45,212,191,0.15)', border: 'rgba(45,212,191,0.3)' };
  if (s >= 40) return { text: '#B3D335', bg: 'rgba(179,211,53,0.15)', border: 'rgba(179,211,53,0.3)' };
  if (s >= 25) return { text: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)' };
  return { text: '#c084fc', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.3)' };
};

function SectionLabel({ icon: Icon, title, color = '#B3D335' }) {
  return (
    <div className="tw:flex tw:items-center tw:gap-2.5 tw:mb-4">
      <div style={{
        width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${color}22, ${color}11)`,
        border: `1px solid ${color}33`,
      }}>
        <Icon style={{ width: 16, height: 16, color }} />
      </div>
      <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '0.01em' }}>{title}</h3>
    </div>
  );
}

// Renders an explicit "not enough data" state instead of the section silently
// vanishing — a blank gap in the report reads as broken, not as "this
// candidate has no data here yet."
export function EmptySectionNote({ icon, title, color, message }) {
  return (
    <div style={{ ...glass, padding: '20px 24px' }}>
      <SectionLabel icon={icon} title={title} color={color} />
      <p style={{ color: '#64748b', fontSize: 13, margin: 0, fontStyle: 'italic' }}>{message}</p>
    </div>
  );
}

/* ── Profile Header ── */

const decodeEmail = (str) => {
  if (!str || str.includes('@')) return str;
  try {
    const decoded = atob(str);
    return decoded.includes('@') ? decoded : str;
  } catch {
    return str;
  }
};

export function ProfileHeader({ profile }) {
  const sc = profile.composite_score != null ? scoreColor(profile.composite_score) : null;
  const locations = Array.isArray(profile.locations)
    ? profile.locations
    : profile.locations
      ? [profile.locations]
      : profile.location
        ? [profile.location]
        : [];
  const rawEmail = typeof profile.contact === 'string' ? profile.contact : profile.contact?.email;
  const email = decodeEmail(rawEmail);
  const phone = typeof profile.contact === 'string' ? undefined : profile.contact?.phone;
  const educationList = Array.isArray(profile.education)
    ? profile.education
    : (profile.education ? [String(profile.education)] : []);
  const linkedin = profile.linkedin;
  const sourceUrl = profile.source_url;
  const hasContactInfo = Boolean(email || phone);
  const hasLinks = Boolean(linkedin || sourceUrl);
  const hasBottom = educationList.length > 0 || hasContactInfo || hasLinks;
  const bottomColCount = [educationList.length > 0, hasContactInfo, hasLinks].filter(Boolean).length;
  const accentColor = sc?.text ?? '#B3D335';

  const linkStyle = { display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12, textDecoration: 'none', transition: 'color 0.15s' };

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: `linear-gradient(135deg, ${accentColor}08 0%, rgba(15,23,42,0) 55%)`,
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 20,
      padding: '22px 24px',
    }}>
      {/* Top accent strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${accentColor}88 0%, ${accentColor}22 60%, transparent 100%)`,
        borderRadius: '20px 20px 0 0',
      }} />

      {/* ── Top row: avatar · identity · scores ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>

        {/* Avatar */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            padding: 3, borderRadius: '50%',
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}55)`,
            boxShadow: `0 0 20px ${accentColor}33`,
          }}>
            <Avatar src={profile.image_url} name={profile.name} size={72} style={{ borderRadius: '50%', border: '3px solid #0f172a' }} />
          </div>
        </div>

        {/* Identity: name + level badge, then title · org, then chips */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Row 1: name + level */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <h2 style={{ color: '#f8fafc', fontSize: 21, fontWeight: 800, margin: 0, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              {profile.name}
            </h2>
            {profile.level && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                background: 'rgba(179,211,53,0.12)', border: '1px solid rgba(179,211,53,0.25)', color: '#B3D335',
                letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>{profile.level}</span>
            )}
          </div>

          {/* Row 2: title · org · location on one line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {profile.title && (
              <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>{profile.title}</span>
            )}
            {profile.title && profile.organization && (
              <span style={{ color: '#334155' }}>·</span>
            )}
            {profile.organization && (
              <span style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Building2 style={{ width: 11, height: 11, flexShrink: 0 }} />
                {profile.organization}
              </span>
            )}
            {locations.length > 0 && (
              <>
                <span style={{ color: '#334155' }}>·</span>
                <span style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin style={{ width: 11, height: 11, flexShrink: 0 }} />
                  {locations.slice(0, 2).join(', ')}
                </span>
              </>
            )}
          </div>

          {/* Row 3: exp + location chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {profile.years_experience != null && (
              <span style={{
                fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                padding: '3px 9px', borderRadius: 20,
              }}>
                <Briefcase style={{ width: 10, height: 10 }} />
                {profile.years_experience} yrs exp
              </span>
            )}
            {profile.passport_number && (
              <span style={{
                fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                padding: '3px 9px', borderRadius: 20,
              }}>
                <CreditCard style={{ width: 10, height: 10 }} />
                Passport: {profile.passport_number}
              </span>
            )}
          </div>
        </div>

        {/* Scores — flush right */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, flexShrink: 0 }}>
          {profile.composite_score != null && (
            <div style={{ minWidth: 130, textAlign: 'right' }}>
              <span style={{ color: sc.text, fontSize: 28, fontWeight: 900, lineHeight: 1 }}>
                {profile.composite_score.toFixed(0)}%
              </span>
              <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, marginTop: 2 }}>Match Score</div>
              <div style={{
                height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)',
                marginTop: 7, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${Math.max(0, Math.min(100, profile.composite_score))}%`,
                  background: sc.text, borderRadius: 4, transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          )}
          {profile.hcm_composite_score != null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 14,
              background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
            }}>
              <Award style={{ width: 12, height: 12, color: '#a78bfa' }} />
              <span style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700 }}>HCM {profile.hcm_composite_score.toFixed(0)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom: education (left) + contact (right) ── */}
      {hasBottom && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '14px 0 12px' }} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.max(bottomColCount, 1)}, 1fr)`,
            gap: '0 32px',
          }}>

            {/* Education */}
            {educationList.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <GraduationCap style={{ width: 11, height: 11, color: '#818cf8' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Education</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {educationList.map((edu, i) => {
                    const text = formatEducationEntry(edu);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#475569', flexShrink: 0, marginTop: 5 }} />
                        <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contact — email/phone only */}
            {hasContactInfo && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  <Mail style={{ width: 11, height: 11, color: '#2dd4bf' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#2dd4bf', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Contact</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {email && (
                    <a href={`mailto:${email}`} style={linkStyle}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#cbd5e1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}>
                      <Mail style={{ width: 12, height: 12, color: '#475569', flexShrink: 0 }} />
                      {email}
                    </a>
                  )}
                  {phone && (
                    <a href={`tel:${phone}`} style={linkStyle}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#cbd5e1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}>
                      <Phone style={{ width: 12, height: 12, color: '#475569', flexShrink: 0 }} />
                      {phone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Links — LinkedIn / source, kept separate from Contact so the
                two columns read as distinct info types, matching the
                reference layout. */}
            {hasLinks && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: bottomColCount > 1 ? 18 : 0 }}>
                  {linkedin && (
                    <a href={linkedin} target="_blank" rel="noopener noreferrer" style={linkStyle}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#38bdf8'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}>
                      <Link style={{ width: 12, height: 12, color: '#475569', flexShrink: 0 }} />
                      LinkedIn Profile
                    </a>
                  )}
                  {sourceUrl && (
                    <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#cbd5e1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}>
                      <ExternalLink style={{ width: 12, height: 12, color: '#475569', flexShrink: 0 }} />
                      View Source
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Professional Summary ── */

// Module-level cache so repeated opens of the same profile don't re-hit GPT.
const _summaryCache = new Map();

// profile.id is only populated for profiles pulled from the main DB — profiles
// from the resume-upload pipeline have no id at all. Falling back to id would
// make every id-less profile share the single `undefined` cache slot (and,
// since useEffect's dep array would never change between them either, the
// stale summary from whichever id-less profile loaded first would silently
// stick around for every one opened after it). source_file/name are always
// present and unique enough to keep each candidate's summary separate.
function profileCacheKey(profile) {
  return profile.id ?? profile.source_file ?? profile.name;
}

// `resolvedSummary`: lets a caller that already knows the final text (the
// print/PDF route, handed the exact string the on-screen report resolved to)
// skip the fetch entirely — re-calling the AI endpoint there would risk a
// different (LLM output isn't deterministic) summary landing in the PDF than
// what the user saw on screen before downloading it.
export function ProfessionalSummary({ profile, resolvedSummary }) {
  const [summary, setSummary] = useState(resolvedSummary ?? '');
  const [loading, setLoading] = useState(resolvedSummary === undefined);
  const [summaryError, setSummaryError] = useState(false);
  const cacheKey = profileCacheKey(profile);

  useEffect(() => {
    if (resolvedSummary !== undefined) {
      setSummary(resolvedSummary);
      setLoading(false);
      return;
    }
    const bio = profile.enhanced_bio || profile.summary || profile.bio || profile.profile_text || '';
    const cached = _summaryCache.get(cacheKey);
    if (cached !== undefined) {
      setSummary(cached);
      setLoading(false);
      return;
    }
    setLoading(true);
    setSummaryError(false);
    InfographicController.generateSummary({
      name: profile.name,
      title: profile.title,
      level: profile.level,
      organization: profile.organization,
      years_experience: profile.years_experience,
      bio,
    })
      .then((res) => {
        const s = res?.summary || bio;
        _summaryCache.set(cacheKey, s);
        setSummary(s);
      })
      .catch(() => {
        _summaryCache.set(cacheKey, bio);
        setSummary(bio);
        setSummaryError(true);
      })
      .finally(() => setLoading(false));
  }, [cacheKey, resolvedSummary]);

  const rawBio = profile.enhanced_bio || profile.summary || profile.bio || profile.profile_text || '';
  if (!loading && !rawBio && !summary) {
    return (
      <EmptySectionNote
        icon={User}
        title="Professional Summary"
        color="#818cf8"
        message="No bio or profile text available for this candidate — nothing to summarize."
      />
    );
  }

  return (
    <div style={{ ...glass, padding: '20px 24px' }}>
      <SectionLabel icon={User} title="Professional Summary" color="#818cf8" />
      {loading ? (
        <div className="tw:flex tw:items-center tw:gap-2" style={{ color: '#64748b', fontSize: 13 }}>
          <Loader2 style={{ width: 14, height: 14 }} className="tw:animate-spin" />
          Generating summary…
        </div>
      ) : (
        <>
          {summaryError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
              padding: '6px 10px', borderRadius: 8,
              background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
            }}>
              <FileText style={{ width: 13, height: 13, color: '#fbbf24', flexShrink: 0 }} />
              <span style={{ color: '#fbbf24', fontSize: 12 }}>
                AI summary unavailable — showing profile bio instead.
              </span>
            </div>
          )}
          <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{summary || rawBio}</p>
        </>
      )}
    </div>
  );
}

/* ── Shared radar sizing ── */

// ApexCharts' root <svg> gets the standard browser default of
// `overflow: hidden` on its viewport — any axis label ApexCharts positions
// outside that box (which it does for long polar/radar labels; it doesn't
// shrink the plot to make room) is hard-clipped there regardless of how
// generous our own margin math is. Scoped (not global) so it can't affect
// any other chart that might get added to the app later.
let radarOverflowStylesInjected = false;
function injectRadarOverflowStyles() {
  if (radarOverflowStylesInjected) return;
  radarOverflowStylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .sl-radar-chart .apexcharts-svg,
    .sl-radar-chart .apexcharts-canvas {
      overflow: visible !important;
    }
  `;
  document.head.appendChild(style);
}

// Greedy word-wrap to `maxChars`-wide lines. Falls back to a hard character
// split for any single word longer than maxChars on its own (e.g. a long
// compound competency name) — otherwise that one line would still overflow
// untouched no matter how conservative maxChars is.
function wrapRadarLabel(val, maxChars) {
  if (!val) return [''];
  const words = val.split(' ');
  const lines = [];
  let line = '';
  const pushWord = (word) => {
    if (word.length <= maxChars) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length > maxChars && line) { lines.push(line); line = word; }
      else { line = candidate; }
    } else {
      // Word itself exceeds the line budget — hard-split it rather than
      // let it overflow on its own line.
      if (line) { lines.push(line); line = ''; }
      for (let i = 0; i < word.length; i += maxChars) lines.push(word.slice(i, i + maxChars));
    }
  };
  words.forEach(pushWord);
  if (line) lines.push(line);
  return lines.length ? lines : [val];
}

// Measures the chart column and derives a radius + axis-label wrap width
// from it — shared by every radar chart in this report so each one sizes
// itself to its own card instead of guessing a fixed pixel radius.
function useRadarResize() {
  const containerRef = useRef(null);
  const [radarSize, setRadarSize] = useState(140);
  const [labelWrapChars, setLabelWrapChars] = useState(12);

  useEffect(() => {
    injectRadarOverflowStyles();
    const el = containerRef.current;
    if (!el) return;
    const compute = (w) => {
      // Radius is a modest share of the column width — left/right axis
      // labels sit in the leftover margin (w - 2*size)/2, and that margin
      // (not the radius) is what the SVG has to fit label text into before
      // it clips. Kept deliberately conservative (smaller radius fraction,
      // wider assumed glyph width) — better to wrap a line one character
      // earlier than to clip it, since the overflow:visible fix above is a
      // safety net, not a substitute for reserving real room up front.
      const size = Math.max(60, Math.min(130, Math.floor(w * 0.22)));
      const margin = Math.max(0, (w - size * 2) / 2);
      // ~7.4px assumed glyph width for this 12px/600-weight label font —
      // biased high (real average is closer to 6.6-7px) so wrapping errs
      // toward an extra short line rather than a clipped long one.
      const wrapChars = Math.max(8, Math.min(20, Math.floor(margin / 7.4)));
      setRadarSize(size);
      setLabelWrapChars(wrapChars);
    };
    compute(el.clientWidth);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) compute(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { containerRef, radarSize, labelWrapChars };
}

// Vertical room a chart needs for its tallest wrapped axis label — top/bottom
// labels wrap in place and push the chart's own bounding box taller, so a
// fixed height constant clips the ones with more wrapped lines than assumed.
function radarLabelExtraHeight(labels, wrapChars) {
  if (!labels?.length) return 0;
  const maxLines = Math.max(1, ...labels.map((l) => wrapRadarLabel(l, wrapChars).length));
  // ~14px per wrapped line beyond the first (already covered by the base offset).
  return Math.max(0, maxLines - 1) * 14;
}

/* ── Talent Competency Radar ── */

export function TalentRadarChart({ profile, printMode = false }) {
  const { containerRef, radarSize, labelWrapChars } = useRadarResize();

  const radarData = useMemo(() => {
    const matches = profile.top_competency_matches;
    if (!matches?.length || matches.length < 3) return null;

    // Deduplicate by FULL PATH (skill_family + group_item + competency)
    // — same competency in different groups = distinct match, keep both
    const seen = new Map();
    for (const m of matches) {
      const key = `${m.skill_family || ''}||${m.group_item || ''}||${m.competency || ''}`;
      const pct = Math.round(m.match_percent ?? 0);
      if (!seen.has(key) || seen.get(key).pct < pct) seen.set(key, { ...m, pct });
    }
    const unique = [...seen.values()];

    // If the same competency name appears more than once, use group_item to disambiguate
    const compFreq = new Map();
    for (const m of unique) {
      const c = m.competency || '';
      compFreq.set(c, (compFreq.get(c) || 0) + 1);
    }
    const labels = unique.map((m) => {
      const comp = m.competency || m.group_item || m.skill_family || 'Unknown';
      return compFreq.get(m.competency || '') > 1
        ? (m.group_item || m.skill_family || comp)
        : comp;
    });

    return { labels, values: unique.map((u) => u.pct) };
  }, [profile.top_competency_matches]);

  const chartHeight = radarSize * 2 + 55 + radarLabelExtraHeight(radarData?.labels, labelWrapChars);

  const options = useMemo(() => {
    const n = radarData?.labels?.length ?? 0;
    return {
      chart: {
        type: 'radar',
        background: 'transparent',
        toolbar: { show: false },
        // Print mode (headless PDF capture) needs the SVG fully painted the
        // instant it mounts — an in-flight entrance animation would get
        // captured mid-transition. On-screen behavior is unchanged.
        animations: { enabled: !printMode, speed: 900, easing: 'easeinout' },
        height: chartHeight,
        padding: { top: -32, right: 0, bottom: -32, left: 0 },
      },
      theme: { mode: 'dark' },
      xaxis: {
        categories: radarData?.labels ?? [],
        labels: {
          show: true,
          trim: false,
          // Wrap width is the actual measured side margin (see compute() in
          // useRadarResize), not a guess — so wrapped lines fit inside the
          // SVG's own viewBox instead of getting clipped at its edge.
          formatter: (val) => (!val || val.length <= labelWrapChars ? val : wrapRadarLabel(val, labelWrapChars)),
          style: {
            colors: Array(n).fill('#94a3b8'),
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'inherit',
          },
        },
      },
      yaxis: { max: 100, show: false, tickAmount: 5 },
      fill: {
        type: 'solid',
        opacity: 0.4,
      },
      stroke: { width: 3, colors: ['#B3D335'], curve: 'smooth' },
      markers: {
        size: 6,
        colors: ['#B3D335'],
        strokeColors: '#0f172a',
        strokeWidth: 2.5,
        hover: { size: 9 },
      },
      dataLabels: {
        enabled: true,
        formatter: (v) => `${v}%`,
        style: { fontSize: '11px', fontWeight: 700, colors: ['#f1f5f9'] },
        background: {
          enabled: true,
          foreColor: '#0f172a',
          borderRadius: 5,
          padding: 4,
          opacity: 0.95,
          borderColor: 'rgba(179,211,53,0.4)',
          borderWidth: 1,
          dropShadow: { enabled: true, top: 1, left: 1, blur: 3, opacity: 0.3 },
        },
      },
      plotOptions: {
        radar: {
          size: radarSize,
          polygons: {
            strokeColors: 'rgba(179,211,53,0.15)',
            strokeWidth: 1,
            connectorColors: 'rgba(179,211,53,0.08)',
            fill: {
              colors: [
                'rgba(179,211,53,0.04)',
                'rgba(179,211,53,0.02)',
                'rgba(45,212,191,0.03)',
                'rgba(255,255,255,0.01)',
              ],
            },
          },
        },
      },
      colors: ['#B3D335'],
      tooltip: {
        theme: 'dark',
        y: { formatter: (v) => `${v}% match` },
        style: { fontSize: '12px' },
      },
      legend: { show: false },
      grid: { show: false },
    };
  }, [radarSize, radarData, chartHeight, labelWrapChars, printMode]);

  if (!radarData) {
    return (
      <EmptySectionNote
        icon={RadarIcon}
        title="Talent Competency Radar"
        color="#B3D335"
        message="Not enough competency data available — at least 3 scored competencies are needed to plot this chart."
      />
    );
  }

  return (
    <div
      style={{ ...glass, padding: '24px 28px', display: 'flex', flexDirection: 'column', transition: 'border-color 250ms ease, box-shadow 250ms ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(179,211,53,0.22)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.25)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <SectionLabel icon={RadarIcon} title="Talent Competency Radar" color="#B3D335" />
      {/* Radar is the sole content now — centered and sized off the card's
          own width via useRadarResize, which both radar cards share, so
          the two charts land on identical size whenever their cards match
          width (guaranteed by the parent grid). */}
      <div ref={containerRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
        <div className="sl-radar-chart" style={{ width: '100%', maxWidth: 460, overflow: 'visible' }}>
          <Chart
            options={options}
            series={[{ name: 'Match %', data: radarData.values }]}
            type="radar"
            height={chartHeight}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Skill Capital Spider Chart (8 Capital Dimensions) ── */

// Fixed framework order — these are named categories from the HCM 8-Capital
// model, not a ranked top-N list, so they keep a stable order and a single
// identity color rather than the rank-gradient used for competency matches.
const CAPITAL_DIMENSIONS = [
  { key: 'knowledge_capital', label: 'Knowledge Capital' },
  { key: 'experience_capital', label: 'Experience Capital' },
  { key: 'intellectual_capital', label: 'Intellectual Capital' },
  { key: 'social_capital', label: 'Social Capital' },
  { key: 'performance_capital', label: 'Performance Capital' },
  { key: 'innovation_capital', label: 'Innovation Capital' },
  { key: 'leadership_capital', label: 'Leadership Capital' },
  { key: 'ethical_capital', label: 'Ethical Capital' },
];
const CAPITAL_COLOR = '#a78bfa';

export function SkillCapitalRadarChart({ profile, printMode = false }) {
  const { containerRef, radarSize, labelWrapChars } = useRadarResize();

  const capitalData = useMemo(() => {
    const scorecard = profile.hcm_scorecard?.scorecard;
    if (!scorecard) return null;
    const rows = CAPITAL_DIMENSIONS
      .map((d) => ({ label: d.label, pct: scorecard[d.key]?.score }))
      .filter((r) => typeof r.pct === 'number');
    // Need at least 3 axes for a radar shape to read as anything but a line.
    if (rows.length < 3) return null;
    return { labels: rows.map((r) => r.label), values: rows.map((r) => Math.round(r.pct)) };
  }, [profile.hcm_scorecard]);

  const chartHeight = radarSize * 2 + 55 + radarLabelExtraHeight(capitalData?.labels, labelWrapChars);

  const options = useMemo(() => {
    const n = capitalData?.labels?.length ?? 0;
    return {
      chart: {
        type: 'radar',
        background: 'transparent',
        toolbar: { show: false },
        animations: { enabled: !printMode, speed: 900, easing: 'easeinout' },
        height: chartHeight,
        padding: { top: -32, right: 0, bottom: -32, left: 0 },
      },
      theme: { mode: 'dark' },
      xaxis: {
        categories: capitalData?.labels ?? [],
        labels: {
          show: true,
          trim: false,
          formatter: (val) => (!val || val.length <= labelWrapChars ? val : wrapRadarLabel(val, labelWrapChars)),
          style: {
            colors: Array(n).fill('#94a3b8'),
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'inherit',
          },
        },
      },
      yaxis: { max: 100, show: false, tickAmount: 5 },
      fill: { type: 'solid', opacity: 0.4 },
      stroke: { width: 3, colors: [CAPITAL_COLOR], curve: 'smooth' },
      markers: {
        size: 6,
        colors: [CAPITAL_COLOR],
        strokeColors: '#0f172a',
        strokeWidth: 2.5,
        hover: { size: 9 },
      },
      dataLabels: {
        enabled: true,
        formatter: (v) => `${v}%`,
        style: { fontSize: '11px', fontWeight: 700, colors: ['#f1f5f9'] },
        background: {
          enabled: true,
          foreColor: '#0f172a',
          borderRadius: 5,
          padding: 4,
          opacity: 0.95,
          borderColor: 'rgba(167,139,250,0.4)',
          borderWidth: 1,
          dropShadow: { enabled: true, top: 1, left: 1, blur: 3, opacity: 0.3 },
        },
      },
      plotOptions: {
        radar: {
          size: radarSize,
          polygons: {
            strokeColors: 'rgba(167,139,250,0.15)',
            strokeWidth: 1,
            connectorColors: 'rgba(167,139,250,0.08)',
            fill: {
              colors: [
                'rgba(167,139,250,0.04)',
                'rgba(167,139,250,0.02)',
                'rgba(45,212,191,0.03)',
                'rgba(255,255,255,0.01)',
              ],
            },
          },
        },
      },
      colors: [CAPITAL_COLOR],
      tooltip: {
        theme: 'dark',
        y: { formatter: (v) => `${v}/100` },
        style: { fontSize: '12px' },
      },
      legend: { show: false },
      grid: { show: false },
    };
  }, [radarSize, capitalData, chartHeight, labelWrapChars, printMode]);

  if (!capitalData) {
    return (
      <EmptySectionNote
        icon={Gem}
        title="Skill Capital Breakdown"
        color={CAPITAL_COLOR}
        message="HCM scorecard not available for this candidate yet — Skill Capital breakdown needs a computed 8-dimension scorecard."
      />
    );
  }

  return (
    <div
      style={{ ...glass, padding: '24px 28px', display: 'flex', flexDirection: 'column', transition: 'border-color 250ms ease, box-shadow 250ms ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.22)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.25)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <SectionLabel icon={Gem} title="Skill Capital Breakdown" color={CAPITAL_COLOR} />
      <div ref={containerRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
        <div className="sl-radar-chart" style={{ width: '100%', maxWidth: 460, overflow: 'visible' }}>
          <Chart
            options={options}
            series={[{ name: 'Score', data: capitalData.values }]}
            type="radar"
            height={chartHeight}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Work Experience Timeline ── */

// Segment height (px) below each dot is scaled to that role's tenure, so a
// 1-year stint and an 8-year stint read as visually different at a glance —
// not just via the text label. Undated entries fall through to the same
// floor as a 0-year entry, rather than getting a distinct special-cased size.
const TIMELINE_MIN_SEGMENT = 32;
const TIMELINE_MAX_SEGMENT = 96;
const TIMELINE_PX_PER_YEAR = 5;

// Recency tint — most recent role is teal (matches the "current" accent),
// fading through amber to orange for older roles. Purely a display gradient
// over the real chronological order, not a fixed per-person color. Entries
// are rendered newest-first, so index 0 IS the most recent role.
const RECENCY_COLORS = ['#2dd4bf', '#f59e0b', '#f97316'];
function recencyColor(idxFromMostRecent) {
  return RECENCY_COLORS[Math.min(idxFromMostRecent, RECENCY_COLORS.length - 1)];
}

function entryDurationYears(entry) {
  const start = entry.start_year;
  const end = entry.is_current ? new Date().getFullYear() : entry.end_year;
  if (start == null || end == null) return null;
  const years = end - start;
  return years > 0 ? years : null;
}

function segmentSpacing(entry) {
  const years = entryDurationYears(entry);
  if (!years) return TIMELINE_MIN_SEGMENT;
  return Math.min(TIMELINE_MAX_SEGMENT, TIMELINE_MIN_SEGMENT + years * TIMELINE_PX_PER_YEAR);
}

function formatYearRange(entry) {
  const start = entry.start_year ?? '—';
  const end = entry.is_current ? 'Present' : (entry.end_year ?? '—');
  if (start === '—' && end === '—') return null;
  return `${start} – ${end}`;
}

// Splits a free-text role description into sentence-level bullets — real
// text, just reformatted; no fabricated content.
function toBullets(description) {
  if (!description) return [];
  return description
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function StatPill({ value, label }) {
  return (
    <div style={{
      textAlign: 'center', padding: '8px 16px', borderRadius: 10,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ color: '#2dd4bf', fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>{value}</div>
      <div style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// Union of each entry's [start, end] year range, merging overlapping/
// continuous stints so simultaneous or back-to-back roles aren't double
// counted — gives total real years covered, not just a sum of durations.
function computeYearsOfExperience(entries) {
  const currentYear = new Date().getFullYear();
  const intervals = entries
    .map((e) => {
      if (e.start_year == null) return null;
      const end = e.is_current ? currentYear : (e.end_year ?? e.start_year);
      return [e.start_year, Math.max(e.start_year, end)];
    })
    .filter(Boolean)
    .sort((a, b) => a[0] - b[0]);
  if (!intervals.length) return null;

  const merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const [start, end] = intervals[i];
    const last = merged[merged.length - 1];
    if (start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  const total = merged.reduce((sum, [start, end]) => sum + (end - start), 0);
  return total > 0 ? total : null;
}

export function WorkExperienceTimeline({ profile }) {
  const entries = useMemo(() => {
    const we = profile.work_experience;
    if (!Array.isArray(we) || we.length === 0) return [];
    // Current role(s) pinned to the top, then the rest in reverse
    // chronological order (most recent first, oldest last).
    return [...we].sort((a, b) => {
      if (!!a.is_current !== !!b.is_current) return a.is_current ? -1 : 1;
      if (a.start_year == null && b.start_year == null) return 0;
      if (a.start_year == null) return 1;
      if (b.start_year == null) return -1;
      return b.start_year - a.start_year;
    });
  }, [profile.work_experience]);

  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const companies = new Set(entries.map((e) => e.organization).filter(Boolean));
    return {
      years: computeYearsOfExperience(entries),
      roles: entries.length,
      companies: companies.size || entries.length,
    };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <EmptySectionNote
        icon={Briefcase}
        title="Career Timeline"
        color="#2dd4bf"
        message="No career history available for this candidate."
      />
    );
  }

  // Date column width is fluid (clamp) instead of a fixed 96px — narrows
  // on mobile so the content card keeps most of the row's width at every
  // breakpoint, rather than the card shrinking to make room for it.
  const dateColWidth = 'clamp(64px, 20vw, 96px)';

  return (
    <div style={{ ...glass, padding: 'clamp(14px, 3vw, 20px) clamp(16px, 3vw, 24px)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <SectionLabel icon={Briefcase} title="Career Timeline" color="#2dd4bf" />
          <p style={{ color: '#64748b', fontSize: 12, margin: '-10px 0 0 42px' }}>A journey of growth and impact</p>
        </div>
        {stats && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            {stats.years != null && <StatPill value={`${stats.years}+`} label="Years of Experience" />}
            <StatPill value={stats.roles} label={stats.roles === 1 ? 'Role' : 'Roles'} />
            <StatPill value={stats.companies} label={stats.companies === 1 ? 'Company' : 'Companies'} />
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        {/* Single continuous connecting line behind all icons, centered under
            the 36px-wide icon column (date column width is fluid above). */}
        <div style={{
          position: 'absolute', left: `calc(${dateColWidth} + 18px)`, top: 15, bottom: 15, width: 2,
          background: 'linear-gradient(180deg, rgba(45,212,191,0.5) 0%, rgba(249,115,22,0.15) 100%)',
          borderRadius: 2,
        }} />

        {entries.map((entry, idx) => {
          const isCurrent = entry.is_current;
          const yearRange = formatYearRange(entry);
          const years = entryDurationYears(entry);
          const isLast = idx === entries.length - 1;
          const color = recencyColor(idx);
          const bullets = toBullets(entry.description).slice(0, 5);

          return (
            <div
              key={idx}
              style={{
                position: 'relative', display: 'grid', gridTemplateColumns: `${dateColWidth} 36px 1fr`, gap: 0,
                marginBottom: isLast ? 0 : segmentSpacing(entry),
              }}
            >
              {/* Date column */}
              <div style={{ textAlign: 'right', paddingRight: 12, paddingTop: 2 }}>
                {yearRange && (
                  <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{yearRange}</div>
                )}
                {years != null && (
                  <div style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>{years}+ yrs</div>
                )}
              </div>

              {/* Icon */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  position: 'relative', width: 30, height: 30, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  // Solid backdrop (not just a translucent tint) so the
                  // connecting line behind it is fully hidden, not visible
                  // bleeding through the middle of the dot.
                  background: `radial-gradient(circle, ${color}22 0%, #0f172a 72%)`,
                  border: `2px solid ${color}`, flexShrink: 0, zIndex: 1,
                }}>
                  <Building2 style={{ width: 14, height: 14, color }} />
                  {isCurrent && (
                    <motion.div
                      animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                      style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: `1.5px solid ${color}` }}
                    />
                  )}
                </div>
              </div>

              {/* Content card — a real bordered card beside the timeline
                  (not bare text), taking the full width the grid gives it. */}
              <div style={{ paddingLeft: 14, paddingBottom: 0 }}>
                <div style={{
                  background: 'rgba(255,255,255,0.035)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: 'clamp(12px, 2vw, 18px) clamp(14px, 2.4vw, 20px)',
                }}>
                  <div className="tw:flex tw:items-start tw:justify-between tw:gap-3 tw:flex-wrap">
                    <div>
                      <p style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 700, margin: '0 0 3px 0' }}>
                        {entry.role}
                      </p>
                      {entry.organization && (
                        <p style={{ color, fontSize: 12.5, fontWeight: 600, margin: 0 }}>{entry.organization}</p>
                      )}
                    </div>
                    {isCurrent && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#2dd4bf',
                        background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)',
                        padding: '2px 9px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                  {bullets.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 9 }}>
                      {bullets.map((b, bi) => (
                        <div key={bi} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                          <Check style={{ width: 12, height: 12, color: '#475569', flexShrink: 0, marginTop: 2 }} />
                          <span style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.55 }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── PDF Download ──
   Standalone so both the full-screen modal's toolbar and the embedded
   Profile Content tab version can trigger the same generatePDF call
   without duplicating the request/blob/anchor-click logic. */

export function InfographicDownloadButton({ profile, source = 'talent' }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);

  const handleDownloadPDF = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(false);
    try {
      // Same cache-or-fallback resolution ProfessionalSummary uses on screen —
      // sent alongside the full profile so the print route renders the exact
      // text already shown, not a fresh (non-deterministic) AI regeneration.
      const cachedSummary = _summaryCache.get(profileCacheKey(profile));
      const resolvedSummary = cachedSummary ?? (
        profile.enhanced_bio || profile.summary || profile.bio || profile.profile_text || ''
      );

      const blob = await InfographicController.generatePDF({
        profile,
        resolvedSummary,
        source,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(profile.name ?? 'Report').replace(/\s+/g, '_')}_Talent_Report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="tw:flex tw:flex-col tw:items-end tw:gap-1">
      <button
        onClick={handleDownloadPDF}
        disabled={downloading || !profile}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8, cursor: downloading ? 'wait' : 'pointer',
          background: downloadError
            ? 'rgba(248,113,113,0.1)'
            : downloading ? 'rgba(179,211,53,0.06)' : 'rgba(179,211,53,0.12)',
          border: `1px solid ${downloadError ? 'rgba(248,113,113,0.3)' : 'rgba(179,211,53,0.25)'}`,
          color: downloadError ? '#f87171' : '#B3D335', fontSize: 13, fontWeight: 600,
          transition: 'all 0.15s',
        }}
      >
        {downloading
          ? <Loader2 style={{ width: 14, height: 14 }} className="tw:animate-spin" />
          : <Download style={{ width: 14, height: 14 }} />}
        {downloading ? 'Generating…' : 'Download PDF'}
      </button>
      {downloadError && (
        <span style={{ color: '#f87171', fontSize: 11 }}>
          PDF failed — try again or check console
        </span>
      )}
    </div>
  );
}

/* ── Main Modal ── */

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function InfographicReportModal({ profile: profileProp, profileId, onClose, source = 'talent' }) {
  // Defaults to 'talent' — every pre-existing call site predates this prop
  // and only ever rendered Talent profiles, so an unset source must keep
  // showing exactly the title it always has.
  const reportTitle = source === 'recruitment' ? 'Recruitment Infographic Report' : 'Talent Infographic Report';
  const modalRef = useRef(null);

  // Self-fetch only kicks in when the caller has an id but no in-memory
  // profile object — e.g. a refreshed page or a direct link to one candidate's
  // report. Normal search-result flow passes `profile` and this stays disabled.
  const {
    data: fetchedProfile,
    isLoading: profileLoading,
    isError: profileFetchFailed,
  } = useInfographicProfile(profileProp ? null : profileId);

  const profile = profileProp ?? fetchedProfile;

  // Focus trap: keeps Tab/Shift+Tab inside the modal, restores focus on unmount,
  // and also handles Escape close.
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const previously = document.activeElement;

    const focusable = () => [...modal.querySelectorAll(FOCUSABLE)];
    focusable()[0]?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previously?.focus();
    };
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="infographic-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          key="infographic-modal"
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${reportTitle}${profile?.name ? ` — ${profile.name}` : ''}`}
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '60vw',
            height: '88vh',
            background: '#0f172a',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(179,211,53,0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* ── Modal toolbar ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
            flexShrink: 0,
          }}>
            <div className="tw:flex tw:items-center tw:gap-2.5">
              <div style={{
                width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(179,211,53,0.2), rgba(143,179,41,0.1))',
                border: '1px solid rgba(179,211,53,0.25)',
              }}>
                <FileText style={{ width: 14, height: 14, color: '#B3D335' }} />
              </div>
              <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600 }}>{reportTitle}</span>
              {profile?.name && (
                <>
                  <span style={{ color: '#475569', fontSize: 13 }}>·</span>
                  <span style={{ color: '#64748b', fontSize: 13 }}>{profile.name}</span>
                </>
              )}
            </div>

            <div className="tw:flex tw:items-center tw:gap-2">
              <InfographicDownloadButton profile={profile} source={source} />

              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94a3b8', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; e.currentTarget.style.color = '#f87171'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
          </div>

          {/* ── Scrollable content ── */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              background: '#0f172a',
            }}
            className="tw:space-y-5"
          >
            {profile ? (
              <>
                <ProfileHeader profile={profile} />
                <ProfessionalSummary profile={profile} />
                <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-5 tw:items-stretch">
                  <TalentRadarChart profile={profile} />
                  <SkillCapitalRadarChart profile={profile} />
                </div>
                <WorkExperienceTimeline profile={profile} />
              </>
            ) : profileLoading ? (
              <div className="tw:flex tw:items-center tw:justify-center tw:gap-2" style={{ color: '#64748b', fontSize: 14, padding: '60px 0' }}>
                <Loader2 style={{ width: 18, height: 18 }} className="tw:animate-spin" />
                Loading report…
              </div>
            ) : (
              <div style={{ ...glass, padding: '20px 24px', textAlign: 'center' }}>
                <p style={{ color: '#f87171', fontSize: 14, margin: 0 }}>
                  {profileFetchFailed ? 'Failed to load this candidate’s report.' : 'No profile data available.'}
                </p>
              </div>
            )}
          </div>

          {profile?.composite_score != null && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px',
              borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)', flexShrink: 0,
            }}>
              <Info style={{ width: 12, height: 12, color: '#475569', flexShrink: 0 }} />
              <span style={{ color: '#475569', fontSize: 11 }}>
                Match score is calculated based on skills, experience, and role relevance.
              </span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
