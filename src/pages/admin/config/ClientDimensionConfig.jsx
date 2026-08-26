'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Loader2,
  Download, Upload, Settings2, RefreshCw, Sliders, XCircle,
  ChevronRight, Zap,
} from 'lucide-react';
import BrandButton from '../../../components/buttons/BrandButton.jsx';
import ClientsController from '../../../api/admin/clients-controller.jsx';
import DimensionConfigController from '../../../api/admin/dimension-config-controller.jsx';
import ConfigPageHeader from '../components/ConfigPageHeader.jsx';
import StatusBanner from '../components/StatusBanner.jsx';
import SuccessToast from '../components/SuccessToast.jsx';
import SectionCard from '../components/SectionCard.jsx';
// ─── helpers ────────────────────────────────────────────────────────────────

const SYNC_META = {
  pending:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)', icon: AlertTriangle, label: 'Pending Setup',           desc: 'No dimension config active. Download the template, fill it in, and upload to get started.' },
  out_of_sync: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)', icon: AlertTriangle, label: 'Re-Embedding Required',    desc: 'Dimension structure changed. Click Re-Embed to update profile embeddings.' },
  in_sync:     { color: '#34d399', bg: 'rgba(52,211,153,0.06)',  border: 'rgba(52,211,153,0.2)',  icon: CheckCircle2,  label: 'In Sync',                  desc: 'Embeddings are up-to-date with the active dimension config.' },
  embedding:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.06)',  border: 'rgba(96,165,250,0.2)',  icon: Loader2,       label: 'Embedding…',           desc: 'Re-embedding is running. Search continues on existing embeddings.' },
  failed:      { color: '#ef4444', bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.2)',   icon: XCircle,       label: 'Failed',                   desc: 'Re-embedding failed. Fix the issue and try again.' },
};

