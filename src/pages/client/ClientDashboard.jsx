// Imports
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import {
    Brain, Users, Target, Search,
    ArrowRight, Sparkles, ChevronRight,
} from 'lucide-react';
import { Row, Col } from 'reactstrap';
import { decompressFflate } from '@devopsthink/react-security-util';
import WorkFlowImg from '../../assets/images/dashboard/workflow.png';

/* ── Animated helpers ── */

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

const PulseRing = ({ delay = 0, size = 300, color = 'rgba(179,211,53,0.08)' }) => (
    <motion.div
        style={{
            position: 'absolute', width: size, height: size,
            borderRadius: '50%', border: `1px solid ${color}`,
        }}
        animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay, ease: 'easeOut' }}
    />
);

const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Feature card data ── */

const features = [
    {
        icon: Brain,
        title: 'AI-Powered Search',
        description: 'Advanced semantic search using cutting-edge AI to find the perfect talent match.',
        color: '#B3D335',
    },
    {
        icon: Users,
        title: 'Comprehensive Profiles',
        description: 'Detailed professional profiles with experience, expertise, and practice areas.',
        color: '#B3D335',
    },
    {
        icon: Target,
        title: 'Skill Framework',
        description: 'Structured skill-based search for precise talent matching.',
        color: '#B3D335',
    },
];

/* ── Quick-nav links ── */

const navLinks = [
    { title: 'Search Talent', description: 'Find professionals with AI-powered search', icon: Search, href: '/client/search-interface', color: '#B3D335' },
];

/* ── Main Component ── */

