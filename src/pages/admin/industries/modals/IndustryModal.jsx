import React, { useState } from 'react';
import { Edit, FolderPlus } from 'lucide-react';
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Button,
  Form, FormGroup, Label, Input,
  Alert,
} from 'reactstrap';
import IndigoButton from '../../../../components/buttons/IndigoButton.jsx';

export default function IndustryModal({ industry, onClose, onSave, isLoading, error }) {
  // Form State
  const [formData, setFormData] = useState({
    name: industry?.name || '',
    description: industry?.description || '',
    is_active: industry?.is_active ?? true,
  });

  // Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal
      isOpen
      toggle={onClose}
      centered
      contentClassName="tw:bg-gray-800 tw:border tw:border-gray-700 tw:text-white"
      style={{ maxWidth: 480 }}
    >
      <div
        className="tw:h-0.75 tw:w-full tw:rounded-t-lg"
        style={{ background: 'linear-gradient(90deg, #6366f1, #818cf8, #a78bfa)' }}
      />
      <ModalHeader
        className="tw:border-gray-700 tw:pb-3"
      >
        <div className="tw:flex tw:items-center tw:gap-3">
          <div
            className="tw:w-10 tw:h-10 tw:rounded-xl tw:flex tw:items-center tw:justify-center"
            style={{
              background: industry
                ? 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(129,140,248,0.08))'
                : 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.08))',
              border: `1px solid ${industry ? 'rgba(129,140,248,0.25)' : 'rgba(52,211,153,0.25)'}`,
            }}
          >
            {industry
              ? <Edit className="tw:w-4.5 tw:h-4.5 tw:text-indigo-400" />
              : <FolderPlus className="tw:w-4.5 tw:h-4.5 tw:text-emerald-400" />
            }
          </div>
          <div>
            <div className="tw:text-lg tw:font-semibold tw:text-slate-100">
              {industry ? 'Edit Industry' : 'Create New Industry'}
            </div>
            <div className="tw:text-xs tw:text-gray-500 tw:font-normal">
              {industry ? 'Update industry details' : 'Set up a new industry'}
            </div>
          </div>
        </div>
      </ModalHeader>
      <ModalBody className="tw:pt-4">
        {error && (
          <Alert color="danger" className="tw:mb-4 tw:rounded-xl">
            {error instanceof Error ? error.message : 'An error occurred'}
          </Alert>
        )}
        <Form onSubmit={handleSubmit} id="industryForm">
          <FormGroup>
            <Label for="industryName" className="tw:text-gray-300 tw:mb-1 tw:text-[13px] tw:font-medium">
              Industry Name <span className="tw:text-red-400">*</span>
            </Label>
            <Input
              type="text"
              id="industryName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="tw:bg-gray-700! tw:border-gray-600! tw:text-white! tw:rounded-[10px]! tw:py-2.5! tw:px-3.5!"
              placeholder="Enter industry name"
            />
          </FormGroup>
          <FormGroup>
            <Label for="industryDescription" className="tw:text-gray-300 tw:mb-1 tw:text-[13px] tw:font-medium">
              Description
            </Label>
            <Input
              type="textarea"
              id="industryDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="tw:bg-gray-700! tw:border-gray-600! tw:text-white! tw:rounded-[10px]! tw:py-2.5! tw:px-3.5!"
              placeholder="Enter description (optional)"
            />
          </FormGroup>
          <FormGroup check className="tw:mt-3">
            <div
              className="tw:flex tw:items-center tw:gap-2.5 tw:py-2.5 tw:px-3.5 tw:rounded-[10px]"
              style={{
                background: formData.is_active ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${formData.is_active ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}
            >
              <Input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="tw:mt-0"
              />
              <Label
                check
                for="is_active"
                className="tw:font-medium tw:text-sm tw:m-0"
                style={{ color: formData.is_active ? '#34d399' : '#ef4444' }}
              >
                {formData.is_active ? 'Active' : 'Inactive'}
              </Label>
            </div>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter className="tw:border-gray-700 tw:py-4">
        <Button
          color="secondary"
          onClick={onClose}
          className="tw:rounded-[10px] tw:py-2 tw:px-5 tw:font-medium"
        >
          Cancel
        </Button>
        <IndigoButton
          type="submit"
          form="industryForm"
          loading={isLoading}
          loadingText="Saving..."
          compact
        >
          {industry ? 'Update Industry' : 'Create Industry'}
        </IndigoButton>
      </ModalFooter>
    </Modal>
  );
}
