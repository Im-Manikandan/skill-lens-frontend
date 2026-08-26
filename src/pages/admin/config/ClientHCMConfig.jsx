'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Loader2,
  Download, Upload, Brain, XCircle, ChevronRight, Zap,
  ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import ClientsController from '../../../api/admin/clients-controller.jsx';
import HCMConfigController from '../../../api/admin/hcm-config-controller.jsx';
import BrandButton from '../../../components/buttons/BrandButton.jsx';
import ConfigPageHeader from '../components/ConfigPageHeader.jsx';
import StatusBanner from '../components/StatusBanner.jsx';
import SuccessToast from '../components/SuccessToast.jsx';
import SectionCard from '../components/SectionCard.jsx';
import WeightBarCard from '../components/WeightBarCard.jsx';
import MarketValueConfigCard from './MarketValueConfigCard.jsx';
import { HCM_DIMENSIONS } from '../../../constants/hcmDimensions.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

const DIM_COLORS = [
  '#34d399', '#60a5fa', '#a78bfa', '#f472b6',
  '#fb923c', '#facc15', '#4ade80', '#38bdf8',
];

/** Parse "[Tab 'X' → Row Y, Column Z] message" into { tab, location, message } */
function parseError(errStr) {
  const m = errStr.match(/^\[Tab '([^']+)'(?: → ([^\]]+))?\]\s*(.*)/s);
  if (m) return { tab: m[1], location: m[2] ?? '', message: m[3] };
  return { tab: null, location: '', message: errStr };
}

