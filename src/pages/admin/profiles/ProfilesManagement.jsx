'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, Search, XCircle, ArrowLeft,
  Briefcase, MapPin, Star, BookOpen, Award, Upload, BarChart3, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { Row, Col, Alert } from 'reactstrap';
import ProfilesController from '../../../api/admin/profiles-controller.jsx';
import ClientsController from '../../../api/admin/clients-controller.jsx';
import StatCard from '../components/StatCard.jsx';
import GradientAvatar from '../../../components/admin/GradientAvatar.jsx';
import BrandButton from '../../../components/buttons/BrandButton.jsx';
import UploadProfilesModal from './modals/UploadProfilesModal.jsx';
import GenerateHCMModal from './modals/GenerateHCMModal.jsx';

// Animation Variants
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

// Tag chip for skills/tags/locations
function Chip({ label, color = '#B3D335' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 6,
      background: `${color}12`,
      border: `1px solid ${color}25`,
      fontSize: 11, fontWeight: 500, color: '#cbd5e1',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

export default function ProfilesManagement() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [isHCMModalOpen, setIsHCMModalOpen] = useState(false);
  const [hcmResult, setHcmResult] = useState(null);
  const [hcmError, setHcmError] = useState(null);
  const uploadMutation = useMutation({
    mutationFn: (payload) => ProfilesController.uploadProfiles(clientId, payload),
    onSuccess: (result) => {
      setUploadResult(result);
      queryClient.refetchQueries({ queryKey: ['profiles', clientId] });
      queryClient.refetchQueries({ queryKey: ['clients'] });
      // The backend upload endpoint already busts its own in-memory search
      // cache for this client (see upload_profiles -> invalidate_cache).
      // Just tell React Query its cached warmup result is stale so the next
      // Search-page visit re-checks — no need to hit /search/restart, which
      // would additionally unload the shared embedding model and wipe every
      // other client's warm cache too.
      queryClient.invalidateQueries({ queryKey: ['search-warmup'] });
    },
  });

  const hcmMutation = useMutation({
    mutationFn: () => {
      // `client` is a separate query from `profiles` — the page's loading
      // gate only waits on the latter, so this can fire before `client` (and
      // therefore industry_id) has resolved. Fail fast with a clear message
      // instead of sending industry_id=undefined to the backend (422, and
      // hard to diagnose from the resulting error).
      if (!client?.industry_id) {
        throw new Error('Client details are still loading — wait a moment and try again.');
      }
      return ProfilesController.precomputeHCMScores(clientId, client.industry_id);
    },
    onSuccess: (result) => {
      setHcmResult(result);
      queryClient.refetchQueries({ queryKey: ['hcmScores', clientId] });
    },
    onError: (err) => setHcmError(err?.message || String(err)),
  });

  const handleGenerateHCM = () => {
    setHcmResult(null);
    setHcmError(null);
    hcmMutation.mutate();
  };

  const handleUpload = (payload) => {
    setUploadResult(null);
    uploadMutation.mutate(payload);
  };

  const { data: profiles = [], isLoading, error } = useQuery({
    queryKey: ['profiles', clientId],
    queryFn: () => ProfilesController.listProfiles(clientId),
    enabled: !!clientId,
  });

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => ClientsController.getClient(clientId),
    enabled: !!clientId,
  });

  const { data: hcmScores = {} } = useQuery({
    queryKey: ['hcmScores', clientId],
    queryFn: () => ProfilesController.getHCMScores(clientId, { source: 'talent' }),
    enabled: !!clientId,
  });

  const { data: hcmProgress } = useQuery({
    queryKey: ['hcmProgress', clientId],
    queryFn: () => ProfilesController.getHCMProgress(clientId, client?.industry_id),
    enabled: hcmMutation.isPending && !!client?.industry_id,
    refetchInterval: hcmMutation.isPending ? 1000 : false,
    staleTime: 0,
  });

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles;
    const q = searchQuery.toLowerCase();
    return profiles.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q) ||
      p.organization?.toLowerCase().includes(q) ||
      p.level?.toLowerCase().includes(q)
    );
  }, [profiles, searchQuery]);

  const stats = useMemo(() => {
    const avgYears = profiles.length
      ? (profiles.reduce((s, p) => s + (p.years_experience || 0), 0) / profiles.length).toFixed(1)
      : 0;
    const allLocations = new Set(profiles.flatMap(p => p.locations || []));
    const scoreValues = profiles.map(p => hcmScores[p.id]).filter(s => s != null);
    const avgHCM = scoreValues.length
      ? (scoreValues.reduce((s, v) => s + Number(v), 0) / scoreValues.length).toFixed(1)
      : null;
    return {
      total: profiles.length,
      avgYears,
      locations: allLocations.size,
      avgHCM,
      scoredCount: scoreValues.length,
    };
  }, [profiles, hcmScores]);

  if (isLoading) {
    return (
      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-20 tw:gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Users style={{ width: 32, height: 32, color: '#B3D335' }} />
        </motion.div>
        <span style={{ color: '#6b7280', fontSize: 14 }}>Loading profiles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert color="danger">
        Error loading profiles: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <div className="tw:relative tw:overflow-hidden">
      {/* Ambient background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: -80, right: -60, width: 380, height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(179,211,53,0.06), transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -80, width: 320, height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(154,202,60,0.04), transparent 70%)',
        }} />
      </div>

      <div className="tw:relative tw:z-10">
        {/* Header */}
        <motion.div
          className="tw:flex tw:items-start tw:justify-between tw:mb-8 tw:flex-wrap tw:gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <button
              onClick={() => navigate('/admin/clients-management')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#6b7280', fontSize: 13, padding: '0 0 10px 0',
              }}
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              Back to Clients
            </button>
            <div className="tw:flex tw:items-center tw:gap-3 tw:mb-2">
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(179,211,53,0.2), rgba(154,202,60,0.1))',
                border: '1px solid rgba(179,211,53,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users style={{ width: 24, height: 24, color: '#B3D335' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: 28, fontWeight: 700, marginBottom: 2,
                  background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, #B3D335 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  {client ? `${client.client_name} — Profiles` : 'Profiles'}
                </h2>
                <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                  {client?.industry_name && `${client.industry_name} · `}
                  All profiles for this client
                </p>
              </div>
            </div>
          </div>
          <div className="tw:flex tw:items-center tw:gap-3 tw:flex-wrap">
            <BrandButton onClick={() => { setHcmResult(null); setHcmError(null); setIsHCMModalOpen(true); }}
              disabled={!client?.industry_id}
              style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)', boxShadow: '0 4px 24px rgba(59,130,246,0.3)' }}
            >
              <BarChart3 style={{ width: 18, height: 18 }} />
              Generate HCM Scores
            </BrandButton>
            <BrandButton onClick={() => { setUploadResult(null); setIsUploadModalOpen(true); }}>
              <Upload style={{ width: 18, height: 18 }} />
              Upload Profiles
            </BrandButton>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="tw:mb-8">
          <Row className="tw:g-3">
            {[
              { icon: Users, label: 'Total Profiles', value: stats.total, color: '#B3D335' },
              { icon: Star, label: 'Avg. Years Exp.', value: stats.avgYears, color: '#60a5fa' },
              { icon: MapPin, label: 'Unique Locations', value: stats.locations, color: '#f472b6' },
              ...(stats.avgHCM != null ? [{ icon: TrendingUp, label: `Avg HCM Score (${stats.scoredCount})`, value: stats.avgHCM, color: '#B3D335' }] : []),
            ].map((stat, i) => (
              <Col xs="6" lg={stats.avgHCM != null ? "3" : "4"} key={i}>
                <StatCard {...stat} animationY={24} />
              </Col>
            ))}
          </Row>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="tw:mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div style={{
            position: 'relative',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            <Search style={{
              position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
              width: 18, height: 18, color: '#6b7280',
            }} />
            <input
              type="text"
              placeholder="Search by name, title, organization, or level..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px 14px 44px',
                background: 'transparent', border: 'none', outline: 'none',
                color: '#e2e8f0', fontSize: 14,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#9ca3af',
                }}
              >
                <XCircle style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Profiles List */}
        {filteredProfiles.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div className="tw:text-center tw:py-8" style={{
              background: 'linear-gradient(135deg, rgba(179,211,53,0.05), rgba(154,202,60,0.02))',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
            }}>
              <div className="tw:flex tw:flex-col tw:items-center tw:gap-3">
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(179,211,53,0.15), rgba(179,211,53,0.05))',
                  border: '1px solid rgba(179,211,53,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Users style={{ width: 22, height: 22, color: '#B3D335' }} />
                </div>
                <div>
                  <h3 style={{ color: '#e2e8f0', fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
                    {searchQuery ? 'No matching profiles' : 'No profiles yet'}
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                    {searchQuery ? `No profiles match "${searchQuery}"` : 'No profiles have been added for this client'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div className="tw:flex tw:flex-col tw:gap-3">
              {filteredProfiles.map((profile) => (
                <motion.div key={profile.id} variants={itemVariants}>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 16,
                      padding: '16px 20px',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(179,211,53,0.2)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="tw:flex tw:items-start tw:gap-4 tw:flex-wrap">
                      {/* Avatar */}
                      <GradientAvatar name={profile.name} />

                      {/* Main Info */}
                      <div className="tw:flex-1 tw:min-w-0">
                        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1 tw:flex-wrap">
                          <span style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600 }}>
                            {profile.name}
                          </span>
                          {profile.level && (
                            <span style={{
                              fontSize: 11, fontWeight: 600, color: '#B3D335',
                              padding: '2px 8px', borderRadius: 6,
                              background: 'rgba(179,211,53,0.1)',
                              border: '1px solid rgba(179,211,53,0.2)',
                            }}>
                              {profile.level}
                            </span>
                          )}
                          {profile.version && (
                            <span style={{
                              fontSize: 11, color: '#6b7280',
                              padding: '2px 8px', borderRadius: 6,
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              fontFamily: 'monospace',
                            }}>
                              v{profile.version}
                            </span>
                          )}
                          {profile.work_experience_error && (
                            <span
                              title={profile.work_experience_error}
                              className="tw:flex tw:items-center tw:gap-1"
                              style={{
                                fontSize: 11, fontWeight: 600, color: '#fbbf24',
                                padding: '2px 8px', borderRadius: 6,
                                background: 'rgba(251,191,36,0.1)',
                                border: '1px solid rgba(251,191,36,0.25)',
                                cursor: 'help',
                              }}
                            >
                              <AlertTriangle style={{ width: 11, height: 11 }} />
                              Career data issue
                            </span>
                          )}
                        </div>

                        <div className="tw:flex tw:items-center tw:gap-3 tw:mb-2 tw:flex-wrap">
                          {profile.title && (
                            <span className="tw:flex tw:items-center tw:gap-1" style={{ color: '#94a3b8', fontSize: 13 }}>
                              <Briefcase style={{ width: 12, height: 12 }} />
                              {profile.title}
                            </span>
                          )}
                          {profile.organization && (
                            <span style={{ color: '#6b7280', fontSize: 13 }}>
                              {profile.organization}
                            </span>
                          )}
                          {profile.years_experience != null && (
                            <span className="tw:flex tw:items-center tw:gap-1" style={{ color: '#6b7280', fontSize: 12 }}>
                              <Star style={{ width: 11, height: 11 }} />
                              {profile.years_experience} yrs exp.
                            </span>
                          )}
                          {profile.locations?.length > 0 && (
                            <span className="tw:flex tw:items-center tw:gap-1" style={{ color: '#6b7280', fontSize: 12 }}>
                              <MapPin style={{ width: 11, height: 11 }} />
                              {profile.locations.slice(0, 2).join(', ')}
                              {profile.locations.length > 2 && ` +${profile.locations.length - 2}`}
                            </span>
                          )}
                        </div>

                        {/* Skills & Tags */}
                        <div className="tw:flex tw:flex-wrap tw:gap-1">
                          {profile.skills?.slice(0, 6).map((skill, i) => (
                            <Chip key={`skill-${i}`} label={skill} color="#B3D335" />
                          ))}
                          {profile.skills?.length > 6 && (
                            <span style={{ fontSize: 11, color: '#6b7280', alignSelf: 'center' }}>
                              +{profile.skills.length - 6} more
                            </span>
                          )}
                          {profile.tags?.slice(0, 3).map((tag, i) => (
                            <Chip key={`tag-${i}`} label={tag} color="#a78bfa" />
                          ))}
                        </div>
                      </div>

                      {/* Right side: HCM score & counts */}
                      <div className="tw:flex tw:flex-col tw:items-end tw:gap-2" style={{ flexShrink: 0 }}>
                        {hcmScores[profile.id] != null && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px', borderRadius: 10,
                            background: 'linear-gradient(135deg, rgba(179,211,53,0.12), rgba(154,202,60,0.06))',
                            border: '1px solid rgba(179,211,53,0.25)',
                          }}>
                            <TrendingUp style={{ width: 14, height: 14, color: '#B3D335' }} />
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 16, fontWeight: 700, color: '#B3D335', lineHeight: 1.1 }}>
                                {Number(hcmScores[profile.id]).toFixed(1)}
                              </div>
                              <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                HCM Score
                              </div>
                            </div>
                          </div>
                        )}
                        {profile.education && (
                          <span className="tw:flex tw:items-center tw:gap-1" style={{ fontSize: 12, color: '#6b7280' }}>
                            <BookOpen style={{ width: 12, height: 12 }} />
                            Education
                          </span>
                        )}
                        {profile.recognitions?.length > 0 && (
                          <span className="tw:flex tw:items-center tw:gap-1" style={{ fontSize: 12, color: '#6b7280' }}>
                            <Award style={{ width: 12, height: 12 }} />
                            {profile.recognitions.length} recognition{profile.recognitions.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer count */}
            <motion.div
              className="tw:mt-4 tw:text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span style={{ fontSize: 13, color: '#4b5563' }}>
                Showing {filteredProfiles.length} of {profiles.length} profile{profiles.length !== 1 ? 's' : ''}
              </span>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <UploadProfilesModal
          clientId={clientId}
          industryId={client?.industry_id}
          industryName={client?.industry_name}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleUpload}
          isLoading={uploadMutation.isPending}
          result={uploadResult}
        />
      )}

      {/* Generate HCM Scores Modal */}
      {isHCMModalOpen && (
        <GenerateHCMModal
          clientName={client?.client_name}
          profileCount={profiles.length}
          onClose={() => setIsHCMModalOpen(false)}
          onConfirm={handleGenerateHCM}
          isLoading={hcmMutation.isPending}
          result={hcmResult}
          error={hcmError}
          progress={hcmMutation.isPending ? hcmProgress : null}
        />
      )}
    </div>
  );
}
