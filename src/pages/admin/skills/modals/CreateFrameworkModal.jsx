import React, { useState } from 'react';
import {
  Button,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Form, FormGroup, Label, Input,
  Spinner, Alert,
} from 'reactstrap';
import { FolderPlus } from 'lucide-react';

export default function CreateFrameworkModal({ clients, onClose, onSave, isLoading, error }) {
  // Form State
  const [clientId, setClientId] = useState(clients[0]?.id ?? 0);
  const [formData, setFormData] = useState({
    framework_name: '',
    description: '',
    version: '',
    created_by: '',
  });

  // Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(clientId, {
      framework_name: formData.framework_name,
      description: formData.description || undefined,
      version: formData.version || undefined,
      created_by: formData.created_by || undefined,
    });
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
        background: 'linear-gradient(90deg, #6366f1, #818cf8, #a78bfa)',
        borderRadius: '8px 8px 0 0',
      }} />
      <ModalHeader
        className="tw:border-gray-700"
        style={{ paddingBottom: 12 }}
      >
        <div className="tw:flex tw:items-center tw:gap-3">
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(129,140,248,0.08))',
            border: '1px solid rgba(129,140,248,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FolderPlus style={{ width: 18, height: 18, color: '#818cf8' }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>
              Create New Framework
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>
              Set up a new skill framework
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
        <Form onSubmit={handleSubmit} id="createFrameworkForm">
          <FormGroup>
            <Label for="fwClient" className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
              Client <span className="tw:text-red-400">*</span>
            </Label>
            <Input
              type="select"
              id="fwClient"
              value={clientId}
              onChange={(e) => setClientId(parseInt(e.target.value))}
              className="tw:bg-gray-700! tw:border-gray-600! tw:text-white!"
              style={{ borderRadius: 10, padding: '10px 14px' }}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.client_name} ({c.client_code})
                </option>
              ))}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label for="fwName" className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
              Framework Name <span className="tw:text-red-400">*</span>
            </Label>
            <Input
              type="text"
              id="fwName"
              value={formData.framework_name}
              onChange={(e) => setFormData({ ...formData, framework_name: e.target.value })}
              required
              className="tw:bg-gray-700! tw:border-gray-600! tw:text-white!"
              placeholder="Enter framework name"
              style={{ borderRadius: 10, padding: '10px 14px' }}
            />
          </FormGroup>
          <FormGroup>
            <Label for="fwDescription" className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
              Description
            </Label>
            <Input
              type="textarea"
              id="fwDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="tw:bg-gray-700! tw:border-gray-600! tw:text-white!"
              placeholder="Enter description (optional)"
              style={{ borderRadius: 10, padding: '10px 14px' }}
            />
          </FormGroup>
          <FormGroup>
            <Label for="fwVersion" className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
              Version (optional)
            </Label>
            <Input
              type="text"
              id="fwVersion"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="tw:bg-gray-700! tw:border-gray-600! tw:text-white!"
              placeholder="e.g., v1.0, 2024-Q1"
              style={{ borderRadius: 10, padding: '10px 14px' }}
            />
          </FormGroup>
        </Form>
      </ModalBody>
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
          form="createFrameworkForm"
          disabled={isLoading}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            border: 'none', borderRadius: 10, padding: '8px 24px',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
          }}
        >
          {isLoading && <Spinner size="sm" />}
          {isLoading ? 'Creating...' : 'Create'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
