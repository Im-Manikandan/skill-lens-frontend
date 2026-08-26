'use client';

import React from 'react';
import { TrendingUp, Award, Briefcase, Users, Lightbulb, Target, MessageSquare, Shield, IndianRupee } from 'lucide-react';
import { HCM_DIMENSION_KEYS } from '../constants/hcmDimensions.js';

// Dimension Configuration
const DIMENSION_CONFIG = {
  knowledge_capital: {
    label: 'Knowledge Capital',
    icon: Award,
    color: '#3b82f6',
    description: 'Formal education, domain specialization, continuous learning, coaching contributions'
  },
  experience_capital: {
    label: 'Experience Capital',
    icon: Briefcase,
    color: '#10b981',
    description: 'Years of experience, cross-functional exposure, leadership experience, global experience'
  },
  intellectual_capital: {
    label: 'Intellectual Capital',
    icon: Lightbulb,
    color: '#f59e0b',
    description: 'IPR contributions, publications, thought leadership, innovation, knowledge assets'
  },
  social_capital: {
    label: 'Social Capital',
    icon: Users,
    color: '#8b5cf6',
    description: 'Client relationships, collaboration, professional network, cross-cultural adaptability'
  },
  performance_capital: {
    label: 'Performance Capital',
    icon: Target,
    color: '#ef4444',
    description: 'Technical competence, analytical skills, digital fluency, execution excellence'
  },
  innovation_capital: {
    label: 'Innovation Capital',
    icon: TrendingUp,
    color: '#06b6d4',
    description: 'Learning velocity, adaptability, creative collaboration, experimentation'
  },
  leadership_capital: {
    label: 'Leadership Capital',
    icon: MessageSquare,
    color: '#ec4899',
    description: 'Strategic communication, leadership competencies, emotional intelligence, cultural alignment'
  },
  ethical_capital: {
    label: 'Ethical Capital',
    icon: Shield,
    color: '#84cc16',
    description: 'Integrity, governance, sustainability, ESG impact, DEI engagement, reputation'
  }
};


