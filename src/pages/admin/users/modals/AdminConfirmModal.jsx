import React from 'react';
import {
  Button,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Spinner, Alert,
} from 'reactstrap';
import { Crown, ShieldOff } from 'lucide-react';

export default function AdminConfirmModal({ user, onClose, onConfirm, isLoading, error }) {
  // Derived Props
  const isAssigning = !user.is_admin;
  const Icon = isAssigning ? Crown : ShieldOff;
  const accentColor = isAssigning ? '#fbbf24' : '#ef4444';

  return (
    <Modal
      isOpen
      toggle={onClose}
      centered
      contentClassName="tw:bg-gray-800 tw:border tw:border-gray-700 tw:text-white"
      style={{ maxWidth: 440 }}
    >
      <div style={{
        height: 3, width: '100%',
        background: isAssigning
          ? 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)'
          : 'linear-gradient(90deg, #ef4444, #f87171, #ef4444)',
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
            <Icon style={{ width: 18, height: 18, color: accentColor }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>
              {isAssigning ? 'Assign Admin Role' : 'Remove Admin Role'}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>
              {isAssigning ? 'Grant administrative privileges' : 'Revoke administrative privileges'}
            </div>
          </div>
        </div>
      </ModalHeader>

      {/* Confirmation Body */}
      <ModalBody style={{ paddingTop: 16 }}>
        {/* Error Alert */}
        {error && (
          <Alert color="danger" className="tw:mb-4" style={{ borderRadius: 12 }}>
            {error instanceof Error ? error.message : 'An error occurred'}
          </Alert>
        )}
        <div style={{
          padding: '16px 20px', borderRadius: 12,
          background: `${accentColor}0d`,
          border: `1px solid ${accentColor}25`,
        }}>
          <p style={{ color: '#e2e8f0', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            {isAssigning
              ? <>Are you sure you want to assign admin role to <strong>{user.name}</strong>? They will have full administrative access to the system.</>
              : <>Are you sure you want to remove admin role from <strong>{user.name}</strong>? They will lose all administrative privileges.</>
            }
          </p>
        </div>
      </ModalBody>

      {/* Footer Actions */}
      <ModalFooter className="tw:border-gray-700" style={{ paddingTop: 16, paddingBottom: 16 }}>
        <Button
          color="secondary"
          onClick={onClose}
          disabled={isLoading}
          style={{ borderRadius: 10, padding: '8px 20px', fontWeight: 500 }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          style={{
            background: isAssigning
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none', borderRadius: 10, padding: '8px 24px',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: `0 4px 16px ${accentColor}4d`,
          }}
        >
          {isLoading && <Spinner size="sm" />}
          {isLoading
            ? (isAssigning ? 'Assigning...' : 'Removing...')
            : (isAssigning ? 'Assign Admin' : 'Remove Admin')
          }
        </Button>
      </ModalFooter>
    </Modal>
  );
}
