import React, { useState } from 'react';
import {
  Button,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Form, FormGroup, Label, Input,
  Spinner, Alert,
} from 'reactstrap';
import { Edit, UserPlus } from 'lucide-react';

export default function UserModal({ user, onClose, onSave, isLoading, error }) {
  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    description: user?.description || '',
    is_active: user?.is_active ?? true,
  });

  // Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!submitData.password) {
      delete submitData.password;
    }
    onSave(submitData);
  };

  return (
    <Modal
      isOpen
      toggle={onClose}
      centered
      contentClassName="tw:bg-gray-800 tw:border tw:border-gray-700 tw:text-white"
      style={{ maxWidth: 480 }}
    >
      <div style={{
        height: 3, width: '100%',
        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
        borderRadius: '8px 8px 0 0',
      }} />
      <ModalHeader
        className="tw:border-gray-700"
        style={{ paddingBottom: 12 }}
      >
        <div className="tw:flex tw:items-center tw:gap-3">
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: user
              ? 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(96,165,250,0.08))'
              : 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.08))',
            border: `1px solid ${user ? 'rgba(96,165,250,0.25)' : 'rgba(52,211,153,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {user
              ? <Edit style={{ width: 18, height: 18, color: '#60a5fa' }} />
              : <UserPlus style={{ width: 18, height: 18, color: '#34d399' }} />
            }
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>
              {user ? 'Edit User' : 'Create New User'}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>
              {user ? 'Update account details' : 'Set up a new account'}
            </div>
          </div>
        </div>
      </ModalHeader>
      <ModalBody style={{ paddingTop: 16 }}>
        {/* Error Alert */}
        {error && (
          <Alert color="danger" className="tw:mb-4" style={{ borderRadius: 12 }}>
            {error instanceof Error ? error.message : 'An error occurred'}
          </Alert>
        )}
        {/* Form Fields */}
        <Form onSubmit={handleSubmit} id="userForm">
          <FormGroup>
            <Label for="userName" className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
              Name <span className="tw:text-red-400">*</span>
            </Label>
            <Input
              type="text"
              id="userName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="tw:bg-gray-700! tw:border-gray-600! tw:text-white!"
              placeholder="Enter full name"
              style={{ borderRadius: 10, padding: '10px 14px' }}
            />
          </FormGroup>
          <FormGroup>
            <Label for="userEmail" className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
              Email
            </Label>
            <Input
              type="email"
              id="userEmail"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="tw:bg-gray-700! tw:border-gray-600! tw:text-white!"
              placeholder="Enter email address"
              style={{ borderRadius: 10, padding: '10px 14px' }}
            />
          </FormGroup>
          <FormGroup>
            <Label for="userPassword" className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
              Password {!user && <span className="tw:text-red-400">*</span>}
            </Label>
            <Input
              type="password"
              id="userPassword"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!user}
              className="tw:bg-gray-700! tw:border-gray-600! tw:text-white!"
              placeholder={user ? 'Leave blank to keep current' : 'Enter password'}
              style={{ borderRadius: 10, padding: '10px 14px' }}
            />
            {user && (
              <small style={{ color: '#6b7280', fontSize: 12, marginTop: 4, display: 'block' }}>
                Leave blank to keep the existing password
              </small>
            )}
          </FormGroup>
          <FormGroup>
            <Label for="userDescription" className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
              Description
            </Label>
            <Input
              type="textarea"
              id="userDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="tw:bg-gray-700! tw:border-gray-600! tw:text-white!"
              placeholder="Enter description (optional)"
              style={{ borderRadius: 10, padding: '10px 14px' }}
            />
          </FormGroup>
          <FormGroup check className="tw:mt-3">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              background: formData.is_active ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${formData.is_active ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
              <Input
                type="checkbox"
                id="userIsActive"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                style={{ marginTop: 0 }}
              />
              <Label check for="userIsActive" style={{ color: formData.is_active ? '#34d399' : '#ef4444', fontWeight: 500, fontSize: 14, margin: 0 }}>
                {formData.is_active ? 'Active' : 'Inactive'}
              </Label>
            </div>
          </FormGroup>
        </Form>
      </ModalBody>
      {/* Footer Actions */}
      <ModalFooter className="tw:border-gray-700" style={{ paddingTop: 16, paddingBottom: 16 }}>
        <Button
          color="secondary"
          onClick={onClose}
          style={{ borderRadius: 10, padding: '8px 20px', fontWeight: 500 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="userForm"
          disabled={isLoading}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            border: 'none', borderRadius: 10, padding: '8px 24px',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
          }}
        >
          {isLoading && <Spinner size="sm" />}
          {isLoading ? 'Saving...' : user ? 'Update User' : 'Create User'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
