'use client';

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus, Edit, Trash2, Building2,
  Search, Hash, Factory, Users, Layers, GitBranch,
  BookOpen, XCircle, FolderPlus, CreditCard, Settings,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';
import {
  Row, Col,
  Alert,
} from 'reactstrap';
import BrandButton from '../../../components/buttons/BrandButton.jsx';
import ClientsController from '../../../api/admin/clients-controller.jsx';
import ActionButton from '../components/ActionButton.jsx';
import StatCard from '../components/StatCard.jsx';
import GradientAvatar, { getGradientPair } from '../../../components/admin/GradientAvatar.jsx';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal.jsx';
import ClientModal from './modals/ClientModal.jsx';
import ClientPlanModal from './modals/ClientPlanModal.jsx';

// Animation Variants
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};


// Metric Chip Component
function MetricChip({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 10,
      background: `linear-gradient(135deg, ${color}10, ${color}05)`,
      border: `1px solid ${color}20`,
    }}>
      <Icon style={{ width: 13, height: 13, color }} />
      <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 700 }}>{value}</span>
    </div>
  );
}

// Plan -> Framework -> Dimension Config -> Profiles can be done/changed in
// any order, at any time. setup_issues (computed server-side, the single
// source of truth — see ClientService._compute_setup_status) tells the
// admin exactly what's missing or out of sync right here, instead of them
// discovering it later as an empty/wrong search result.
function SetupStatusBadge({ setupComplete, setupIssues }) {
  if (setupComplete === null || setupComplete === undefined) return null;

  if (setupComplete) {
    return (
      <div
        title="Plan, Skill Framework, Relevance Configuration, and Profiles are all set up and embeddings are in sync."
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 10,
          background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
        }}
      >
        <CheckCircle2 style={{ width: 13, height: 13, color: '#34d399' }} />
        <span style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 600 }}>Ready</span>
      </div>
    );
  }

  return (
    <div
      title={(setupIssues || []).join('\n')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 10,
        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
        cursor: 'help',
      }}
    >
      <AlertTriangle style={{ width: 13, height: 13, color: '#f59e0b' }} />
      <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>
        {(setupIssues || []).length} action{(setupIssues || []).length === 1 ? '' : 's'} needed
      </span>
    </div>
  );
}

