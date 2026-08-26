// Imports
import React, {useEffect, useRef, useState, useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigate} from 'react-router';
import {motion} from 'framer-motion';
import {AlertCircle, ArrowRight, Building2, CreditCard, Loader2, Sparkles} from 'lucide-react';
import {compressFflate, decompressFflate} from "@devopsthink/react-security-util";
import {setAccessMap, setClientInfo} from '../../store/apps/client/ClientInfoSlice.js';
import GradientAvatar, {getGradientPair} from '../../components/admin/GradientAvatar.jsx';
import useMyClients from '../../hooks/query/useMyClients.jsx';

// Animation Variants
const containerVariants = {
    hidden: {},
    visible: {transition: {staggerChildren: 0.06, delayChildren: 0.15}},
};

const cardVariants = {
    hidden: {opacity: 0, x: -20, scale: 0.97},
    visible: {
        opacity: 1, x: 0, scale: 1,
        transition: {duration: 0.45, ease: [0.22, 1, 0.36, 1]},
    },
};

export default function ClientSelect() {
    // State & Hooks
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const compressedUserInfo = useSelector((state) => state.userInfo.userInfo);
    const userInfo = compressedUserInfo ? JSON.parse(decompressFflate(compressedUserInfo)) : null;
    const firstName = userInfo?.name?.split(' ')[0] || userInfo?.fullName?.split(' ')[0] || 'there';

    const {data: clients = [], isLoading, isError, refetch} = useMyClients();

    const [spotlights, setSpotlights] = useState({});
    const [hoveredId, setHoveredId] = useState(null);
    const autoRedirectedRef = useRef(false);

    // Event Handlers
    const handleAccess = useCallback((client) => {
        const accessMap = (client?.access_list ?? []).reduce((acc, item) => {
            if (item?.access_name) acc[item.access_name] = item;
            return acc;
        }, {});
        const compressedClient = compressFflate(JSON.stringify(client));
        dispatch(setClientInfo(compressedClient));
        dispatch(setAccessMap(accessMap));
        navigate('/client/search-interface');
    }, [dispatch, navigate]);

    const handleMouseMove = useCallback((e, clientId) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setSpotlights(prev => ({
            ...prev,
            [clientId]: {x: e.clientX - rect.left, y: e.clientY - rect.top},
        }));
    }, []);

    const handleMouseLeave = useCallback((clientId) => {
        setSpotlights(prev => {
            const next = {...prev};
            delete next[clientId];
            return next;
        });
        setHoveredId(null);
    }, []);

    // Side Effects — Auto-redirect when exactly one client arrives (run once)
    useEffect(() => {
        if (!autoRedirectedRef.current && clients.length === 1) {
            autoRedirectedRef.current = true;
            handleAccess(clients[0]);
        }
    }, [clients, handleAccess]);

    return (
        <div className="tw:relative tw:min-h-[calc(100vh-70px)] tw:overflow-hidden">
            {/* ── Animated Background Orbs ── */}
            <div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}}>
                <motion.div
                    style={{
                        position: 'absolute', top: -120, right: -80,
                        width: 500, height: 500, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(179,211,53,0.07), transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                    animate={{x: [0, 80, -40, 0], y: [0, -60, 40, 0]}}
                    transition={{duration: 20, repeat: Infinity, ease: 'linear'}}
                />
                <motion.div
                    style={{
                        position: 'absolute', bottom: -100, left: -100,
                        width: 450, height: 450, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(129,140,248,0.06), transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                    animate={{x: [0, -60, 50, 0], y: [0, 50, -30, 0]}}
                    transition={{duration: 25, repeat: Infinity, ease: 'linear'}}
                />
                <motion.div
                    style={{
                        position: 'absolute', top: '40%', left: '50%',
                        width: 400, height: 400, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(244,114,182,0.04), transparent 70%)',
                        filter: 'blur(60px)',
                    }}
                    animate={{x: [0, 40, -60, 0], y: [0, -40, 30, 0]}}
                    transition={{duration: 30, repeat: Infinity, ease: 'linear'}}
                />
            </div>

            {/* ── Compact Header ── */}
            <div className="tw:relative tw:z-10 tw:px-4 sm:tw:px-6 tw:pt-5 tw:pb-3">
                <motion.div
                    className="tw:flex tw:items-center tw:justify-between tw:flex-wrap tw:gap-3"
                    initial={{opacity: 0, y: -12}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.6, ease: [0.22, 1, 0.36, 1]}}
                >
                    <div className="tw:flex tw:items-center tw:gap-3">
                        <motion.div
                            className="tw:flex tw:items-center tw:justify-center tw:shrink-0"
                            style={{
                                width: 38, height: 38, borderRadius: 12,
                                background: 'linear-gradient(135deg, rgba(179,211,53,0.15), rgba(179,211,53,0.05))',
                                border: '1px solid rgba(179,211,53,0.2)',
                            }}
                            animate={{boxShadow: ['0 0 16px rgba(179,211,53,0.1)', '0 0 28px rgba(179,211,53,0.2)', '0 0 16px rgba(179,211,53,0.1)']}}
                            transition={{duration: 3, repeat: Infinity, ease: 'easeInOut'}}
                        >
                            <Building2 style={{color: '#B3D335', width: 18, height: 18}}/>
                        </motion.div>
                        <div>
                            <h1 className="tw:text-xl tw:font-bold tw:mb-0 tw:leading-tight" style={{
                                background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, #B3D335 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.02em',
                            }}>
                                Welcome back, {firstName}
                            </h1>
                            <p className="tw:text-xs tw:mb-0" style={{color: '#64748b'}}>
                                Choose a workspace to continue
                            </p>
                        </div>
                    </div>
                    {clients.length > 0 && (
                        <motion.div
                            className="tw:inline-flex tw:items-center tw:gap-1.5"
                            initial={{opacity: 0, scale: 0.9}}
                            animate={{opacity: 1, scale: 1}}
                            transition={{delay: 0.3, duration: 0.5}}
                            style={{
                                padding: '4px 12px', borderRadius: 20,
                                background: 'rgba(179,211,53,0.1)',
                                border: '1px solid rgba(179,211,53,0.2)',
                                fontSize: 11, fontWeight: 600, color: '#B3D335',
                            }}
                        >
                            <Sparkles style={{width: 12, height: 12}}/>
                            {clients.length} workspace{clients.length !== 1 ? 's' : ''}
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* ── Client Rows ── */}
            <div className="tw:relative tw:z-10 tw:px-4 sm:tw:px-6 tw:pb-6">
                {isLoading && (
                    <motion.div
                        className="tw:text-center tw:py-20"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                    >
                        <Loader2 className="tw:mx-auto tw:mb-4 tw:animate-spin" style={{color: '#B3D335', width: 32, height: 32}}/>
                        <p className="tw:text-gray-400 tw:text-sm">Loading workspaces…</p>
                    </motion.div>
                )}
                {!isLoading && isError && (
                    <motion.div
                        className="tw:text-center tw:py-20"
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                    >
                        <AlertCircle className="tw:mx-auto tw:mb-4" style={{color: '#f87171', width: 40, height: 40}}/>
                        <h3 className="tw:text-lg tw:font-semibold tw:text-white tw:mb-2">Could not load workspaces</h3>
                        <p className="tw:text-gray-400 tw:text-sm tw:mb-4 tw:max-w-md tw:mx-auto">
                            Something went wrong fetching your client list
                        </p>
                        <button
                            onClick={() => refetch()}
                            className="tw:px-4 tw:py-2 tw:rounded-lg tw:text-sm tw:font-semibold"
                            style={{
                                background: 'linear-gradient(135deg, #9ACA3C, #B3D335)',
                                color: '#0b1120',
                            }}
                        >
                            Retry
                        </button>
                    </motion.div>
                )}
                {!isLoading && !isError && clients.length === 0 && (
                    <motion.div
                        className="tw:text-center tw:py-20"
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.5}}
                    >
                        <motion.div
                            className="tw:mb-6 tw:flex tw:justify-center"
                            animate={{y: [0, -8, 0]}}
                            transition={{duration: 3, repeat: Infinity, ease: 'easeInOut'}}
                        >
                            <div className="tw:flex tw:items-center tw:justify-center tw:rounded-2xl" style={{
                                width: 72, height: 72,
                                background: 'linear-gradient(135deg, rgba(179,211,53,0.1), rgba(179,211,53,0.03))',
                                border: '1px solid rgba(179,211,53,0.15)',
                            }}>
                                <Building2 className="tw:w-8 tw:h-8" style={{color: '#B3D335'}}/>
                            </div>
                        </motion.div>
                        <h3 className="tw:text-lg tw:font-semibold tw:text-white tw:mb-2">No Workspaces Available</h3>
                        <p className="tw:text-gray-500 tw:text-sm tw:max-w-md tw:mx-auto">
                            There are no client workspaces assigned to your account yet
                        </p>
                    </motion.div>
                )}
                {!isLoading && !isError && clients.length > 0 && (
                    /* Client Cards List */
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="tw:flex tw:flex-col tw:gap-2"
                    >
                        {clients.map((client) => {
                            const [color1, color2] = getGradientPair(client.client_name);
                            const isHovered = hoveredId === client.client_id;
                            const spot = spotlights[client.client_id];

                            return (
                                <motion.div key={client.client_id} variants={cardVariants}>
                                    {/* Outer gradient border wrapper */}
                                    <div
                                        style={{
                                            padding: 1,
                                            borderRadius: 14,
                                            background: isHovered
                                                ? `linear-gradient(135deg, ${color1}40, ${color2}30)`
                                                : 'rgba(255,255,255,0.06)',
                                            transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                                            transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                                            boxShadow: isHovered
                                                ? `0 8px 32px rgba(0,0,0,0.25), 0 0 30px ${color1}08`
                                                : 'none',
                                        }}
                                        onClick={() => handleAccess(client)}
                                        onMouseMove={(e) => {
                                            handleMouseMove(e, client.client_id);
                                            setHoveredId(client.client_id);
                                        }}
                                        onMouseLeave={() => handleMouseLeave(client.client_id)}
                                    >
                                        {/* Inner card */}
                                        <div style={{
                                            position: 'relative', overflow: 'hidden',
                                            borderRadius: 13,
                                            background: 'rgba(11, 17, 32, 0.8)',
                                            backdropFilter: 'blur(20px)',
                                            WebkitBackdropFilter: 'blur(20px)',
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                        }}>
                                            {/* Spotlight overlay */}
                                            {spot && (
                                                <div style={{
                                                    position: 'absolute', inset: 0, borderRadius: 13,
                                                    background: `radial-gradient(400px circle at ${spot.x}px ${spot.y}px, ${color1}12, transparent 70%)`,
                                                    pointerEvents: 'none',
                                                }}/>
                                            )}

                                            <div className="tw:flex tw:items-center tw:gap-3" style={{position: 'relative'}}>
                                                {/* Avatar */}
                                                <GradientAvatar name={client.client_name} src={client.logo} size={42} borderRadius={12} fontSize={16}/>

                                                {/* Info */}
                                                <div className="tw:flex-1 tw:min-w-0">
                                                    <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
                                                        <span style={{color: '#f1f5f9', fontSize: 14, fontWeight: 600}}>
                                                            {client.client_name}
                                                        </span>
                                                        {client.industry_name && (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                                                fontSize: 10, fontWeight: 600, color: '#6b7280',
                                                                padding: '2px 7px', borderRadius: 6,
                                                                background: 'rgba(255,255,255,0.05)',
                                                                border: '1px solid rgba(255,255,255,0.08)',
                                                            }}>
                                                                <Building2 style={{width: 9, height: 9}}/>
                                                                {client.industry_name}
                                                            </span>
                                                        )}
                                                        {client.plan_name && (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                                                fontSize: 10, fontWeight: 600, color: '#B3D335',
                                                                padding: '2px 7px', borderRadius: 6,
                                                                background: 'rgba(179,211,53,0.1)',
                                                                border: '1px solid rgba(179,211,53,0.2)',
                                                            }}>
                                                                <CreditCard style={{width: 9, height: 9}}/>
                                                                {client.plan_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Arrow button */}
                                                <div
                                                    className="tw:flex tw:items-center tw:justify-center tw:shrink-0"
                                                    style={{
                                                        width: 32, height: 32, borderRadius: 10,
                                                        background: isHovered
                                                            ? `linear-gradient(135deg, ${color1}, ${color2})`
                                                            : `linear-gradient(135deg, ${color1}30, ${color2}20)`,
                                                        border: `1px solid ${isHovered ? 'transparent' : `${color1}25`}`,
                                                        boxShadow: isHovered ? `0 4px 16px ${color1}35` : 'none',
                                                        transition: 'all 0.3s ease',
                                                    }}
                                                >
                                                    <ArrowRight style={{
                                                        width: 15, height: 15,
                                                        color: isHovered ? '#fff' : `${color1}aa`,
                                                        transition: 'all 0.3s ease',
                                                        transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                                                    }}/>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
