import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Edit, ImagePlus, X, Hash, FolderPlus,
} from 'lucide-react';
import {
  Button,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Form, FormGroup, Label, Input,
  Spinner,
} from 'reactstrap';
import BrandButton from '../../../../components/buttons/BrandButton.jsx';
import IndustriesController from '../../../../api/admin/industries-controller.jsx';
import ClientsController from '../../../../api/admin/clients-controller.jsx';

export default function ClientModal({ client, onClose, onSave, isLoading }) {
  // Form State
  const [formData, setFormData] = useState({
    industry_id: client?.industry_id || '',
    client_name: client?.client_name || '',
    client_code: client?.client_code || '',
    description: client?.description || '',
    logo: client?.logo || '',
    plan_id: null,
  });
  const [logoPreview, setLogoPreview] = useState(
    client?.logo
      ? (client.logo.startsWith('data:') ? client.logo : `data:image/png;base64,${client.logo}`)
      : ''
  );

  // Logo Handlers
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setLogoPreview(dataUrl);
      const base64 = dataUrl.split(',')[1];
      setFormData((prev) => ({ ...prev, logo: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setFormData((prev) => ({ ...prev, logo: '' }));
  };

  // Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const { client_code: _, plan_id, ...baseData } = formData;
    if (!baseData.logo) baseData.logo = null;
    const submitData = client ? baseData : { ...baseData, plan_id };
    onSave(submitData);
  };

  // Industries Query
  const { data: industries = [], isLoading: industriesLoading } = useQuery({
    queryKey: ['industries'],
    queryFn: () => IndustriesController.listIndustries(true),
  });

  // Billing Plans Query (create mode only)
  const { data: billingPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => ClientsController.listBillingPlans(),
    enabled: !client,
  });

  // Auto-select the default (or first available) plan so the field is never blank
  useEffect(() => {
    if (client || !billingPlans.length || formData.plan_id) return;
    const defaultPlan = billingPlans.find(p => p.is_default && !p.is_coming_soon)
      ?? billingPlans.find(p => !p.is_coming_soon);
    if (defaultPlan) setFormData(prev => ({ ...prev, plan_id: defaultPlan.id }));
  }, [billingPlans, client]);

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
        background: 'linear-gradient(90deg, #10b981, #34d399, #818cf8)',
        borderRadius: '8px 8px 0 0',
      }} />
      <ModalHeader
        className="tw:border-gray-700"
        style={{ paddingBottom: 12 }}
      >
        <div className="tw:flex tw:items-center tw:gap-3">
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: client
              ? 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(96,165,250,0.08))'
              : 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.08))',
            border: `1px solid ${client ? 'rgba(96,165,250,0.25)' : 'rgba(52,211,153,0.25)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {client
              ? <Edit style={{ width: 18, height: 18, color: '#60a5fa' }} />
              : <FolderPlus style={{ width: 18, height: 18, color: '#34d399' }} />
            }
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>
              {client ? 'Edit Client' : 'Create New Client'}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>
              {client ? 'Update client details' : 'Onboard a new client'}
            </div>
          </div>
        </div>
      </ModalHeader>
      {/* Form Fields */}
      <ModalBody style={{ paddingTop: 16 }}>
        <Form onSubmit={handleSubmit} id="clientForm">
          <FormGroup>
            <Label for="clientIndustry" className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
              Industry <span className="tw:text-red-400">*</span>
            </Label>
            {industriesLoading ? (
              <div className="tw:flex tw:items-center tw:gap-2 tw:text-gray-400 tw:py-2">
                <Spinner size="sm" /> Loading industries...
              </div>
            ) : (
              <Input
                type="select"
                id="clientIndustry"
                value={formData.industry_id}
                onChange={(e) => setFormData({ ...formData, industry_id: e.target.value ? parseInt(e.target.value) : '' })}
                required
                className="tw:bg-gray-700! tw:border-gray-600! tw:text-white!"
                style={{ borderRadius: 10, padding: '10px 14px' }}
              >
                {!client && <option value="" disabled>Select an industry...</option>}
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </Input>
            )}
          </FormGroup>
          {!client && (
            <FormGroup>
              <Label for="clientPlan" className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                Billing Plan <span className="tw:text-red-400">*</span>
              </Label>
              {plansLoading ? (
                <div className="tw:flex tw:items-center tw:gap-2 tw:text-gray-400 tw:py-2">
                  <Spinner size="sm" /> Loading plans...
                </div>
              ) : (
                <Input
                  type="select"
                  id="clientPlan"
                  value={formData.plan_id || ''}
                  onChange={(e) => setFormData({ ...formData, plan_id: e.target.value ? parseInt(e.target.value) : null })}
                  required
                  className="tw:bg-gray-700! tw:border-gray-600! tw:text-white!"
                  style={{ borderRadius: 10, padding: '10px 14px' }}
                >
                  <option value="" disabled>Select a billing plan...</option>
                  {billingPlans.map((plan) => (
                    <option key={plan.id} value={plan.id} disabled={plan.is_coming_soon}>
                      {plan.plan_name}
                      {' — '}
                      ${Number(plan.monthly_price).toLocaleString()}/mo
                      {plan.is_coming_soon ? ' (Coming Soon)' : ''}
                    </option>
                  ))}
                </Input>
              )}
            </FormGroup>
          )}

          <FormGroup>
            <Label for="clientName" className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
              Client Name <span className="tw:text-red-400">*</span>
            </Label>
            <Input
              type="text"
              id="clientName"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              required
              className="tw:bg-gray-700! tw:border-gray-600! tw:text-white!"
              placeholder="Enter client name"
              style={{ borderRadius: 10, padding: '10px 14px' }}
            />
          </FormGroup>
          {client && (
            <FormGroup>
              <Label for="clientCode" className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
                Client Code
              </Label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <Hash style={{ width: 14, height: 14, color: '#6b7280' }} />
                <span style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: 14 }}>
                  {formData.client_code}
                </span>
              </div>
              <small style={{ color: '#4b5563', fontSize: 11, marginTop: 4, display: 'block' }}>
                Auto-generated and cannot be changed
              </small>
            </FormGroup>
          )}
          <FormGroup>
            <Label for="clientDescription" className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
              Description
            </Label>
            <Input
              type="textarea"
              id="clientDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="tw:bg-gray-700! tw:border-gray-600! tw:text-white!"
              placeholder="Enter description (optional)"
              style={{ borderRadius: 10, padding: '10px 14px' }}
            />
          </FormGroup>
          <FormGroup>
            <Label className="tw:text-gray-300 tw:mb-2" style={{ fontSize: 13, fontWeight: 500 }}>Logo</Label>
            {logoPreview ? (
              <div className="tw:flex tw:items-center tw:gap-3 tw:mb-3">
                <div style={{
                  width: 64, height: 64, borderRadius: 14, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleRemoveLogo}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
                    background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer',
                  }}
                >
                  <X style={{ width: 14, height: 14 }} />
                  Remove
                </motion.button>
              </div>
            ) : null}
            <Label
              for="clientLogo"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(255,255,255,0.15)',
                cursor: 'pointer', color: '#9ca3af', fontSize: 13, fontWeight: 500,
                transition: 'all 0.2s ease', margin: 0,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(52,211,153,0.3)';
                e.currentTarget.style.color = '#34d399';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.color = '#9ca3af';
              }}
            >
              <ImagePlus style={{ width: 18, height: 18 }} />
              {logoPreview ? 'Change logo' : 'Upload a logo image'}
            </Label>
            <Input
              type="file"
              id="clientLogo"
              accept="image/*"
              onChange={handleLogoChange}
              className="tw:hidden"
            />
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
        <BrandButton
          type="submit"
          form="clientForm"
          loading={isLoading}
          loadingText="Saving..."
          compact
        >
          {client ? 'Update Client' : 'Create Client'}
        </BrandButton>
      </ModalFooter>
    </Modal>
  );
}
