'use client';

import React, {useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import {Row, Col, Card, CardBody} from 'reactstrap';
import {
    Settings, Building2, Users, Layers, Database,
    Shield, Activity, TrendingUp, FileText, GitBranch,
    Zap, BarChart3, Network, BookOpen, ArrowRight
} from 'lucide-react';
import {useNavigate} from 'react-router';

// Animated Counter Component
const AnimatedCounter = ({target, duration = 2000, suffix = ''}) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration]);
    return <span>{count}{suffix}</span>;
};

// Background Animation Components
const PulseRing = ({delay = 0, size = 300, color = 'rgba(96,165,250,0.08)'}) => (
    <motion.div
        style={{
            position: 'absolute', width: size, height: size,
            borderRadius: '50%', border: `1px solid ${color}`,
        }}
        animate={{scale: [1, 2.2], opacity: [0.6, 0]}}
        transition={{duration: 4, repeat: Infinity, delay, ease: 'easeOut'}}
    />
);

const FloatingOrb = ({x, y, size, color, delay}) => (
    <motion.div
        style={{
            position: 'absolute', left: x, top: y, width: size, height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
            filter: 'blur(1px)', pointerEvents: 'none',
        }}
        animate={{y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1]}}
        transition={{duration: 6 + delay, repeat: Infinity, ease: 'easeInOut', delay}}
    />
);

// Animation Variants
const containerVariants = {
    hidden: {},
    visible: {transition: {staggerChildren: 0.1}},
};

const itemVariants = {
    hidden: {opacity: 0, y: 30},
    visible: {opacity: 1, y: 0, transition: {duration: 0.6, ease: [0.22, 1, 0.36, 1]}},
};

// Capability Cards Data
const capabilities = [
    {
        title: 'Industries Management',
        desc: 'Create, organize, and manage industry verticals. Control active/inactive status and track industry metadata across your platform.',
        icon: Building2,
        color: '#818cf8',
        gradient: 'linear-gradient(135deg, rgba(129,140,248,0.15) 0%, rgba(129,140,248,0.03) 100%)',
        stats: [{label: 'CRUD Ops', value: 'Full'}, {label: 'Status', value: 'Toggle'}],
        route: '/admin/industries-management',
        tags: ['Create', 'Edit', 'Delete', 'Status'],
    },
    {
        title: 'Clients Management',
        desc: 'Onboard clients, assign industries, and auto-generate unique client codes. Track profiles, skill families, groups, and competencies per client.',
        icon: Users,
        color: '#34d399',
        gradient: 'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(52,211,153,0.03) 100%)',
        stats: [{label: 'Auto Code', value: 'Yes'}, {label: 'Cascade', value: 'Protected'}],
        route: '/admin/clients-management',
        tags: ['Onboard', 'Assign', 'Track', 'Code Gen'],
    },
    {
        title: 'Skill Frameworks',
        desc: 'Upload JSON-based skill frameworks, manage versioning, activate per client. Regenerate AI embeddings and descriptions on demand.',
        icon: Network,
        color: '#f472b6',
        gradient: 'linear-gradient(135deg, rgba(244,114,182,0.15) 0%, rgba(244,114,182,0.03) 100%)',
        stats: [{label: 'AI Embed', value: 'Yes'}, {label: 'Versions', value: 'Tracked'}],
        route: '/admin/skill-framework-management',
        tags: ['Upload', 'Activate', 'Embed', 'Version'],
    },
];

// Platform Highlights Data
const platformHighlights = [
    {icon: Layers, label: 'Skill Families', desc: 'Top-level skill categories', color: '#818cf8'},
    {icon: GitBranch, label: 'Skill Groups', desc: 'Mid-level skill clusters', color: '#34d399'},
    {icon: BookOpen, label: 'Skills', desc: 'Granular skill definitions', color: '#f472b6'},
    {icon: Zap, label: 'AI Embeddings', desc: 'Vector-based skill matching', color: '#fbbf24'},
    {icon: BarChart3, label: 'Analytics Ready', desc: 'Data-driven skill insights', color: '#60a5fa'},
    {icon: Shield, label: 'Access Control', desc: 'Role-based permissions', color: '#a78bfa'},
];

