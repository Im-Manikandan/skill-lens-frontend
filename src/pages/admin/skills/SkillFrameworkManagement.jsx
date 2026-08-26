'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Database,
  FolderPlus,
  Plus,
  Trash2,
  Eye,
  Power,
  ArrowLeft,
  Search,
  XCircle,
  Layers,
  BookOpen,
  GitBranch,
  ClipboardList,
} from 'lucide-react';
import {
  Row, Col,
  Button,
} from 'reactstrap';
import ClientsController from '../../../api/admin/clients-controller.jsx';
import FrameworksController from '../../../api/admin/frameworks-controller.jsx';
import ActionButton from '../components/ActionButton.jsx';
import StatCard from '../components/StatCard.jsx';
import GradientAvatar, { getGradientPair } from '../../../components/admin/GradientAvatar.jsx';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal.jsx';
import CreateFrameworkModal from './modals/CreateFrameworkModal.jsx';
import FrameworkDetailsModal from './modals/FrameworkDetailsModal.jsx';

// Animation Variants
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
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

export default function SkillFrameworkManagement() {
  // Routing & Client Scope
  const { clientId: clientIdParam } = useParams();
  const navigate = useNavigate();
  const scopedClientId = clientIdParam ? parseInt(clientIdParam) : null;

  // State
  const [selectedFramework, setSelectedFramework] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  // Queries
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => ClientsController.listClients(undefined, true),
  });

  // Derived Client Data
  const clientNameById = useMemo(() => {
    const map = new Map();
    clients.forEach((c) => map.set(c.id, c.client_name));
    return map;
  }, [clients]);

  const scopedClient = useMemo(() => {
    if (!scopedClientId) return null;
    return clients.find((c) => c.id === scopedClientId) || null;
  }, [clients, scopedClientId]);

  const { data: frameworksAll = [], isLoading: frameworksLoading } = useQuery({
    queryKey: scopedClientId
      ? ['frameworks-client', scopedClientId]
      : ['frameworks-all', clients.map((c) => c.id).sort().join(',')],
    queryFn: async () => {
      const targetClients = scopedClientId
        ? clients.filter((c) => c.id === scopedClientId)
        : clients;
      const results = await Promise.all(
        targetClients.map(async (c) => {
          const fs = await FrameworksController.listFrameworks(c.id, true);
          return fs.map((f) => ({
            ...f,
            client_name: c.client_name,
            client_code: c.client_code,
          }));
        })
      );
      return results.flat();
    },
    enabled: scopedClientId ? clients.length > 0 : clients.length > 0,
  });

  const frameworks = frameworksAll;

  const { data: frameworkData, isLoading: frameworkDataLoading } = useQuery({
    queryKey: ['framework-data', selectedFramework?.clientId, selectedFramework?.frameworkId],
    queryFn: () => FrameworksController.getFrameworkData(selectedFramework.clientId, selectedFramework.frameworkId),
    enabled: !!selectedFramework && isDetailsModalOpen,
  });

  // Mutations
  const createFrameworkMutation = useMutation({
    mutationFn: ({ clientId, data }) => FrameworksController.createFramework(clientId, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['frameworks-all'] }),
        queryClient.refetchQueries({ queryKey: ['frameworks-client'] }),
      ]);
      setIsCreateModalOpen(false);
    },
  });

  const deleteFrameworkMutation = useMutation({
    mutationFn: ({ clientId, frameworkId }) => FrameworksController.deleteFramework(clientId, frameworkId),
    onSuccess: async (_, vars) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['frameworks-all'] }),
        queryClient.refetchQueries({ queryKey: ['frameworks-client'] }),
      ]);
      if (selectedFramework?.frameworkId === vars.frameworkId) {
        setSelectedFramework(null);
        setIsDetailsModalOpen(false);
      }
    },
  });

  const activateFrameworkMutation = useMutation({
    mutationFn: ({ clientId, frameworkId }) => {
      return FrameworksController.activateFramework(clientId, frameworkId);
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['frameworks-all'] }),
        queryClient.refetchQueries({ queryKey: ['frameworks-client'] }),
        queryClient.refetchQueries({ queryKey: ['active-framework', data.client_id] }),
      ]);
    },
  });

  const deactivateFrameworkMutation = useMutation({
    mutationFn: ({ clientId, frameworkId }) => {
      return FrameworksController.deactivateFramework(clientId, frameworkId);
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['frameworks-all'] }),
        queryClient.refetchQueries({ queryKey: ['frameworks-client'] }),
        queryClient.refetchQueries({ queryKey: ['active-framework', data.client_id] }),
      ]);
    },
  });

  // Event Handlers
  const handleCreate = (clientId, data) => {
    createFrameworkMutation.mutate({ clientId, data });
  };

  const handleDelete = (clientId, frameworkId) => {
    setDeleteTarget({ clientId, frameworkId });
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteFrameworkMutation.mutate(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const handleActivate = (clientId, frameworkId) => {
    activateFrameworkMutation.mutate({ clientId, frameworkId });
  };

  const handleDeactivate = (clientId, frameworkId) => {
    deactivateFrameworkMutation.mutate({ clientId, frameworkId });
  };

  // Filtered Data & Stats
  const filteredFrameworks = useMemo(() => {
    const sorted = frameworks.slice().sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      const an = (a.client_name || clientNameById.get(a.client_id) || '').toLowerCase();
      const bn = (b.client_name || clientNameById.get(b.client_id) || '').toLowerCase();
      if (an !== bn) return an.localeCompare(bn);
      return (b.updated_at || '').localeCompare(a.updated_at || '');
    });
    if (!searchQuery.trim()) return sorted;
    const q = searchQuery.toLowerCase();
    return sorted.filter(f =>
      f.framework_name?.toLowerCase().includes(q) ||
      (f.client_name || clientNameById.get(f.client_id) || '').toLowerCase().includes(q) ||
      f.description?.toLowerCase().includes(q) ||
      f.version?.toLowerCase().includes(q)
    );
  }, [frameworks, searchQuery, clientNameById]);

  const stats = useMemo(() => ({
    total: frameworks.length,
    active: frameworks.filter(f => f.is_active).length,
    totalFamilies: frameworks.reduce((sum, f) => sum + (f.skill_families_count || 0), 0),
    totalCompetencies: frameworks.reduce((sum, f) => sum + (f.competencies_count || 0), 0),
  }), [frameworks]);

  // Loading State
  if (clientsLoading || frameworksLoading) {
    return (
      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-20 tw:gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Database style={{ width: 32, height: 32, color: '#818cf8' }} />
        </motion.div>
        <span style={{ color: '#6b7280', fontSize: 14 }}>Loading frameworks...</span>
      </div>
    );
  }

  return (
    <div className="tw:relative tw:overflow-hidden">
      {/* Ambient background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: -80, right: -60, width: 380, height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.06), transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -80, width: 320, height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.05), transparent 70%)',
        }} />
      </div>

      <div className="tw:relative tw:z-10">
        {/* Back navigation for scoped view */}
        {scopedClientId && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => navigate('../clients-management')}
              className="tw:flex tw:items-center tw:gap-1 tw:text-gray-400 hover:tw:text-white tw:mb-4 tw:bg-transparent tw:border-0 tw:cursor-pointer tw:p-0 tw:text-sm"
              style={{ transition: 'color 0.2s ease' }}
            >
              <ArrowLeft className="tw:w-4 tw:h-4" />
              Back to Clients
            </button>
          </motion.div>
        )}

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
                background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.1))',
                border: '1px solid rgba(129,140,248,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Database style={{ width: 24, height: 24, color: '#818cf8' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: 28, fontWeight: 700, marginBottom: 2,
                  background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, #818cf8 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {scopedClient
                    ? `${scopedClient.client_name} — Frameworks`
                    : 'Skill Framework Management'}
                </h2>
                <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                  {scopedClient
                    ? `Manage skill frameworks for ${scopedClient.client_name}`
                    : 'All frameworks across all clients (one active per client)'}
                </p>
              </div>
            </div>
          </div>
          <div className="tw:flex tw:gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                }}
              >
                <Plus style={{ width: 18, height: 18 }} />
                Add Framework
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="tw:mb-8">
          <Row className="tw:g-3">
            {[
              { icon: Database, label: 'Total Frameworks', value: stats.total, color: '#818cf8' },
              { icon: CheckCircle, label: 'Active', value: stats.active, color: '#34d399' },
              { icon: Layers, label: 'Skill Families', value: stats.totalFamilies, color: '#f472b6' },
              { icon: BookOpen, label: 'Skills', value: stats.totalCompetencies, color: '#fbbf24' },
            ].map((stat, i) => (
              <Col xs="6" lg="3" key={i}>
                <StatCard {...stat} />
              </Col>
            ))}
          </Row>
        </motion.div>

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
              placeholder="Search by framework name, client, or version..."
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

        {/* Frameworks List */}
        {filteredFrameworks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="tw:text-center tw:py-16"
              style={{
                background: 'linear-gradient(135deg, rgba(129,140,248,0.05), rgba(99,102,241,0.02))',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20,
              }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div style={{
                  width: 72, height: 72, borderRadius: 20, margin: '0 auto 20px',
                  background: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(129,140,248,0.05))',
                  border: '1px solid rgba(129,140,248,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FolderPlus style={{ width: 32, height: 32, color: '#818cf8' }} />
                </div>
              </motion.div>
              <h3 style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                {searchQuery ? 'No matching frameworks' : 'No frameworks yet'}
              </h3>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
                {searchQuery
                  ? `No frameworks match "${searchQuery}"`
                  : 'Get started by creating your first skill framework'
                }
              </p>
              {!searchQuery && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                      border: 'none', borderRadius: 12, padding: '10px 24px',
                      fontWeight: 600, fontSize: 14,
                      boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                    }}
                  >
                    <Plus style={{ width: 16, height: 16, marginRight: 8, display: 'inline' }} />
                    Create First Framework
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="tw:flex tw:flex-col tw:gap-3">
              {filteredFrameworks.map((framework) => {
                const isActive = framework.is_active === true;
                const clientName = framework.client_name || clientNameById.get(framework.client_id) || `Client ${framework.client_id}`;
                const [color1] = getGradientPair(framework.framework_name);
                const isActivating = activateFrameworkMutation.isPending &&
                  activateFrameworkMutation.variables?.frameworkId === framework.id;
                const isDeactivating = deactivateFrameworkMutation.isPending &&
                  deactivateFrameworkMutation.variables?.frameworkId === framework.id;
                const isPowerPending = isActivating || isDeactivating;

                return (
                  <motion.div key={`${framework.client_id}-${framework.id}`} variants={itemVariants}>
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
                        {/* Avatar */}
                        <GradientAvatar name={framework.framework_name} />

                        {/* Framework Info */}
                        <div className="tw:flex-1 tw:min-w-0">
                          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                            <span style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600 }}>
                              {framework.framework_name}
                            </span>
                            {/* Active status dot */}
                            <span style={{
                              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                              backgroundColor: isActive ? '#34d399' : '#6b7280',
                              boxShadow: isActive ? '0 0 8px rgba(52,211,153,0.5)' : 'none',
                            }} />
                            <span style={{
                              fontSize: 11, fontWeight: 500,
                              color: isActive ? '#34d399' : '#6b7280',
                            }}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                            {framework.version && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center',
                                fontSize: 11, fontWeight: 600, color: '#818cf8',
                                padding: '2px 8px', borderRadius: 6,
                                background: 'rgba(129,140,248,0.1)',
                                border: '1px solid rgba(129,140,248,0.2)',
                              }}>
                                v{framework.version}
                              </span>
                            )}
                          </div>
                          <div className="tw:flex tw:items-center tw:gap-3 tw:flex-wrap">
                            <span className="tw:flex tw:items-center tw:gap-1" style={{ color: color1, fontSize: 12, fontWeight: 500 }}>
                              <Layers style={{ width: 12, height: 12 }} />
                              {clientName}
                            </span>
                            {framework.description && (
                              <span style={{
                                color: '#4b5563', fontSize: 12,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                maxWidth: 200,
                              }}>
                                {framework.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Metric chips */}
                        <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
                          {framework.skill_families_count !== undefined && (
                            <MetricChip icon={Layers} label="Families" value={framework.skill_families_count} color="#f472b6" />
                          )}
                          {framework.skill_groups_count !== undefined && (
                            <MetricChip icon={GitBranch} label="Groups" value={framework.skill_groups_count || 0} color="#a78bfa" />
                          )}
                          {framework.competencies_count !== undefined && (
                            <MetricChip icon={BookOpen} label="Skills" value={framework.competencies_count || 0} color="#fbbf24" />
                          )}
                        </div>

                        {/* Actions */}
                        <div className="tw:flex tw:items-center tw:gap-2" style={{ flexShrink: 0 }}>
                          <ActionButton icon={Eye} color="#818cf8" onClick={() => { setSelectedFramework({ clientId: framework.client_id, frameworkId: framework.id }); setIsDetailsModalOpen(true); }} title="View Details" />
                          <ActionButton icon={ClipboardList} color="#a855f7" onClick={() => navigate(`/admin/self-assessment-management/${framework.id}`)} title="Manage Self-Assessment Questions" />
                          <ActionButton
                            icon={Power}
                            color={isActive ? '#f97316' : '#34d399'}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (isActive) {
                                handleDeactivate(framework.client_id, framework.id);
                              } else {
                                handleActivate(framework.client_id, framework.id);
                              }
                            }}
                            title={isActive ? 'Deactivate Framework' : 'Set as Active'}
                            disabled={isPowerPending}
                            loading={isPowerPending}
                          />
                          <ActionButton icon={Trash2} color="#ef4444" onClick={() => handleDelete(framework.client_id, framework.id)} title="Delete framework" />
                        </div>
                      </div>
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
                Showing {filteredFrameworks.length} of {frameworks.length} framework{frameworks.length !== 1 ? 's' : ''}
              </span>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Create Framework Modal */}
      {isCreateModalOpen && (
        <CreateFrameworkModal
          clients={scopedClientId ? clients.filter((c) => c.id === scopedClientId) : clients}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreate}
          isLoading={createFrameworkMutation.isPending}
          error={createFrameworkMutation.error}
        />
      )}

      {/* Framework Details Modal */}
      {isDetailsModalOpen && selectedFramework && (
        <FrameworkDetailsModal
          clientId={selectedFramework.clientId}
          frameworkId={selectedFramework.frameworkId}
          frameworkData={frameworkData}
          isLoading={frameworkDataLoading}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedFramework(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isLoading={deleteFrameworkMutation.isPending}
        title="Delete Framework"
        message="Are you sure you want to delete this framework? This will also delete all associated skill framework data. This action cannot be undone."
      />
    </div>
  );
}

