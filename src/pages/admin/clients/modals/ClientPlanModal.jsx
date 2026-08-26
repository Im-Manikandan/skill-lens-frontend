import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CreditCard, Check, Zap, Star, Crown } from 'lucide-react';
import {
  Button,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Spinner,
} from 'reactstrap';
import BrandButton from '../../../../components/buttons/BrandButton.jsx';
import ClientsController from '../../../../api/admin/clients-controller.jsx';

const PLAN_ICONS = { SILVER: Star, GOLD: Zap, PLATINUM: Crown };
const PLAN_COLORS = { SILVER: '#94a3b8', GOLD: '#fbbf24', PLATINUM: '#a78bfa' };

function PlanCard({ plan, isSelected, onSelect }) {
  const Icon = PLAN_ICONS[plan.plan_code] || CreditCard;
  const color = PLAN_COLORS[plan.plan_code] || '#B3D335';

  return (
    <motion.div
      whileHover={{ scale: plan.is_coming_soon ? 1 : 1.02 }}
      whileTap={{ scale: plan.is_coming_soon ? 1 : 0.98 }}
      onClick={() => !plan.is_coming_soon && onSelect(plan.id)}
      style={{
        position: 'relative',
        padding: '16px 18px',
        borderRadius: 14,
        cursor: plan.is_coming_soon ? 'not-allowed' : 'pointer',
        background: isSelected
          ? `linear-gradient(135deg, ${color}18, ${color}08)`
          : 'rgba(255,255,255,0.02)',
        border: `1.5px solid ${isSelected ? color : 'rgba(255,255,255,0.07)'}`,
        transition: 'border-color 0.2s ease, background 0.2s ease',
        opacity: plan.is_coming_soon ? 0.5 : 1,
      }}
    >
      {plan.is_coming_soon && (
        <span style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: 10, fontWeight: 600, color: '#fbbf24',
          background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: 6, padding: '2px 7px',
        }}>
          Coming Soon
        </span>
      )}
      {isSelected && !plan.is_coming_soon && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          width: 20, height: 20, borderRadius: '50%',
          background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check style={{ width: 12, height: 12, color: '#0f172a' }} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${color}25, ${color}10)`,
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon style={{ width: 18, height: 18, color }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{plan.plan_name}</div>
          {plan.tagline && (
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{plan.tagline}</div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color }}>
            ${Number(plan.monthly_price).toLocaleString()}
          </span>
          <span style={{ fontSize: 11, color: '#4b5563' }}>/mo</span>
        </div>
      </div>

      {plan.features?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
          {plan.features.map((f, i) => (
            <span key={i} style={{
              fontSize: 11, color: '#9ca3af',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 6, padding: '2px 8px',
            }}>
              {f.label}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function ClientPlanModal({ client, onClose }) {
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  // Single query: returns { client_id, current_plan_id, current_plan_code, plans: [...] }
  const { data, isLoading, error } = useQuery({
    queryKey: ['client-billing-plan', client.id],
    queryFn: () => ClientsController.getClientBillingPlan(client.id),
  });

  const allPlans = data?.plans ?? [];
  const currentPlanId = data?.current_plan_id ?? null;
  // activePlanId: what's visually selected (selectedPlanId takes precedence over current)
  const activePlanId = selectedPlanId ?? currentPlanId;
  const isDirty = selectedPlanId !== null && selectedPlanId !== currentPlanId;

  const updateMutation = useMutation({
    mutationFn: (planId) => ClientsController.updateClientBillingPlan(client.id, planId),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['client-billing-plan', client.id] });
      await queryClient.refetchQueries({ queryKey: ['clients'] });
      onClose();
    },
  });

  const handleSave = () => {
    if (isDirty) updateMutation.mutate(selectedPlanId);
  };

  return (
    <Modal
      isOpen
      toggle={onClose}
      centered
      contentClassName="tw:bg-gray-800 tw:border tw:border-gray-700 tw:text-white"
      style={{ maxWidth: 520 }}
    >
      <div style={{
        height: 3, width: '100%',
        background: 'linear-gradient(90deg, #B3D335, #9ACA3C, #fbbf24)',
        borderRadius: '8px 8px 0 0',
      }} />
      <ModalHeader className="tw:border-gray-700" toggle={onClose} style={{ paddingBottom: 12 }}>
        <div className="tw:flex tw:items-center tw:gap-3">
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(179,211,53,0.2), rgba(179,211,53,0.08))',
            border: '1px solid rgba(179,211,53,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CreditCard style={{ width: 18, height: 18, color: '#B3D335' }} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#f1f5f9' }}>Manage Plan</div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>{client.client_name}</div>
          </div>
        </div>
      </ModalHeader>

      <ModalBody style={{ paddingTop: 16 }}>
        {isLoading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:py-8 tw:gap-3">
            <Spinner size="sm" style={{ color: '#B3D335' }} />
            <span style={{ color: '#6b7280', fontSize: 14 }}>Loading plans...</span>
          </div>
        ) : error ? (
          <div style={{ color: '#ef4444', fontSize: 14, padding: '16px 0' }}>
            Failed to load plans. Please try again.
          </div>
        ) : (
          <>
            {currentPlanId && data?.current_plan_code && (
              <div style={{
                marginBottom: 16, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(179,211,53,0.06)', border: '1px solid rgba(179,211,53,0.15)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Check style={{ width: 14, height: 14, color: '#B3D335', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#9ca3af' }}>
                  Active plan: <strong style={{ color: '#B3D335' }}>{data.current_plan_code}</strong>
                </span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={activePlanId === plan.id}
                  onSelect={setSelectedPlanId}
                />
              ))}
            </div>

            {updateMutation.isError && (
              <div style={{ color: '#ef4444', fontSize: 13, marginTop: 12 }}>
                {updateMutation.error?.message ?? 'Failed to update plan. Please try again.'}
              </div>
            )}
          </>
        )}
      </ModalBody>

      <ModalFooter className="tw:border-gray-700" style={{ paddingTop: 16, paddingBottom: 16 }}>
        <Button
          color="secondary"
          onClick={onClose}
          style={{ borderRadius: 10, padding: '8px 20px', fontWeight: 500 }}
        >
          Cancel
        </Button>
        <BrandButton
          onClick={handleSave}
          disabled={!isDirty || isLoading}
          loading={updateMutation.isPending}
          loadingText="Saving..."
          compact
        >
          Update Plan
        </BrandButton>
      </ModalFooter>
    </Modal>
  );
}
