import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, FolderOpen, CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react';
import {
  Modal, ModalHeader, ModalBody, ModalFooter, Button,
} from 'reactstrap';
import BrandButton from '../../../../components/buttons/BrandButton.jsx';

function formatEta(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export default function ResumeProcessingModal({
  isOpen, status, progress, folderName, jobId, onCancel, onContinue, onClose,
}) {
  const total = progress?.total ?? 0;
  const completed = progress?.completed ?? 0;
  const failed = progress?.failed ?? 0;
  const currentFile = progress?.current_file;
  const etaSeconds = progress?.eta_seconds ?? 0;
  const isProcessing = status === 'processing';
  const isComplete = status === 'completed';
  const isFailed = status === 'failed';
  const isCancelled = status === 'cancelled';
  const isDone = isComplete || isFailed || isCancelled;

  // The job (see resume-processing-controller.jsx) runs two real backend
  // phases: (1) parse each resume — completed/total ticks up on genuine,
  // individually-awaited per-file results, so it's an exact fraction; then
  // (2) one bulk upload + HCM precompute call, which the controller keeps
  // `status: 'processing'` for but exposes no per-item signal for (it's a
  // single request). Verified end-to-end with a real 6-file batch: phase 1
  // finished in ~7s, then completed/total sat at 100% for a further ~22s
  // while phase 2 ran — that gap is what was showing as "frozen at 99%".
  //
  // Fix: give each phase its own slice of the bar instead of letting phase 1
  // exhaust the whole 1-99 range and leaving phase 2 nothing to crawl
  // through. Phase 1 fills 1-85% off the real completed/total ratio. Phase 2
  // has no real progress signal, so 85-99% is paced by elapsed time against
  // an estimate that scales with batch size (bigger batches → more
  // embedding/scoring work); it's a clearly-bounded "finishing up" crawl,
  // never a claim of precision, and never reaches 100 on its own. The bar
  // only ever hits 100% the instant the backend actually reports 'completed'.
  const PARSE_BAND_END = 85;
  const CEILING = 99;

  const inIndexPhase = total > 0 && completed >= total && !isComplete;

  const phase2StartRef = useRef(null);
  useEffect(() => {
    if (inIndexPhase && phase2StartRef.current == null) phase2StartRef.current = Date.now();
    if (!inIndexPhase) phase2StartRef.current = null;
  }, [inIndexPhase]);

  const parseTargetRef = useRef(1);
  useEffect(() => {
    if (!inIndexPhase) {
      parseTargetRef.current = total > 0 ? 1 + Math.min(1, completed / total) * (PARSE_BAND_END - 1) : 1;
    }
  }, [completed, total, inIndexPhase]);

  const [displayPct, setDisplayPct] = useState(1);
  const displayPctRef = useRef(1);

  useEffect(() => {
    displayPctRef.current = 1;
    parseTargetRef.current = 1;
    phase2StartRef.current = null;
    setDisplayPct(1);
  }, [jobId]);

  useEffect(() => {
    if (isComplete) {
      displayPctRef.current = 100;
      setDisplayPct(100);
      return undefined;
    }
    const id = setInterval(() => {
      let target = parseTargetRef.current;
      if (phase2StartRef.current != null) {
        const elapsedSec = (Date.now() - phase2StartRef.current) / 1000;
        // Fixed overhead (upload request + precompute kickoff) plus a per-profile
        // component — calibrated against two real 6-file runs (~20s and ~27s).
        // Deliberately paced to undershoot: reaching the ceiling early means
        // sitting at 99% waiting, reaching it late just means a bigger (but
        // still instant) final jump to 100% — the latter is the safe side.
        const estimatedDurationSec = Math.max(10, 10 + total * 3);
        const rate = (CEILING - PARSE_BAND_END) / estimatedDurationSec;
        target = Math.min(CEILING, PARSE_BAND_END + elapsedSec * rate);
      }
      const current = displayPctRef.current;
      if (current >= target) return;
      // Capped catch-up step so a real per-file jump (parse completions can
      // arrive in big whole-file increments) glides into view over roughly a
      // second instead of teleporting.
      const next = Math.min(target, current + Math.max(0.3, (target - current) * 0.25));
      displayPctRef.current = next;
      setDisplayPct(next);
    }, 100);
    return () => clearInterval(id);
  }, [isComplete, jobId]);

  const pct = Math.round(displayPct);

  return (
    <Modal
      isOpen={isOpen}
      toggle={isProcessing ? undefined : onClose}
      centered
      contentClassName="tw:bg-gray-800 tw:border tw:border-gray-700 tw:text-white"
      style={{ maxWidth: 480 }}
    >
      <div style={{
        height: 3, width: '100%',
        background: 'linear-gradient(90deg, #9ACA3C, #B3D335, #818cf8)',
        borderRadius: '8px 8px 0 0',
      }} />
      <ModalHeader className="tw:border-gray-700" style={{ paddingBottom: 12 }}>
        <div className="tw:flex tw:items-center tw:gap-3">
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: isComplete
              ? 'linear-gradient(135deg, rgba(179,211,53,0.2), rgba(179,211,53,0.08))'
              : 'linear-gradient(135deg, rgba(154,202,60,0.2), rgba(154,202,60,0.08))',
            border: `1px solid ${isComplete ? 'rgba(179,211,53,0.3)' : 'rgba(154,202,60,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isComplete ? (
              <CheckCircle2 style={{ width: 18, height: 18, color: '#B3D335' }} />
            ) : (
              <FolderOpen style={{ width: 18, height: 18, color: '#9ACA3C' }} />
            )}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>
              {isComplete ? 'Resume Processing Completed' : isFailed ? 'Processing Failed' : isCancelled ? 'Processing Cancelled' : 'Processing Resumes...'}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>
              {folderName ? `Folder: ${folderName}` : 'Bulk resume ingestion'}
            </div>
          </div>
        </div>
      </ModalHeader>

      <ModalBody style={{ paddingTop: 16, paddingBottom: 8 }}>
        {/* Processing state */}
        {isProcessing && (
          <div className="tw:flex tw:flex-col tw:gap-5 tw:py-2">
            {/* Status row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  Converting resumes to structured profiles
                </div>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <FileText style={{ width: 13, height: 13, color: '#6b7280', flexShrink: 0 }} />
                  <motion.div
                    key={currentFile || 'idle'}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      color: '#9ca3af', fontSize: 13,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {currentFile || 'Starting...'}
                  </motion.div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                <div style={{ color: '#B3D335', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
                  {pct}%
                </div>
                <div style={{ color: '#4b5563', fontSize: 11, marginTop: 2 }}>
                  ETA {formatEta(etaSeconds)}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%' }}>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.05, ease: 'linear' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #9ACA3C, #B3D335)', borderRadius: 4 }}
                />
              </div>
            </div>

            {/* Stat chips */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Completed', value: `${completed} / ${total}`, color: '#B3D335' },
                { label: 'Failed', value: failed, color: failed > 0 ? '#f59e0b' : '#e2e8f0' },
                { label: 'Remaining', value: Math.max(0, total - completed - failed), color: '#e2e8f0' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ color: '#4b5563', fontSize: 12 }}>
              Do not close this window. Search stays locked until processing completes.
            </div>
          </div>
        )}

        {/* Success state */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="tw:flex tw:flex-col tw:gap-3"
          >
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '14px 16px', borderRadius: 12,
              background: 'rgba(179,211,53,0.08)',
              border: '1px solid rgba(179,211,53,0.25)',
            }}>
              <CheckCircle2 style={{ width: 20, height: 20, color: '#B3D335', flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                <strong style={{ color: '#B3D335' }}>All resumes processed successfully.</strong>
                {' '}Search controls are now unlocked.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Total Resumes', value: total },
                { label: 'JSON Generated', value: completed - failed },
                { label: 'Failed', value: failed },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>{value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Failed / cancelled state */}
        {(isFailed || isCancelled) && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '14px 16px', borderRadius: 12,
              background: isCancelled ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${isCancelled ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
              {isCancelled ? (
                <XCircle style={{ width: 20, height: 20, color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
              ) : (
                <AlertTriangle style={{ width: 20, height: 20, color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
              )}
              <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                <strong style={{ color: isCancelled ? '#f59e0b' : '#ef4444' }}>
                  {isCancelled ? 'Processing was cancelled.' : 'Resume processing failed.'}
                </strong>
                {' '}{completed} of {total} resumes were processed before stopping.
              </div>
            </div>
          </motion.div>
        )}
      </ModalBody>

      <ModalFooter className="tw:border-gray-700" style={{ paddingTop: 16, paddingBottom: 16 }}>
        {isProcessing && onCancel && (
          <Button
            color="secondary"
            onClick={onCancel}
            style={{ borderRadius: 10, padding: '8px 20px', fontWeight: 500 }}
          >
            Cancel
          </Button>
        )}
        {isDone && !isComplete && (
          <Button
            color="secondary"
            onClick={onClose}
            style={{ borderRadius: 10, padding: '8px 20px', fontWeight: 500 }}
          >
            Close
          </Button>
        )}
        {isComplete && (
          <BrandButton onClick={onContinue} compact>
            <CheckCircle2 style={{ width: 15, height: 15 }} />
            Continue
          </BrandButton>
        )}
      </ModalFooter>
    </Modal>
  );
}
