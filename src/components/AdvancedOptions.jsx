'use client';

import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col } from 'reactstrap';
import { motion } from 'framer-motion';
import { Settings, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import BrandButton from './buttons/BrandButton';
import DimensionConfigController from '../api/admin/dimension-config-controller.jsx';

// ─── Legacy fallback (used when no clientId / dim config unavailable) ─────────

const LEGACY_BALANCED = { profile_weight: 0.5, matter_weight: 0.2, publication_weight: 0.15, web_weight: 0.15 };

const LEGACY_PRESETS = [
  { id: 'balanced', label: 'Balanced', weights: { profile_weight: 0.5, matter_weight: 0.2, publication_weight: 0.15, web_weight: 0.15 } },
  { id: 'experience', label: 'Experience Focus', weights: { profile_weight: 0.25, matter_weight: 0.5, publication_weight: 0.1, web_weight: 0.15 } },
  { id: 'thought', label: 'Thought Leadership', weights: { profile_weight: 0.25, matter_weight: 0.15, publication_weight: 0.45, web_weight: 0.15 } },
  { id: 'profile', label: 'Profile Focus', weights: { profile_weight: 0.65, matter_weight: 0.15, publication_weight: 0.05, web_weight: 0.15 } },
  { id: 'web_focused', label: 'Web Enhanced', weights: { profile_weight: 0.3, matter_weight: 0.2, publication_weight: 0.15, web_weight: 0.35 } },
];

const LEGACY_FIELDS = [
  { key: 'profile_weight', label: 'Profile Content', description: 'Bio, experience, and general profile information' },
  { key: 'matter_weight', label: 'Representative Matters', description: 'Case experience and client work' },
  { key: 'publication_weight', label: 'Publications', description: 'Articles, papers, and thought leadership' },
  { key: 'web_weight', label: 'Web Enhanced Data', description: 'Real-time web data and current information' },
];

// ─── Dim-key preset builder ───────────────────────────────────────────────────

function normalizeDimWeights(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total <= 0) return { ...weights };
  return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / total]));
}

function buildDimPresets(dimensions) {
  if (!dimensions?.length) return [];

  const balanced = normalizeDimWeights(
    Object.fromEntries(dimensions.map(d => [d.key, d.default_weight ?? 0]))
  );
  const presets = [{ id: 'balanced', label: 'Balanced', dimWeights: balanced }];

  dimensions.forEach(d => {
    const fw = Object.fromEntries(dimensions.map(d2 => [d2.key, 0.1]));
    fw[d.key] = 0.7;
    presets.push({ id: `focus_${d.key}`, label: `${d.label} Focus`, dimWeights: normalizeDimWeights(fw) });
  });

  return presets;
}

function matchDimPreset(dimWeights, presets) {
  if (!dimWeights || !presets?.length) return null;
  for (const p of presets) {
    if (!p.dimWeights) continue;
    const keys = Object.keys(p.dimWeights);
    if (keys.every(k => Math.abs((dimWeights[k] ?? 0) - p.dimWeights[k]) < 0.01)) return p.id;
  }
  return null;
}