/** Group error strings by tab name. Ungrouped errors go under key "__general__". */
function groupErrors(errors) {
  const groups = {};
  for (const err of errors) {
    const { tab, location, message } = parseError(err);
    const key = tab ?? '__general__';
    if (!groups[key]) groups[key] = [];
    groups[key].push({ location, message });
  }
  return groups;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function ErrorPanel({ errors }) {
  const [expanded, setExpanded] = useState({});
  const groups = groupErrors(errors);
  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(239,68,68,0.25)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.1)' }}>
        <XCircle style={{ width: 15, height: 15, color: '#ef4444', flexShrink: 0 }} />
        <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 13 }}>
          Validation failed — {errors.length} error{errors.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {Object.entries(groups).map(([tabKey, items]) => {
        const isOpen = expanded[tabKey] !== false;
        const displayTab = tabKey === '__general__' ? 'General' : tabKey;
        return (
          <div key={tabKey} style={{ borderTop: '1px solid rgba(239,68,68,0.12)' }}>
            <button
              onClick={() => toggle(tabKey)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', background: 'rgba(239,68,68,0.05)',
                border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              {isOpen
                ? <ChevronUp   style={{ width: 13, height: 13, color: '#ef4444', flexShrink: 0 }} />
                : <ChevronDown style={{ width: 13, height: 13, color: '#ef4444', flexShrink: 0 }} />}
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5' }}>
                {tabKey === '__general__' ? 'General' : `Tab: ${displayTab}`}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#ef4444', background: 'rgba(239,68,68,0.15)', borderRadius: 4, padding: '1px 6px' }}>
                {items.length} error{items.length !== 1 ? 's' : ''}
              </span>
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  {items.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', gap: 8, padding: '6px 14px 6px 30px',
                      borderTop: '1px solid rgba(239,68,68,0.06)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(239,68,68,0.02)',
                    }}>
                      <div style={{ flexShrink: 0, marginTop: 2 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', marginTop: 4 }} />
                      </div>
                      <div>
                        {item.location && (
                          <span style={{
                            fontSize: 10, fontWeight: 600, color: '#f87171',
                            background: 'rgba(239,68,68,0.15)', borderRadius: 4,
                            padding: '1px 5px', marginRight: 6, display: 'inline-block', marginBottom: 2,
                          }}>
                            {item.location}
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.5 }}>{item.message}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
        borderTop: '1px solid rgba(239,68,68,0.12)',
        background: 'rgba(239,68,68,0.04)',
      }}>
        <Info style={{ width: 12, height: 12, color: '#6b7280', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: '#6b7280' }}>
          Open the Excel file, go to the tab shown above, and fix the highlighted rows. Then re-upload.
        </span>
      </div>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function ClientHCMConfig() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef();

  const [uploadResult, setUploadResult] = useState(null);
  const [uploadFile, setUploadFile]     = useState(null);
  const [successMsg, setSuccessMsg]     = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError]     = useState(null);

  // ─── queries ─────────────────────────────────────────────────────────────

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => ClientsController.getClient(Number(clientId)),
  });

  const { data: config, isLoading: configLoading, isError: configError } = useQuery({
    queryKey: ['hcmConfig', clientId],
    queryFn: () => HCMConfigController.getConfig(Number(clientId)),
  });

  // ─── mutations ───────────────────────────────────────────────────────────

  const uploadMutation = useMutation({
    mutationFn: ({ file }) => HCMConfigController.uploadAndValidate(Number(clientId), file),
    onSuccess: (data) => { setUploadResult(data); setSuccessMsg(null); },
  });

  const activateMutation = useMutation({
    mutationFn: (parsedConfig) => HCMConfigController.activateConfig(Number(clientId), parsedConfig),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['hcmConfig', clientId] });
      setUploadResult(null);
      setUploadFile(null);
      setSuccessMsg('HCM configuration activated successfully.');
    },
  });

  // ─── handlers ────────────────────────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    setDownloadLoading(true);
    setDownloadError(null);
    try {
      const blob = await HCMConfigController.downloadTemplate(Number(clientId));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hcm_config_client_${clientId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err.message ?? 'Download failed.');
    } finally {
      setDownloadLoading(false);
    }
  }, [clientId]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadResult(null);
    setSuccessMsg(null);
    uploadMutation.mutate({ file });
    e.target.value = '';
  };

  // ─── derived ─────────────────────────────────────────────────────────────

  const isDefault  = configError || !config || config?.is_default === true;
  const dimWeights = config?.config?.dimension_weights ?? {};

  // ─── render ──────────────────────────────────────────────────────────────

  if (configLoading) {
    return (
      <div className="tw:flex tw:items-center tw:justify-center tw:py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Brain style={{ width: 32, height: 32, color: '#f472b6' }} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="tw:relative tw:overflow-hidden">
      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -80, right: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.05), transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.04), transparent 70%)' }} />
      </div>

      <div className="tw:relative tw:z-10 tw:flex tw:flex-col tw:gap-8">

        {/* ── Header ── */}
        <ConfigPageHeader
          icon={Brain}
          iconColor="#f472b6"
          iconBg="linear-gradient(135deg, rgba(244,114,182,0.2), rgba(236,72,153,0.1))"
          iconBorder="rgba(244,114,182,0.2)"
          title="HCM Score Configuration"
          subtitle={`${client?.client_name ?? `Client ${clientId}`} — keywords, weights, thresholds`}
          backLabel="Back to Clients"
          onBack={() => navigate('/admin/clients-management')}
        />

        {/* ── Status banner ── */}
        {isDefault ? (
          <StatusBanner
            color="#f59e0b"
            bg="rgba(245,158,11,0.08)"
            border="rgba(245,158,11,0.25)"
            icon={AlertTriangle}
            label="Using system defaults"
            desc="No custom HCM config active. Default law-domain keywords and weights apply. Download the template, customise for your industry, and upload to configure."
          />
        ) : (
          <StatusBanner
            color="#34d399"
            bg="rgba(52,211,153,0.06)"
            border="rgba(52,211,153,0.2)"
            icon={CheckCircle2}
            label="Custom HCM configuration active"
            desc={`Version ${config?.version ?? 1} · Last updated by ${config?.created_by ?? 'admin'}${config?.updated_at ? ` · ${new Date(config.updated_at).toLocaleDateString()}` : ''}`}
          />
        )}

        {/* ── Success alert ── */}
        <SuccessToast message={successMsg} onDismiss={() => setSuccessMsg(null)} />

        {/* ── Active dim weights preview ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>
            Dimension Weights {isDefault && <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>(defaults)</span>}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
            {HCM_DIMENSIONS.map(({ key, label }, i) => (
              <WeightBarCard
                key={key}
                label={label}
                pct={dimWeights[key] ?? 12.5}
                color={DIM_COLORS[i % DIM_COLORS.length]}
                index={i}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Upload section: HCM (left) + Market Value (right), same row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
          <SectionCard delay={0.2}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
            Update HCM Configuration
          </h3>
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
            Download the template, fill in keywords and weights for your industry, validate in Excel
            (Validation Dashboard tab), then upload here.
          </p>

          {/* Step 1: Download */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#6b7280', minWidth: 80 }}>
              <span style={{ color: '#f472b6', fontWeight: 700 }}>1.</span> Download
            </span>
            <BrandButton compact onClick={handleDownload} disabled={downloadLoading}>
              {downloadLoading
                ? <Loader2 style={{ width: 14, height: 14 }} className="tw:animate-spin" />
                : <Download style={{ width: 14, height: 14 }} />}
              {downloadLoading ? 'Generating…' : 'Download Template'}
            </BrandButton>
            <span style={{ fontSize: 11, color: '#4b5563' }}>
              Pre-filled with {isDefault ? 'law-domain defaults' : 'your current config'}
            </span>
          </div>

          <AnimatePresence>
            {downloadError && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ borderRadius: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle style={{ width: 14, height: 14, color: '#ef4444', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#fca5a5' }}>{downloadError}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 2: Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#6b7280', minWidth: 80 }}>
              <span style={{ color: '#f472b6', fontWeight: 700 }}>2.</span> Upload
            </span>
            <input ref={fileRef} type="file" accept=".xlsx,.xlsm" style={{ display: 'none' }} onChange={handleFileChange} />
            <BrandButton compact onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending
                ? <Loader2 style={{ width: 14, height: 14 }} className="tw:animate-spin" />
                : <Upload style={{ width: 14, height: 14 }} />}
              {uploadFile ? uploadFile.name : 'Upload Filled Template'}
            </BrandButton>
            {uploadMutation.isPending && (
              <span style={{ fontSize: 12, color: '#6b7280' }}>Validating all tabs…</span>
            )}
          </div>

          {/* Validation result */}
          <AnimatePresence>
            {uploadResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginBottom: 16, overflow: 'hidden' }}
              >
                {uploadResult.valid ? (
                  <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(52,211,153,0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(52,211,153,0.08)' }}>
                      <CheckCircle2 style={{ width: 15, height: 15, color: '#34d399', flexShrink: 0 }} />
                      <span style={{ color: '#34d399', fontWeight: 600, fontSize: 13 }}>
                        All validations passed — configuration ready to activate
                      </span>
                    </div>
                    <div style={{ padding: '10px 14px' }}>
                      <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Parsed dimension weights:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {HCM_DIMENSIONS.map(({ key, label }, i) => {
                          const w = uploadResult.config?.dimension_weights?.[key] ?? 12.5;
                          return (
                            <div key={key} style={{
                              fontSize: 11, padding: '3px 8px', borderRadius: 6,
                              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                              <span style={{ color: DIM_COLORS[i % DIM_COLORS.length], fontWeight: 700 }}>{w}%</span>
                              <span style={{ color: '#9ca3af' }}>{label}</span>
                            </div>
                          );
                        })}
                      </div>
                      {(uploadResult.warnings ?? []).length > 0 && (
                        <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
                          {uploadResult.warnings.map((w, i) => (
                            <p key={i} style={{ fontSize: 11, color: '#fbbf24', margin: '1px 0' }}>⚠ {w}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <ErrorPanel errors={uploadResult.errors ?? []} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Activate */}
          {uploadResult?.valid && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
            >
              <span style={{ fontSize: 13, color: '#6b7280', minWidth: 80 }}>
                <span style={{ color: '#f472b6', fontWeight: 700 }}>3.</span> Activate
              </span>
              <BrandButton
                compact
                onClick={() => activateMutation.mutate(uploadResult.config)}
                disabled={activateMutation.isPending}
              >
                {activateMutation.isPending
                  ? <Loader2 style={{ width: 14, height: 14 }} className="tw:animate-spin" />
                  : <Zap style={{ width: 14, height: 14 }} />}
                Activate HCM Config
              </BrandButton>
              <span style={{ fontSize: 11, color: '#4b5563' }}>
                Replaces existing config immediately. HCM scores will update on next calculation.
              </span>
              {activateMutation.isError && (
                <span style={{ fontSize: 12, color: '#ef4444' }}>
                  {activateMutation.error?.message ?? 'Activation failed'}
                </span>
              )}
            </motion.div>
          )}
          </SectionCard>

          <MarketValueConfigCard clientId={clientId} delay={0.2} />
        </div>

        {/* ── What this controls ── */}
        <SectionCard delay={0.25}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 10 }}>
            What the Excel template lets you configure
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 8 }}>
            {[
              ['Dimension Weights tab',  'How much each of the 8 dimensions counts toward the final HCM score'],
              ['Sub-metric Weights tab', 'Within each dimension, how each of the 4 sub-metrics is weighted'],
              ['KW_* tabs (8 tabs)',      'Industry-specific keywords that signal each sub-metric (replace law terms with your domain)'],
              ['Seniority Map tab',       'Map your industry\'s job titles to years-of-experience estimates'],
              ['Education Tiers tab',     'Which degree types earn which scores (e.g. MBA=85, PhD=100)'],
              ['Count Thresholds tab',    'How many cases/publications/affiliations equal 100%, 80%, etc.'],
            ].map(([label, desc]) => (
              <div key={label} style={{ display: 'flex', gap: 8 }}>
                <ChevronRight style={{ width: 13, height: 13, color: '#f472b6', flexShrink: 0, marginTop: 3 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>
    </div>
  );
}
