'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Loader2, Target, XCircle, Info, Save,
} from 'lucide-react';
import ClientsController from '../../../api/admin/clients-controller.jsx';
import SkillReadinessConfigController from '../../../api/admin/skill-readiness-config-controller.jsx';
import BrandButton from '../../../components/buttons/BrandButton.jsx';
import ConfigPageHeader from '../components/ConfigPageHeader.jsx';
import StatusBanner from '../components/StatusBanner.jsx';
import SuccessToast from '../components/SuccessToast.jsx';
import SectionCard from '../components/SectionCard.jsx';

const SYSTEM_DEFAULT_CONFIG = {
  evidence_work_weight: 0.65,
  evidence_publication_weight: 0.35,
  capability_weight: 0.50,
  application_weight: 0.50,
  thresholds: { ready_now: 80, nearly_ready: 60, developing: 40 },
  show_score_breakdown: 'admin_only',
  // Feature enable/disable — missing on configs saved before this flag
  // existed, which the hydration below treats as "active" (see also
  // useSkillReadinessEnabled.js which applies the same default elsewhere).
  enabled: true,
};

// v1: show_score_breakdown is fixed to 'admin_only' — the spec lists
// per-client 'always'/'never' exposure as an explicit open decision, not
// yet made, so this UI does not offer them. Only admin-portal users see the
// capability/application breakdown; client-portal users see just the
// headline classification. Enforced server-side, not just hidden here.
const BREAKDOWN_LOCKED_VALUE = 'admin_only';
const BREAKDOWN_LOCKED_DESC = 'Only admin-portal users see the capability/application breakdown. Client-portal users see just the headline classification (Ready Now / Nearly Ready / Developing / Not Ready). Fixed for v1.';

// ─── validation ──────────────────────────────────────────────────────────────

function validate(config) {
  const errors = [];
  const evidenceSum = (config.evidence_work_weight ?? 0) + (config.evidence_publication_weight ?? 0);
  const capSum = (config.capability_weight ?? 0) + (config.application_weight ?? 0);

  if (Math.abs(evidenceSum - 1.0) > 0.01) {
    errors.push(`Evidence weights must sum to 1.0 (currently ${evidenceSum.toFixed(2)}).`);
  }
  if (Math.abs(capSum - 1.0) > 0.01) {
    errors.push(`Capability + Application weights must sum to 1.0 (currently ${capSum.toFixed(2)}).`);
  }
  for (const [key, val] of Object.entries({
    evidence_work_weight: config.evidence_work_weight,
    evidence_publication_weight: config.evidence_publication_weight,
    capability_weight: config.capability_weight,
    application_weight: config.application_weight,
  })) {
    if (val === null || val === undefined || val < 0 || val > 1) {
      errors.push(`${key} must be between 0 and 1.`);
    }
  }
  const { ready_now, nearly_ready, developing } = config.thresholds ?? {};
  for (const [key, val] of Object.entries({ ready_now, nearly_ready, developing })) {
    if (val === null || val === undefined || val < 0 || val > 100) {
      errors.push(`Threshold "${key}" must be between 0 and 100.`);
    }
  }
  if (!(ready_now > nearly_ready && nearly_ready > developing)) {
    errors.push('Thresholds must be strictly descending: Ready Now > Nearly Ready > Developing.');
  }
  if (config.show_score_breakdown !== 'admin_only') {
    errors.push("Score breakdown visibility is fixed to 'admin_only' for v1.");
  }
  return errors;
}

// ─── weight pair input ───────────────────────────────────────────────────────

function WeightPairInput({ title, colorA, colorB, labelA, labelB, valA, valB, onChangeA, onChangeB }) {
  const sum = (valA ?? 0) + (valB ?? 0);
  const isValid = Math.abs(sum - 1.0) <= 0.01;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{title}</span>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
          color: isValid ? '#34d399' : '#ef4444',
          background: isValid ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${isValid ? 'rgba(52,211,153,0.25)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          Sum: {sum.toFixed(2)} {isValid ? '✓' : '≠ 1.0'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: colorA, fontWeight: 600, display: 'block', marginBottom: 4 }}>{labelA}</label>
          <input
            type="number" step="0.01" min="0" max="1" value={valA}
            onChange={(e) => onChangeA(parseFloat(e.target.value))}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: colorB, fontWeight: 600, display: 'block', marginBottom: 4 }}>{labelB}</label>
          <input
            type="number" step="0.01" min="0" max="1" value={valB}
            onChange={(e) => onChangeB(parseFloat(e.target.value))}
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#e2e8f0', fontSize: 13, outline: 'none',
};