export default function ClientDashboard() {
    // State & Hooks
    const navigate = useNavigate();
    const compressedClientInfo = useSelector((state) => state.clientInfo.clientInfo);
    const clientInfo = compressedClientInfo
        ? JSON.parse(decompressFflate(compressedClientInfo))
        : null;
    const clientName = clientInfo?.client_name ?? '';

    return (
        <div className="tw:min-h-screen tw:relative tw:overflow-hidden">
            {/* ── Ambient Background ── */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <FloatingOrb x="5%" y="8%" size={200} color="rgba(179,211,53,0.06)" delay={0} />
                <FloatingOrb x="78%" y="4%" size={260} color="rgba(129,140,248,0.05)" delay={1.5} />
                <FloatingOrb x="62%" y="50%" size={180} color="rgba(244,114,182,0.04)" delay={3} />
                <FloatingOrb x="12%" y="60%" size={220} color="rgba(52,211,153,0.04)" delay={2} />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(179,211,53,0.06) 0%, transparent 60%)',
                }} />
            </div>

            {/* ── Hero Section (compact) ── */}
            <div className="tw:relative tw:pt-4 tw:pb-4 tw:px-4 sm:tw:px-6 lg:tw:px-8">
                <div className="tw:max-w-7xl tw:mx-auto">
                    {/* Pulse rings */}
                    <div style={{ position: 'absolute', left: '25%', top: 10, transform: 'translateX(-50%)', zIndex: 0 }}>
                        <PulseRing delay={0} />
                        <PulseRing delay={1.3} size={300} color="rgba(129,140,248,0.05)" />
                        <PulseRing delay={2.6} size={380} color="rgba(179,211,53,0.04)" />
                    </div>

                    <motion.div
                        className="tw:relative tw:z-10 tw:flex tw:items-center tw:gap-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Icon badge */}
                        <motion.div
                            className="tw:flex tw:items-center tw:justify-center tw:shrink-0"
                            style={{
                                width: 48, height: 48, borderRadius: 14,
                                background: 'linear-gradient(135deg, rgba(179,211,53,0.2) 0%, rgba(154,202,60,0.1) 100%)',
                                border: '1px solid rgba(179,211,53,0.2)',
                                backdropFilter: 'blur(12px)',
                            }}
                            animate={{ boxShadow: ['0 0 20px rgba(179,211,53,0.15)', '0 0 35px rgba(179,211,53,0.25)', '0 0 20px rgba(179,211,53,0.15)'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <Sparkles style={{ color: '#B3D335', width: 22, height: 22 }} />
                        </motion.div>

                        <div>
                            <h3 className="tw:text-2xl sm:tw:text-3xl tw:font-bold tw:mb-0.5 tw:leading-tight" style={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 50%, #B3D335 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.02em',
                            }}>
                                {clientName ? `Welcome, ${clientName}` : 'Skill Lens Dashboard'}
                            </h3>
                            <p className="tw:text-sm tw:mb-0" style={{ color: '#94a3b8' }}>
                                Revolutionizing talent discovery with advanced AI-powered search and comprehensive professional profiling.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Workflow Image Section (How It Works) ── */}
            <div className="tw:relative tw:z-10 tw:px-4 sm:tw:px-6 lg:tw:px-8 tw:pb-5">
                <div className="tw:max-w-7xl tw:mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        <div className="tw:relative tw:rounded-2xl tw:overflow-hidden" style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            backdropFilter: 'blur(16px)',
                        }}>
                            {/* Top gradient line */}
                            <motion.div
                                style={{ height: 2, background: 'linear-gradient(90deg, transparent 0%, #B3D335 30%, #818cf8 70%, transparent 100%)' }}
                                animate={{ opacity: [0.3, 0.7, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            />

                            <div className="tw:p-4">
                                <div className="tw:flex tw:items-center tw:gap-2.5 tw:mb-3">
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 10,
                                        background: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(129,140,248,0.05))',
                                        border: '1px solid rgba(129,140,248,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <ArrowRight style={{ width: 15, height: 15, color: '#818cf8' }} />
                                    </div>
                                    <div>
                                        <h3 style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 700, marginBottom: 0 }}>
                                            How It Works
                                        </h3>
                                        <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 0 }}>
                                            Our end-to-end workflow for talent discovery
                                        </p>
                                    </div>
                                </div>

                                <div className="tw:rounded-xl tw:overflow-hidden" style={{
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }}>
                                    <img
                                        src={WorkFlowImg}
                                        alt="Skill Lens Workflow"
                                        className="tw:w-full tw:h-auto tw:block"
                                        style={{ opacity: 0.92 }}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Feature Cards ── */}
            <div className="tw:relative tw:z-10 tw:px-4 sm:tw:px-6 lg:tw:px-8 tw:pb-5">
                <div className="tw:max-w-7xl tw:mx-auto">
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                        <Row>
                            {features.map((feature, i) => {
                                const Icon = feature.icon;
                                return (
                                    <Col md="4" key={i} className="tw:mb-4 md:tw:mb-0">
                                        <motion.div variants={itemVariants}>
                                            <motion.div
                                                className="tw:relative tw:rounded-xl tw:p-4 tw:h-full"
                                                style={{
                                                    background: 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(255,255,255,0.07)',
                                                    backdropFilter: 'blur(16px)',
                                                }}
                                                whileHover={{
                                                    y: -3,
                                                    boxShadow: `0 8px 30px rgba(0,0,0,0.3), 0 0 20px ${feature.color}10`,
                                                    borderColor: `${feature.color}25`,
                                                }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <div
                                                    className="tw:flex tw:items-center tw:justify-center tw:mb-3"
                                                    style={{
                                                        width: 40, height: 40, borderRadius: 12,
                                                        background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}08)`,
                                                        border: `1px solid ${feature.color}25`,
                                                    }}
                                                >
                                                    <Icon style={{ width: 20, height: 20, color: feature.color }} />
                                                </div>

                                                <h3 style={{
                                                    color: '#e2e8f0', fontSize: 15, fontWeight: 700,
                                                    marginBottom: 4, letterSpacing: '-0.01em',
                                                }}>
                                                    {feature.title}
                                                </h3>

                                                <p style={{
                                                    color: '#94a3b8', fontSize: 13, lineHeight: 1.5,
                                                    marginBottom: 0,
                                                }}>
                                                    {feature.description}
                                                </p>
                                            </motion.div>
                                        </motion.div>
                                    </Col>
                                );
                            })}
                        </Row>
                    </motion.div>
                </div>
            </div>

            {/* ── Quick Navigation ── */}
            <div className="tw:relative tw:z-10 tw:px-4 sm:tw:px-6 lg:tw:px-8 tw:pb-6">
                <div className="tw:max-w-7xl tw:mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                    >
                        <h2 style={{
                            color: '#e2e8f0', fontSize: 16, fontWeight: 700,
                            marginBottom: 10, letterSpacing: '-0.01em',
                        }}>
                            Quick Actions
                        </h2>

                        <Row>
                            {navLinks.map((link, i) => {
                                const Icon = link.icon;
                                return (
                                    <Col md="4" key={i} className="tw:mb-3 md:tw:mb-0">
                                        <motion.div
                                            className="tw:relative tw:rounded-xl tw:p-3.5 tw:cursor-pointer tw:group tw:h-full"
                                            style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                backdropFilter: 'blur(12px)',
                                            }}
                                            whileHover={{
                                                y: -2,
                                                boxShadow: `0 6px 24px rgba(0,0,0,0.25), 0 0 15px ${link.color}10`,
                                                borderColor: `${link.color}25`,
                                            }}
                                            transition={{ duration: 0.25 }}
                                            onClick={() => navigate(link.href)}
                                        >
                                            <div className="tw:flex tw:items-center tw:justify-between">
                                                <div className="tw:flex tw:items-center tw:gap-2.5">
                                                    <div style={{
                                                        width: 34, height: 34, borderRadius: 10,
                                                        background: `linear-gradient(135deg, ${link.color}18, ${link.color}08)`,
                                                        border: `1px solid ${link.color}20`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <Icon style={{ width: 16, height: 16, color: link.color }} />
                                                    </div>
                                                    <div>
                                                        <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>
                                                            {link.title}
                                                        </div>
                                                        <div style={{ color: '#6b7280', fontSize: 11 }}>
                                                            {link.description}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight style={{
                                                    width: 16, height: 16, color: '#4b5563',
                                                    transition: 'color 0.2s, transform 0.2s',
                                                }} className="group-hover:tw:translate-x-1 group-hover:tw:text-gray-300" />
                                            </div>
                                        </motion.div>
                                    </Col>
                                );
                            })}
                        </Row>
                    </motion.div>
                </div>
            </div>

        </div>
    );
}