export default function AdminDashboard() {
    const navigate = useNavigate();

    return (
        <div className="tw:min-h-screen tw:relative tw:overflow-hidden" >
            {/* Ambient Background */}
            <div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}}>
                <FloatingOrb x="5%" y="10%" size={200} color="rgba(96,165,250,0.06)" delay={0}/>
                <FloatingOrb x="75%" y="5%" size={260} color="rgba(129,140,248,0.05)" delay={1.5}/>
                <FloatingOrb x="60%" y="55%" size={180} color="rgba(244,114,182,0.04)" delay={3}/>
                <FloatingOrb x="15%" y="65%" size={220} color="rgba(52,211,153,0.04)" delay={2}/>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(96,165,250,0.08) 0%, transparent 60%)',
                }}/>
            </div>

            {/* Hero Section */}
            <div className="tw:relative tw:pt-12 tw:pb-16 tw:px-4 sm:tw:px-6 lg:tw:px-8">
                <div className="tw:max-w-7xl tw:mx-auto">
                    {/* Pulse Rings behind title */}
                    <div style={{position: 'absolute', left: '50%', top: 60, transform: 'translateX(-50%)', zIndex: 0}}>
                        <PulseRing delay={0}/>
                        <PulseRing delay={1.3} size={400} color="rgba(129,140,248,0.05)"/>
                        <PulseRing delay={2.6} size={500} color="rgba(52,211,153,0.04)"/>
                    </div>

                    <motion.div
                        className="tw:text-center tw:relative tw:z-10"
                        initial={{opacity: 0, y: -20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.8, ease: [0.22, 1, 0.36, 1]}}
                    >
                        {/* Icon Badge */}
                        <motion.div
                            className="tw:inline-flex tw:items-center tw:justify-center tw:mb-6"
                            style={{
                                width: 72, height: 72, borderRadius: 20,
                                background: 'linear-gradient(135deg, rgba(96,165,250,0.2) 0%, rgba(129,140,248,0.1) 100%)',
                                border: '1px solid rgba(96,165,250,0.2)',
                                backdropFilter: 'blur(12px)',
                            }}
                            animate={{boxShadow: ['0 0 30px rgba(96,165,250,0.15)', '0 0 50px rgba(96,165,250,0.25)', '0 0 30px rgba(96,165,250,0.15)']}}
                            transition={{duration: 3, repeat: Infinity, ease: 'easeInOut'}}
                        >
                            <Settings style={{color: '#60a5fa', width: 32, height: 32}}/>
                        </motion.div>

                        <h1 className="tw:text-4xl sm:tw:text-5xl tw:font-bold tw:mb-3" style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 50%, #60a5fa 100%)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.02em',
                        }}>
                            Admin Command Center
                        </h1>

                        <p className="tw:text-lg tw:max-w-2xl tw:mx-auto tw:mb-2" style={{color: '#94a3b8'}}>
                            Manage industries, clients, and skill frameworks from a single control plane.
                        </p>

                        <motion.div
                            className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:mt-4"
                            initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.5}}
                        >
                            <span style={{
                                display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                                backgroundColor: '#34d399',
                                boxShadow: '0 0 8px rgba(52,211,153,0.6)',
                            }}/>
                            <span style={{color: '#6b7280', fontSize: 13, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase'}}>
                                System Operational
                            </span>
                        </motion.div>
                    </motion.div>

                    {/* Stats Row */}
                    <motion.div
                        className="tw:flex tw:justify-center tw:gap-8 sm:tw:gap-16 tw:mt-12"
                        initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.4, duration: 0.7}}
                    >
                        {[
                            {label: 'Modules', value: 3, icon: Database, color: '#60a5fa'},
                            {label: 'Operations', value: 12, suffix: '+', icon: Activity, color: '#34d399'},
                            {label: 'AI Powered', value: 100, suffix: '%', icon: TrendingUp, color: '#f472b6'},
                        ].map((stat, i) => (
                            <div key={i} className="tw:text-center">
                                <div className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:mb-1">
                                    <stat.icon style={{width: 16, height: 16, color: stat.color}}/>
                                    <span style={{fontSize: 28, fontWeight: 700, color: '#ffffff', fontVariantNumeric: 'tabular-nums'}}>
                                        <AnimatedCounter target={stat.value} suffix={stat.suffix || ''}/>
                                    </span>
                                </div>
                                <span style={{fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500}}>
                                    {stat.label}
                                </span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* Capability Cards */}
            <div className="tw:relative tw:z-10 tw:px-4 sm:tw:px-6 lg:tw:px-8 tw:pb-12">
                <div className="tw:max-w-7xl tw:mx-auto">
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                        <Row className="tw:g-4">
                            {capabilities.map((cap, i) => {
                                const Icon = cap.icon;
                                return (
                                    <Col md="4" key={i}>
                                        <motion.div variants={itemVariants}>
                                            <Card
                                                className="tw:h-full tw:cursor-pointer tw:transition-all tw:duration-300"
                                                onClick={() => navigate(cap.route)}
                                                style={{
                                                    background: cap.gradient,
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    borderRadius: 16,
                                                    backdropFilter: 'blur(12px)',
                                                    overflow: 'hidden',
                                                    position: 'relative',
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.border = `1px solid ${cap.color}33`;
                                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                                    e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.3), 0 0 30px ${cap.color}15`;
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }}
                                            >
                                                {/* Glow accent line */}
                                                <div style={{
                                                    height: 2, width: '100%',
                                                    background: `linear-gradient(90deg, transparent 0%, ${cap.color} 50%, transparent 100%)`,
                                                    opacity: 0.5,
                                                }}/>
                                                <CardBody className="tw:p-6">
                                                    <div className="tw:flex tw:items-start tw:justify-between tw:mb-4">
                                                        <div style={{
                                                            width: 48, height: 48, borderRadius: 14,
                                                            background: `linear-gradient(135deg, ${cap.color}20, ${cap.color}08)`,
                                                            border: `1px solid ${cap.color}25`,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <Icon style={{width: 24, height: 24, color: cap.color}}/>
                                                        </div>
                                                        <ArrowRight style={{width: 18, height: 18, color: '#4b5563', marginTop: 4}}/>
                                                    </div>

                                                    <h3 style={{color: '#f1f5f9', fontSize: 18, fontWeight: 600, marginBottom: 8}}>
                                                        {cap.title}
                                                    </h3>
                                                    <p style={{color: '#94a3b8', fontSize: 14, lineHeight: 1.6, marginBottom: 16}}>
                                                        {cap.desc}
                                                    </p>

                                                    {/* Tags */}
                                                    <div className="tw:flex tw:flex-wrap tw:gap-2 tw:mb-4">
                                                        {cap.tags.map((tag, j) => (
                                                            <span key={j} style={{
                                                                fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
                                                                padding: '3px 10px', borderRadius: 20,
                                                                backgroundColor: `${cap.color}12`,
                                                                color: cap.color,
                                                                border: `1px solid ${cap.color}20`,
                                                            }}>
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {/* Stat Chips */}
                                                    <div className="tw:flex tw:gap-4 tw:pt-4" style={{borderTop: '1px solid rgba(255,255,255,0.05)'}}>
                                                        {cap.stats.map((s, j) => (
                                                            <div key={j}>
                                                                <div style={{fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2}}>
                                                                    {s.label}
                                                                </div>
                                                                <div style={{fontSize: 14, fontWeight: 600, color: '#e2e8f0'}}>
                                                                    {s.value}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </motion.div>
                                    </Col>
                                );
                            })}
                        </Row>
                    </motion.div>
                </div>
            </div>

            {/* Platform Highlights */}
            <div className="tw:relative tw:z-10 tw:px-4 sm:tw:px-6 lg:tw:px-8 tw:pb-16">
                <div className="tw:max-w-7xl tw:mx-auto">
                    <motion.div
                        initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.8}}
                    >
                        <div className="tw:text-center tw:mb-8">
                            <h2 style={{color: '#e2e8f0', fontSize: 22, fontWeight: 600, marginBottom: 4}}>
                                Platform Architecture
                            </h2>
                            <p style={{color: '#6b7280', fontSize: 14}}>
                                Core building blocks powering the Skill Lens ecosystem
                            </p>
                        </div>

                        <motion.div variants={containerVariants} initial="hidden" animate="visible">
                            <Row className="tw:g-3">
                                {platformHighlights.map((item, i) => {
                                    const Icon = item.icon;
                                    return (
                                        <Col md="4" lg="2" sm="6" xs="6" key={i}>
                                            <motion.div variants={itemVariants}>
                                                <div
                                                    className="tw:text-center tw:py-5 tw:px-3 tw:rounded-xl tw:transition-all tw:duration-300"
                                                    style={{
                                                        background: 'rgba(255,255,255,0.02)',
                                                        border: '1px solid rgba(255,255,255,0.04)',
                                                        borderRadius: 14,
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                                        e.currentTarget.style.borderColor = `${item.color}30`;
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                                                    }}
                                                >
                                                    <div className="tw:flex tw:justify-center tw:mb-3">
                                                        <motion.div
                                                            animate={{y: [0, -4, 0]}}
                                                            transition={{duration: 3, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut'}}
                                                        >
                                                            <Icon style={{width: 28, height: 28, color: item.color, strokeWidth: 1.5}}/>
                                                        </motion.div>
                                                    </div>
                                                    <div style={{color: '#e2e8f0', fontSize: 13, fontWeight: 600, marginBottom: 2}}>
                                                        {item.label}
                                                    </div>
                                                    <div style={{color: '#6b7280', fontSize: 11, lineHeight: 1.4}}>
                                                        {item.desc}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Data Flow Visual */}
            <div className="tw:relative tw:z-10 tw:px-4 sm:tw:px-6 lg:tw:px-8 tw:pb-20">
                <div className="tw:max-w-4xl tw:mx-auto">
                    <motion.div
                        initial={{opacity: 0, y: 30}} animate={{opacity: 1, y: 0}} transition={{delay: 1, duration: 0.8}}
                    >
                        <div
                            className="tw:rounded-2xl tw:p-8 tw:relative tw:overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(96,165,250,0.06) 0%, rgba(129,140,248,0.03) 50%, rgba(244,114,182,0.04) 100%)',
                                border: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
                            {/* Animated connection line */}
                            <div style={{position: 'absolute', top: '50%', left: 0, width: '100%', height: 1, zIndex: 0}}>
                                <motion.div
                                    style={{height: '100%', background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.3), transparent)'}}
                                    animate={{x: ['-100%', '100%']}}
                                    transition={{duration: 4, repeat: Infinity, ease: 'linear'}}
                                />
                            </div>

                            <div className="tw:text-center tw:mb-8">
                                <span style={{
                                    fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                                    color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '4px 14px', borderRadius: 20,
                                    border: '1px solid rgba(96,165,250,0.15)',
                                }}>
                                    Data Pipeline
                                </span>
                            </div>

                            <div className="tw:flex tw:items-center tw:justify-between tw:relative tw:z-10 tw:flex-wrap tw:gap-y-6">
                                {[
                                    {icon: Building2, label: 'Industries', sub: 'Define verticals', color: '#818cf8'},
                                    {icon: Users, label: 'Clients', sub: 'Assign & onboard', color: '#34d399'},
                                    {icon: FileText, label: 'Frameworks', sub: 'Upload & version', color: '#f472b6'},
                                    {icon: Zap, label: 'AI Engine', sub: 'Embed & match', color: '#fbbf24'},
                                ].map((step, i, arr) => {
                                    const StepIcon = step.icon;
                                    return (
                                        <React.Fragment key={i}>
                                            <motion.div
                                                className="tw:text-center tw:flex-1"
                                                animate={{y: [0, -6, 0]}}
                                                transition={{duration: 3, repeat: Infinity, delay: i * 0.6, ease: 'easeInOut'}}
                                            >
                                                <div className="tw:flex tw:justify-center tw:mb-2">
                                                    <div style={{
                                                        width: 52, height: 52, borderRadius: 16,
                                                        background: `linear-gradient(135deg, ${step.color}18, ${step.color}08)`,
                                                        border: `1px solid ${step.color}25`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <StepIcon style={{width: 24, height: 24, color: step.color}}/>
                                                    </div>
                                                </div>
                                                <div style={{color: '#e2e8f0', fontSize: 14, fontWeight: 600}}>{step.label}</div>
                                                <div style={{color: '#6b7280', fontSize: 11}}>{step.sub}</div>
                                            </motion.div>
                                            {i < arr.length - 1 && (
                                                <motion.div
                                                    className="tw:hidden sm:tw:block"
                                                    animate={{opacity: [0.3, 0.8, 0.3]}}
                                                    transition={{duration: 2, repeat: Infinity, delay: i * 0.5}}
                                                >
                                                    <ArrowRight style={{width: 20, height: 20, color: '#374151'}}/>
                                                </motion.div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
