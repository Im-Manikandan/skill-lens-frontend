'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { decompressFflate } from '@devopsthink/react-security-util';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, MapPin, Building, Star, Mail, Phone, ExternalLink, Briefcase, GraduationCap, Award, User, ClipboardList, Globe, CheckCircle, Clock, TrendingUp, Sparkles, Target, Download, Tag, Users, FileText, Gauge, Info, Video, Newspaper, BookOpen } from 'lucide-react';
import useSkillReadinessEnabled from '../hooks/query/useSkillReadinessEnabled.js';
import SelfAssessmentTab from './SelfAssessmentTab';
import HCMScorecardTab from './HCMScorecardTab';
import Avatar from './Avatar';
import { decodeBase64 } from '../utils/decodeBase64';
import { formatEducationEntry } from '../utils/formatEducationEntry';
import {
  ProfileHeader as InfographicProfileHeader,
  ProfessionalSummary as InfographicProfessionalSummary,
  TalentRadarChart as InfographicTalentRadarChart,
  SkillCapitalRadarChart as InfographicSkillCapitalRadarChart,
  WorkExperienceTimeline as InfographicWorkExperienceTimeline,
  InfographicDownloadButton,
} from './infographic/InfographicReportModal';

/* ── helpers ── */

// Score Color Helpers
const getScoreColor = (score) => {
  if (score >= 60) return { bg: 'linear-gradient(135deg, #059669, #34d399)', glow: 'rgba(52,211,153,0.4)', text: '#ecfdf5' };
  if (score >= 40) return { bg: 'linear-gradient(135deg, #8fb329, #bef264)', glow: 'rgba(143,179,41,0.4)', text: '#f7fee7' };
  if (score >= 25) return { bg: 'linear-gradient(135deg, #d97706, #fbbf24)', glow: 'rgba(251,191,36,0.4)', text: '#fffbeb' };
  return { bg: 'linear-gradient(135deg, #9333ea, #c084fc)', glow: 'rgba(192,132,252,0.35)', text: '#faf5ff' };
};

const getBarGradient = (percent) => {
  if (percent >= 60) return 'linear-gradient(90deg, #059669, #34d399)';
  if (percent >= 45) return 'linear-gradient(90deg, #8fb329, #bef264)';
  if (percent >= 30) return 'linear-gradient(90deg, #d97706, #fbbf24)';
  return 'linear-gradient(90deg, #7c3aed, #c084fc)';
};

// Shared Glass Style
const glassSection = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14,
  backdropFilter: 'blur(12px)',
};