function DimensionCard({ label, pct, color, textSource, description, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 * index, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', display: 'block', lineHeight: 1.3 }}>
            {label}
          </span>
          {textSource && (
            <span
              title="Profile field this dimension is embedded/scored from — assigned by AI from the label/description."
              style={{
                display: 'inline-block', marginTop: 5,
                color: '#94a3b8', fontSize: 10, fontWeight: 600, letterSpacing: 0.3,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 5, padding: '2px 7px',
              }}
            >
              {textSource}
            </span>
          )}
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, color, flexShrink: 0, lineHeight: 1 }}>
          {pct}%
        </span>
      </div>

      {description && (
        <p style={{
          color: '#6b7280', fontSize: 11, margin: 0, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {description}
        </p>
      )}

      <div style={{ height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 2 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '100%', borderRadius: 3, background: color }}
        />
      </div>
    </motion.div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export default function ClientDimensionConfig() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef();

  const [uploadResult, setUploadResult] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [reembedConfirm, setReembedConfirm] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  // ─── queries ──────────────────────────────────────────────────────────────

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => ClientsController.getClient(Number(clientId)),
  });

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['dimConfig', clientId],
    queryFn: () => DimensionConfigController.getConfig(Number(clientId)),
  });

  const { data: jobStatus } = useQuery({
    queryKey: ['dimReembedStatus', clientId],
    queryFn: () => DimensionConfigController.getReembedStatus(Number(clientId)),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'running' || status === 'queued' ? 3000 : false;
    },
  });

  // ─── mutations ────────────────────────────────────────────────────────────

  const activateMutation = useMutation({
    mutationFn: (dimensions) => DimensionConfigController.activateConfig(Number(clientId), dimensions, client?.industry_id),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['dimConfig', clientId] });
      qc.refetchQueries({ queryKey: ['dimReembedStatus', clientId] });
      qc.refetchQueries({ queryKey: ['clients'] });
      setUploadResult(null);
      setUploadFile(null);
      setSuccessMsg('Config activated successfully.');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file }) => DimensionConfigController.uploadAndValidate(Number(clientId), file),
    onSuccess: (data) => {
      setUploadResult(data);
      setSuccessMsg(null);
      if (data.valid) {
        activateMutation.mutate(data.dimensions);
      }
    },
  });

  const reembedMutation = useMutation({
    mutationFn: () => DimensionConfigController.triggerReembed(Number(clientId), client?.industry_id),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['dimReembedStatus', clientId] });
      qc.refetchQueries({ queryKey: ['dimConfig', clientId] });
      setReembedConfirm(false);
    },
  });

  // When job finishes, refresh config so syncStatus leaves 'embedding'
  const jobStatusValue = jobStatus?.status;
  useEffect(() => {
    if (jobStatusValue === 'completed' || jobStatusValue === 'failed') {
      qc.refetchQueries({ queryKey: ['dimConfig', clientId] });
    }
  }, [jobStatusValue, clientId, qc]);

  // ─── handlers ─────────────────────────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    setDownloadLoading(true);
    setDownloadError(null);
    try {
      const blob = await DimensionConfigController.downloadTemplate(Number(clientId));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dimension_config_client_${clientId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err.message ?? 'Download failed. Check server logs.');
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

  // ─── derived ──────────────────────────────────────────────────────────────

  const syncStatus = config?.embedding_sync_status ?? 'pending';
  const syncMeta = SYNC_META[syncStatus] ?? SYNC_META.pending;
  const isEmbedding = syncStatus === 'embedding' || jobStatus?.status === 'running' || jobStatus?.status === 'queued';
  const showReembedBanner = config?.is_active === true && syncStatus === 'out_of_sync';
  const jobPct = jobStatus?.progress ?? 0;
  const activeDimensions = config?.is_active ? (config.dimensions ?? []) : [];

  // ─── render ───────────────────────────────────────────────────────────────

  if (configLoading) {
    return (
      <div className="tw:flex tw:items-center tw:justify-center tw:py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Settings2 style={{ width: 32, height: 32, color: '#34d399' }} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="tw:relative tw:overflow-hidden">
      {/* Ambient glow */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -80, right: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.05), transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.04), transparent 70%)' }} />
      </div>

      <div className="tw:relative tw:z-10 tw:flex tw:flex-col tw:gap-8">

        {/* ── Header ── */}
        <ConfigPageHeader
          icon={Sliders}
          iconColor="#34d399"
          iconBg="linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.1))"
          iconBorder="rgba(52,211,153,0.2)"
          title="Relevance Dimensions"
          subtitle={`${client?.client_name ?? `Client ${clientId}`} — scoring configuration`}
          backLabel="Back to Clients"
          onBack={() => navigate('/admin/clients-management')}
        />

        {/* ── Status banner ── */}
        <StatusBanner
          color={syncMeta.color}
          bg={syncMeta.bg}
          border={syncMeta.border}
          icon={syncMeta.icon}
          iconSpin={syncStatus === 'embedding'}
          label={syncMeta.label}
          desc={syncMeta.desc}
        >
          {isEmbedding && (
            <div style={{ marginTop: 8 }}>
              <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${jobPct}%` }}
                  transition={{ duration: 0.5 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #60a5fa, #34d399)', borderRadius: 4 }}
                />
              </div>
              <span style={{ color: '#6b7280', fontSize: 11, marginTop: 4, display: 'block' }}>{jobPct.toFixed(0)}% complete</span>
            </div>
          )}
        </StatusBanner>

        {/* ── Success alert ── */}
        <SuccessToast message={successMsg} onDismiss={() => setSuccessMsg(null)} />

        {/* ── Active dimensions ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>Active Dimensions</h3>

          {activeDimensions.length === 0 ? (
            <div style={{ borderRadius: 12, padding: '20px 16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', textAlign: 'center' }}>
              <p style={{ color: '#4b5563', fontSize: 13, margin: 0 }}>
                No configuration active. Download the template, fill in your dimensions, and upload to activate.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
              {activeDimensions.map((dim, i) => (
                <DimensionCard
                  key={dim.key ?? i}
                  label={dim.label}
                  pct={Math.round((dim.default_weight ?? 0) * 100)}
                  color="#34d399"
                  textSource={dim.text_source}
                  description={dim.description}
                  index={i}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Update config ── */}
        <SectionCard delay={0.2}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>Update Configuration</h3>
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
            Download the template, edit dimensions and weights in Excel, then upload — configuration activates automatically on successful validation.
          </p>

          {/* Step 1: Download */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#6b7280', minWidth: 80 }}>
              <span style={{ color: '#34d399', fontWeight: 700 }}>1.</span> Download
            </span>
            <BrandButton compact onClick={handleDownload} disabled={downloadLoading}>
              {downloadLoading
                ? <Loader2 style={{ width: 14, height: 14 }} className="tw:animate-spin" />
                : <Download style={{ width: 14, height: 14 }} />}
              {downloadLoading ? 'Generating…' : 'Download Template'}
            </BrandButton>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#6b7280', minWidth: 80 }}>
              <span style={{ color: '#34d399', fontWeight: 700 }}>2.</span> Upload
            </span>
            <input ref={fileRef} type="file" accept=".xlsx,.xlsm" style={{ display: 'none' }} onChange={handleFileChange} />
            <BrandButton compact onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending
                ? <Loader2 style={{ width: 14, height: 14 }} className="tw:animate-spin" />
                : <Upload style={{ width: 14, height: 14 }} />}
              {uploadFile ? uploadFile.name : 'Upload Excel'}
            </BrandButton>
            {uploadMutation.isPending && <span style={{ fontSize: 12, color: '#6b7280' }}>Validating…</span>}
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
                  <div style={{ borderRadius: 10, padding: '10px 14px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <CheckCircle2 style={{ width: 15, height: 15, color: '#34d399' }} />
                      <span style={{ color: '#34d399', fontWeight: 600, fontSize: 13 }}>
                        Valid — {uploadResult.dimension_count} dimension{uploadResult.dimension_count !== 1 ? 's' : ''} parsed
                      </span>
                    </div>
                    <div className="tw:flex tw:flex-col tw:gap-1">
                      {(uploadResult.dimensions ?? []).map((d, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ChevronRight style={{ width: 11, height: 11, color: '#34d399' }} />
                          <strong style={{ color: '#e2e8f0' }}>{d.label}</strong>
                          <span>— {Math.round((d.default_weight ?? 0) * 100)}%</span>
                          {d.text_source && (
                            <span title="AI-assigned data source for this dimension. Review before activating." style={{ color: '#60a5fa', fontSize: 10 }}>
                              (scored from: {d.text_source})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ borderRadius: 10, padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <XCircle style={{ width: 15, height: 15, color: '#ef4444' }} />
                      <span style={{ color: '#ef4444', fontWeight: 600, fontSize: 13 }}>Validation failed</span>
                    </div>
                    {(uploadResult.errors ?? []).map((err, i) => (
                      <p key={i} style={{ fontSize: 12, color: '#fca5a5', margin: '2px 0 0' }}>{err}</p>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auto-activation status */}
          {uploadResult?.valid && activateMutation.isPending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 style={{ width: 14, height: 14, color: '#34d399' }} className="tw:animate-spin" />
              <span style={{ fontSize: 13, color: '#6b7280' }}>Activating configuration…</span>
            </div>
          )}
          {uploadResult?.valid && activateMutation.isError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#ef4444' }}>
                {activateMutation.error?.message ?? 'Activation failed'}
              </span>
              <BrandButton
                compact
                onClick={() => activateMutation.mutate(uploadResult.dimensions)}
              >
                <Zap style={{ width: 14, height: 14 }} />
                Retry Activate
              </BrandButton>
            </div>
          )}
        </SectionCard>

        {/* ── Re-embed section ── */}
        {showReembedBanner && (
          <SectionCard delay={0.25} accent="#f59e0b">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <RefreshCw style={{ width: 18, height: 18, color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fbbf24', marginBottom: 4 }}>Re-Embed Profiles</h3>
                <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 12 }}>
                  Profile embeddings are out of sync with the active dimension config.
                  Re-embedding updates semantic search accuracy. Search remains functional on old embeddings while the job runs.
                </p>

                {!reembedConfirm ? (
                  <BrandButton compact onClick={() => setReembedConfirm(true)} disabled={!client?.industry_id}>
                    <RefreshCw style={{ width: 14, height: 14 }} />
                    Re-Embed Profiles
                  </BrandButton>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#fbbf24' }}>
                      This will re-embed all profiles for this client. Continue?
                    </span>
                    <BrandButton
                      compact
                      onClick={() => reembedMutation.mutate()}
                      disabled={reembedMutation.isPending}
                    >
                      {reembedMutation.isPending
                        ? <Loader2 style={{ width: 14, height: 14 }} className="tw:animate-spin" />
                        : <Zap style={{ width: 14, height: 14 }} />}
                      Confirm
                    </BrandButton>
                    <button
                      onClick={() => setReembedConfirm(false)}
                      style={{ fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Cancel
                    </button>
                    {reembedMutation.isError && (
                      <span style={{ fontSize: 12, color: '#ef4444' }}>
                        {reembedMutation.error?.message ?? 'Failed to start job'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        )}

      </div>
    </div>
  );
}
