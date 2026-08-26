import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import {
  Modal, ModalHeader, ModalBody, ModalFooter, Button,
} from 'reactstrap';
import BrandButton from '../../../../components/buttons/BrandButton.jsx';

const PHASE_MESSAGES = {
  initializing: 'Preparing job...',
  loading: 'Loading profiles from database...',
  saving: 'Saving scorecards to database...',
};

function formatElapsed(seconds) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function GenerateHCMModal({ clientName, profileCount, onClose, onConfirm, isLoading, result, error, progress }) {
  const isDone = !!result;
  const hasFailed = !!error;

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isLoading && !isDone) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isLoading, isDone]);

  const phase = progress?.phase ?? 'initializing';
  const pct = progress?.pct ?? 0;
  const processed = progress?.processed ?? 0;
  const total = progress?.total ?? 0;

  const statusMessage = phase === 'scoring' && total > 0
    ? `Scoring profile ${processed} of ${total}`
    : PHASE_MESSAGES[phase] ?? 'Starting...';

  return (
    <Modal
      isOpen
      toggle={isLoading ? undefined : onClose}
      centered
      contentClassName="tw:bg-gray-800 tw:border tw:border-gray-700 tw:text-white"
      style={{ maxWidth: 480 }}
    >
      <div style={{
        height: 3, width: '100%',
        background: 'linear-gradient(90deg, #9ACA3C, #B3D335, #60a5fa)',
        borderRadius: '8px 8px 0 0',
      }} />
      <ModalHeader
        className="tw:border-gray-700"
        style={{ paddingBottom: 12 }}
      >
        <div className="tw:flex tw:items-center tw:gap-3">
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(179,211,53,0.08))',
            border: '1px solid rgba(96,165,250,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BarChart3 style={{ width: 18, height: 18, color: '#60a5fa' }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>Generate HCM Scores</div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>Pre-compute scorecards for all profiles</div>
          </div>
        </div>
      </ModalHeader>

      <ModalBody style={{ paddingTop: 16, paddingBottom: 8 }}>
        {/* Loading state */}
        {isLoading && !isDone && (
          <div className="tw:flex tw:flex-col tw:gap-5 tw:py-4">
            {/* Status row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  Computing HCM scorecards...
                </div>
                <motion.div
                  key={statusMessage}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ color: '#9ca3af', fontSize: 13 }}
                >
                  {statusMessage}
                </motion.div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                {pct >= 15 && (
                  <div style={{ color: '#B3D335', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
                    {Math.round(pct)}%
                  </div>
                )}
                <div style={{ color: '#4b5563', fontSize: 11, marginTop: 2 }}>
                  {formatElapsed(elapsed)}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%' }}>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                {pct >= 15 ? (
                  <motion.div
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, #9ACA3C, #B3D335)', borderRadius: 4 }}
                  />
                ) : (
                  <motion.div
                    animate={{ x: ['-100%', '350%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ height: '100%', width: '40%', background: 'linear-gradient(90deg, transparent, #B3D335, transparent)', borderRadius: 4 }}
                  />
                )}
              </div>
            </div>

            {/* Phase step indicators */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {[
                { key: 'loading', label: 'Load' },
                { key: 'scoring', label: 'Score' },
                { key: 'saving', label: 'Save' },
              ].map(({ key, label }, i) => {
                const phaseOrder = ['initializing', 'loading', 'scoring', 'saving', 'done'];
                const currentIdx = phaseOrder.indexOf(phase);
                const stepIdx = phaseOrder.indexOf(key);
                const isDoneStep = currentIdx > stepIdx;
                const isActive = currentIdx === stepIdx;
                return (
                  <React.Fragment key={key}>
                    {i > 0 && (
                      <div style={{ flex: 1, height: 1, background: isDoneStep ? 'rgba(179,211,53,0.4)' : 'rgba(255,255,255,0.08)' }} />
                    )}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '3px 8px', borderRadius: 20,
                      background: isActive ? 'rgba(179,211,53,0.12)' : isDoneStep ? 'rgba(179,211,53,0.06)' : 'transparent',
                      border: `1px solid ${isActive ? 'rgba(179,211,53,0.35)' : isDoneStep ? 'rgba(179,211,53,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      transition: 'all 0.3s',
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: isActive ? '#B3D335' : isDoneStep ? 'rgba(179,211,53,0.6)' : 'rgba(255,255,255,0.15)',
                      }} />
                      <span style={{ fontSize: 11, color: isActive ? '#B3D335' : isDoneStep ? 'rgba(179,211,53,0.7)' : '#4b5563', fontWeight: isActive ? 600 : 400 }}>
                        {label}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            <div style={{ color: '#4b5563', fontSize: 12 }}>
              Do not close this window.
            </div>
          </div>
        )}

        {/* Success result */}
        {isDone && !hasFailed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="tw:flex tw:flex-col tw:gap-3"
          >
            {result.db_error ? (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '14px 16px', borderRadius: 12,
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.25)',
              }}>
                <AlertTriangle style={{ width: 20, height: 20, color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                  <strong style={{ color: '#f59e0b' }}>Scoring complete — database save failed.</strong>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '14px 16px', borderRadius: 12,
                background: 'rgba(179,211,53,0.08)',
                border: '1px solid rgba(179,211,53,0.25)',
              }}>
                <CheckCircle2 style={{ width: 20, height: 20, color: '#B3D335', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                  <strong style={{ color: '#B3D335' }}>HCM scores generated successfully!</strong>
                </div>
              </div>
            )}

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
            }}>
              {[
                { label: 'Total Profiles', value: result.total_profiles },
                { label: 'Processed', value: result.processed },
                { label: 'Saved to DB', value: result.saved_to_db },
                { label: 'Duration', value: `${result.duration_seconds}s` },
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

            {result.failed > 0 && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.25)',
              }}>
                <AlertTriangle style={{ width: 16, height: 16, color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>
                  <strong style={{ color: '#f59e0b' }}>{result.failed} profile(s) failed.</strong>
                  {result.errors?.slice(0, 5).map((err, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      {err.profile_name}: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.db_error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
              }}>
                <AlertTriangle style={{ width: 16, height: 16, color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>
                  <strong style={{ color: '#ef4444' }}>
                    {result.processed} profiles scored but could not be saved to the database.
                  </strong>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                    {result.db_error}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                    Scores were not lost — re-run Generate HCM Scores to retry saving.
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Error state */}
        {hasFailed && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '14px 16px', borderRadius: 12,
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
            }}>
              <AlertTriangle style={{ width: 20, height: 20, color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 14, color: '#cbd5e1' }}>
                <strong style={{ color: '#ef4444' }}>Failed to generate HCM scores.</strong>
                <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>{String(error)}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Confirmation state */}
        {!isLoading && !isDone && !hasFailed && (
          <div style={{
            padding: '16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{ color: '#cbd5e1', fontSize: 14, margin: '0 0 8px 0' }}>
              This will compute HCM scorecards and INR valuations for
              <strong style={{ color: '#B3D335' }}> all {profileCount} profiles </strong>
              {clientName && <>of <strong style={{ color: '#e2e8f0' }}>{clientName}</strong></>}
              &nbsp;and save the results to the database.
            </p>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
              Existing scorecards for this scope will be replaced. This operation may take several minutes.
            </p>
          </div>
        )}
      </ModalBody>

      <ModalFooter className="tw:border-gray-700" style={{ paddingTop: 16, paddingBottom: 16 }}>
        {!isLoading && (
          <Button
            color="secondary"
            onClick={onClose}
            style={{ borderRadius: 10, padding: '8px 20px', fontWeight: 500 }}
          >
            {isDone || hasFailed ? 'Close' : 'Cancel'}
          </Button>
        )}
        {!isDone && !hasFailed && !isLoading && (
          <BrandButton
            onClick={onConfirm}
            compact
          >
            <BarChart3 style={{ width: 15, height: 15 }} />
            Generate Scores
          </BrandButton>
        )}
      </ModalFooter>
    </Modal>
  );
}