// Accent Color Palette
const ACCENT_COLORS = [
  { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', text: '#6ee7b7' },
  { bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.25)', text: '#a5b4fc' },
  { bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.25)', text: '#f9a8d4' },
  { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', text: '#fcd34d' },
  { bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)', text: '#93c5fd' },
  { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)', text: '#c4b5fd' },
  { bg: 'rgba(45,212,191,0.12)', border: 'rgba(45,212,191,0.25)', text: '#5eead4' },
  { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)', text: '#fca5a5' },
  { bg: 'rgba(143,179,41,0.12)', border: 'rgba(143,179,41,0.25)', text: '#bef264' },
  { bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.25)', text: '#67e8f9' },
  { bg: 'rgba(232,121,249,0.12)', border: 'rgba(232,121,249,0.25)', text: '#e879f9' },
];

const pickColor = (str, idx) => ACCENT_COLORS[(idx + (str?.charCodeAt(0) || 0)) % ACCENT_COLORS.length];

// Skill Readiness classification colors — consistent with app status-badge tones.
const READINESS_COLORS = {
  'Ready Now':     { bg: 'linear-gradient(135deg, rgba(52,211,153,0.22), rgba(16,185,129,0.14))', border: 'rgba(52,211,153,0.3)',  text: '#6ee7b7' },
  'Nearly Ready':  { bg: 'linear-gradient(135deg, rgba(96,165,250,0.22), rgba(59,130,246,0.14))', border: 'rgba(96,165,250,0.3)',  text: '#93c5fd' },
  'Developing':    { bg: 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(217,119,6,0.14))',   border: 'rgba(245,158,11,0.3)',  text: '#fbbf24' },
  'Not Ready':     { bg: 'linear-gradient(135deg, rgba(239,68,68,0.22), rgba(220,38,38,0.14))',    border: 'rgba(239,68,68,0.3)',   text: '#fca5a5' },
};

const FLOATING_PANEL_WIDTH = 220;
const FLOATING_PANEL_MARGIN = 8;

// Positions a portaled panel from a trigger element's live rect, flipping
// above the trigger when there isn't room below — the profile card this
// trigger sits in has `overflow: hidden`, so anything positioned relative to
// it (instead of the viewport) gets silently clipped.
function useFloatingPanelCoords(triggerRef, open, estimatedHeight) {
  const [coords, setCoords] = React.useState(null);

  React.useLayoutEffect(() => {
    if (!open) { setCoords(null); return undefined; }
    const trigger = triggerRef.current;
    if (!trigger) return undefined;

    const recompute = () => {
      const rect = trigger.getBoundingClientRect();
      let left = rect.right - FLOATING_PANEL_WIDTH;
      left = Math.max(FLOATING_PANEL_MARGIN, Math.min(left, window.innerWidth - FLOATING_PANEL_WIDTH - FLOATING_PANEL_MARGIN));

      const spaceBelow = window.innerHeight - rect.bottom;
      const flipUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
      const top = flipUp ? Math.max(FLOATING_PANEL_MARGIN, rect.top - estimatedHeight - 6) : rect.bottom + 6;

      setCoords({ top, left });
    };

    recompute();
    window.addEventListener('scroll', recompute, true);
    window.addEventListener('resize', recompute);
    return () => {
      window.removeEventListener('scroll', recompute, true);
      window.removeEventListener('resize', recompute);
    };
  }, [open, estimatedHeight, triggerRef]);

  return coords;
}

/**
 * Skill Readiness badge — only rendered when `skill_readiness` is present on
 * the profile. This is ALWAYS the one headline value per skill_search.py —
 * for a multi-skill query it's the WEAKEST already-calculated intent (see
 * skill_readiness_winning_skill for provenance), never a per-skill value and
 * never re-averaged/recalculated client-side.
 *
 * Two independent, differently-triggered panels hang off this same badge:
 *  - Click → the existing component-score breakdown (Capability/Application/
 *    etc.), when the client's show_score_breakdown config exposes it.
 *  - Hover → the per-skill breakdown (`skillReadinessBySkill`) plus which
 *    skill is the limiting "Lowest skill" (`winningSkill`), shown only when
 *    2+ skills were detected — hidden by default, per-skill values taken
 *    as-is from the backend with no frontend recalculation.
 */
function SkillReadinessBadge({ skillReadiness, skillReadinessBySkill, winningSkill }) {
  const [showBreakdown, setShowBreakdown] = React.useState(false);
  const [showSkillTooltip, setShowSkillTooltip] = React.useState(false);
  const triggerRef = React.useRef(null);

  const perSkillList = Array.isArray(skillReadinessBySkill) ? skillReadinessBySkill : [];
  const hasPerSkillDetail = perSkillList.length >= 2;
  const hasScoreBreakdown = !!skillReadiness && (skillReadiness.capability_score !== undefined || skillReadiness.application_score !== undefined);
  const lowestSkillName = winningSkill?.skill_name;
  const formatScore = (v) => (typeof v === 'number' ? v.toFixed(1) : null);

  // Two independently-triggered panels never show at once, so one shared
  // coordinate calc covers both — estimate scales with whichever is open.
  const breakdownRowCount = [
    skillReadiness?.capability_score, skillReadiness?.application_score, skillReadiness?.background_match_score,
    skillReadiness?.work_experience_match_score, skillReadiness?.published_work_match_score,
  ].filter((v) => v !== undefined && v !== null).length;
  const estimatedHeight = showSkillTooltip
    ? 34 + perSkillList.length * 20 + (lowestSkillName ? 40 : 0) + 16
    : 34 + breakdownRowCount * 20 + 16;
  const coords = useFloatingPanelCoords(triggerRef, showBreakdown || showSkillTooltip, estimatedHeight);

  if (!skillReadiness) return null;

  const { classification, skill_readiness_score } = skillReadiness;
  const palette = READINESS_COLORS[classification] || READINESS_COLORS['Developing'];

  const panelStyle = {
    position: 'fixed', top: coords?.top ?? -9999, left: coords?.left ?? -9999, zIndex: 1000,
    width: FLOATING_PANEL_WIDTH, padding: '10px 12px', borderRadius: 12,
    // Subtle elevated-surface effect: a faint top-edge highlight (inset)
    // plus a soft ambient shadow reads as "raised" without looking gaudy.
    background: 'linear-gradient(180deg, rgba(31,41,59,0.98), rgba(15,23,42,0.98))',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 10px 28px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3)',
  };

  return (
    <div
      ref={triggerRef}
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => { if (hasPerSkillDetail) setShowSkillTooltip(true); }}
      onMouseLeave={() => setShowSkillTooltip(false)}
    >
      <div
        className="tw:flex tw:items-center tw:space-x-1 tw:px-2.5 tw:py-0.5 tw:rounded-full tw:text-xs tw:font-bold"
        style={{ background: palette.bg, color: palette.text, border: `1px solid ${palette.border}`, cursor: hasScoreBreakdown ? 'pointer' : 'default' }}
        onClick={(e) => { if (hasScoreBreakdown) { e.stopPropagation(); setShowBreakdown((v) => !v); } }}
        title={hasScoreBreakdown ? 'Click for score breakdown' : undefined}
      >
        <Gauge className="tw:w-3 tw:h-3" />
        <span>{classification}{typeof skill_readiness_score === 'number' ? ` · ${Math.round(skill_readiness_score)}%` : ''}</span>
        {(hasScoreBreakdown || hasPerSkillDetail) && <Info className="tw:w-2.5 tw:h-2.5" style={{ opacity: 0.7 }} />}
      </div>

      {showBreakdown && hasScoreBreakdown && coords && createPortal(
        <div onClick={(e) => e.stopPropagation()} style={panelStyle}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>Skill Readiness Breakdown</p>
          {[
            ['Capability', skillReadiness.capability_score, '#34d399'],
            ['Application', skillReadiness.application_score, '#60a5fa'],
            ['Background match', skillReadiness.background_match_score, '#a78bfa'],
            ['Work experience match', skillReadiness.work_experience_match_score, '#f472b6'],
            ['Published work match', skillReadiness.published_work_match_score, '#fbbf24'],
          ].filter(([, v]) => v !== undefined && v !== null).map(([label, val, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', padding: '2px 0' }}>
              <span>{label}</span>
              <span style={{ color, fontWeight: 700 }}>{Math.round(val)}%</span>
            </div>
          ))}
        </div>,
        document.body
      )}

      {showSkillTooltip && hasPerSkillDetail && coords && createPortal(
        <div style={{ ...panelStyle, pointerEvents: 'none' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>Skill Readiness Breakdown</p>
          {perSkillList.map(({ skill_name, skill_readiness: skillDetail }, idx) => {
            const detailPalette = skillDetail ? (READINESS_COLORS[skillDetail.classification] || READINESS_COLORS['Developing']) : null;
            const formatted = skillDetail ? formatScore(skillDetail.skill_readiness_score) : null;
            return (
              <div key={`${skill_name}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', padding: '2px 0' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }} title={skill_name}>{skill_name}</span>
                {formatted !== null ? (
                  <span style={{ color: detailPalette.text, fontWeight: 700 }}>{formatted}</span>
                ) : (
                  <span style={{ fontStyle: 'italic' }}>Not available</span>
                )}
              </div>
            );
          })}

          {lowestSkillName && (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', margin: '10px 0 4px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                Lowest skill
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130, color: '#e2e8f0' }} title={lowestSkillName}>{lowestSkillName}</span>
                {formatScore(skill_readiness_score) !== null && (
                  <span style={{ color: palette.text, fontWeight: 700 }}>{formatScore(skill_readiness_score)}</span>
                )}
              </div>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// Reusable Section Header
const SectionHeader = ({ icon: Icon, title, extra, color = '#8fb329' }) => (
  <div className="tw:flex tw:items-center tw:justify-between tw:mb-4">
    <div className="tw:flex tw:items-center tw:gap-2.5">
      {Icon && (
        <div className="tw:flex tw:items-center tw:justify-center" style={{
          width: 30, height: 30, borderRadius: 8,
          background: `linear-gradient(135deg, ${color}22, ${color}11)`,
          border: `1px solid ${color}33`,
        }}>
          <Icon style={{ width: 15, height: 15, color }} />
        </div>
      )}
      <h4 className="tw:font-semibold tw:text-white tw:text-sm tw:mb-0">{title}</h4>
    </div>
    {extra}
  </div>
);

export default function TimelineItem({ profile, isSelected, onClick, index, dimensionOrder = null, source = 'talent' }) {
  // Access Map (keyed by access_name)
  const accessMap = useSelector((state) => state.clientInfo?.accessMap ?? {});

  // Skill Readiness feature flag — single source of truth, see useSkillReadinessEnabled.
  const compressedClientInfo = useSelector((state) => state.clientInfo?.clientInfo);
  const clientId = compressedClientInfo
    ? JSON.parse(decompressFflate(compressedClientInfo))?.client_id ?? null
    : null;
  const skillReadinessEnabled = useSkillReadinessEnabled(clientId);

  // Derived State
  const scoreColor = profile.composite_score ? getScoreColor(profile.composite_score) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.08, 0.4), duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="tw:rounded-xl tw:overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
      }}
    >

      {/* Top accent line */}
      {isSelected && (
        <div style={{
          height: 2,
          background: 'linear-gradient(90deg, transparent, #8fb329, #818cf8, transparent)',
          opacity: 0.6,
        }} />
      )}

      {/* Compact Card Header */}
      <motion.div
        onClick={onClick}
        className="tw:px-3 tw:py-2.5 tw:cursor-pointer tw:transition-all tw:duration-300 tw:relative"
        style={{
          background: isSelected
            ? 'linear-gradient(135deg, rgba(143,179,41,0.06) 0%, rgba(129,140,248,0.04) 100%)'
            : 'rgba(255,255,255,0.01)',
        }}
        whileHover={{
          backgroundColor: 'rgba(255,255,255,0.04)',
        }}
      >
        <div className="tw:flex tw:items-center tw:space-x-3">
          {/* Profile image with ring */}
          <div className="tw:shrink-0 tw:relative">
            <div style={{
              padding: 2,
              borderRadius: '50%',
              background: scoreColor ? scoreColor.bg : 'linear-gradient(135deg, #4b5563, #6b7280)',
            }}>
              <Avatar
                src={profile.image_url}
                name={profile.name}
                size={36}
                className="tw:border-2"
                style={{ borderColor: '#111827' }}
              />
            </div>
          </div>

          {/* Profile info */}
          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
              <div className="tw:flex-1 tw:min-w-0">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <h3 className="tw:text-sm tw:font-semibold tw:text-white tw:mb-0 tw:leading-tight tw:truncate">
                    {profile.name}
                  </h3>
                  <span className="tw:text-xs tw:hidden sm:tw:inline tw:shrink-0" style={{ color: '#64748b' }}>&middot;</span>
                  <p className="tw:text-xs tw:mb-0 tw:truncate tw:hidden sm:tw:block" style={{ color: '#94a3b8' }}>
                    {profile.title}
                  </p>
                </div>
                {/* Location and practice areas - inline */}
                <div className="tw:flex tw:items-center tw:gap-3 tw:text-xs tw:mt-0.5" style={{ color: '#6b7280' }}>
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <MapPin className="tw:w-3 tw:h-3" />
                    <span>{profile.location}</span>
                  </div>
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <Building className="tw:w-3 tw:h-3" />
                    {profile.practice_areas && profile.practice_areas.length > 0 ? (
                      <span className="tw:truncate tw:max-w-40">{profile.practice_areas.slice(0, 2).join(', ')}{profile.practice_areas.length > 2 ? ` +${profile.practice_areas.length - 2}` : ''}</span>
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score badges */}
              <div className="tw:flex tw:items-center tw:space-x-1.5 tw:shrink-0">
                {profile.composite_score && (
                  <div
                    className="tw:flex tw:items-center tw:space-x-1 tw:px-2.5 tw:py-0.5 tw:rounded-full tw:text-xs tw:font-bold"
                    style={{
                      background: scoreColor.bg,
                      color: scoreColor.text,
                      boxShadow: `0 2px 8px ${scoreColor.glow}`,
                    }}
                  >
                    <Star className="tw:w-3 tw:h-3" />
                    <span>{profile.composite_score}%</span>
                  </div>
                )}

                {skillReadinessEnabled && profile.skill_readiness && (
                  <SkillReadinessBadge
                    skillReadiness={profile.skill_readiness}
                    skillReadinessBySkill={profile.skill_readiness_by_skill}
                    winningSkill={profile.skill_readiness_winning_skill}
                  />
                )}

                {skillReadinessEnabled && profile.background_match_score !== undefined && profile.background_match_score !== null && !profile.skill_readiness && (
                  <div className="tw:flex tw:items-center tw:space-x-1 tw:px-2 tw:py-0.5 tw:rounded-full tw:text-xs tw:font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(124,58,237,0.15))',
                      color: '#c4b5fd',
                      border: '1px solid rgba(167,139,250,0.25)',
                    }}>
                    <Target className="tw:w-3 tw:h-3" />
                    <span>BG {Math.round(profile.background_match_score)}%</span>
                  </div>
                )}

                {(accessMap["Search_Individual Profile_HCM Score"] && profile.hcm_composite_score) && (
                  <div className="tw:flex tw:items-center tw:space-x-1 tw:px-2 tw:py-0.5 tw:rounded-full tw:text-xs tw:font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(59,130,246,0.15))',
                      color: '#93c5fd',
                      border: '1px solid rgba(96,165,250,0.25)',
                    }}>
                    <Award className="tw:w-3 tw:h-3" />
                    <span>HCM {profile.hcm_composite_score.toFixed(0)}</span>
                  </div>
                )}
                {profile.web_enhanced && (
                  <div className="tw:flex tw:items-center tw:px-2 tw:py-0.5 tw:rounded-full tw:text-xs tw:font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.15))',
                      color: '#6ee7b7',
                      border: '1px solid rgba(52,211,153,0.25)',
                    }}>
                    <Globe className="tw:w-3 tw:h-3" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expand/Collapse indicator */}
          <div className="tw:shrink-0">
            <motion.div
              animate={{ rotate: isSelected ? 90 : 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="tw:flex tw:items-center tw:justify-center"
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: isSelected ? 'rgba(143,179,41,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isSelected ? 'rgba(143,179,41,0.25)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <ChevronRight
                className="tw:w-3.5 tw:h-3.5"
                style={{ color: isSelected ? '#8fb329' : '#6b7280' }}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="tw:overflow-hidden"
          >
            <ExpandedProfileTabs profile={profile} dimensionOrder={dimensionOrder} source={source} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Tabbed Profile View ── */

const HCM_ACCESS_KEY = 'Search_Individual Profile_HCM Scorecard';

// dimension.text_source → tab icon/color. This is presentation metadata
// only — which dimensions exist, their labels, and their order all come
// from the client's dimension config (dimensionOrder below), never from a
// hardcoded tab list. A text_source not in this map (future catalogue
// addition) still gets a tab via the Sparkles/gray fallback — it is never
// silently dropped.
const TEXT_SOURCE_META = {
  summary: { icon: User, color: '#818cf8' },
  representative_matters: { icon: Briefcase, color: '#B3D335' },
  publications: { icon: ExternalLink, color: '#f472b6' },
  web_enhanced: { icon: Globe, color: '#9ACA3C' },
  skills: { icon: Target, color: '#B3D335' },
  tags: { icon: Tag, color: '#a78bfa' },
  education: { icon: GraduationCap, color: '#a78bfa' },
  recognitions: { icon: Award, color: '#fbbf24' },
  affiliations: { icon: Users, color: '#60a5fa' },
  seniority: { icon: TrendingUp, color: '#fbbf24' },
};

// Renders the real backing content for a configured dimension, routed by
// text_source — not by a fixed industry-specific tab list. Falls through to
// GenericDimensionTab (which itself renders an honest empty state) for any
// text_source without a dedicated, richer tab component.
function renderDimensionTabContent(dim, profile, source = 'talent') {
  switch (dim.text_source) {
    case 'representative_matters':
      return <MattersTab profile={profile} />;
    case 'publications':
      return <PublicationsTab profile={profile} />;
    case 'web_enhanced':
      return <WebTab profile={profile} />;
    case 'summary':
      return <ProfileTab profile={profile} source={source} />;
    default:
      return <GenericDimensionTab profile={profile} textSource={dim.text_source} label={dim.label} />;
  }
}

// Shows the dimension's real numeric contribution to composite_score (from
// the search API's dimension_scores[]) above its content — this is the
// "see the data that contributed to the score for that dimension" requirement.
function DimensionTabWrapper({ dim, profile, children }) {
  const ds = profile.dimension_scores?.find((d) => d.key === dim.key);
  return (
    <div className="tw:space-y-4">
      {ds && (
        <div
          className="tw:flex tw:items-center tw:justify-between tw:px-4 tw:py-2.5 tw:rounded-lg"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="tw:text-xs tw:font-medium" style={{ color: '#94a3b8' }}>
            Contribution to relevance score (weight {Math.round((dim.default_weight ?? 0) * 100)}%)
          </span>
          <span className="tw:text-sm tw:font-bold" style={{ color: ds.score > 0 ? '#B3D335' : '#6b7280' }}>
            {Math.round(ds.score * 100)}%
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

// Chrome-style scrollable tab bar: no raw native scrollbar, chevron buttons
// + edge fades appear only when there's actually more to scroll to, and the
// active tab auto-scrolls into view whenever it changes (clicking a tab near
// the edge no longer leaves you wondering whether the click "took" — the bar
// scrolls to confirm it).
function TabBar({ tabs, effectiveTab, onSelect }) {
  const scrollRef = React.useRef(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return undefined;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, tabs.length]);

  React.useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-tab-id="${effectiveTab}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [effectiveTab]);

  const scrollByAmount = (dx) => scrollRef.current?.scrollBy({ left: dx, behavior: 'smooth' });

  return (
    <div className="tw:relative tw:flex tw:items-center tw:rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      {canScrollLeft && (
        <button
          onClick={() => scrollByAmount(-160)}
          className="tw:absolute tw:left-0 tw:top-0 tw:bottom-0 tw:z-10 tw:flex tw:items-center tw:justify-center tw:border-0"
          style={{ width: 28, background: 'linear-gradient(90deg, #0f172a 30%, transparent)', color: '#94a3b8', cursor: 'pointer' }}
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="tw:w-4 tw:h-4" />
        </button>
      )}
      <div
        ref={scrollRef}
        className="sl-tabbar-scroll tw:flex tw:gap-1 tw:p-1 tw:overflow-x-auto tw:w-full"
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = effectiveTab === tab.id;
          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => onSelect(tab.id)}
              className="tw:flex tw:items-center tw:px-3 tw:py-2 tw:text-xs tw:font-medium tw:rounded-lg tw:transition-all tw:duration-200 tw:border-0 tw:whitespace-nowrap tw:relative tw:shrink-0"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${tab.color}18, ${tab.color}0a)`
                  : 'transparent',
                color: isActive ? tab.color : '#6b7280',
                boxShadow: isActive ? `0 0 12px ${tab.color}15` : 'none',
                border: isActive ? `1px solid ${tab.color}30` : '1px solid transparent',
              }}
            >
              <Icon className="tw:w-3.5 tw:h-3.5 tw:mr-1.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scrollByAmount(160)}
          className="tw:absolute tw:right-0 tw:top-0 tw:bottom-0 tw:z-10 tw:flex tw:items-center tw:justify-center tw:border-0"
          style={{ width: 28, background: 'linear-gradient(270deg, #0f172a 30%, transparent)', color: '#94a3b8', cursor: 'pointer' }}
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="tw:w-4 tw:h-4" />
        </button>
      )}
      <style>{'.sl-tabbar-scroll::-webkit-scrollbar { display: none; }'}</style>
    </div>
  );
}

function ExpandedProfileTabs({ profile, dimensionOrder = null, source = 'talent' }) {
  const accessMap = useSelector((state) => state.clientInfo?.accessMap ?? {});

  const [activeTab, setActiveTab] = React.useState('relevance');

  // One tab per configured dimension, sorted by weight (desc) — 1:1 with
  // the client's active Relevance Configuration, however many dimensions it
  // has. No source_type bucketing: 8 configured dimensions means 8 tabs,
  // not however many distinct profile/experience/publications buckets they
  // happen to share.
  const dimensionTabs = React.useMemo(() => {
    if (!dimensionOrder?.length) return [];
    return [...dimensionOrder]
      .sort((a, b) => (b.default_weight ?? 0) - (a.default_weight ?? 0))
      .map((dim) => {
        const meta = TEXT_SOURCE_META[dim.text_source] ?? { icon: Sparkles, color: '#94a3b8' };
        return { id: `dim_${dim.key}`, label: dim.label, icon: meta.icon, color: meta.color, dim };
      });
  }, [dimensionOrder]);

  // Used only by RelevanceTab to decide whether to show its "Most Relevant
  // Matter/Publication" cards — defaults true while config is still loading
  // so that summary doesn't flicker empty before dimensionOrder arrives.
  const hasMattersDim = !dimensionOrder || dimensionOrder.some((d) => d.text_source === 'representative_matters');
  const hasPublicationsDim = !dimensionOrder || dimensionOrder.some((d) => d.text_source === 'publications');

  // Tab order: Relevance (always first) → configured dimension tabs (by
  // weight) → Self-Assessment → HCM (conditional) → Contact (always last).
  const tabs = [
    { id: 'relevance', label: 'Relevance', icon: Star, color: '#fbbf24' },
    ...dimensionTabs,
    // Legacy fallback: show Web Data tab when no dim config but profile has web_enhanced data
    ...(!dimensionOrder && profile.web_enhanced ? [{ id: 'web', label: 'Web Data', icon: Globe, color: '#9ACA3C' }] : []),
    { id: 'selfassessment', label: 'Self-Assessment', icon: ClipboardList, color: '#38bdf8' },
    ...(accessMap[HCM_ACCESS_KEY] ? [{ id: 'hcm', label: 'HCM Scorecard', icon: Award, color: '#a78bfa' }] : []),
    { id: 'contact', label: 'Contact', icon: Mail, color: '#fb923c' },
  ];

  // Stale-state safety: if activeTab not in current tabs, fall back to relevance
  const effectiveTab = tabs.some(t => t.id === activeTab) ? activeTab : 'relevance';

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Tab Navigation */}
      <div className="tw:px-4 tw:pt-3">
        <TabBar tabs={tabs} effectiveTab={effectiveTab} onSelect={setActiveTab} />
      </div>

      {/* Tab Content */}
      <div className="tw:px-4 tw:pb-5 tw:pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={effectiveTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {effectiveTab === 'relevance' && <RelevanceTab profile={profile} showMatter={hasMattersDim} showPublication={hasPublicationsDim} />}
            {effectiveTab === 'web' && <WebTab profile={profile} />}
            {effectiveTab === 'selfassessment' && <SelfAssessmentTab profile={profile} />}
            {effectiveTab === 'hcm' && <HCMTab profile={profile} />}
            {effectiveTab === 'contact' && <ContactTab profile={profile} />}
            {dimensionTabs.map((t) => effectiveTab === t.id && (
              <DimensionTabWrapper key={t.id} dim={t.dim} profile={profile}>
                {renderDimensionTabContent(t.dim, profile, source)}
              </DimensionTabWrapper>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Relevance Tab ── */

function RelevanceTab({ profile, showMatter = true, showPublication = true }) {
  return (
    <div className="tw:space-y-5">
      {/* Why This Profile is Relevant */}
      <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
        <SectionHeader icon={Sparkles} title="Why This Profile is Relevant" color="#fbbf24" />

        {/* Relevant Sentences */}
        {profile.relevant_sentences && profile.relevant_sentences.length > 0 && (
          <div className="tw:mb-5">
            <p className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wider tw:mb-3" style={{ color: '#94a3b8' }}>
              Key Relevant Sentences:
            </p>
            <div className="tw:space-y-3">
              {profile.relevant_sentences.map((item, idx) => {
                // const colors = ['#34d399', '#818cf8', '#f472b6', '#fbbf24', '#38bdf8'];
                const colors = ['#818cf8'];
                const accent = colors;
                return (
                  <div key={idx} className="tw:rounded-lg tw:p-4 tw:relative tw:overflow-hidden" style={{
                    background: `linear-gradient(135deg, ${accent}08, transparent)`,
                    borderLeft: `3px solid ${accent}`,
                    border: `1px solid ${accent}20`,
                    borderLeftWidth: 3,
                    borderLeftColor: accent,
                  }}>
                    <p className="tw:text-sm tw:leading-relaxed tw:italic tw:mb-1.5" style={{ color: '#e2e8f0' }}>
                      &ldquo;{item.sentence}&rdquo;
                    </p>
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <div className="tw:h-1.5 tw:rounded-full tw:flex-1 tw:max-w-20" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="tw:h-full tw:rounded-full" style={{
                          width: `${item.relevance_score * 100}%`,
                          background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
                        }} />
                      </div>
                      <span className="tw:text-xs tw:font-semibold" style={{ color: accent }}>
                        {(item.relevance_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="tw:text-xs tw:mt-3" style={{ color: '#64748b' }}>
              * Relevant sentences are extracted using semantic similarity analysis
            </p>
          </div>
        )}

        {/* Expertise Tags */}
        {profile.expertise_tags && profile.expertise_tags.length > 0 && (
          <div className="tw:mb-4">
            <p className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wider tw:mb-3" style={{ color: '#94a3b8' }}>
              Key Expertise Areas:
            </p>
            <div className="tw:flex tw:flex-wrap tw:gap-2">
              {profile.expertise_tags.slice(0, 8).map((tag, idx) => (
                <span key={idx} className="tw:px-3 tw:py-1.5 tw:text-xs tw:rounded-lg tw:font-medium" style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#cbd5e1',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Practice Areas */}
        {profile.practice_areas && profile.practice_areas.length > 0 && (
          <div>
            <p className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wider tw:mb-3" style={{ color: '#94a3b8' }}>
              Practice Areas Match:
            </p>
            <div className="tw:flex tw:flex-wrap tw:gap-2">
              {profile.practice_areas.map((area, idx) => {
                const c = pickColor(area, idx);
                return (
                  <span key={idx} className="tw:px-3 tw:py-1.5 tw:text-xs tw:rounded-lg tw:font-medium" style={{
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    color: c.text,
                  }}>
                    {area}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Top Skill Matches */}
      {profile.top_competency_matches && profile.top_competency_matches.length > 0 && (
        <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
          <SectionHeader icon={Target} title="Top Skill Matches" color="#818cf8" />
          <div className="tw:space-y-2.5">
            {profile.top_competency_matches.slice(0, 5).map((match, idx) => {
              const percent = match.match_percent || 0;
              return (
                <motion.div
                  key={idx}
                  className="tw:flex tw:items-center tw:justify-between tw:p-3.5 tw:rounded-xl tw:group"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                  whileHover={{
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="tw:flex-1 tw:mr-4">
                    <div className="tw:text-sm tw:font-medium tw:text-white tw:leading-snug">
                      {match.skill_family}
                      <span style={{ color: '#4b5563' }}> &rarr; </span>
                      {match.group_item}
                      <span style={{ color: '#4b5563' }}> &rarr; </span>
                      <span style={{ color: '#94a3b8' }}>{match.competency}</span>
                    </div>
                    <div className="tw:text-xs tw:mt-1" style={{ color: '#64748b' }}>
                      Match Score
                    </div>
                  </div>
                  <div className="tw:flex tw:items-center tw:space-x-3 tw:shrink-0">
                    <div className="tw:w-28 tw:rounded-full tw:h-2 tw:overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        className="tw:h-full tw:rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                        style={{ background: getBarGradient(percent) }}
                      />
                    </div>
                    <span className="tw:text-sm tw:font-bold tw:min-w-12 tw:text-right" style={{
                      color: percent >= 60 ? '#34d399' : percent >= 45 ? '#bef264' : percent >= 30 ? '#fbbf24' : '#c084fc',
                    }}>
                      {percent}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <p className="tw:text-xs tw:mt-3" style={{ color: '#64748b' }}>
            * Skill matches are calculated using profile content, matter experience, and publication relevance
          </p>
        </div>
      )}

      {/* Top Relevant Matter — only shown when client config includes experience source_type */}
      {showMatter && profile.top_matter && (
        <div className="tw:p-5 tw:rounded-xl tw:relative tw:overflow-hidden" style={{
          ...glassSection,
          borderColor: 'rgba(52,211,153,0.12)',
        }}>
          <div className="tw:absolute tw:top-0 tw:left-0 tw:right-0 tw:h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.3), transparent)' }} />
          <SectionHeader
            icon={Briefcase}
            title="Most Relevant Matter"
            color="#34d399"
            extra={profile.top_matter_score && (
              <span className="tw:text-xs tw:font-bold tw:px-2.5 tw:py-1 tw:rounded-lg" style={{
                background: 'rgba(52,211,153,0.12)',
                color: '#34d399',
                border: '1px solid rgba(52,211,153,0.2)',
              }}>
                {profile.top_matter_score}% match
              </span>
            )}
          />
          <p className="tw:text-sm tw:leading-relaxed" style={{ color: '#e2e8f0' }}>{profile.top_matter}</p>
          <p className="tw:text-xs tw:mt-3" style={{ color: '#64748b' }}>
            * Selected from {profile.representative_matters?.length || 'multiple'} representative matters based on relevance scoring
          </p>
        </div>
      )}

      {/* Top Relevant Publication — only shown when client config includes publications source_type */}
      {showPublication && profile.top_publication && (
        <div className="tw:p-5 tw:rounded-xl tw:relative tw:overflow-hidden" style={{
          ...glassSection,
          borderColor: 'rgba(244,114,182,0.12)',
        }}>
          <div className="tw:absolute tw:top-0 tw:left-0 tw:right-0 tw:h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(244,114,182,0.3), transparent)' }} />
          <SectionHeader
            icon={ExternalLink}
            title="Most Relevant Publication"
            color="#f472b6"
            extra={profile.top_publication_score && (
              <span className="tw:text-xs tw:font-bold tw:px-2.5 tw:py-1 tw:rounded-lg" style={{
                background: 'rgba(244,114,182,0.12)',
                color: '#f472b6',
                border: '1px solid rgba(244,114,182,0.2)',
              }}>
                {profile.top_publication_score}% match
              </span>
            )}
          />
          <p className="tw:text-sm tw:leading-relaxed tw:mb-2" style={{ color: '#e2e8f0' }}>{profile.top_publication}</p>
          {profile.top_publication_url && (
            <a
              href={profile.top_publication_url}
              target="_blank"
              rel="noopener noreferrer"
              className="tw:text-sm tw:flex tw:items-center tw:gap-1.5 tw:transition-colors tw:no-underline"
              style={{ color: '#f472b6' }}
            >
              Read Publication <ExternalLink className="tw:w-3.5 tw:h-3.5" />
            </a>
          )}
          <p className="tw:text-xs tw:mt-3" style={{ color: '#64748b' }}>
            * Selected from {profile.publications?.length || 'multiple'} publications based on relevance scoring
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Shared Education List ── */

function EducationList({ items, bulletColor }) {
  return (
    <ul className="tw:space-y-2 tw:list-none tw:ps-0 tw:mb-0">
      {items.map((edu, index) => (
        <li key={index} className="tw:text-sm tw:flex tw:items-start tw:gap-2" style={{ color: '#e2e8f0' }}>
          <span style={{ color: bulletColor }}>&#8226;</span>
          {formatEducationEntry(edu)}
        </li>
      ))}
    </ul>
  );
}

/* ── Profile Tab ── */

function ProfileTab({ profile, source = 'talent' }) {
  // Matches the title the standalone Infographic Report modal used to show
  // per source — Talent vs Recruitment — before it was moved into this tab.
  const infographicTitle = source === 'recruitment' ? 'Recruitment Profile Report' : 'Talent Profile Report';
  return (
    <div className="tw:space-y-5">
      {/* Infographic Report — lazy: this whole tab only mounts once the card
          is expanded and this tab is the active one (see ExpandedProfileTabs
          below), so nothing here fetches/renders until then. Reuses the exact
          same components the standalone Infographic Report modal used —
          each already has its own loading state (ProfessionalSummary) and
          empty state (all four) for missing data, nothing new to build.
          ProfileHeader/ProfessionalSummary already cover Education and a
          biography-style summary, so the standalone Biography/Education
          blocks that used to lead this tab were dropped as duplicates. */}
      <div>
        <SectionHeader icon={FileText} title={infographicTitle} color="#B3D335" extra={<InfographicDownloadButton profile={profile} source={source} />} />
        <div className="tw:space-y-5">
          <InfographicProfileHeader profile={profile} />
          <InfographicProfessionalSummary profile={profile} />
          <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-5 tw:items-stretch">
            <InfographicTalentRadarChart profile={profile} />
            <InfographicSkillCapitalRadarChart profile={profile} />
          </div>
          <InfographicWorkExperienceTimeline profile={profile} />
        </div>
      </div>

      {profile.recognitions && (Array.isArray(profile.recognitions) ? profile.recognitions.length > 0 : true) && (
        <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
          <SectionHeader icon={Award} title="Recognitions" color="#fbbf24" />
          {Array.isArray(profile.recognitions) ? (
            <ul className="tw:space-y-2 tw:list-none tw:ps-0 tw:mb-0">
              {profile.recognitions.map((r, i) => (
                <li key={i} className="tw:text-sm tw:flex tw:items-start tw:gap-2" style={{ color: '#e2e8f0' }}>
                  <span style={{ color: '#fbbf24' }}>&#8226;</span>
                  {r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="tw:text-sm" style={{ color: '#e2e8f0' }}>{profile.recognitions}</p>
          )}
        </div>
      )}

      {profile.practice_areas && profile.practice_areas.length > 0 && (
        <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
          <SectionHeader icon={Building} title="Practice Areas" color="#34d399" />
          <div className="tw:flex tw:flex-wrap tw:gap-2">
            {profile.practice_areas.map((area, index) => {
              const c = pickColor(area, index);
              return (
                <span key={index} className="tw:px-3 tw:py-1.5 tw:text-sm tw:rounded-lg tw:font-medium" style={{
                  background: c.bg, border: `1px solid ${c.border}`, color: c.text,
                }}>
                  {area}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Matters Tab ── */

function MattersTab({ profile }) {
  return (
    <div className="tw:space-y-3">
      {profile.representative_matters && profile.representative_matters.length > 0 ? (
        profile.representative_matters.map((matter, index) => (
          <div key={index} className="tw:p-4 tw:rounded-xl tw:relative" style={glassSection}>
            <div className="tw:absolute tw:left-0 tw:top-3 tw:bottom-3 tw:w-0.5 tw:rounded-full" style={{ background: 'linear-gradient(180deg, #34d399, transparent)' }} />
            <div className="tw:pl-3">
              {typeof matter === 'string' ? (
                <p className="tw:text-sm tw:leading-relaxed tw:mb-0" style={{ color: '#e2e8f0' }}>{matter}</p>
              ) : (
                <div>
                  {matter.client && (
                    <p className="tw:font-medium tw:text-white tw:mb-1 tw:text-sm">Client: {matter.client}</p>
                  )}
                  {matter.description && (
                    <p className="tw:text-sm tw:leading-relaxed tw:mb-0" style={{ color: '#e2e8f0' }}>{matter.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="tw:p-5 tw:rounded-xl tw:text-center" style={glassSection}>
          <Briefcase className="tw:w-8 tw:h-8 tw:mx-auto tw:mb-2" style={{ color: '#4b5563' }} />
          <p style={{ color: '#64748b' }} className="tw:mb-0">No representative matters available.</p>
        </div>
      )}
    </div>
  );
}

/* ── Publications Tab ── */

// pub.tag -> icon/color/label + accent bar. "tag" (not "type") is what the
// backend actually delivers here — the assets table's asset_type column is
// mapped to the "tag" key in data_loader.py's _fetch_assets_for_profiles,
// and the Law-client attributes.publications fallback uses the same "tag"
// key — so this must match that name, not the JSON upload schema's
// "asset_type" field. Falls back to the original generic "Read Publication"
// treatment for entries with no tag (older converted profiles predating
// this field) so nothing regresses.
const PUBLICATION_TYPE_META = {
  youtube: { icon: Video, color: '#f87171', label: 'Watch Video' },
  news: { icon: Newspaper, color: '#60a5fa', label: 'Read News' },
  article: { icon: FileText, color: '#34d399', label: 'Read Article' },
  publication: { icon: BookOpen, color: '#f472b6', label: 'Read Publication' },
};
const DEFAULT_PUBLICATION_META = { icon: ExternalLink, color: '#f472b6', label: 'Read Publication' };

function PublicationsTab({ profile }) {
  return (
    <div className="tw:space-y-3">
      {profile.publications && profile.publications.length > 0 ? (
        profile.publications.map((pub, index) => {
          const meta = (typeof pub === 'object' && PUBLICATION_TYPE_META[pub.tag]) || DEFAULT_PUBLICATION_META;
          const LinkIcon = meta.icon;
          return (
            <div key={index} className="tw:p-4 tw:rounded-xl tw:relative" style={glassSection}>
              <div className="tw:absolute tw:left-0 tw:top-3 tw:bottom-3 tw:w-0.5 tw:rounded-full" style={{ background: `linear-gradient(180deg, ${meta.color}, transparent)` }} />
              <div className="tw:pl-3">
                {typeof pub === 'string' ? (
                  <p className="tw:text-sm tw:leading-relaxed tw:mb-0" style={{ color: '#e2e8f0' }}>{pub}</p>
                ) : (
                  <div>
                    <div className="tw:mb-1" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <LinkIcon style={{ color: meta.color, width: 14, height: 14, flexShrink: 0, display: 'block' }} />
                      <p className="tw:font-medium tw:text-white tw:text-sm" style={{ margin: 0, lineHeight: '14px' }}>
                        {pub.title || 'Untitled Publication'}
                      </p>
                    </div>
                    {pub.url && (
                      <a
                        href={pub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tw:text-sm tw:flex tw:items-center tw:gap-1 tw:no-underline tw:transition-opacity hover:tw:opacity-80"
                        style={{ color: meta.color }}
                      >
                        {meta.label} <ExternalLink className="tw:w-3 tw:h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="tw:p-5 tw:rounded-xl tw:text-center" style={glassSection}>
          <ExternalLink className="tw:w-8 tw:h-8 tw:mx-auto tw:mb-2" style={{ color: '#4b5563' }} />
          <p style={{ color: '#64748b' }} className="tw:mb-0">No publications available.</p>
        </div>
      )}
    </div>
  );
}

/* ── Generic Field-Backed Dimension Tab ──
   For text_source values without a dedicated, richer tab component above
   (skills / tags / education / recognitions / affiliations / seniority).
   Shows the real backing field, or an honest empty state if this profile
   has no data for it — the tab itself is never hidden. */

function EmptyDimensionState({ icon: Icon, message }) {
  return (
    <div className="tw:p-5 tw:rounded-xl tw:text-center" style={glassSection}>
      <Icon className="tw:w-8 tw:h-8 tw:mx-auto tw:mb-2" style={{ color: '#4b5563' }} />
      <p style={{ color: '#64748b' }} className="tw:mb-0">{message}</p>
    </div>
  );
}

const GENERIC_FIELD_MAP = {
  skills: { profileKey: 'skills', icon: Target, color: '#B3D335' },
  tags: { profileKey: 'expertise_tags', icon: Tag, color: '#a78bfa' },
  education: { profileKey: 'education', icon: GraduationCap, color: '#a78bfa' },
  recognitions: { profileKey: 'recognitions', icon: Award, color: '#fbbf24' },
  affiliations: { profileKey: 'affiliations', icon: Users, color: '#60a5fa' },
};

function GenericDimensionTab({ profile, textSource, label }) {
  if (textSource === 'seniority') {
    const parts = [
      profile.title,
      profile.level,
      profile.organization,
      profile.years_experience ? `${profile.years_experience} years experience` : null,
    ].filter(Boolean);

    if (!parts.length) {
      return <EmptyDimensionState icon={TrendingUp} message={`No ${label.toLowerCase()} data available for this profile.`} />;
    }
    return (
      <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
        <SectionHeader icon={TrendingUp} title={label} color="#fbbf24" />
        <ul className="tw:space-y-2 tw:list-none tw:ps-0 tw:mb-0">
          {parts.map((p, i) => (
            <li key={i} className="tw:text-sm tw:flex tw:items-start tw:gap-2" style={{ color: '#e2e8f0' }}>
              <span style={{ color: '#fbbf24' }}>&#8226;</span>{p}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const conf = GENERIC_FIELD_MAP[textSource];
  if (!conf) {
    return <EmptyDimensionState icon={Sparkles} message="No data available for this dimension." />;
  }

  let raw = profile[conf.profileKey];
  if (raw && !Array.isArray(raw)) raw = [raw];
  const items = (raw || []).filter(Boolean);

  if (!items.length) {
    return <EmptyDimensionState icon={conf.icon} message={`No ${label.toLowerCase()} data available for this profile.`} />;
  }

  if (textSource === 'education') {
    return (
      <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
        <SectionHeader icon={conf.icon} title={label} color={conf.color} />
        <EducationList items={items} bulletColor={conf.color} />
      </div>
    );
  }

  return (
    <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
      <SectionHeader icon={conf.icon} title={label} color={conf.color} />
      <div className="tw:flex tw:flex-wrap tw:gap-2">
        {items.map((item, index) => {
          const c = pickColor(item, index);
          return (
            <span key={index} className="tw:px-3 tw:py-1.5 tw:text-sm tw:rounded-lg tw:font-medium" style={{
              background: c.bg, border: `1px solid ${c.border}`, color: c.text,
            }}>
              {item}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ── Contact Tab ── */

function ContactTab({ profile }) {
  return (
    <div className="tw:space-y-5">
      <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
        <SectionHeader icon={Mail} title="Contact Information" color="#fb923c" />
        <div className="tw:space-y-3">
          {profile.contact?.email && (() => {
            const email = decodeBase64(profile.contact.email);
            return (
              <div className="tw:flex tw:items-center tw:gap-3">
                <div className="tw:flex tw:items-center tw:justify-center" style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)',
                }}>
                  <Mail className="tw:w-4 tw:h-4" style={{ color: '#fb923c' }} />
                </div>
                <a href={`mailto:${email}`} className="tw:text-sm tw:no-underline tw:transition-opacity hover:tw:opacity-80" style={{ color: '#e2e8f0' }}>
                  {email}
                </a>
              </div>
            );
          })()}
          {profile.contact?.phone && (
            <div className="tw:flex tw:items-center tw:gap-3">
              <div className="tw:flex tw:items-center tw:justify-center" style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
              }}>
                <Phone className="tw:w-4 tw:h-4" style={{ color: '#34d399' }} />
              </div>
              <a href={`tel:${profile.contact.phone}`} className="tw:text-sm tw:no-underline tw:transition-opacity hover:tw:opacity-80" style={{ color: '#e2e8f0' }}>
                {profile.contact.phone}
              </a>
            </div>
          )}
          {profile.linkedin && (
            <div className="tw:flex tw:items-center tw:gap-3">
              <div className="tw:flex tw:items-center tw:justify-center" style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)',
              }}>
                <ExternalLink className="tw:w-4 tw:h-4" style={{ color: '#60a5fa' }} />
              </div>
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="tw:text-sm tw:no-underline tw:transition-opacity hover:tw:opacity-80" style={{ color: '#e2e8f0' }}>
                LinkedIn Profile
              </a>
            </div>
          )}
          {profile.source_url && (
            <div className="tw:flex tw:items-center tw:gap-3">
              <div className="tw:flex tw:items-center tw:justify-center" style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)',
              }}>
                <ExternalLink className="tw:w-4 tw:h-4" style={{ color: '#818cf8' }} />
              </div>
              <a href={profile.source_url} target="_blank" rel="noopener noreferrer" className="tw:text-sm tw:no-underline tw:transition-opacity hover:tw:opacity-80" style={{ color: '#e2e8f0' }}>
                View Full Profile
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
        <SectionHeader icon={Briefcase} title="Professional Details" color="#818cf8" />
        <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:text-sm">
          <div>
            <span className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wider" style={{ color: '#64748b' }}>Position</span>
            <p className="tw:mt-1 tw:mb-0" style={{ color: '#e2e8f0' }}>{profile.title}</p>
          </div>
          <div>
            <span className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wider" style={{ color: '#64748b' }}>Location</span>
            <p className="tw:mt-1 tw:mb-0" style={{ color: '#e2e8f0' }}>{profile.location}</p>
          </div>
          {profile.level && (
            <div>
              <span className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wider" style={{ color: '#64748b' }}>Level</span>
              <p className="tw:mt-1 tw:mb-0" style={{ color: '#e2e8f0' }}>{profile.level}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── HCM Tab ── */

function HCMTab({ profile }) {
  // Data Extraction & Normalization
  let scorecard = undefined;
  let valuation = undefined;

  if (profile.hcm_scorecard) {
    if (typeof profile.hcm_scorecard === 'object' && 'scorecard' in profile.hcm_scorecard) {
      const nested = profile.hcm_scorecard;
      scorecard = nested.scorecard;
      valuation = nested.valuation;
    } else {
      scorecard = profile.hcm_scorecard;
    }
  }

  if (!valuation && profile.inr_valuation) {
    valuation = profile.inr_valuation;
  }

  return (
    <HCMScorecardTab
      scorecard={scorecard}
      valuation={valuation}
    />
  );
}

/* ── Web Tab ── */

function WebTab({ profile }) {
  if (!profile.web_enhanced) {
    return (
      <div className="tw:p-5 tw:rounded-xl tw:text-center" style={glassSection}>
        <Globe className="tw:w-8 tw:h-8 tw:mx-auto tw:mb-2" style={{ color: '#4b5563' }} />
        <p style={{ color: '#64748b' }} className="tw:mb-0">This profile has not been enhanced with web data.</p>
      </div>
    );
  }

  return (
    <div className="tw:space-y-5">
      {/* Web Enhancement Status */}
      <div className="tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-2.5 tw:rounded-xl" style={{
        background: 'rgba(52,211,153,0.08)',
        border: '1px solid rgba(52,211,153,0.15)',
      }}>
        <CheckCircle className="tw:w-5 tw:h-5" style={{ color: '#34d399' }} />
        <span className="tw:font-medium tw:text-sm" style={{ color: '#6ee7b7' }}>Web Enhanced Profile</span>
        {profile.web_timestamp && (
          <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:ml-auto" style={{ color: '#64748b' }}>
            <Clock className="tw:w-3.5 tw:h-3.5" />
            <span>Updated: {new Date(profile.web_timestamp).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {profile.enhanced_bio && (
        <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
          <SectionHeader icon={User} title="Enhanced Biography" color="#34d399" />
          <p className="tw:text-sm tw:leading-relaxed" style={{ color: '#cbd5e1' }}>{profile.enhanced_bio}</p>
        </div>
      )}

      {profile.web_current_role && (
        <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
          <SectionHeader icon={Briefcase} title="Current Role" color="#818cf8" />
          <p className="tw:text-sm" style={{ color: '#cbd5e1' }}>{profile.web_current_role}</p>
        </div>
      )}

      {profile.web_expertise_areas && profile.web_expertise_areas.length > 0 && (
        <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
          <SectionHeader icon={Sparkles} title="Web-Discovered Expertise Areas" color="#34d399" />
          <div className="tw:flex tw:flex-wrap tw:gap-2">
            {profile.web_expertise_areas.map((area, index) => {
              const c = pickColor(area, index);
              return (
                <span key={index} className="tw:px-3 tw:py-1.5 tw:text-sm tw:rounded-lg tw:font-medium" style={{
                  background: c.bg, border: `1px solid ${c.border}`, color: c.text,
                }}>
                  {area}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {profile.web_career_highlights && profile.web_career_highlights.length > 0 && (
        <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
          <SectionHeader icon={TrendingUp} title="Career Highlights" color="#fbbf24" />
          <ul className="tw:space-y-2 tw:list-none tw:ps-0 tw:mb-0">
            {profile.web_career_highlights.map((highlight, index) => (
              <li key={index} className="tw:text-sm tw:flex tw:items-start tw:gap-2" style={{ color: '#cbd5e1' }}>
                <span className="tw:mt-1" style={{ color: '#34d399' }}>&#8226;</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.web_achievements && profile.web_achievements.length > 0 && (
        <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
          <SectionHeader icon={Award} title="Web-Discovered Achievements" color="#a78bfa" />
          <ul className="tw:space-y-2 tw:list-none tw:ps-0 tw:mb-0">
            {profile.web_achievements.map((achievement, index) => (
              <li key={index} className="tw:text-sm tw:flex tw:items-start tw:gap-2" style={{ color: '#cbd5e1' }}>
                <span className="tw:mt-1" style={{ color: '#a78bfa' }}>&#8226;</span>
                <span>{achievement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.web_education && profile.web_education.length > 0 && (
        <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
          <SectionHeader icon={GraduationCap} title="Web-Discovered Education" color="#38bdf8" />
          <ul className="tw:space-y-2 tw:list-none tw:ps-0 tw:mb-0">
            {profile.web_education.map((edu, index) => (
              <li key={index} className="tw:text-sm" style={{ color: '#cbd5e1' }}>{edu}</li>
            ))}
          </ul>
        </div>
      )}

      {profile.web_professional_affiliations && profile.web_professional_affiliations.length > 0 && (
        <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
          <SectionHeader icon={Building} title="Professional Affiliations" color="#fb923c" />
          <ul className="tw:space-y-2 tw:list-none tw:ps-0 tw:mb-0">
            {profile.web_professional_affiliations.map((affiliation, index) => (
              <li key={index} className="tw:text-sm tw:flex tw:items-start tw:gap-2" style={{ color: '#cbd5e1' }}>
                <span className="tw:mt-1" style={{ color: '#fb923c' }}>&#8226;</span>
                <span>{affiliation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.web_other_notes && profile.web_other_notes.length > 0 && (
        <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
          <SectionHeader icon={Globe} title="Additional Information" color="#94a3b8" />
          <ul className="tw:space-y-2 tw:list-none tw:ps-0 tw:mb-0">
            {profile.web_other_notes.map((note, index) => (
              <li key={index} className="tw:text-sm tw:flex tw:items-start tw:gap-2" style={{ color: '#cbd5e1' }}>
                <span className="tw:mt-1" style={{ color: '#64748b' }}>&#8226;</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.web_source_urls && profile.web_source_urls.length > 0 && (
        <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
          <SectionHeader icon={Globe} title="Web Sources" color="#38bdf8" />
          <div className="tw:space-y-2">
            {profile.web_source_urls.map((url, index) => (
              <div key={index} className="tw:flex tw:items-center tw:gap-2">
                <ExternalLink className="tw:w-3.5 tw:h-3.5 tw:shrink-0" style={{ color: '#38bdf8' }} />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw:text-sm tw:truncate tw:no-underline tw:transition-opacity hover:tw:opacity-80"
                  style={{ color: '#93c5fd' }}
                >
                  {url}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.web_structured_summary && (
        <div className="tw:p-5 tw:rounded-xl" style={glassSection}>
          <SectionHeader icon={Sparkles} title="AI-Generated Summary" color="#e879f9" />
          <div className="tw:p-4 tw:rounded-xl tw:space-y-4" style={{
            background: 'rgba(232,121,249,0.04)',
            border: '1px solid rgba(232,121,249,0.1)',
          }}>
            {typeof profile.web_structured_summary === 'string' ? (
              <p className="tw:text-sm tw:leading-relaxed tw:mb-0" style={{ color: '#cbd5e1' }}>{profile.web_structured_summary}</p>
            ) : (
              <div className="tw:space-y-4">
                {profile.web_structured_summary?.current_role && (
                  <div>
                    <h5 className="tw:font-medium tw:text-white tw:mb-2 tw:text-sm">Current Role</h5>
                    <p className="tw:text-sm tw:mb-0" style={{ color: '#cbd5e1' }}>{profile.web_structured_summary.current_role}</p>
                  </div>
                )}
                {profile.web_structured_summary?.expertise && profile.web_structured_summary.expertise.length > 0 && (
                  <div>
                    <h5 className="tw:font-medium tw:text-white tw:mb-2 tw:text-sm">Expertise Areas</h5>
                    <div className="tw:flex tw:flex-wrap tw:gap-2">
                      {profile.web_structured_summary.expertise.map((area, index) => {
                        const c = pickColor(area, index);
                        return (
                          <span key={index} className="tw:px-2.5 tw:py-1 tw:text-xs tw:rounded-lg tw:font-medium" style={{
                            background: c.bg, border: `1px solid ${c.border}`, color: c.text,
                          }}>
                            {area}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {profile.web_structured_summary?.transactional_experience && (
                  <div>
                    <h5 className="tw:font-medium tw:text-white tw:mb-2 tw:text-sm">Transactional Experience</h5>
                    {profile.web_structured_summary.transactional_experience?.deal_types && (
                      <div className="tw:mb-2">
                        <span className="tw:text-sm" style={{ color: '#64748b' }}>Deal Types: </span>
                        <span className="tw:text-sm" style={{ color: '#cbd5e1' }}>
                          {profile.web_structured_summary.transactional_experience.deal_types.join(', ')}
                        </span>
                      </div>
                    )}
                    {profile.web_structured_summary.transactional_experience?.notable_deals &&
                      (profile.web_structured_summary.transactional_experience?.notable_deals?.length ?? 0) > 0 && (
                        <div>
                          <span className="tw:text-sm" style={{ color: '#64748b' }}>Notable Deals:</span>
                          <ul className="tw:mt-1 tw:space-y-1 tw:list-none tw:ps-0 tw:mb-0">
                            {profile.web_structured_summary.transactional_experience?.notable_deals?.slice(0, 3).map((deal, index) => (
                              <li key={index} className="tw:text-sm tw:flex tw:items-start tw:gap-2" style={{ color: '#cbd5e1' }}>
                                <span className="tw:mt-1" style={{ color: '#64748b' }}>&#8226;</span>
                                <span>{deal}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
                {profile.web_structured_summary?.professional_recognition && (
                  <div>
                    <h5 className="tw:font-medium tw:text-white tw:mb-2 tw:text-sm">Professional Recognition</h5>
                    <div className="tw:space-y-1 tw:text-sm">
                      {profile.web_structured_summary.professional_recognition?.legal500_ranking && (
                        <p className="tw:mb-1" style={{ color: '#cbd5e1' }}>
                          <span style={{ color: '#64748b' }}>Legal 500: </span>
                          {profile.web_structured_summary.professional_recognition.legal500_ranking}
                        </p>
                      )}
                      {profile.web_structured_summary.professional_recognition?.chambers_ranking && (
                        <p className="tw:mb-0" style={{ color: '#cbd5e1' }}>
                          <span style={{ color: '#64748b' }}>Chambers: </span>
                          {profile.web_structured_summary.professional_recognition.chambers_ranking}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {profile.web_structured_summary?.education && profile.web_structured_summary.education.length > 0 && (
                  <div>
                    <h5 className="tw:font-medium tw:text-white tw:mb-2 tw:text-sm">Education</h5>
                    <ul className="tw:space-y-1 tw:list-none tw:ps-0 tw:mb-0">
                      {profile.web_structured_summary.education.map((edu, index) => (
                        <li key={index} className="tw:text-sm" style={{ color: '#cbd5e1' }}>{edu}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {profile.web_structured_summary?.career_highlights && profile.web_structured_summary.career_highlights.length > 0 && (
                  <div>
                    <h5 className="tw:font-medium tw:text-white tw:mb-2 tw:text-sm">Career Highlights</h5>
                    <ul className="tw:space-y-1 tw:list-none tw:ps-0 tw:mb-0">
                      {profile.web_structured_summary.career_highlights.map((highlight, index) => (
                        <li key={index} className="tw:text-sm tw:flex tw:items-start tw:gap-2" style={{ color: '#cbd5e1' }}>
                          <span className="tw:mt-1" style={{ color: '#64748b' }}>&#8226;</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
