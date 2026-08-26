'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus, Edit, Trash2, Search, XCircle,
  Factory, CheckCircle, AlertCircle, Calendar, FolderPlus,
} from 'lucide-react';
import { Row, Col, Alert } from 'reactstrap';
import IndustriesController from '../../../api/admin/industries-controller.jsx';
import IndigoButton from '../../../components/buttons/IndigoButton.jsx';
import ActionButton from '../components/ActionButton.jsx';
import StatCard from '../components/StatCard.jsx';
import GradientAvatar from '../../../components/admin/GradientAvatar.jsx';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal.jsx';
import IndustryModal from './modals/IndustryModal.jsx';

// Animation Variants
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};


export default function IndustriesManagement() {
  // State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  // Query
  const { data: industries = [], isLoading, error } = useQuery({
    queryKey: ['industries'],
    queryFn: () => IndustriesController.listIndustries(false),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => IndustriesController.createIndustry(data),
    onSuccess: () => {
      setIsCreateModalOpen(false);
    },
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: ['industries'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => IndustriesController.updateIndustry(id, data),
    onSuccess: () => {
      setEditingIndustry(null);
    },
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: ['industries'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => IndustriesController.deleteIndustry(id),
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: ['industries'] });
    },
  });

  // Event Handlers
  const handleCreate = (data) => {
    createMutation.mutate(data);
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
  const filteredIndustries = useMemo(() => {
    if (!searchQuery.trim()) return industries;
    const q = searchQuery.toLowerCase();
    return industries.filter(ind =>
      ind.name?.toLowerCase().includes(q) ||
      ind.description?.toLowerCase().includes(q)
    );
  }, [industries, searchQuery]);

  const stats = useMemo(() => ({
    total: industries.length,
    active: industries.filter(ind => ind.is_active).length,
    inactive: industries.filter(ind => !ind.is_active).length,
    recentlyUpdated: industries.filter(ind => {
      const updated = new Date(ind.updated_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return updated >= thirtyDaysAgo;
    }).length,
  }), [industries]);

  // Loading & Error States
  if (isLoading) {
    return (
      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-20 tw:gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Factory className="tw:w-8 tw:h-8 tw:text-indigo-400" />
        </motion.div>
        <span className="tw:text-gray-500 tw:text-sm">Loading industries...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert color="danger">
        Error loading industries: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <div className="tw:relative tw:overflow-hidden">
      {/* Ambient background */}
      <div className="tw:absolute tw:inset-0 tw:overflow-hidden tw:pointer-events-none">
        <div
          className="tw:absolute tw:-top-25 tw:-right-25 tw:w-100 tw:h-100 tw:rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.06), transparent 70%)' }}
        />
        <div
          className="tw:absolute tw:-bottom-12.5 tw:-left-12.5 tw:w-75 tw:h-75 tw:rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.05), transparent 70%)' }}
        />
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
              <div
                className="tw:w-12 tw:h-12 tw:rounded-[14px] tw:flex tw:items-center tw:justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.1))',
                  border: '1px solid rgba(129,140,248,0.2)',
                }}
              >
                <Factory className="tw:w-6 tw:h-6 tw:text-indigo-400" />
              </div>
              <div>
                <h2
                  className="tw:text-[28px] tw:font-bold tw:mb-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, #818cf8 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}
                >
                  Industries Management
                </h2>
                <p className="tw:text-gray-500 tw:text-sm tw:m-0">
                  Manage industries, then add clients and skill frameworks
                </p>
              </div>
            </div>
          </div>
          <IndigoButton onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="tw:w-4.5 tw:h-4.5" />
            Add Industry
          </IndigoButton>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="tw:mb-8">
          <Row className="tw:g-3">
            {[
              { icon: Factory, label: 'Total Industries', value: stats.total, color: '#818cf8' },
              { icon: CheckCircle, label: 'Active', value: stats.active, color: '#34d399' },
              { icon: AlertCircle, label: 'Inactive', value: stats.inactive, color: '#ef4444' },
              { icon: Calendar, label: 'Updated (30d)', value: stats.recentlyUpdated, color: '#fbbf24' },
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
          <div
            className="tw:relative tw:bg-white/3 tw:rounded-[14px] tw:overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Search className="tw:absolute tw:left-4 tw:top-1/2 tw:-translate-y-1/2 tw:w-4.5 tw:h-4.5 tw:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tw:w-full tw:py-3.5 tw:pr-4 tw:pl-11 tw:bg-transparent tw:border-0 tw:outline-none tw:text-slate-200 tw:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="tw:absolute tw:right-3 tw:top-1/2 tw:-translate-y-1/2 tw:bg-white/10 tw:border-0 tw:rounded-lg tw:w-7 tw:h-7 tw:flex tw:items-center tw:justify-center tw:cursor-pointer tw:text-gray-400"
              >
                <XCircle className="tw:w-3.5 tw:h-3.5" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Industries List */}
        {filteredIndustries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="tw:text-center tw:py-16 tw:rounded-[20px]"
              style={{
                background: 'linear-gradient(135deg, rgba(129,140,248,0.05), rgba(99,102,241,0.02))',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div
                  className="tw:w-18 tw:h-18 tw:rounded-[20px] tw:mx-auto tw:mb-5 tw:flex tw:items-center tw:justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(129,140,248,0.05))',
                    border: '1px solid rgba(129,140,248,0.2)',
                  }}
                >
                  <FolderPlus className="tw:w-8 tw:h-8 tw:text-indigo-400" />
                </div>
              </motion.div>
              <h3 className="tw:text-slate-200 tw:text-lg tw:font-semibold tw:mb-2">
                {searchQuery ? 'No matching industries' : 'No industries yet'}
              </h3>
              <p className="tw:text-gray-500 tw:text-sm tw:mb-5">
                {searchQuery
                  ? `No industries match "${searchQuery}"`
                  : 'Get started by creating your first industry'
                }
              </p>
              {!searchQuery && (
                <div className="tw:flex tw:justify-center">
                  <IndigoButton onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="tw:w-4 tw:h-4" />
                    Create First Industry
                  </IndigoButton>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="tw:flex tw:flex-col tw:gap-3">
              {filteredIndustries.map((industry) => (
                <motion.div key={industry.id} variants={itemVariants}>
                  <div
                    className="tw:bg-white/2 tw:rounded-2xl tw:py-4 tw:px-5 tw:transition-all tw:duration-300 tw:ease-in-out tw:cursor-default"
                    style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(129,140,248,0.15)';
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
                      <GradientAvatar name={industry.name} />

                      {/* Industry Info */}
                      <div className="tw:flex-1 tw:min-w-0">
                        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                          <span className="tw:text-slate-100 tw:text-[15px] tw:font-semibold">
                            {industry.name}
                          </span>
                          {/* Status dot */}
                          <span
                            className="tw:w-2 tw:h-2 tw:rounded-full tw:shrink-0"
                            style={{
                              backgroundColor: industry.is_active ? '#34d399' : '#ef4444',
                              boxShadow: industry.is_active ? '0 0 8px rgba(52,211,153,0.5)' : '0 0 8px rgba(239,68,68,0.5)',
                            }}
                          />
                          <span
                            className="tw:text-[11px] tw:font-medium"
                            style={{ color: industry.is_active ? '#34d399' : '#ef4444' }}
                          >
                            {industry.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="tw:flex tw:items-center tw:gap-4 tw:flex-wrap">
                          {industry.description && (
                            <span className="tw:text-gray-500 tw:text-[13px] tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap tw:max-w-75">
                              {industry.description}
                            </span>
                          )}
                          <span className="tw:flex tw:items-center tw:gap-1 tw:text-gray-600 tw:text-xs">
                            <Calendar className="tw:w-3 tw:h-3" />
                            {new Date(industry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Industry pill */}
                      <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
                        <span
                          className="tw:inline-flex tw:items-center tw:gap-1.25 tw:py-1.25 tw:px-3 tw:rounded-[20px] tw:text-xs tw:font-semibold tw:text-indigo-400"
                          style={{
                            background: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(129,140,248,0.05))',
                            border: '1px solid rgba(129,140,248,0.25)',
                          }}
                        >
                          <Factory className="tw:w-3.25 tw:h-3.25" /> Industry
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="tw:flex tw:items-center tw:gap-2 tw:shrink-0">
                        <ActionButton icon={Edit} color="#818cf8" onClick={() => setEditingIndustry(industry)} title="Edit industry" />
                        <ActionButton icon={Trash2} color="#ef4444" onClick={() => handleDelete(industry.id)} title="Delete industry" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer count */}
            <motion.div
              className="tw:mt-4 tw:text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="tw:text-[13px] tw:text-gray-600">
                Showing {filteredIndustries.length} of {industries.length} industr{industries.length !== 1 ? 'ies' : 'y'}
              </span>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingIndustry) && (
        <IndustryModal
          industry={editingIndustry}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingIndustry(null);
          }}
          onSave={editingIndustry
            ? (data) => handleUpdate(editingIndustry.id, data)
            : (data) => handleCreate(data)
          }
          isLoading={createMutation.isPending || updateMutation.isPending}
          error={createMutation.error || updateMutation.error}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
        title="Delete Industry"
        message="Are you sure you want to delete this industry? This will also delete all associated clients and skill framework data. This action cannot be undone."
      />
    </div>
  );
}