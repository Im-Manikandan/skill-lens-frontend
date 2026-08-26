'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  Zap,
  Search,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from 'reactstrap';
import SelfAssessmentController from '../../../api/admin/self-assessment-controller';
import ActionButton from '../components/ActionButton.jsx';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal.jsx';
import GradientAvatar, { getGradientPair } from '../../../components/admin/GradientAvatar.jsx';
import QuestionModal from './modals/QuestionModal.jsx';

// Animation variants
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function SelfAssessmentManagement() {
  const { frameworkId: frameworkIdParam } = useParams();
  const navigate = useNavigate();
  const frameworkId = frameworkIdParam ? parseInt(frameworkIdParam) : null;

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  // Fetch skill families from framework
  const { data: skillFamilies = [] } = useQuery({
    queryKey: ['skill-families', frameworkId],
    queryFn: () => SelfAssessmentController.listSkillFamilies(frameworkId),
    enabled: !!frameworkId,
  });

  // Fetch questions
  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['self-assessment-questions', frameworkId],
    queryFn: () => SelfAssessmentController.listQuestions(frameworkId),
    enabled: !!frameworkId,
  });

  // Filter questions by search
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) =>
      q.question_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [questions, searchQuery]);

  // Group by skill family
  const groupedQuestions = useMemo(() => {
    const grouped = {};
    filteredQuestions.forEach((q) => {
      if (!grouped[q.skill_family]) {
        grouped[q.skill_family] = [];
      }
      grouped[q.skill_family].push(q);
    });
    return grouped;
  }, [filteredQuestions]);

  // Mutations
  const addMutation = useMutation({
    mutationFn: (data) => SelfAssessmentController.addQuestion(frameworkId, data),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['self-assessment-questions', frameworkId] });
      setIsModalOpen(false);
      setEditingQuestion(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => SelfAssessmentController.updateQuestion(frameworkId, data.question_id, {
      skill_family: data.skill_family,
      question_text: data.question_text,
      label: data.label,
    }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['self-assessment-questions', frameworkId] });
      setIsModalOpen(false);
      setEditingQuestion(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (questionId) => SelfAssessmentController.deleteQuestion(frameworkId, questionId),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['self-assessment-questions', frameworkId] });
      setDeleteTarget(null);
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => SelfAssessmentController.regenerateEmbeddings(frameworkId),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['self-assessment-questions', frameworkId] });
    },
  });

  const handleAddClick = () => {
    setEditingQuestion(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (question) => {
    setEditingQuestion(question);
    setIsModalOpen(true);
  };

  const handleModalSave = (data) => {
    if (editingQuestion) {
      updateMutation.mutate(data);
    } else {
      addMutation.mutate(data);
    }
  };

  const handleDelete = (question) => {
    setDeleteTarget(question);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.question_id);
    }
  };

  const isLoading = addMutation.isPending || updateMutation.isPending;

  return (
    <div style={{
      position: 'relative', minHeight: '100vh', padding: '40px 20px',
      background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(30,27,75,0.4))',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        overflow: 'hidden', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', top: -80, right: -60, width: 380, height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.06), transparent 70%)',
        }} />
      </div>

      <div className="tw:relative tw:z-10 tw:max-w-6xl tw:mx-auto">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="tw:mb-6"
        >
          <button
            onClick={() => navigate(-1)}
            className="tw:flex tw:items-center tw:gap-1 tw:text-gray-400 hover:tw:text-white tw:bg-transparent tw:border-0 tw:cursor-pointer tw:p-0 tw:text-sm"
          >
            <ArrowLeft className="tw:w-4 tw:h-4" />
            Back to Skill Framework Management
          </button>
        </motion.div>

        {/* Header */}
        <motion.div
          className="tw:flex tw:items-start tw:justify-between tw:mb-8 tw:flex-wrap tw:gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <div className="tw:flex tw:items-center tw:gap-3 tw:mb-2">
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(129,140,248,0.2), rgba(99,102,241,0.1))',
                border: '1px solid rgba(129,140,248,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <HelpCircle style={{ width: 24, height: 24, color: '#818cf8' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: 28, fontWeight: 700, marginBottom: 2,
                  background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, #818cf8 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Self-Assessment Questions
                </h2>
                <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                  Manage self-assessment questions for skill evaluation
                </p>
              </div>
            </div>
          </div>

          <div className="tw:flex tw:gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending}
                style={{
                  background: 'linear-gradient(135deg, #f97316, #fb923c)',
                  border: 'none', borderRadius: 12, padding: '10px 20px',
                  fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 20px rgba(249,115,22,0.3)',
                }}
              >
                <Zap style={{ width: 18, height: 18 }} />
                {regenerateMutation.isPending ? 'Regenerating...' : 'Regenerate Embeddings'}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={handleAddClick}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                  border: 'none', borderRadius: 12, padding: '10px 20px',
                  fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                }}
              >
                <Plus style={{ width: 18, height: 18 }} />
                Add Question
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Search */}
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
              placeholder="Search questions by ID, text, or label..."
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

        {/* Questions list */}
        {questionsLoading ? (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px 20px' }}>
            Loading questions...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{
              background: 'linear-gradient(135deg, rgba(129,140,248,0.05), rgba(99,102,241,0.02))',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 20, padding: '40px 20px', textAlign: 'center',
            }}>
              <h3 style={{ color: '#e2e8f0', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                {searchQuery ? 'No matching questions' : 'No questions yet'}
              </h3>
              <p style={{ color: '#6b7280', fontSize: 14 }}>
                {searchQuery
                  ? `No questions match "${searchQuery}"`
                  : 'Get started by adding your first self-assessment question'}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {Object.entries(groupedQuestions).map(([family, familyQuestions]) => (
              <div key={family} className="tw:mb-8">
                <h3 style={{
                  color: '#cbd5e1', fontSize: 14, fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.05em', marginBottom: 12, paddingLeft: 4,
                }}>
                  {family}
                </h3>

                <div className="tw:flex tw:flex-col tw:gap-3">
                  {familyQuestions.map((question) => {
                    const [color1] = getGradientPair(question.question_id);
                    return (
                      <motion.div key={question.id} variants={itemVariants}>
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 14, padding: '16px 20px',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                            e.currentTarget.style.borderColor = `${color1}20`;
                            e.currentTarget.style.transform = 'translateX(4px)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
                            <div className="tw:flex-1">
                              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
                                <GradientAvatar name={question.question_id} />
                                <span style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600 }}>
                                  {question.label}
                                </span>
                              </div>
                              <p style={{ color: '#9ca3af', fontSize: 13, margin: '8px 0 0 0', lineHeight: 1.5 }}>
                                {question.question_text}
                              </p>
                              <span style={{
                                display: 'inline-block', marginTop: 8,
                                fontSize: 11, color: '#818cf8', fontWeight: 600,
                                padding: '4px 8px', background: 'rgba(129,140,248,0.1)',
                                border: '1px solid rgba(129,140,248,0.2)', borderRadius: 6,
                              }}>
                                {question.question_id}
                              </span>
                            </div>

                            <div className="tw:flex tw:items-center tw:gap-2">
                              <ActionButton
                                icon={Eye}
                                color="#818cf8"
                                onClick={() => handleEditClick(question)}
                                title="Edit question"
                              />
                              <ActionButton
                                icon={Trash2}
                                color="#ef4444"
                                onClick={() => handleDelete(question)}
                                title="Delete question"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <QuestionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleModalSave}
        isLoading={isLoading}
        existingQuestion={editingQuestion}
        skillFamilies={skillFamilies}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDeleteModal
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          title={`Delete Question: ${deleteTarget.question_id}?`}
          message={`Are you sure you want to delete the question "${deleteTarget.label}"? This action cannot be undone.`}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
