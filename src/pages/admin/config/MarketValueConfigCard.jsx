'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Loader2, Download, Upload, XCircle,
  Zap, ChevronDown, ChevronUp, Info,
} from 'lucide-react';
import MarketConfigController from '../../../api/admin/market-config-controller.jsx';
import BrandButton from '../../../components/buttons/BrandButton.jsx';
import SectionCard from '../components/SectionCard.jsx';

// ─── helpers ─────────────────────────────────────────────────────────────────
// Mirrors ClientHCMConfig.jsx's error-panel helpers, duplicated here so this
// card stays self-contained and the existing HCM component is left untouched.
// Market Value's parser (app/services/market_config_service.py) uses a plain
// "->" separator inside "[Tab 'X' -> Row Y]" instead of HCM's unicode "→", so
// the regex below matches Market's exact format.

function parseError(errStr) {
  const m = errStr.match(/^\[Tab '([^']+)'(?:\s*->\s*([^\]]+))?\]\s*(.*)/s);
  if (m) return { tab: m[1], location: m[2] ?? '', message: m[3] };
  return { tab: null, location: '', message: errStr };
}

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

const TIER_COLORS = ['#38bdf8', '#4ade80', '#facc15', '#fb923c', '#a78bfa', '#f472b6', '#2dd4bf', '#f87171'];

function tierLabel(tier) {
  return tier.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatInr(n) {
  if (n == null) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

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

// ─── main card ───────────────────────────────────────────────────────────────
// Renders as a single SectionCard — same border/padding/typography as the
// "Update HCM Configuration" card next to it — so the two sit as equal
// columns inside one shared grid, not as separate page sections.

export default function MarketValueConfigCard({ clientId, delay = 0.2 }) {
  const qc = useQueryClient();
  const fileRef = useRef();

  const [uploadResult, setUploadResult] = useState(null);
  const [uploadFile, setUploadFile]     = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError]     = useState(null);

  const { data: config, isError: configError } = useQuery({
    queryKey: ['marketConfig', clientId],
    queryFn: () => MarketConfigController.getConfig(Number(clientId)),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file }) => MarketConfigController.uploadAndValidate(Number(clientId), file),
    onSuccess: (data) => setUploadResult(data),
  });

  const activateMutation = useMutation({
    mutationFn: (parsedConfig) => MarketConfigController.activateConfig(Number(clientId), parsedConfig),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['marketConfig', clientId] });
      setUploadResult(null);
      setUploadFile(null);
    },
  });

  const handleDownload = useCallback(async () => {
    setDownloadLoading(true);
    setDownloadError(null);
    try {
      const blob = await MarketConfigController.downloadTemplate(Number(clientId));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `market_value_config_client_${clientId}.xlsx`;
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
    uploadMutation.mutate({ file });
    e.target.value = '';
  };

  const isDefault = configError || !config || config?.is_default === true;

  return (
    <SectionCard delay={delay}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
        Update Market Value Configuration
      </h3>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
        Download the template, fill in market value settings (pay bands, factors, etc.), then upload here.
      </p>

      {/* Step 1: Download */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#6b7280', minWidth: 80 }}>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>1.</span> Download
        </span>
        <BrandButton compact onClick={handleDownload} disabled={downloadLoading}>
          {downloadLoading
            ? <Loader2 style={{ width: 14, height: 14 }} className="tw:animate-spin" />
            : <Download style={{ width: 14, height: 14 }} />}
          {downloadLoading ? 'Generating…' : 'Download Template'}
        </BrandButton>
        <span style={{ fontSize: 11, color: '#4b5563' }}>
          Pre-filled with {isDefault ? 'default market values' : 'your current config'}
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
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>2.</span> Upload
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
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Parsed pay bands:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(uploadResult.config?.pay_bands ?? {}).map(([tier, band], i) => (
                      <div key={tier} style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 6,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <span style={{ color: TIER_COLORS[i % TIER_COLORS.length], fontWeight: 700 }}>
                          {formatInr(band.min)}–{formatInr(band.max)}
                        </span>
                        <span style={{ color: '#9ca3af' }}>{tierLabel(tier)}</span>
                      </div>
                    ))}
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
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>3.</span> Activate
          </span>
          <BrandButton
            compact
            onClick={() => activateMutation.mutate(uploadResult.config)}
            disabled={activateMutation.isPending}
          >
            {activateMutation.isPending
              ? <Loader2 style={{ width: 14, height: 14 }} className="tw:animate-spin" />
              : <Zap style={{ width: 14, height: 14 }} />}
            Activate Market Value Config
          </BrandButton>
          <span style={{ fontSize: 11, color: '#4b5563' }}>
            Replaces existing config immediately. Market Value will update on next calculation.
          </span>
          {activateMutation.isError && (
            <span style={{ fontSize: 12, color: '#ef4444' }}>
              {activateMutation.error?.message ?? 'Activation failed'}
            </span>
          )}
        </motion.div>
      )}
    </SectionCard>
  );
}
