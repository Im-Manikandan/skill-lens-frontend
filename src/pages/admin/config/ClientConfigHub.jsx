'use client';

import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sliders, Brain, Target, ChevronRight, Settings, Power } from 'lucide-react';
import ClientsController from '../../../api/admin/clients-controller.jsx';
import DimensionConfigController from '../../../api/admin/dimension-config-controller.jsx';
import HCMConfigController from '../../../api/admin/hcm-config-controller.jsx';
import SkillReadinessConfigController from '../../../api/admin/skill-readiness-config-controller.jsx';
import ConfigPageHeader from '../components/ConfigPageHeader.jsx';

function StatusPill({ isDefault }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
      background: isDefault ? 'rgba(245,158,11,0.1)' : 'rgba(52,211,153,0.1)',
      border: `1px solid ${isDefault ? 'rgba(245,158,11,0.3)' : 'rgba(52,211,153,0.3)'}`,
      color: isDefault ? '#fbbf24' : '#6ee7b7',
    }}>
      {isDefault ? 'Using defaults' : 'Configured'}
    </span>
  );
}

function ConfigTile({ icon: Icon, color, title, desc, isDefault, isLoading, onClick, delay, featureActive, onToggleActive, toggling }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.99 }}
      style={{
        textAlign: 'left', cursor: 'pointer',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 22,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13,
          background: `linear-gradient(135deg, ${color}33, ${color}11)`,
          border: `1px solid ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon style={{ width: 22, height: 22, color }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Skill Readiness only — reflects the Active/Inactive feature flag
              set on the config page itself; other tiles have no such flag. */}
          {featureActive !== undefined && (
            <div
              role="button"
              tabIndex={0}
              title={featureActive ? 'Skill Readiness feature: Active — click to deactivate' : 'Skill Readiness feature: Inactive — click to activate'}
              onClick={(e) => {
                // Toggles the feature flag without opening the config page —
                // the rest of the card still navigates via the outer button.
                e.stopPropagation();
                e.preventDefault();
                if (!toggling) onToggleActive?.();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  e.preventDefault();
                  if (!toggling) onToggleActive?.();
                }
              }}
              style={{
                width: 26, height: 26, borderRadius: 8,
                background: featureActive ? 'rgba(52,211,153,0.12)' : 'rgba(107,114,128,0.12)',
                border: `1px solid ${featureActive ? 'rgba(52,211,153,0.3)' : 'rgba(107,114,128,0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: onToggleActive ? 'pointer' : 'default',
                opacity: toggling ? 0.5 : 1,
              }}
            >
              <Power style={{ width: 13, height: 13, color: featureActive ? '#34d399' : '#6b7280' }} />
            </div>
          )}
          <ChevronRight style={{ width: 16, height: 16, color: '#4b5563' }} />
        </div>
      </div>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{title}</h3>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0', lineHeight: 1.4 }}>{desc}</p>
      </div>
      <div>
        {isLoading
          ? <span style={{ fontSize: 11, color: '#4b5563' }}>Checking status…</span>
          : <StatusPill isDefault={isDefault} />}
      </div>
    </motion.button>
  );
}

export default function ClientConfigHub() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => ClientsController.getClient(Number(clientId)),
  });

  const { data: dimConfig, isLoading: dimLoading } = useQuery({
    queryKey: ['dimensionConfig', clientId],
    queryFn: () => DimensionConfigController.getConfig(Number(clientId)),
  });

  const { data: hcmConfig, isLoading: hcmLoading } = useQuery({
    queryKey: ['hcmConfig', clientId],
    queryFn: () => HCMConfigController.getConfig(Number(clientId)),
  });

  const { data: skillReadinessConfig, isLoading: srLoading } = useQuery({
    queryKey: ['skillReadinessConfig', clientId],
    queryFn: () => SkillReadinessConfigController.getConfig(Number(clientId)),
  });

  // Flips only the `enabled` flag, reusing the full config the GET already
  // returned (defaults included when no custom row exists yet) — the save
  // endpoint validates/persists the whole config, same as the config page.
  const toggleSkillReadinessMutation = useMutation({
    mutationFn: (config) => SkillReadinessConfigController.saveConfig(Number(clientId), config),
    onSuccess: () => qc.refetchQueries({ queryKey: ['skillReadinessConfig', clientId] }),
  });
  const handleToggleSkillReadiness = () => {
    if (!skillReadinessConfig?.config) return;
    toggleSkillReadinessMutation.mutate({
      ...skillReadinessConfig.config,
      enabled: skillReadinessConfig.config.enabled === false,
    });
  };

  const tiles = [
    {
      icon: Sliders, color: '#a78bfa', title: 'Relevance Config',
      desc: 'Search dimensions and weights used to compute the relevance/composite match score.',
      isDefault: dimConfig?.is_default !== false,
      isLoading: dimLoading,
      onClick: () => navigate(`/admin/client-config/${clientId}`),
    },
    {
      icon: Brain, color: '#f472b6', title: 'HCM Score Config',
      desc: 'Human Capital Metric dimension weights, keywords, and market value settings.',
      isDefault: hcmConfig?.is_default !== false,
      isLoading: hcmLoading,
      onClick: () => navigate(`/admin/hcm-config/${clientId}`),
    },
    {
      icon: Target, color: '#34d399', title: 'Skill Readiness Config',
      desc: 'Capability/application weights and thresholds behind the Ready Now / Nearly Ready / Developing / Not Ready label.',
      isDefault: skillReadinessConfig?.is_default !== false,
      isLoading: srLoading,
      featureActive: skillReadinessConfig?.config?.enabled !== false,
      onToggleActive: handleToggleSkillReadiness,
      toggling: toggleSkillReadinessMutation.isPending,
      onClick: () => navigate(`/admin/skill-readiness-config/${clientId}`),
    },
  ];

  return (
    <div className="tw:relative tw:overflow-hidden">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -80, right: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.05), transparent 70%)' }} />
      </div>

      <div className="tw:relative tw:z-10 tw:flex tw:flex-col tw:gap-8">
        <ConfigPageHeader
          icon={Settings}
          iconColor="#a78bfa"
          iconBg="linear-gradient(135deg, rgba(167,139,250,0.2), rgba(124,58,237,0.1))"
          iconBorder="rgba(167,139,250,0.2)"
          title="Configuration"
          subtitle={`${client?.client_name ?? `Client ${clientId}`} — search, HCM, and skill readiness scoring config`}
          backLabel="Back to Clients"
          onBack={() => navigate('/admin/clients-management')}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {tiles.map((tile, i) => (
            <ConfigTile key={tile.title} {...tile} delay={0.05 * i} />
          ))}
        </div>
      </div>
    </div>
  );
}
