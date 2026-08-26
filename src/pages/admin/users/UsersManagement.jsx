'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, Users, XCircle,
  Building2, Search, UserPlus, UserCheck, Crown,
  Mail, Calendar, ShieldOff,
} from 'lucide-react';
import {
  Row, Col,
  Button,
  Alert,
} from 'reactstrap';
import UsersController from '../../../api/admin/users-controller.jsx';
import ClientsController from '../../../api/admin/clients-controller.jsx';
import ActionButton from '../components/ActionButton.jsx';
import StatCard from '../components/StatCard.jsx';
import GradientAvatar from '../../../components/admin/GradientAvatar.jsx';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal.jsx';
import UserModal from './modals/UserModal.jsx';
import AdminConfirmModal from './modals/AdminConfirmModal.jsx';
import ClientAdminModal from './modals/ClientAdminModal.jsx';

// Animation Variants
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};


export default function UsersManagement() {
  // State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminToggleUser, setAdminToggleUser] = useState(null);
  const [clientAdminUser, setClientAdminUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedClientAdmin, setExpandedClientAdmin] = useState(null);
  const queryClient = useQueryClient();

  // Queries
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => UsersController.listUsers(false),
  });

  const { data: allClients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => ClientsController.listClients(null, true),
    enabled: !!clientAdminUser,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => UsersController.createUser(data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['users'] });
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => UsersController.updateUser(id, data),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => UsersController.deleteUser(id),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['users'] });
    },
  });

  const adminToggleMutation = useMutation({
    mutationFn: (user) => user.is_admin
      ? UsersController.removeAdminRole(user.id)
      : UsersController.assignAdminRole(user.id),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['users'] });
      setAdminToggleUser(null);
    },
  });

  const assignClientAdminMutation = useMutation({
    mutationFn: ({ userId, clientId }) => UsersController.assignClientAdminRole(userId, clientId),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['users'] });
    },
  });

  const removeClientAdminMutation = useMutation({
    mutationFn: ({ userId, clientId }) => UsersController.removeClientAdminRole(userId, clientId),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['users'] });
    },
  });

  // Derived State
  const liveClientAdminUser = useMemo(() => {
    if (!clientAdminUser) return null;
    return users.find(u => u.id === clientAdminUser.id) || clientAdminUser;
  }, [clientAdminUser, users]);

  // Event Handlers
  const handleCreate = (data) => createMutation.mutate(data);
  const handleUpdate = (id, data) => updateMutation.mutate({ id, data });
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
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.is_admin).length,
    clientAdmins: users.filter(u => u.client_admin_clients?.some(ca => ca.client_admin_active !== false)).length,
  }), [users]);

  // Loading & Error States
  if (isLoading) {
    return (
      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-20 tw:gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Users style={{ width: 32, height: 32, color: '#60a5fa' }} />
        </motion.div>
        <span style={{ color: '#6b7280', fontSize: 14 }}>Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert color="danger">
        Error loading users: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <div className="tw:relative tw:overflow-hidden">
      {/* Ambient background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: -100, right: -100, width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96,165,250,0.06), transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -50, left: -50, width: 300, height: 300,
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
                background: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(129,140,248,0.1))',
                border: '1px solid rgba(96,165,250,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users style={{ width: 24, height: 24, color: '#60a5fa' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: 28, fontWeight: 700, marginBottom: 2,
                  background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, #60a5fa 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Users Management
                </h2>
                <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                  Manage accounts, roles, and permissions
                </p>
              </div>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                border: 'none',
                borderRadius: 12,
                padding: '10px 20px',
                fontWeight: 600,
                fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
              }}
            >
              <Plus style={{ width: 18, height: 18 }} />
              Add User
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="tw:mb-8">
          <Row className="tw:g-3">
            {[
              { icon: Users, label: 'Total Users', value: stats.total, color: '#60a5fa' },
              { icon: UserCheck, label: 'Active', value: stats.active, color: '#34d399' },
              { icon: Crown, label: 'Admins', value: stats.admins, color: '#fbbf24' },
              { icon: Building2, label: 'Client Admins', value: stats.clientAdmins, color: '#a78bfa' },
            ].map((stat, i) => (
              <Col xs="6" lg="3" key={i}>
                <StatCard {...stat} delay={i * 0.1} />
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
              placeholder="Search by name or email..."
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

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="tw:text-center tw:py-16"
              style={{
                background: 'linear-gradient(135deg, rgba(96,165,250,0.05), rgba(129,140,248,0.02))',
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
                  background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(96,165,250,0.05))',
                  border: '1px solid rgba(96,165,250,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <UserPlus style={{ width: 32, height: 32, color: '#60a5fa' }} />
                </div>
              </motion.div>
              <h3 style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                {searchQuery ? 'No matching users' : 'No users yet'}
              </h3>
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
                {searchQuery
                  ? `No users match "${searchQuery}"`
                  : 'Get started by creating your first user account'
                }
              </p>
              {!searchQuery && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                      border: 'none', borderRadius: 12, padding: '10px 24px',
                      fontWeight: 600, fontSize: 14,
                      boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
                    }}
                  >
                    <Plus style={{ width: 16, height: 16, marginRight: 8, display: 'inline' }} />
                    Create First User
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="tw:flex tw:flex-col tw:gap-3">
              {filteredUsers.map((user) => (
                <motion.div key={user.id} variants={itemVariants}>
                  <div
                    className="tw:group"
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
                      e.currentTarget.style.borderColor = 'rgba(96,165,250,0.15)';
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
                    {/* Top Row: Avatar, Info, Role Badge, Actions */}
                    <div className="tw:flex tw:items-center tw:gap-4 tw:flex-wrap">
                      {/* Avatar */}
                      <GradientAvatar name={user.name} doubleInitial fontSize={16} />

                      {/* User Info */}
                      <div className="tw:flex-1 tw:min-w-0">
                        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                          <span style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600 }}>
                            {user.name}
                          </span>
                          {/* Status dot */}
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                            backgroundColor: user.is_active ? '#34d399' : '#ef4444',
                            boxShadow: user.is_active ? '0 0 8px rgba(52,211,153,0.5)' : '0 0 8px rgba(239,68,68,0.5)',
                          }} />
                          <span style={{
                            fontSize: 11, fontWeight: 500, color: user.is_active ? '#34d399' : '#ef4444',
                          }}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {user.is_admin && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                              background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
                              color: '#fbbf24',
                              border: '1px solid rgba(251,191,36,0.25)',
                            }}>
                              <Crown style={{ width: 12, height: 12 }} /> Admin
                            </span>
                          )}
                          {(() => {
                            const activeClients = user.client_admin_clients?.filter(ca => ca.client_admin_active !== false) || [];
                            return activeClients.length > 0 ? (
                              <span
                                onClick={() => setExpandedClientAdmin(expandedClientAdmin === user.id ? null : user.id)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                                  background: expandedClientAdmin === user.id
                                    ? 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(167,139,250,0.12))'
                                    : 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.05))',
                                  color: '#a78bfa',
                                  border: expandedClientAdmin === user.id
                                    ? '1px solid rgba(167,139,250,0.4)'
                                    : '1px solid rgba(167,139,250,0.25)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  userSelect: 'none',
                                }}
                              >
                                <Building2 style={{ width: 12, height: 12 }} />
                                Client Admin
                                <span style={{
                                  fontSize: 10, fontWeight: 700, lineHeight: 1,
                                  background: 'rgba(167,139,250,0.2)',
                                  padding: '2px 6px', borderRadius: 8,
                                  minWidth: 18, textAlign: 'center',
                                }}>
                                  {activeClients.length}
                                </span>
                                <motion.span
                                  animate={{ rotate: expandedClientAdmin === user.id ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                  style={{ display: 'inline-flex', marginLeft: -2 }}
                                >
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </motion.span>
                              </span>
                            ) : null;
                          })()}
                          {!user.is_admin && !user.client_admin_clients?.some(ca => ca.client_admin_active !== false) && (
                            <span style={{
                              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                              background: 'rgba(255,255,255,0.04)',
                              color: '#4b5563',
                              border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                              Default
                            </span>
                          )}
                        </div>
                        <div className="tw:flex tw:items-center tw:gap-4 tw:flex-wrap">
                          {user.email && (
                            <span className="tw:flex tw:items-center tw:gap-1" style={{ color: '#6b7280', fontSize: 13 }}>
                              <Mail style={{ width: 12, height: 12 }} />
                              {user.email}
                            </span>
                          )}
                          <span className="tw:flex tw:items-center tw:gap-1" style={{ color: '#4b5563', fontSize: 12 }}>
                            <Calendar style={{ width: 12, height: 12 }} />
                            {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="tw:flex tw:items-center tw:gap-2" style={{ flexShrink: 0 }}>
                        <ActionButton
                          icon={user.is_admin ? ShieldOff : Crown}
                          color={user.is_admin ? '#f59e0b' : '#fbbf24'}
                          onClick={() => setAdminToggleUser(user)}
                          title={user.is_admin ? 'Remove admin role' : 'Assign admin role'}
                        />
                        <ActionButton icon={Building2} color="#a78bfa" onClick={() => setClientAdminUser(user)} title="Manage client admin roles" />
                        <ActionButton icon={Edit} color="#60a5fa" onClick={() => setEditingUser(user)} title="Edit user" />
                        <ActionButton icon={Trash2} color="#ef4444" onClick={() => handleDelete(user.id)} title="Delete user" />
                      </div>
                    </div>

                    {/* Client Admin Assignments - Collapsible */}
                    <AnimatePresence>
                      {expandedClientAdmin === user.id && (() => {
                        const activeClients = user.client_admin_clients?.filter(ca => ca.client_admin_active !== false) || [];
                        return activeClients.length > 0 ? (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            style={{ overflow: 'hidden', marginLeft: 56, marginTop: 12 }}
                          >
                            <div style={{
                              borderRadius: 12,
                              overflow: 'hidden',
                              border: '1px solid rgba(167,139,250,0.12)',
                              background: 'rgba(167,139,250,0.03)',
                            }}>
                              {activeClients.map((ca, idx) => (
                                <div
                                  key={ca.client_admin_id}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '9px 14px',
                                    borderBottom: idx < activeClients.length - 1
                                      ? '1px solid rgba(167,139,250,0.06)' : 'none',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.08)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <span style={{
                                    width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                                    background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(129,140,248,0.1))',
                                    border: '1px solid rgba(167,139,250,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>
                                    <Building2 style={{ width: 12, height: 12, color: '#a78bfa' }} />
                                  </span>
                                  <span style={{ fontSize: 12.5, fontWeight: 500, color: '#c4b5fd' }}>
                                    {ca.client_name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        ) : null;
                      })()}
                    </AnimatePresence>
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
              <span style={{ fontSize: 13, color: '#4b5563' }}>
                Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
              </span>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingUser) && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingUser(null);
          }}
          onSave={editingUser
            ? (data) => handleUpdate(editingUser.id, data)
            : (data) => handleCreate(data)
          }
          isLoading={createMutation.isPending || updateMutation.isPending}
          error={createMutation.error || updateMutation.error}
        />
      )}

      {/* Admin Role Confirmation Modal */}
      {adminToggleUser && (
        <AdminConfirmModal
          user={adminToggleUser}
          onClose={() => {
            setAdminToggleUser(null);
            adminToggleMutation.reset();
          }}
          onConfirm={() => adminToggleMutation.mutate(adminToggleUser)}
          isLoading={adminToggleMutation.isPending}
          error={adminToggleMutation.error}
        />
      )}

      {/* Client Admin Role Modal */}
      {clientAdminUser && (
        <ClientAdminModal
          user={liveClientAdminUser}
          onClose={() => {
            setClientAdminUser(null);
            assignClientAdminMutation.reset();
            removeClientAdminMutation.reset();
          }}
          onAssign={(clientId) =>
            assignClientAdminMutation.mutate({ userId: clientAdminUser.id, clientId })
          }
          onRemove={(clientId) =>
            removeClientAdminMutation.mutate({ userId: clientAdminUser.id, clientId })
          }
          assignLoading={assignClientAdminMutation.isPending}
          removeLoading={removeClientAdminMutation.isPending}
          error={assignClientAdminMutation.error || removeClientAdminMutation.error}
          clients={allClients}
          clientsLoading={clientsLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
        title="Delete User"
        message="Are you sure you want to delete this user? This will also remove their admin and client admin roles. This action cannot be undone."
      />
    </div>
  );
}
