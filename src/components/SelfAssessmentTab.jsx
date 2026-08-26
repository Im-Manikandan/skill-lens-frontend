'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Star, Target } from 'lucide-react';

export default function SelfAssessmentTab({ profile }) {
  // Data Extraction
  const questions = profile.selfassessment_questions || [];

  // Empty State
  if (questions.length === 0) {
    return (
      <div className="tw:text-center tw:py-8">
        <ClipboardList className="tw:w-12 tw:h-12 tw:mx-auto tw:text-gray-500 tw:mb-3" />
        <p className="tw:text-gray-400">No self-assessment questions available for this profile</p>
      </div>
    );
  }

  // Mock Score Generator (demonstration purposes)
  const getMockScore = (questionId) => {
    // Use question ID to generate consistent mock scores
    const hash = questionId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash % 5) + 1; // 1-5 scale
  };

  return (
    <div className="tw:space-y-4">
      {/* Header */}
      <div className="tw:p-4 tw:rounded-lg tw:border tw:border-gray-700" style={{ backgroundColor: '#1f2937' }}>
        <h4 className="tw:font-semibold tw:text-white tw:mb-3 tw:flex tw:items-center">
          <ClipboardList className="tw:w-4 tw:h-4 tw:mr-2" />
          Self-Assessment Questions
        </h4>
        <p className="tw:text-sm tw:text-gray-300">
          These questions help evaluate how well this professional matches specific competency criteria.
          Questions are ranked by relevance to the search criteria.
        </p>
      </div>

      {/* Questions List */}
      <div className="tw:space-y-3">
        {questions.map((question, index) => {
          const mockScore = getMockScore(question.question_id);
          const relevancePercent = (question.similarity_score * 100).toFixed(1);

          return (
            <motion.div
              key={question.question_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="tw:p-4 tw:rounded-lg tw:border tw:border-gray-700 hover:tw:border-gray-600 tw:transition-colors"
              style={{ backgroundColor: '#1f2937' }}
            >
              {/* Question Header */}
              <div className="tw:flex tw:items-start tw:justify-between tw:mb-3">
                <div className="tw:flex tw:items-center tw:space-x-2">
                  <span className="tw:text-xs tw:font-medium tw:text-gray-400 tw:px-2 tw:py-1 tw:rounded" style={{ backgroundColor: '#111827' }}>
                    Q{index + 1}
                  </span>
                  <span className="tw:text-sm tw:font-medium tw:text-white">
                    {question.label}
                  </span>
                </div>
                <div className="tw:flex tw:items-center tw:space-x-2">
                  {/* Relevance Score */}
                  <div className="tw:flex tw:items-center tw:space-x-1 tw:text-xs">
                    <Target className="tw:w-3 tw:h-3 tw:text-gray-400" />
                    <span className="tw:text-gray-400 tw:font-medium">{relevancePercent}%</span>
                  </div>
                  {/* Mock Score */}
                  <div className="tw:flex tw:items-center tw:space-x-1 tw:text-xs">
                    <Star className="tw:w-3 tw:h-3 tw:text-yellow-400" />
                    <span className="tw:text-yellow-400 tw:font-medium">{mockScore}/5</span>
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <div className="tw:flex-1">
                <p className="tw:text-gray-200 tw:font-medium tw:mb-2">
                  {question.question_text}
                </p>

                {/* Skill Family Badge */}
                {question.skill_family && (
                  <span className="tw:inline-block tw:text-gray-200 tw:text-xs tw:px-2 tw:py-1 tw:rounded-full tw:mr-2" style={{ backgroundColor: '#374151' }}>
                    {question.skill_family}
                  </span>
                )}
              </div>

              {/* Score Visualization */}
              <div className="tw:mt-3 tw:pt-3 tw:border-t tw:border-gray-600">
                <div className="tw:flex tw:items-center tw:justify-between tw:text-xs tw:text-gray-400 tw:mb-1">
                  <span>Assessment Score</span>
                  <span className="tw:font-medium tw:text-gray-200">{mockScore}/5</span>
                </div>
                <div className="tw:w-full tw:rounded-full tw:h-2" style={{ backgroundColor: '#4b5563' }}>
                  <div
                    className="tw:h-2 tw:rounded-full tw:transition-all tw:duration-500"
                    style={{ width: `${(mockScore / 5) * 100}%`, background: 'linear-gradient(to right, #ef4444, #eab308, #10b981)' }}
                  ></div>
                </div>
                <div className="tw:flex tw:justify-between tw:text-xs tw:text-gray-500 tw:mt-1">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="tw:p-4 tw:rounded-lg tw:border tw:border-gray-600" style={{ backgroundColor: '#1f2937' }}>
        <h5 className="tw:font-medium tw:text-gray-200 tw:mb-2">Assessment Summary</h5>
        <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:text-sm">
          <div>
            <span className="tw:text-gray-300 tw:font-medium">Questions Analyzed:</span>
            <p className="tw:text-gray-200">{questions.length}</p>
          </div>
          <div>
            <span className="tw:text-gray-300 tw:font-medium">Average Relevance:</span>
            <p className="tw:text-gray-200">
              {(questions.reduce((sum, q) => sum + q.similarity_score, 0) / questions.length * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <span className="tw:text-gray-300 tw:font-medium">Average Score:</span>
            <p className="tw:text-gray-200">
              {(questions.reduce((sum, q) => sum + getMockScore(q.question_id), 0) / questions.length).toFixed(1)}/5
            </p>
          </div>
          <div>
            <span className="tw:text-gray-300 tw:font-medium">Skill Families:</span>
            <p className="tw:text-gray-200">
              {new Set(questions.map(q => q.skill_family).filter(Boolean)).size} skill families covered
            </p>
          </div>
        </div>
        <p className="tw:text-xs tw:text-gray-300 tw:mt-3">
          * Scores are simulated for demonstration purposes. In a real implementation, these would be actual assessment scores.
        </p>
      </div>
    </div>
  );
}
