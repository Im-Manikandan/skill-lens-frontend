// Imports
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Row, Col, Spinner } from 'reactstrap';
import { Lock, Sparkles, Rocket, Info } from 'lucide-react';
import { decompressFflate } from '@devopsthink/react-security-util';
import { getClientBillingPlan } from '../../api/client/billing-plan-controller';

/* ── Plan visual config (matches reference screenshot accent palette) ── */
const PLAN_VISUAL = {
    SILVER:   { color: '#B3D335', soft: 'rgba(179,211,53,0.10)', border: 'rgba(179,211,53,0.30)' },
    GOLD:     { color: '#3b82f6', soft: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.30)' },
    PLATINUM: { color: '#a855f7', soft: 'rgba(168,85,247,0.10)', border: 'rgba(168,85,247,0.30)' },
};
const DEFAULT_VISUAL = { color: '#94a3b8', soft: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.30)' };

/* ── Animated background helpers ── */
const FloatingOrb = ({ x, y, size, color, delay }) => (
    <motion.div
        style={{
            position: 'absolute', left: x, top: y, width: size, height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            filter: 'blur(1px)', pointerEvents: 'none',
        }}
        animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 6 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
);

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Plan Card ── */
function PlanCard({ plan, isSelected, currency }) {
    const visual = PLAN_VISUAL[plan.plan_code] || DEFAULT_VISUAL;
    const dim = !isSelected;

    return (
        <motion.div
            variants={cardVariants}
            className="tw:relative tw:rounded-2xl tw:overflow-hidden tw:h-full tw:flex tw:flex-col"
            style={{
                background: isSelected
                    ? `linear-gradient(180deg, ${visual.soft} 0%, rgba(255,255,255,0.02) 100%)`
                    : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isSelected ? visual.border : 'rgba(255,255,255,0.07)'}`,
                backdropFilter: 'blur(16px)',
                boxShadow: isSelected ? `0 12px 40px rgba(0,0,0,0.35), 0 0 24px ${visual.color}20` : 'none',
                opacity: dim ? 0.78 : 1,
            }}
        >
            {/* Top accent bar */}
            <div style={{
                height: 4,
                background: isSelected
                    ? `linear-gradient(90deg, transparent 0%, ${visual.color} 50%, transparent 100%)`
                    : `linear-gradient(90deg, transparent 0%, ${visual.color}55 50%, transparent 100%)`,
            }}/>

            {/* Corner fold ribbon */}
            {isSelected && (
                <div style={{
                    position: 'absolute', top: 18, right: -42, width: 150,
                    transform: 'rotate(45deg)',
                    background: `linear-gradient(135deg, ${visual.color}, ${visual.color}cc)`,
                    color: '#0a0f1a',
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.14em',
                    textAlign: 'center', padding: '5px 0',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
                    zIndex: 2, pointerEvents: 'none',
                }}>
                    CURRENT
                </div>
            )}

            {/* Header */}
            <div className="tw:px-6 tw:pt-7 tw:pb-5 tw:text-center">
                <div className="tw:inline-flex tw:items-center tw:gap-1.5 tw:px-3 tw:py-1 tw:rounded-full tw:mb-3"
                     style={{
                         background: visual.soft,
                         border: `1px solid ${visual.border}`,
                         color: visual.color,
                         fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                     }}>
                    {plan.plan_code}
                </div>
                <div className="tw:text-sm tw:mb-3" style={{ color: '#cbd5e1' }}>
                    {plan.tagline}
                </div>
                <div className="tw:flex tw:items-baseline tw:justify-center tw:gap-1">
                    <span style={{ color: '#e5e7eb', fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>
                        {currency === 'USD' ? '$' : ''}{Math.round(Number(plan.monthly_price) || 0)}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>/ month</span>
                </div>
            </div>

            {/* Coming soon ribbon (Platinum) */}
            {plan.is_coming_soon && (
                <div className="tw:mx-6 tw:mb-3 tw:px-3 tw:py-2 tw:rounded-lg tw:flex tw:items-center tw:gap-2"
                     style={{
                         background: visual.soft,
                         border: `1px dashed ${visual.border}`,
                         color: visual.color, fontSize: 12, fontWeight: 600,
                     }}>
                    <Rocket size={13}/> Coming Soon — Join the waitlist
                </div>
            )}

            {/* Features */}
            <div className="tw:px-6 tw:pb-5 tw:flex-1">
                <ul className="tw:space-y-2.5 tw:list-none tw:p-0 tw:m-0">
                    {(plan.features || []).map((f, i) => (
                        <li key={i} className="tw:flex tw:items-start tw:gap-2.5">
                            <span style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: visual.color, marginTop: 7, flexShrink: 0,
                            }}/>
                            <span style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.5 }}>
                                {f.label}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Footer message */}
            <div className="tw:px-6 tw:pb-6">
                {isSelected ? (
                    <div className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:py-2.5 tw:rounded-lg"
                         style={{
                             background: `linear-gradient(135deg, ${visual.color}, ${visual.color}cc)`,
                             color: '#0a0f1a', fontWeight: 700, fontSize: 13, letterSpacing: '0.02em',
                         }}>
                        <Sparkles size={14}/> Active on your account
                    </div>
                ) : (
                    <div className="tw:flex tw:items-start tw:gap-2 tw:px-3 tw:py-2.5 tw:rounded-lg"
                         style={{
                             background: 'rgba(255,255,255,0.03)',
                             border: '1px solid rgba(255,255,255,0.06)',
                         }}>
                        <Lock size={13} style={{ color: '#94a3b8', marginTop: 2, flexShrink: 0 }}/>
                        <span style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.5 }}>
                            To change your plan, contact your <strong style={{ color: '#cbd5e1' }}>Skill Lens POC</strong>.
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

/* ── Main Page ── */
export default function MyAccount() {
    const compressedClientInfo = useSelector((state) => state.clientInfo.clientInfo);
    const clientInfo = useMemo(
        () => (compressedClientInfo ? JSON.parse(decompressFflate(compressedClientInfo)) : null),
        [compressedClientInfo]
    );
    const clientId = clientInfo?.client_id;
    const clientName = clientInfo?.client_name;

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['client-billing-plan', clientId],
        queryFn: () => getClientBillingPlan(clientId),
        enabled: !!clientId,
        staleTime: 5 * 60 * 1000,
    });

    const plans = data?.plans || [];
    const currentPlanId = data?.current_plan_id ?? clientInfo?.plan_id;
    const currency = plans[0]?.currency || 'USD';

    return (
        <div className="tw:min-h-screen tw:relative tw:overflow-hidden">
            {/* Ambient orbs */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <FloatingOrb x="6%"  y="8%"  size={220} color="rgba(179,211,53,0.06)" delay={0}/>
                <FloatingOrb x="78%" y="6%"  size={260} color="rgba(59,130,246,0.05)"  delay={1.4}/>
                <FloatingOrb x="60%" y="55%" size={200} color="rgba(168,85,247,0.05)"  delay={2.8}/>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(179,211,53,0.05) 0%, transparent 60%)',
                }}/>
            </div>

            {/* Header */}
            <div className="tw:relative tw:z-10 tw:px-4 sm:tw:px-6 lg:tw:px-8 tw:pt-5 tw:pb-3">
                <div className="tw:max-w-7xl tw:mx-auto">
                    <motion.div
                        className="tw:flex tw:items-center tw:gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="tw:flex tw:items-center tw:justify-center"
                             style={{
                                 width: 44, height: 44, borderRadius: 12,
                                 background: 'linear-gradient(135deg, rgba(179,211,53,0.18), rgba(154,202,60,0.06))',
                                 border: '1px solid rgba(179,211,53,0.22)',
                             }}>
                            <Sparkles style={{ color: '#B3D335', width: 20, height: 20 }}/>
                        </div>
                        <div>
                            <h3 className="tw:text-2xl tw:font-bold tw:mb-0.5 tw:leading-tight" style={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 50%, #B3D335 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.02em',
                            }}>
                                My Account
                            </h3>
                            <p className="tw:text-sm tw:mb-0" style={{ color: '#94a3b8' }}>
                                {clientName ? `${clientName} — billing plan & subscription` : 'Billing plan & subscription'}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="tw:relative tw:z-10 tw:px-4 sm:tw:px-6 lg:tw:px-8 tw:pb-8">
                <div className="tw:max-w-7xl tw:mx-auto">
                    {isLoading && (
                        <div className="tw:flex tw:items-center tw:justify-center tw:py-16">
                            <Spinner style={{ color: '#B3D335' }}/>
                        </div>
                    )}

                    {isError && (
                        <div className="tw:flex tw:items-start tw:gap-2 tw:p-4 tw:rounded-xl"
                             style={{
                                 background: 'rgba(239,68,68,0.08)',
                                 border: '1px solid rgba(239,68,68,0.25)',
                                 color: '#fca5a5',
                             }}>
                            <Info size={16} style={{ marginTop: 2 }}/>
                            <div style={{ fontSize: 13 }}>
                                Failed to load billing plan. {error?.message || ''}
                            </div>
                        </div>
                    )}

                    {!isLoading && !isError && plans.length > 0 && (
                        <motion.div variants={containerVariants} initial="hidden" animate="visible">
                            <Row>
                                {plans.map((plan) => (
                                    <Col lg="4" md="6" key={plan.id} className="tw:mb-4 lg:tw:mb-0">
                                        <PlanCard
                                            plan={plan}
                                            isSelected={plan.id === currentPlanId}
                                            currency={currency}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