function matchLegacyPreset(weights) {
  for (const p of LEGACY_PRESETS) {
    const pw = p.weights;
    if (Math.abs(weights.profile_weight - pw.profile_weight) < 0.01 &&
        Math.abs(weights.matter_weight - pw.matter_weight) < 0.01 &&
        Math.abs(weights.publication_weight - pw.publication_weight) < 0.01 &&
        Math.abs(weights.web_weight - pw.web_weight) < 0.01) return p.id;
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdvancedOptions({
  isOpen,
  onClose,
  weights,          // legacy 4-key dict | null (from SearchInterface)
  onWeightsChange,  // called with dim-key dict (dim mode) OR legacy dict (legacy mode)
  onApplyAndSearch,
  onActivePresetChange,
  clientId,
}) {
  // ── Dimension config query ─────────────────────────────────────────────────
  const { data: dimConfig, isLoading: isDimConfigLoading } = useQuery({
    queryKey: ['dimConfig', clientId],
    queryFn: () => DimensionConfigController.getConfig(Number(clientId)),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });

  const dimensions = dimConfig?.dimensions ?? null;
  const dimMode = !!(dimensions?.length);

  const dimPresets = useMemo(() => buildDimPresets(dimensions), [dimensions]);

  const defaultDimWeights = useMemo(() => {
    if (!dimensions?.length) return null;
    return normalizeDimWeights(Object.fromEntries(dimensions.map(d => [d.key, d.default_weight ?? 0])));
  }, [dimensions]);

  // ── State ──────────────────────────────────────────────────────────────────

  // Legacy mode state (4-key)
  const [localWeights, setLocalWeights] = useState(weights ?? LEGACY_BALANCED);

  // Dim-key mode state ({ [dim.key]: weight })
  const [localDimWeights, setLocalDimWeights] = useState(null);

  const [activePreset, setActivePreset] = useState('balanced');

  const initializedClientRef = useRef(null);
  const entrySnapshotRef = useRef({ legacyWeights: null, dimWeights: null });

  useEffect(() => {
    if (!defaultDimWeights || !clientId) return;
    if (initializedClientRef.current !== clientId) {
      setLocalDimWeights({ ...defaultDimWeights });
      setActivePreset('balanced');
      initializedClientRef.current = clientId;
    }
  }, [defaultDimWeights, clientId]);

  // Capture entry state when modal opens so Cancel can restore it.
  // useLayoutEffect fires synchronously after render, before paint — ensures
  // the snapshot is always captured before the user can interact with the modal.
  useLayoutEffect(() => {
    if (isOpen) {
      entrySnapshotRef.current = { legacyWeights: localWeights, dimWeights: localDimWeights };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Sync legacy localWeights when weights prop changes externally
  useEffect(() => {
    if (!dimMode && weights) {
      setLocalWeights(weights);
      setActivePreset(matchLegacyPreset(weights) ?? 'balanced');
    }
  }, [weights, dimMode]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDimWeightChange = (dimKey, value) => {
    const next = { ...localDimWeights, [dimKey]: value };
    setLocalDimWeights(next);
    setActivePreset(matchDimPreset(next, dimPresets));
  };

  const handleLegacyWeightChange = (key, value) => {
    const next = { ...localWeights, [key]: value };
    setLocalWeights(next);
    setActivePreset(matchLegacyPreset(next));
  };

  const handlePresetClick = (preset) => {
    if (dimMode && preset.dimWeights) {
      setLocalDimWeights({ ...preset.dimWeights });
    } else if (!dimMode && preset.weights) {
      setLocalWeights({ ...preset.weights });
    }
    setActivePreset(preset.id);
  };

  const handleApply = () => {
    if (!isTotalValid) return;
    const activeWeights = dimMode && localDimWeights ? localDimWeights : localWeights;
    onWeightsChange(normalizeDimWeights(activeWeights));
    if (onApplyAndSearch) onApplyAndSearch();
    onClose();
  };

  const handleReset = () => {
    if (dimMode && defaultDimWeights) {
      setLocalDimWeights({ ...defaultDimWeights });
      onWeightsChange({ ...defaultDimWeights });
    } else {
      setLocalWeights({ ...LEGACY_BALANCED });
      onWeightsChange({ ...LEGACY_BALANCED });
    }
    setActivePreset('balanced');
  };

  const handleCancel = () => {
    if (dimMode) {
      setLocalDimWeights(entrySnapshotRef.current.dimWeights);
    } else {
      setLocalWeights(entrySnapshotRef.current.legacyWeights ?? LEGACY_BALANCED);
    }
    onClose();
  };

  // Notify parent about preset changes
  useEffect(() => {
    if (onActivePresetChange) {
      onActivePresetChange(activePreset ?? 'custom');
    }
  }, [activePreset, onActivePresetChange]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const total = dimMode && localDimWeights
    ? Object.values(localDimWeights).reduce((a, b) => a + b, 0)
    : (localWeights.profile_weight ?? 0) + (localWeights.matter_weight ?? 0) +
      (localWeights.publication_weight ?? 0) + (localWeights.web_weight ?? 0);

  const isTotalValid = Math.abs(total - 1.0) < 0.01;

  const activePresets = dimMode ? dimPresets : LEGACY_PRESETS;

  const sliderTrackStyle = (value) => ({
    background: `linear-gradient(to right, #8fb329 0%, #8fb329 ${value * 100}%, #2d2d2d ${value * 100}%, #2d2d2d 100%)`,
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal
      isOpen={isOpen}
      toggle={onClose}
      centered
      size="lg"
      keyboard={false}
      backdrop="static"
      contentClassName="tw:bg-gray-900! tw:border! tw:border-gray-700! tw:text-white! tw:rounded-2xl! tw:overflow-hidden! tw:relative!"
    >
      {/* Decorative background */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(143,179,41,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #8fb329, transparent)', position: 'relative', zIndex: 1 }} />

      <ModalHeader className="tw:border-gray-700! tw:relative tw:z-1">
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex tw:items-center tw:justify-center" style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, rgba(143,179,41,0.2) 0%, rgba(143,179,41,0.05) 100%)', border: '1px solid rgba(143,179,41,0.2)' }}>
            <Settings className="tw:w-3.5 tw:h-3.5" style={{ color: '#8fb329' }} />
          </div>
          <span className="tw:text-white tw:text-sm tw:font-semibold" style={{ letterSpacing: '-0.01em' }}>
            Advanced Search Options
          </span>
        </div>
      </ModalHeader>

      <ModalBody className="tw:relative tw:z-1">
        <div className="tw:mb-3">
          <h4 className="tw:text-xs tw:font-medium tw:text-white tw:mb-0.5">Search Weight Configuration</h4>
          <p className="tw:text-xs tw:text-gray-400" style={{ lineHeight: 1.4 }}>
            {dimMode
              ? 'Set the importance of each scoring dimension. Weights auto-normalize to 100%.'
              : 'Adjust importance of profile aspects. Weights auto-normalize to 100%.'}
          </p>
        </div>

        <Row>
          {/* Quick Presets */}
          <Col md={6}>
            <h5 className="tw:text-xs tw:font-medium tw:uppercase tw:mb-2" style={{ color: '#6b7280', letterSpacing: '0.05em' }}>Quick Presets</h5>
            <div className="tw:flex tw:flex-col tw:gap-1.5">
              {activePresets.map(preset => (
                <motion.button
                  key={preset.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePresetClick(preset)}
                  className="tw:text-sm tw:rounded-lg tw:transition-all tw:duration-200 tw:font-medium tw:text-center"
                  style={activePreset === preset.id
                    ? { backgroundColor: '#8fb329', color: '#fff', padding: '6px 14px', border: '1px solid transparent', boxShadow: '0 4px 12px rgba(143,179,41,0.3)' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#d1d5db', padding: '6px 14px', border: '1px solid rgba(255,255,255,0.1)' }
                  }
                >
                  {preset.label}
                </motion.button>
              ))}
            </div>
          </Col>

          {/* Weight Sliders */}
          <Col md={6}>
            <div className="tw:space-y-2">

              {dimMode && localDimWeights ? (
                /* ── Dim-key sliders: one per dimension ── */
                (dimensions ?? []).map(dim => {
                  const val = localDimWeights[dim.key] ?? 0;
                  return (
                    <div key={dim.key} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="tw:flex tw:items-center tw:justify-between tw:mb-1">
                        <label className="tw:text-xs tw:font-medium tw:text-gray-200" title={dim.description}>{dim.label}</label>
                        <span className="tw:font-semibold tw:tabular-nums" style={{ color: '#8fb329', background: 'rgba(143,179,41,0.1)', padding: '1px 8px', borderRadius: 20, fontSize: 11 }}>
                          {(val * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range" min="0" max="1" step="0.05"
                        value={val}
                        onChange={e => handleDimWeightChange(dim.key, parseFloat(e.target.value))}
                        className="tw:w-full slider"
                        style={sliderTrackStyle(val)}
                      />
                    </div>
                  );
                })
              ) : (
                /* ── Legacy sliders: fixed 4 slots ── */
                LEGACY_FIELDS.map(field => (
                  <div key={field.key} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="tw:flex tw:items-center tw:justify-between tw:mb-1">
                      <label className="tw:text-xs tw:font-medium tw:text-gray-200">{field.label}</label>
                      <span className="tw:font-semibold tw:tabular-nums" style={{ color: '#8fb329', background: 'rgba(143,179,41,0.1)', padding: '1px 8px', borderRadius: 20, fontSize: 11 }}>
                        {((localWeights[field.key] ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={localWeights[field.key] ?? 0}
                      onChange={e => handleLegacyWeightChange(field.key, parseFloat(e.target.value))}
                      className="tw:w-full slider"
                      style={sliderTrackStyle(localWeights[field.key] ?? 0)}
                    />
                  </div>
                ))
              )}

              {/* Total indicator */}
              <div style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${isTotalValid ? 'rgba(34,197,94,0.3)' : 'rgba(234,179,8,0.3)'}`, background: isTotalValid ? 'rgba(34,197,94,0.06)' : 'rgba(234,179,8,0.06)', boxShadow: isTotalValid ? '0 0 20px rgba(34,197,94,0.08)' : 'none' }}>
                <div className="tw:flex tw:items-center tw:justify-between">
                  <span className="tw:text-sm tw:font-medium tw:text-gray-300">Total Weight</span>
                  <span className="tw:text-sm tw:font-semibold tw:tabular-nums" style={{ color: isTotalValid ? '#4ade80' : '#facc15' }}>
                    {(total * 100).toFixed(1)}%
                  </span>
                </div>
                {!isTotalValid && (
                  <p className="tw:text-xs tw:mt-1" style={{ color: '#facc15' }}>
                    Weights will be automatically normalized to 100%
                  </p>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </ModalBody>

      <ModalFooter className="tw:border-gray-700! tw:relative tw:z-1 tw:flex! tw:justify-between!">
        <button
          onClick={handleReset}
          className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2 tw:text-sm tw:transition-all tw:duration-200 tw:rounded-lg tw:bg-transparent tw:border-0"
          style={{ color: '#9ca3af' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}
        >
          <RotateCcw className="tw:w-3.5 tw:h-3.5" />
          <span>Reset to Default</span>
        </button>
        <div className="tw:flex tw:gap-3">
          <button
            onClick={handleCancel}
            className="tw:px-4 tw:py-2 tw:text-sm tw:font-medium tw:transition-all tw:duration-200"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            Cancel
          </button>
          <BrandButton
            onClick={handleApply}
            compact
            disabled={!isTotalValid || (!!clientId && isDimConfigLoading)}
            loading={!!clientId && isDimConfigLoading}
            loadingText="Loading config..."
          >
            Apply Weights
          </BrandButton>
        </div>
      </ModalFooter>
    </Modal>
  );
}
