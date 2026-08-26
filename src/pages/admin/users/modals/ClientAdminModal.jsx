import React, { useState, useMemo } from 'react';
import {
  Button, Label,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Spinner, Alert,
} from 'reactstrap';
import { Select, MenuItem, FormControl } from '@mui/material';
import { Building2, Plus, Trash2, AlertTriangle } from 'lucide-react';

// Style Constants
const accentColor = '#a78bfa';
const dangerColor = '#ef4444';

export default function ClientAdminModal({
  user, onClose, onAssign, onRemove,
  assignLoading, removeLoading, error,
  clients, clientsLoading,
}) {
  // State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null);

  // Derived Data
  const activeAssignedClientIds = useMemo(() => {
    return new Set(
      (user.client_admin_clients || [])
        .filter(ca => ca.client_admin_active !== false)
        .map(ca => ca.client_id)
    );
  }, [user.client_admin_clients]);

  const availableClients = useMemo(() => {
    return (clients || []).filter(c => !activeAssignedClientIds.has(c.id));
  }, [clients, activeAssignedClientIds]);

  const activeAssignments = useMemo(() => {
    return (user.client_admin_clients || []).filter(ca => ca.client_admin_active !== false);
  }, [user.client_admin_clients]);

  const isAnyLoading = assignLoading || removeLoading;

  // Event Handlers
  const handleAssign = () => {
    if (selectedClientId) {
      onAssign(parseInt(selectedClientId));
      setSelectedClientId('');
    }
  };

  const handleRemoveClick = (ca) => {
    setConfirmRemove(ca);
  };

  const handleConfirmRemove = () => {
    if (confirmRemove) {
      onRemove(confirmRemove.client_id);
      setConfirmRemove(null);
    }
  };

  return (
    <Modal
      isOpen
      toggle={onClose}
      centered
      contentClassName="tw:bg-gray-800 tw:border tw:border-gray-700 tw:text-white"
      style={{ maxWidth: 520 }}
    >
      {/* Gradient header bar */}
      <div style={{
        height: 3, width: '100%',
        background: `linear-gradient(90deg, #8b5cf6, ${accentColor}, #8b5cf6)`,
        borderRadius: '8px 8px 0 0',
      }} />

      <ModalHeader
        className="tw:border-gray-700"
        style={{ paddingBottom: 12 }}
      >
        <div className="tw:flex tw:items-center tw:gap-3">
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}14)`,
            border: `1px solid ${accentColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 style={{ width: 18, height: 18, color: accentColor }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>
              Manage Client Admin Roles
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>
              {user.name}
            </div>
          </div>
        </div>
      </ModalHeader>

      <ModalBody style={{ paddingTop: 16 }}>
        {error && (
          <Alert color="danger" className="tw:mb-4" style={{ borderRadius: 12 }}>
            {error instanceof Error ? error.message : 'An error occurred'}
          </Alert>
        )}

        {/* Assign section */}
        <div style={{
          padding: '16px', borderRadius: 12,
          background: `${accentColor}0d`,
          border: `1px solid ${accentColor}25`,
          marginBottom: 20,
        }}>
          <Label style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 8, display: 'block' }}>
            Assign to Client
          </Label>
          {clientsLoading ? (
            <div className="tw:flex tw:items-center tw:gap-2" style={{ color: '#9ca3af', fontSize: 13 }}>
              <Spinner size="sm" /> Loading clients...
            </div>
          ) : availableClients.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: 13, fontStyle: 'italic' }}>
              {(clients || []).length === 0 ? 'No clients available' : 'All clients have been assigned'}
            </div>
          ) : (
            <div className="tw:flex tw:gap-2 tw:items-center">
              <FormControl size="small" sx={{ flex: 1 }}>
                <Select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  disabled={isAnyLoading}
                  displayEmpty
                  sx={{
                    borderRadius: '10px',
                    backgroundColor: 'rgba(55, 65, 81, 0.8)',
                    color: '#e2e8f0',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(75, 85, 99, 0.6)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: accentColor,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: accentColor,
                    },
                    '.MuiSvgIcon-root': {
                      color: '#9ca3af',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: '#1f2937',
                        border: '1px solid rgba(75, 85, 99, 0.6)',
                        borderRadius: '10px',
                        mt: 0.5,
                        '& .MuiMenuItem-root': {
                          color: '#e2e8f0',
                          fontSize: 14,
                          '&:hover': {
                            backgroundColor: `${accentColor}22`,
                          },
                          '&.Mui-selected': {
                            backgroundColor: `${accentColor}33`,
                            '&:hover': {
                              backgroundColor: `${accentColor}44`,
                            },
                          },
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    <span style={{ color: '#6b7280' }}>Select a client...</span>
                  </MenuItem>
                  {availableClients.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.client_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                onClick={handleAssign}
                disabled={!selectedClientId || isAnyLoading}
                style={{
                  background: `linear-gradient(135deg, #8b5cf6, #7c3aed)`,
                  border: 'none', borderRadius: 10, padding: '8px 16px',
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: `0 4px 16px ${accentColor}4d`,
                  opacity: (!selectedClientId || isAnyLoading) ? 0.5 : 1,
                }}
              >
                {assignLoading ? <Spinner size="sm" /> : <Plus style={{ width: 16, height: 16 }} />}
                Assign
              </Button>
            </div>
          )}
        </div>

        {/* Assigned clients list */}
        <div>
          <Label style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 8, display: 'block' }}>
            Assigned Clients ({activeAssignments.length})
          </Label>
          {activeAssignments.length === 0 ? (
            <div style={{
              padding: '20px', borderRadius: 12, textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#4b5563', fontSize: 13,
            }}>
              No client admin roles assigned
            </div>
          ) : (
            <div className="tw:flex tw:flex-col tw:gap-2">
              {activeAssignments.map((ca) => (
                <div key={ca.client_admin_id}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.2s',
                  }}>
                    <div className="tw:flex tw:items-center tw:gap-3">
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}0a)`,
                        border: `1px solid ${accentColor}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Building2 style={{ width: 14, height: 14, color: accentColor }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>
                        {ca.client_name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveClick(ca)}
                      disabled={isAnyLoading}
                      title="Remove client admin role"
                      style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: confirmRemove?.client_admin_id === ca.client_admin_id
                          ? `${dangerColor}22`
                          : 'rgba(255,255,255,0.04)',
                        border: confirmRemove?.client_admin_id === ca.client_admin_id
                          ? `1px solid ${dangerColor}40`
                          : '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: isAnyLoading ? 'not-allowed' : 'pointer',
                        opacity: isAnyLoading ? 0.5 : 1,
                        transition: 'all 0.2s',
                      }}
                    >
                      <Trash2 style={{ width: 14, height: 14, color: dangerColor }} />
                    </button>
                  </div>

                  {/* Inline confirmation */}
                  {confirmRemove?.client_admin_id === ca.client_admin_id && (
                    <div style={{
                      marginTop: 6, padding: '12px 14px', borderRadius: 10,
                      background: `${dangerColor}0d`,
                      border: `1px solid ${dangerColor}25`,
                    }}>
                      <div className="tw:flex tw:items-start tw:gap-2 tw:mb-3">
                        <AlertTriangle style={{ width: 16, height: 16, color: dangerColor, flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.5 }}>
                          Remove <strong>{ca.client_name}</strong> client admin role from <strong>{user.name}</strong>?
                        </span>
                      </div>
                      <div className="tw:flex tw:gap-2 tw:justify-end">
                        <Button
                          size="sm"
                          color="secondary"
                          onClick={() => setConfirmRemove(null)}
                          disabled={removeLoading}
                          style={{ borderRadius: 8, padding: '4px 14px', fontWeight: 500 }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleConfirmRemove}
                          disabled={removeLoading}
                          style={{
                            background: `linear-gradient(135deg, ${dangerColor}, #dc2626)`,
                            border: 'none', borderRadius: 8, padding: '4px 14px',
                            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                            boxShadow: `0 4px 12px ${dangerColor}4d`,
                          }}
                        >
                          {removeLoading ? <Spinner size="sm" /> : null}
                          {removeLoading ? 'Removing...' : 'Confirm Remove'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalBody>

      {/* Footer Actions */}
      <ModalFooter className="tw:border-gray-700" style={{ paddingTop: 16, paddingBottom: 16 }}>
        <Button
          color="secondary"
          onClick={onClose}
          disabled={isAnyLoading}
          style={{ borderRadius: 10, padding: '8px 20px', fontWeight: 500 }}
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