export default function HCMScorecardTab({ scorecard, valuation }) {
  // Empty State
  if (!scorecard) {
    return (
      <div className="tw:p-6 tw:rounded-lg tw:border tw:border-gray-700 tw:text-center" style={{ backgroundColor: '#1f2937' }}>
        <p className="tw:text-gray-300 tw:font-medium tw:mb-1">HCM Score Not Yet Calculated</p>
        <p className="tw:text-gray-500 tw:text-sm tw:mb-0">
          Scores for this profile have not been computed yet. Contact your administrator to trigger a recompute.
        </p>
      </div>
    );
  }

  // Build dimensions array with null safety (DB data may have missing fields)
  const dimensions = HCM_DIMENSION_KEYS
    .map((key) => scorecard[key])
    .filter(Boolean);

  const compositeScore = scorecard.composite_hcm_score ?? 0;

  // Score Color Helper
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#3b82f6'; // blue
    if (score >= 40) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="tw:space-y-4">
      {/* Composite Score Header */}
      <div className="tw:p-4 tw:rounded-lg tw:border tw:border-gray-700" style={{ backgroundColor: '#1f2937' }}>
        <div className="tw:flex tw:items-center tw:justify-between tw:mb-4">
          <div>
            <h3 className="tw:text-lg tw:font-bold tw:text-white tw:mb-1">HCM Composite Score</h3>
            <p className="tw:text-sm tw:text-gray-400">Human Capital Management Index</p>
          </div>
          <div className="tw:text-right">
            <div
              className="tw:text-3xl tw:font-bold tw:mb-1"
              style={{ color: getScoreColor(compositeScore) }}
            >
              {compositeScore.toFixed(1)}
            </div>
            <p className="tw:text-xs tw:text-gray-400">out of 100</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="tw:w-full tw:rounded-full tw:h-3" style={{ backgroundColor: '#374151' }}>
          <div
            className="tw:h-3 tw:rounded-full tw:transition-all tw:duration-500"
            style={{
              width: `${compositeScore}%`,
              backgroundColor: getScoreColor(compositeScore)
            }}
          />
        </div>
      </div>

      {/* INR Valuation */}
      {valuation && (
        <div className="tw:p-4 tw:rounded-lg tw:border tw:border-gray-700" style={{ backgroundColor: '#1f2937' }}>
          <div className="tw:flex tw:items-center tw:space-x-2 tw:mb-3">
            {/*<IndianRupee className="tw:w-5 tw:h-5 tw:text-yellow-400" />*/}
            <h3 className="tw:text-base tw:font-semibold tw:text-white">Market Valuation</h3>
          </div>
          <div className="tw:grid tw:grid-cols-2 tw:gap-4">
            <div>
              <p className="tw:text-sm tw:text-gray-400 tw:mb-1">Base Salary</p>
              <p className="tw:text-lg tw:font-semibold tw:text-white">
                {valuation.base_salary_inr != null
                  ? `\u20B9${valuation.base_salary_inr}`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="tw:text-sm tw:text-gray-400 tw:mb-1">HCM Adjusted</p>
              <p className="tw:text-lg tw:font-semibold tw:text-green-400">
                {valuation.adjusted_salary_inr != null
                  ? `\u20B9${valuation.adjusted_salary_inr}`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="tw:text-sm tw:text-gray-400 tw:mb-1">Market Tier</p>
              <p className="tw:text-sm tw:font-medium tw:text-white tw:capitalize">{valuation.market_rate_tier ?? 'N/A'}</p>
            </div>
            <div>
              <p className="tw:text-sm tw:text-gray-400 tw:mb-1">HCM Multiplier</p>
              <p className="tw:text-sm tw:font-medium tw:text-white">
                {valuation.hcm_multiplier != null ? `${valuation.hcm_multiplier.toFixed(2)}x` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dimension Scores */}
      {dimensions.length > 0 && (
        <div className="tw:space-y-3">
          <h3 className="tw:text-base tw:font-semibold tw:text-white tw:mb-3">Dimension Breakdown</h3>
          {dimensions.map((dimension) => {
            const config = DIMENSION_CONFIG[dimension.dimension];
            if (!config) return null;
            const Icon = config.icon;

            return (
              <DimensionCard
                key={dimension.dimension}
                dimension={dimension}
                config={config}
                Icon={Icon}
                getScoreColor={getScoreColor}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// DimensionCard Component
function DimensionCard({ dimension, config, Icon, getScoreColor }) {
  const [expanded, setExpanded] = React.useState(false);
  const score = dimension.score ?? 0;

  return (
    <div className="tw:p-4 tw:rounded-lg tw:border tw:border-gray-700" style={{ backgroundColor: '#1f2937' }}>
      {/* Header */}
      <div
        className="tw:flex tw:items-center tw:justify-between tw:cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="tw:flex tw:items-center tw:space-x-3 tw:flex-1">
          <div
            className="tw:p-2 tw:rounded-lg"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <div style={{ color: config.color }}>
              <Icon className="tw:w-5 tw:h-5" />
            </div>
          </div>
          <div className="tw:flex-1">
            <h4 className="tw:font-semibold tw:text-white">{config.label}</h4>
            <p className="tw:text-xs tw:text-gray-400">{config.description}</p>
          </div>
        </div>
        <div className="tw:flex tw:items-center tw:space-x-4">
          <div className="tw:text-right">
            <div
              className="tw:text-2xl tw:font-bold"
              style={{ color: getScoreColor(score) }}
            >
              {score.toFixed(1)}
            </div>
            <p className="tw:text-xs tw:text-gray-400">Score</p>
          </div>
          <div className="tw:text-xs tw:text-gray-500">
            {expanded ? '\u25BC' : '\u25B6'}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="tw:mt-3 tw:w-full tw:rounded-full tw:h-2" style={{ backgroundColor: '#374151' }}>
        <div
          className="tw:h-2 tw:rounded-full tw:transition-all tw:duration-500"
          style={{
            width: `${score}%`,
            backgroundColor: getScoreColor(score)
          }}
        />
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="tw:mt-4 tw:pt-4 tw:border-t tw:border-gray-700 tw:space-y-4">
          {/* Evidence Summary */}
          {dimension.evidence_summary && (
            <div>
              <p className="tw:text-sm tw:font-medium tw:text-gray-300 tw:mb-2">Evidence Summary:</p>
              <p className="tw:text-sm tw:text-gray-400">{dimension.evidence_summary}</p>
            </div>
          )}

          {/* Metrics Breakdown */}
          {dimension.metrics && dimension.metrics.length > 0 && (
            <div>
              <p className="tw:text-sm tw:font-medium tw:text-gray-300 tw:mb-3">Metrics Breakdown:</p>
              <div className="tw:space-y-2">
                {dimension.metrics.map((metric, idx) => (
                  <MetricItem key={idx} metric={metric} getScoreColor={getScoreColor} />
                ))}
              </div>
            </div>
          )}

          {/* Confidence Indicator */}
          {dimension.confidence != null && (
            <div className="tw:flex tw:items-center tw:space-x-2 tw:text-xs tw:text-gray-400">
              <span>Confidence:</span>
              <div className="tw:flex-1 tw:rounded-full tw:h-1.5" style={{ backgroundColor: '#374151' }}>
                <div
                  className="tw:h-1.5 tw:rounded-full"
                  style={{
                    width: `${dimension.confidence * 100}%`,
                    backgroundColor: dimension.confidence > 0.7 ? '#10b981' : '#f59e0b'
                  }}
                />
              </div>
              <span>{(dimension.confidence * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// MetricItem Component
function MetricItem({ metric, getScoreColor }) {
  const metricScore = metric.score ?? 0;

  return (
    <div className="tw:p-3 tw:rounded" style={{ backgroundColor: '#2a2a2a' }}>
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
        <span className="tw:text-sm tw:font-medium tw:text-gray-300">{metric.metric_name}</span>
        <div className="tw:flex tw:items-center tw:space-x-2">
          <span
            className="tw:text-sm tw:font-semibold"
            style={{ color: getScoreColor(metricScore) }}
          >
            {metricScore.toFixed(1)}
          </span>
          {metric.weight != null && (
            <span className="tw:text-xs tw:text-gray-500">({(metric.weight * 100).toFixed(1)}%)</span>
          )}
        </div>
      </div>
      <div className="tw:w-full tw:rounded-full tw:h-1.5" style={{ backgroundColor: '#374151' }}>
        <div
          className="tw:h-1.5 tw:rounded-full"
          style={{
            width: `${metricScore}%`,
            backgroundColor: getScoreColor(metricScore)
          }}
        />
      </div>
      {metric.evidence && metric.evidence.length > 0 && (
        <div className="tw:mt-2">
          <p className="tw:text-xs tw:text-gray-400">Evidence:</p>
          <ul className="tw:list-disc tw:list-inside tw:text-xs tw:text-gray-500 tw:mt-1">
            {metric.evidence.slice(0, 3).map((ev, idx) => (
              <li key={idx}>{ev}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