export default function ClientsManagement() {
  const navigate = useNavigate();

  // State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [planClient, setPlanClient] = useState(null);
  const queryClient = useQueryClient();

  // Query
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: () => ClientsController.listClients(undefined, true),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => ClientsController.createClient(data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['clients'] });
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ClientsController.updateClient(id, data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['clients'] });
      setEditingClient(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ClientsController.deleteClient(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['clients'] });
      const previous = queryClient.getQueryData(['clients']);
      queryClient.setQueryData(['clients'], (old) => (old ?? []).filter((c) => c.id !== id));
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['clients'], context.previous);
      setDeleteError(err?.message || 'Failed to delete client. Please try again.');
    },
    onSettled: async () => {
      await queryClient.refetchQueries({ queryKey: ['clients'] });
    },
  });

  // Event Handlers
  const handleCreate = (data) => {
    const { client_code: _, ...createData } = data;
    createMutation.mutate(createData);
  };

  const handleUpdate = (id, data) => {
    updateMutation.mutate({ id, data });
  };

  const handleDelete = (id) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget);
      setDeleteTarget(null);
    }
  };

  // Filtered Data & Stats
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(c =>
      c.client_name?.toLowerCase().includes(q) ||
      c.client_code?.toLowerCase().includes(q) ||
      c.industry_name?.toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  const stats = useMemo(() => ({
    total: clients.length,
    totalProfiles: clients.reduce((sum, c) => sum + (c.profiles_count || 0), 0),
    totalSkillFamilies: clients.reduce((sum, c) => sum + (c.skill_families_count || 0), 0),
    totalCompetencies: clients.reduce((sum, c) => sum + (c.competencies_count || 0), 0),
  }), [clients]);

  // Loading & Error States
  if (isLoading) {
    return (
      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-20 tw:gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Building2 style={{ width: 32, height: 32, color: '#34d399' }} />
        </motion.div>
        <span style={{ color: '#6b7280', fontSize: 14 }}>Loading clients...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert color="danger">
        Error loading clients: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <div className="tw:relative tw:overflow-hidden">
      {/* Ambient background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: -80, right: -60, width: 380, height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52,211,153,0.06), transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -80, width: 320, height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.05), transparent 70%)',
        }} />
      </div>

      <div className="tw:relative tw:z-10">
        {/* Header */}
        <motion.div
          className="tw:flex tw:items-start tw:justify-between tw:mb-8 tw:flex-wrap tw:gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <div className="tw:flex tw:items-center tw:gap-3 tw:mb-2">
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.1))',
                border: '1px solid rgba(52,211,153,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Building2 style={{ width: 24, height: 24, color: '#34d399' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: 28, fontWeight: 700, marginBottom: 2,
                  background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, #34d399 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Clients Management
                </h2>
                <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                  Manage clients, frameworks, and skill data
                </p>
              </div>
            </div>
          </div>
          <BrandButton onClick={() => setIsCreateModalOpen(true)}>
            <Plus style={{ width: 18, height: 18 }} />
            Add Client
          </BrandButton>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="tw:mb-8">
          <Row className="tw:g-3">
            {[
              { icon: Building2, label: 'Total Clients', value: stats.total, color: '#34d399' },
              { icon: Users, label: 'Profiles', value: stats.totalProfiles, color: '#60a5fa' },
              { icon: Layers, label: 'Skill Families', value: stats.totalSkillFamilies, color: '#f472b6' },
              { icon: BookOpen, label: 'Skills', value: stats.totalCompetencies, color: '#fbbf24' },
            ].map((stat, i) => (
              <Col xs="6" lg="3" key={i}>
                <StatCard {...stat} animationY={24} />
              </Col>
            ))}
          </Row>
        </motion.div>

        {/* Delete error banner */}
        {deleteError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="tw:mb-4"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', borderRadius: 10,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            <div className="tw:flex tw:items-center tw:gap-2">
              <XCircle style={{ width: 16, height: 16, color: '#f87171', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#f87171', fontWeight: 500 }}>{deleteError}</span>
            </div>
            <button
              onClick={() => setDeleteError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}
              aria-label="Dismiss"
            >
              <XCircle style={{ width: 14, height: 14 }} />
            </button>
          </motion.div>
        )}

        {/* Search Bar */}
        <motion.div
          className="tw:mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div style={{
            position: 'relative',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            <Search style={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              width: 18, height: 18, color: '#6b7280',
            }} />
            <input
              type="text"
              placeholder="Search by name, code, or industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px 14px 44px',
                background: 'transparent', border: 'none', outline: 'none',
                color: '#e2e8f0', fontSize: 14,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#9ca3af',
                }}
              >
                <XCircle style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Clients Grid */}
        {filteredClients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="tw:text-center tw:py-8"
              style={{
                background: 'linear-gradient(135deg, rgba(52,211,153,0.05), rgba(16,185,129,0.02))',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
              }}
            >
              <div className="tw:flex tw:flex-col tw:items-center tw:gap-3">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(52,211,153,0.05))',
                    border: '1px solid rgba(52,211,153,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FolderPlus style={{ width: 22, height: 22, color: '#34d399' }} />
                  </div>
                </motion.div>
                <div>
                  <h3 style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
                    {searchQuery ? 'No matching clients' : 'No clients yet'}
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                    {searchQuery
                      ? `No clients match "${searchQuery}"`
                      : 'Get started by onboarding your first client'
                    }
                  </p>
                </div>
                {!searchQuery && (
                  <BrandButton onClick={() => setIsCreateModalOpen(true)} compact>
                    <Plus style={{ width: 15, height: 15 }} />
                    Create First Client
                  </BrandButton>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="tw:flex tw:flex-col tw:gap-3">
              {filteredClients.map((client) => {
                const [color1] = getGradientPair(client.client_name);
                return (
                  <motion.div key={client.id} variants={itemVariants}>
                    <div
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 16,
                        padding: '16px 20px',
                        transition: 'all 0.3s ease',
                        cursor: 'default',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.borderColor = `${color1}20`;
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="tw:flex tw:items-center tw:gap-4 tw:flex-wrap">
                        {/* Logo / Avatar */}
                        <GradientAvatar name={client.client_name} src={client.logo} />

                        {/* Client Info */}
                        <div className="tw:flex-1 tw:min-w-0">
                          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                            <span style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600 }}>
                              {client.client_name}
                            </span>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 11, fontWeight: 600, color: '#6b7280',
                              padding: '2px 8px', borderRadius: 6,
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              fontFamily: 'monospace',
                            }}>
                              <Hash style={{ width: 10, height: 10 }} />
                              {client.client_code}
                            </span>
                          </div>
                          <div className="tw:flex tw:items-center tw:gap-3 tw:flex-wrap">
                            {client.industry_name && (
                              <span className="tw:flex tw:items-center tw:gap-1" style={{ color: color1, fontSize: 12, fontWeight: 500 }}>
                                <Factory style={{ width: 12, height: 12 }} />
                                {client.industry_name}
                              </span>
                            )}
                            {client.description && (
                              <span style={{
                                color: '#4b5563', fontSize: 12,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                maxWidth: 200,
                              }}>
                                {client.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Metrics chips */}
                        <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
                          {client.profiles_count !== undefined && (
                            <MetricChip icon={Users} label="Profiles" value={client.profiles_count} color="#60a5fa" />
                          )}
                          {client.skill_families_count !== undefined && (
                            <MetricChip icon={Layers} label="Families" value={client.skill_families_count} color="#f472b6" />
                          )}
                          {client.skill_groups_count !== undefined && (
                            <MetricChip icon={GitBranch} label="Groups" value={client.skill_groups_count} color="#a78bfa" />
                          )}
                          {client.competencies_count !== undefined && (
                            <MetricChip icon={BookOpen} label="Skills" value={client.competencies_count} color="#fbbf24" />
                          )}
                          <SetupStatusBadge setupComplete={client.setup_complete} setupIssues={client.setup_issues} />
                        </div>

                        {/* Actions */}
                        <div className="tw:flex tw:items-center tw:gap-2" style={{ flexShrink: 0 }}>
                          <ActionButton icon={CreditCard} color="#fbbf24" onClick={() => setPlanClient(client)} title="Manage plan" />
                          <ActionButton icon={Layers} color="#34d399" onClick={() => navigate(`/admin/skill-framework-management/${client.id}`)} title="Manage frameworks" />
                          <ActionButton icon={Settings} color="#a78bfa" onClick={() => navigate(`/admin/config-hub/${client.id}`)} title="Configuration" />
                          <ActionButton icon={Users} color="#B3D335" onClick={() => navigate(`/admin/profiles/${client.id}`)} title="View profiles" />
                          <ActionButton icon={Edit} color="#60a5fa" onClick={() => setEditingClient(client)} title="Edit client" />
                          <ActionButton icon={Trash2} color="#ef4444" onClick={() => handleDelete(client.id)} title="Delete client" />
                        </div>
                      </div>

                      {!client.setup_complete && client.setup_issues?.length > 0 && (
                        <div className="tw:mt-3" style={{
                          borderRadius: 10, padding: '10px 14px',
                          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)',
                        }}>
                          <div className="tw:flex tw:items-center tw:gap-2" style={{ marginBottom: 6 }}>
                            <AlertTriangle style={{ width: 13, height: 13, color: '#f59e0b', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24' }}>
                              Needs attention before search will work correctly
                            </span>
                          </div>
                          <ul className="tw:list-none tw:ps-0 tw:mb-0" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {client.setup_issues.map((issue, i) => (
                              <li key={i} style={{ fontSize: 12, color: '#9ca3af', paddingLeft: 21 }}>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer count */}
            <motion.div
              className="tw:mt-4 tw:text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span style={{ fontSize: 13, color: '#4b5563' }}>
                Showing {filteredClients.length} of {clients.length} client{clients.length !== 1 ? 's' : ''}
              </span>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingClient) && (
        <ClientModal
          client={editingClient}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingClient(null);
          }}
          onSave={editingClient
            ? (data) => handleUpdate(editingClient.id, data)
            : (data) => handleCreate(data)
          }
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Plan Modal */}
      {planClient && (
        <ClientPlanModal
          client={planClient}
          onClose={() => setPlanClient(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Client"
        message="Are you sure you want to delete this client? This will also delete all associated skill framework data. This action cannot be undone."
      />
    </div>
  );
}

