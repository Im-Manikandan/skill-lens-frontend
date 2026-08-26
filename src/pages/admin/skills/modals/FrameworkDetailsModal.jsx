import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Upload,
  RefreshCw,
  FileText,
  Database,
  CheckCircle,
  AlertCircle,
  Layers,
  Clock,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import {
  Row, Col,
  Button,
  Modal, ModalHeader, ModalBody,
  FormGroup, Label, Input,
  Spinner, Alert,
} from 'reactstrap';
import FrameworksController from '../../../../api/admin/frameworks-controller.jsx';

export default function FrameworkDetailsModal({ clientId, frameworkId, frameworkData, isLoading, onClose }) {
  // State & Mutations
  const [uploadFile, setUploadFile] = useState(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file) => FrameworksController.uploadFramework(clientId, frameworkId, file, false, false),
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['framework-data', clientId, frameworkId] }),
        queryClient.refetchQueries({ queryKey: ['frameworks', clientId] }),
      ]);
      setUploadFile(null);
      await regenerateDescriptionsMutation.mutateAsync();
      regenerateEmbeddingsMutation.mutate();
    },
  });

  const regenerateEmbeddingsMutation = useMutation({
    mutationFn: () => FrameworksController.regenerateFrameworkEmbeddings(clientId, frameworkId),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['framework-data', clientId, frameworkId] });
    },
  });

  const regenerateDescriptionsMutation = useMutation({
    mutationFn: () => FrameworksController.regenerateFrameworkDescriptions(clientId, frameworkId),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['framework-data', clientId, frameworkId] });
    },
  });

  // Upload Handler
  const handleUpload = () => {
    if (uploadFile) {
      uploadMutation.mutate(uploadFile);
    }
  };

  // Pipeline state — derived from mutation statuses
  const isUploading = uploadMutation.isPending;
  const isProcessingDescriptions = regenerateDescriptionsMutation.isPending;
  const isProcessingEmbeddings = regenerateEmbeddingsMutation.isPending;
  const isPipelineActive = isUploading || isProcessingDescriptions || isProcessingEmbeddings;
  const pipelineHasError = uploadMutation.isError || regenerateDescriptionsMutation.isError || regenerateEmbeddingsMutation.isError;
  const isPipelineComplete = uploadMutation.isSuccess && regenerateDescriptionsMutation.isSuccess && regenerateEmbeddingsMutation.isSuccess;
  // Show pipeline UI once any step has started (stays visible on error too)
  const pipelineVisible = isPipelineActive || isPipelineComplete || pipelineHasError;
  const uploadStepDone = uploadMutation.isSuccess || isProcessingDescriptions || isProcessingEmbeddings || isPipelineComplete;

  const framework = frameworkData?.framework;

  return (
    <Modal
      isOpen
      toggle={isPipelineActive ? undefined : onClose}
      centered
      size="lg"
      contentClassName="tw:bg-gray-800 tw:border tw:border-gray-700 tw:text-white"
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
            <Database style={{ width: 18, height: 18, color: '#818cf8' }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>
              {framework?.framework_name || 'Framework Details'}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>
              {framework?.version ? `Version: ${framework.version}` : 'Upload and manage framework data'}
            </div>
          </div>
        </div>
      </ModalHeader>
      <ModalBody style={{ paddingTop: 16 }}>
        {isLoading ? (
          <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-12 tw:gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Database style={{ width: 28, height: 28, color: '#818cf8' }} />
            </motion.div>
            <span style={{ color: '#6b7280', fontSize: 13 }}>Loading framework data...</span>
          </div>
        ) : (
          <div className="tw:space-y-5">
            {/* Upload Section */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '20px',
            }}>
              <h4 className="tw:flex tw:items-center tw:gap-2 tw:mb-4" style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(96,165,250,0.08))',
                  border: '1px solid rgba(96,165,250,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Upload style={{ width: 16, height: 16, color: '#60a5fa' }} />
                </div>
                Upload Skill Framework
              </h4>
              <FormGroup>
                <Label for="fwUpload" className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>JSON File</Label>
                <Input
                  type="file"
                  id="fwUpload"
                  accept=".json"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="tw:bg-gray-700! tw:border-gray-600! tw:text-white!"
                  style={{ borderRadius: 10, padding: '10px 14px' }}
                />
              </FormGroup>
              {/* Upload button — hidden while pipeline is running or has run */}
              {!pipelineVisible && (
                <Button
                  block
                  onClick={handleUpload}
                  disabled={!uploadFile}
                  style={{
                    background: uploadFile ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255,255,255,0.05)',
                    border: 'none', borderRadius: 10, padding: '10px',
                    fontWeight: 600, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: uploadFile ? '0 4px 16px rgba(59,130,246,0.3)' : 'none',
                    color: uploadFile ? '#ffffff' : '#6b7280',
                  }}
                >
                  <Upload style={{ width: 16, height: 16 }} />
                  <span>Upload &amp; Process</span>
                </Button>
              )}

              {/* Pipeline progress — shown during processing, on completion, and on error */}
              {pipelineVisible && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: isPipelineComplete ? 'rgba(52,211,153,0.06)' : pipelineHasError ? 'rgba(239,68,68,0.06)' : 'rgba(99,102,241,0.07)',
                    border: `1px solid ${isPipelineComplete ? 'rgba(52,211,153,0.25)' : pipelineHasError ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.25)'}`,
                    borderRadius: 14, padding: '16px 18px',
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    {isPipelineComplete ? (
                      <CheckCircle2 style={{ width: 16, height: 16, color: '#34d399', flexShrink: 0 }} />
                    ) : (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        style={{ flexShrink: 0 }}
                      >
                        <RefreshCw style={{ width: 15, height: 15, color: '#a78bfa' }} />
                      </motion.div>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 600, color: isPipelineComplete ? '#34d399' : pipelineHasError ? '#f87171' : '#e2e8f0' }}>
                      {isPipelineComplete ? 'All steps complete' : pipelineHasError && !isPipelineActive ? 'Some steps failed' : 'Processing — do not close this window'}
                    </span>
                  </div>

                  {/* Step indicators */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      {
                        label: 'Upload JSON',
                        sub: null,
                        isPending: isUploading,
                        isDone: uploadStepDone,
                        isError: uploadMutation.isError,
                      },
                      {
                        label: 'Generate AI Descriptions',
                        sub: 'OpenAI enrichment — may take 2–5 min',
                        isPending: isProcessingDescriptions,
                        isDone: regenerateDescriptionsMutation.isSuccess,
                        isError: regenerateDescriptionsMutation.isError,
                      },
                      {
                        label: 'Generate Vector Embeddings',
                        sub: 'Local sentence-transformers — ~30–90 sec',
                        isPending: isProcessingEmbeddings,
                        isDone: regenerateEmbeddingsMutation.isSuccess,
                        isError: regenerateEmbeddingsMutation.isError,
                      },
                    ].map((step, i) => {
                      const iconColor = step.isDone ? '#34d399' : step.isPending ? '#a78bfa' : step.isError ? '#ef4444' : '#4b5563';
                      const bgColor = step.isDone ? 'rgba(52,211,153,0.12)' : step.isPending ? 'rgba(167,139,250,0.12)' : step.isError ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)';
                      const borderColor = step.isDone ? 'rgba(52,211,153,0.3)' : step.isPending ? 'rgba(167,139,250,0.3)' : step.isError ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)';
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{
                            width: 26, height: 26, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '50%', background: bgColor, border: `1px solid ${borderColor}`,
                            marginTop: 1,
                          }}>
                            {step.isDone ? (
                              <CheckCircle2 style={{ width: 13, height: 13, color: iconColor }} />
                            ) : step.isPending ? (
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                <RefreshCw style={{ width: 11, height: 11, color: iconColor }} />
                              </motion.div>
                            ) : step.isError ? (
                              <AlertCircle style={{ width: 13, height: 13, color: iconColor }} />
                            ) : (
                              <Clock style={{ width: 11, height: 11, color: iconColor }} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: step.isDone ? '#6ee7b7' : step.isPending ? '#e2e8f0' : step.isError ? '#f87171' : '#4b5563' }}>
                              {step.label}
                              {step.isPending && <span style={{ color: '#6b7280', fontWeight: 400 }}> &nbsp;running…</span>}
                            </div>
                            {step.sub && (
                              <div style={{ fontSize: 11, color: '#4b5563', marginTop: 1 }}>{step.sub}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer guidance */}
                  {isPipelineComplete && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      style={{
                        marginTop: 14, padding: '10px 12px', borderRadius: 10,
                        background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
                        fontSize: 12, color: '#6ee7b7',
                      }}
                    >
                      Framework ready. In <strong>Admin › Skills</strong>, click <strong>Activate</strong> to enable it for the Search interface.
                    </motion.div>
                  )}
                  {isPipelineActive && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldAlert style={{ width: 12, height: 12, color: '#f59e0b', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#b45309' }}>
                        Closing or refreshing this window will interrupt the operation.
                      </span>
                    </div>
                  )}
                  {pipelineHasError && !isPipelineActive && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertCircle style={{ width: 12, height: 12, color: '#ef4444', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#f87171' }}>
                        One or more steps failed. Check the errors above, then try re-uploading or use the Regenerate buttons below.
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

            </div>

            {/* Regenerate Section */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '20px',
            }}>
              <h4 className="tw:flex tw:items-center tw:gap-2 tw:mb-4" style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.08))',
                  border: '1px solid rgba(251,191,36,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <RefreshCw style={{ width: 16, height: 16, color: '#fbbf24' }} />
                </div>
                Regenerate
              </h4>
              <Row>
                <Col md="6" className="tw:mb-3 md:tw:mb-0">
                  <Button
                    block
                    onClick={() => regenerateDescriptionsMutation.mutate()}
                    disabled={regenerateDescriptionsMutation.isPending}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10, padding: '10px',
                      fontWeight: 600, fontSize: 13, color: '#e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {regenerateDescriptionsMutation.isPending ? (
                      <>
                        <Spinner size="sm" />
                        <span>Regenerating...</span>
                      </>
                    ) : (
                      <>
                        <FileText style={{ width: 16, height: 16, color: '#818cf8' }} />
                        <span>Regenerate Descriptions</span>
                      </>
                    )}
                  </Button>
                </Col>
                <Col md="6">
                  <Button
                    block
                    onClick={() => regenerateEmbeddingsMutation.mutate()}
                    disabled={regenerateEmbeddingsMutation.isPending}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10, padding: '10px',
                      fontWeight: 600, fontSize: 13, color: '#e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {regenerateEmbeddingsMutation.isPending ? (
                      <>
                        <Spinner size="sm" />
                        <span>Regenerating...</span>
                      </>
                    ) : (
                      <>
                        <Database style={{ width: 16, height: 16, color: '#34d399' }} />
                        <span>Regenerate Embeddings</span>
                      </>
                    )}
                  </Button>
                </Col>
              </Row>
            </div>

            {/* Framework Structure Preview */}
            {frameworkData && (
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '20px',
              }}>
                <h4 className="tw:flex tw:items-center tw:gap-2 tw:mb-4" style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'linear-gradient(135deg, rgba(244,114,182,0.2), rgba(244,114,182,0.08))',
                    border: '1px solid rgba(244,114,182,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Layers style={{ width: 16, height: 16, color: '#f472b6' }} />
                  </div>
                  Framework Structure
                </h4>
                <div className="tw:space-y-3 tw:max-h-96 tw:overflow-y-auto" style={{ paddingRight: 4 }}>
                  {frameworkData.skill_families.length === 0 ? (
                    <div className="tw:text-center tw:py-8">
                      <Database style={{ width: 28, height: 28, color: '#4b5563', margin: '0 auto 12px' }} />
                      <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                        No skill framework data yet. Upload a JSON file to get started.
                      </p>
                    </div>
                  ) : (
                    frameworkData.skill_families.map((family) => {
                      const familyGroups = frameworkData.skill_groups.filter(g => g.skill_family === family.skill_family);
                      return (
                        <div key={family.id} style={{
                          padding: '14px 16px', borderRadius: 12,
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.04)',
                        }}>
                          <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14, marginBottom: 4 }}>
                            {family.skill_family}
                          </div>
                          {family.description && (
                            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>{family.description}</p>
                          )}
                          <div className="tw:ml-3 tw:space-y-2">
                            {familyGroups.map((group) => {
                              const groupCompetencies = frameworkData.competencies.filter(
                                c => c.skill_family === group.skill_family && c.group_item === group.group_item
                              );
                              return (
                                <div key={group.id} style={{
                                  padding: '10px 12px', borderRadius: 10,
                                  background: 'rgba(0,0,0,0.2)',
                                  border: '1px solid rgba(255,255,255,0.03)',
                                }}>
                                  <div style={{ fontWeight: 500, color: '#e2e8f0', fontSize: 13, marginBottom: 2 }}>
                                    {group.group_item}
                                  </div>
                                  {group.description && (
                                    <p style={{ fontSize: 11, color: '#4b5563', marginBottom: 6 }}>{group.description}</p>
                                  )}
                                  <div className="tw:ml-3 tw:space-y-1">
                                    {groupCompetencies.map((comp) => (
                                      <div key={comp.id} style={{ fontSize: 12, color: '#9ca3af' }}>
                                        &bull; {comp.competency}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
