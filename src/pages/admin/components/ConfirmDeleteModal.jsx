import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from 'reactstrap';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, isLoading, title, message }) {
  return (
    <Modal
      isOpen={isOpen}
      toggle={onClose}
      centered
      contentClassName="tw:bg-gray-800 tw:border tw:border-gray-700 tw:text-white"
      style={{ maxWidth: 420 }}
    >
      <div style={{
        height: 3, width: '100%',
        background: 'linear-gradient(90deg, #ef4444, #f87171, #fca5a5)',
        borderRadius: '8px 8px 0 0',
      }} />
      <ModalHeader
        className="tw:border-gray-700"
        style={{ paddingBottom: 12 }}
      >
        <div className="tw:flex tw:items-center tw:gap-3">
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))',
            border: '1px solid rgba(239,68,68,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle style={{ width: 18, height: 18, color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>
            {title || 'Confirm Delete'}
          </div>
        </div>
      </ModalHeader>
      {/* Warning Message */}
      <ModalBody style={{ paddingTop: 16, paddingBottom: 16 }}>
        <p style={{ color: '#9ca3af', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          {message || 'Are you sure? This action cannot be undone.'}
        </p>
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
            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            border: 'none', borderRadius: 10, padding: '8px 24px',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
          }}
        >
          {isLoading && <Spinner size="sm" />}
          {isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