// ─── main page ───────────────────────────────────────────────────────────────

export default function ClientSkillReadinessConfig() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState(SYSTEM_DEFAULT_CONFIG);
  const [successMsg, setSuccessMsg] = useState(null);
  const [serverErrors, setServerErrors] = useState(null);

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => ClientsController.getClient(Number(clientId)),
  });

  const { data: configRow, isLoading: configLoading, isError: configError } = useQuery({
    queryKey: ['skillReadinessConfig', clientId],
    queryFn: () => SkillReadinessConfigController.getConfig(Number(clientId)),
  });

  useEffect(() => {
    if (configRow?.config) {
      setForm({
        ...SYSTEM_DEFAULT_CONFIG,
        ...configRow.config,
        thresholds: { ...SYSTEM_DEFAULT_CONFIG.thresholds, ...configRow.config.thresholds },
        // Fixed for v1 regardless of what a config row happens to carry.
        show_score_breakdown: BREAKDOWN_LOCKED_VALUE,
      });
    }
  }, [configRow]);

  const saveMutation = useMutation({
    mutationFn: (config) => SkillReadinessConfigController.saveConfig(Number(clientId), config),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['skillReadinessConfig', clientId] });
      setSuccessMsg('Skill Readiness configuration saved successfully.');
      setServerErrors(null);
    },
    onError: (err) => {
      if (Array.isArray(err?.errors)) {
        setServerErrors(err.errors);
      } else {
        setServerErrors([err?.message ?? 'Save failed.']);
      }
    },
  });

  const isDefault = configError || !configRow || configRow?.is_default === true;
  const clientErrors = validate(form);
  const isValid = clientErrors.length === 0;

  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const setThreshold = (key, val) => setForm((prev) => ({ ...prev, thresholds: { ...prev.thresholds, [key]: val } }));

  const handleSave = () => {
    setSuccessMsg(null);
    if (!isValid) return;
    saveMutation.mutate(form);
  };

  if (configLoading) {
    return (
      <div className="tw:flex tw:items-center tw:justify-center tw:py-20">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Target style={{ width: 32, height: 32, color: '#34d399' }} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="tw:relative tw:overflow-hidden">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -80, right: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.05), transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.04), transparent 70%)' }} />
      </div>

      <div className="tw:relative tw:z-10 tw:flex tw:flex-col tw:gap-8">

        <ConfigPageHeader
          icon={Target}
          iconColor="#34d399"
          iconBg="linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.1))"
          iconBorder="rgba(52,211,153,0.2)"
          title="Skill Readiness Configuration"
          subtitle={`${client?.client_name ?? `Client ${clientId}`} — capability & application weights, thresholds, visibility`}
          backLabel="Back to Configuration"
          onBack={() => navigate(`/admin/config-hub/${clientId}`)}
        />

        {isDefault ? (
          <StatusBanner
            color="#f59e0b"
            bg="rgba(245,158,11,0.08)"
            border="rgba(245,158,11,0.25)"
            icon={AlertTriangle}
            label="Using system defaults"
            desc="No custom Skill Readiness config active. Adjust weights and thresholds below, then save to activate a client-specific config."
          />
        ) : (
          <StatusBanner
            color="#34d399"
            bg="rgba(52,211,153,0.06)"
            border="rgba(52,211,153,0.2)"
            icon={CheckCircle2}
            label="Custom Skill Readiness configuration active"
            desc={`Version ${configRow?.version ?? 1} · Last updated by ${configRow?.created_by ?? 'admin'}${configRow?.updated_at ? ` · ${new Date(configRow.updated_at).toLocaleDateString()}` : ''}`}
          />
        )}

        <SuccessToast message={successMsg} onDismiss={() => setSuccessMsg(null)} />

        {/* Weights */}
        <SectionCard delay={0.15}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>Score Weights</h3>
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
            Each pair must sum to exactly 1.0. Capability = background match; Application = proven work/publication evidence.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <WeightPairInput
              title="Evidence composition (within Application)"
              colorA="#f472b6" colorB="#a78bfa"
              labelA="Work experience weight" labelB="Publication weight"
              valA={form.evidence_work_weight} valB={form.evidence_publication_weight}
              onChangeA={(v) => setField('evidence_work_weight', v)}
              onChangeB={(v) => setField('evidence_publication_weight', v)}
            />
            <WeightPairInput
              title="Overall composition"
              colorA="#34d399" colorB="#60a5fa"
              labelA="Capability weight" labelB="Application weight"
              valA={form.capability_weight} valB={form.application_weight}
              onChangeA={(v) => setField('capability_weight', v)}
              onChangeB={(v) => setField('application_weight', v)}
            />
          </div>
        </SectionCard>

        {/* Thresholds */}
        <SectionCard delay={0.2}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>Classification Thresholds</h3>
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
            Score ≥ Ready Now → "Ready Now". Score ≥ Nearly Ready → "Nearly Ready". Score ≥ Developing → "Developing". Else → "Not Ready". Must be strictly descending.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {[
              ['ready_now', 'Ready Now', '#34d399'],
              ['nearly_ready', 'Nearly Ready', '#60a5fa'],
              ['developing', 'Developing', '#f59e0b'],
            ].map(([key, label, color]) => (
              <div key={key}>
                <label style={{ fontSize: 12, color, fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
                <input
                  type="number" min="0" max="100" value={form.thresholds?.[key] ?? ''}
                  onChange={(e) => setThreshold(key, parseFloat(e.target.value))}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Breakdown visibility — fixed for v1, not editable (see spec's
            Open Decisions: per-client always/never exposure not yet decided) */}
        <SectionCard delay={0.25}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>Score Breakdown Visibility</h3>
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
            Controls who can see the capability/application sub-score breakdown vs just the headline classification.
          </p>
          <div
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(52,211,153,0.06)',
              border: '1px solid rgba(52,211,153,0.25)',
            }}
          >
            <CheckCircle2 style={{ width: 16, height: 16, color: '#34d399', flexShrink: 0, marginTop: 1 }} />
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Admin only</span>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{BREAKDOWN_LOCKED_DESC}</p>
            </div>
          </div>
        </SectionCard>

        {/* Validation errors */}
        {!isValid && (
          <div style={{
            borderRadius: 10, padding: '10px 14px', background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <XCircle style={{ width: 14, height: 14, color: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>Fix before saving</span>
            </div>
            {clientErrors.map((err, i) => (
              <p key={i} style={{ fontSize: 12, color: '#fca5a5', margin: '2px 0 0 22px' }}>{err}</p>
            ))}
          </div>
        )}

        {serverErrors && (
          <div style={{
            borderRadius: 10, padding: '10px 14px', background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <XCircle style={{ width: 14, height: 14, color: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>Server rejected the save</span>
            </div>
            {serverErrors.map((err, i) => (
              <p key={i} style={{ fontSize: 12, color: '#fca5a5', margin: '2px 0 0 22px' }}>{err}</p>
            ))}
          </div>
        )}

        {/* Save */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BrandButton onClick={handleSave} disabled={!isValid || saveMutation.isPending}>
            {saveMutation.isPending
              ? <Loader2 style={{ width: 16, height: 16 }} className="tw:animate-spin" />
              : <Save style={{ width: 16, height: 16 }} />}
            {saveMutation.isPending ? 'Saving…' : 'Save Configuration'}
          </BrandButton>
          <span style={{ fontSize: 11, color: '#4b5563', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Info style={{ width: 12, height: 12 }} />
            Takes effect immediately for new searches.
          </span>
        </div>

      </div>
    </div>
  );
}
