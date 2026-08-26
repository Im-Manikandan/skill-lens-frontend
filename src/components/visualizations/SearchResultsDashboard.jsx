'use client';

// Imports
import React from 'react';
import { Users, TrendingUp, MapPin, Briefcase, Star, Award } from 'lucide-react';
import ScoreDistributionChart from './ScoreDistributionChart';
import LocationDistributionChart from './LocationDistributionChart';
import PracticeAreaChart from './PracticeAreaChart';

export default function SearchResultsDashboard({ results }) {
  if (results.length === 0) return null;

  // Score Statistics
  const avgScore = results.reduce((sum, p) => sum + (p.composite_score || 0), 0) / results.length;
  const maxScore = Math.max(...results.map(p => p.composite_score || 0));
  const minScore = Math.min(...results.map(p => p.composite_score || 0));

  // Top Location Aggregation
  const locationCounts = results.reduce((acc, p) => {
    const location = p.location || 'Unknown';
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {});
  const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const topLocationCount = locationCounts[topLocation] || 0;

  // Top Practice Area Aggregation
  const practiceAreaCounts = results.reduce((acc, p) => {
    p.practice_areas?.forEach(pa => {
      acc[pa] = (acc[pa] || 0) + 1;
    });
    return acc;
  }, {});
  const topPracticeArea = Object.entries(practiceAreaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const topPracticeAreaCount = practiceAreaCounts[topPracticeArea] || 0;

  // Top Level Aggregation
  const levelCounts = results.reduce((acc, p) => {
    if (p.level) {
      acc[p.level] = (acc[p.level] || 0) + 1;
    }
    return acc;
  }, {});
  const topLevel = Object.entries(levelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const topLevelCount = levelCounts[topLevel] || 0;

  // Web-Enhanced Count
  const webEnhancedCount = results.filter(p => p.web_enhanced).length;

  // Stats Card Configuration
  const stats = [
    { icon: Users, label: 'Results', value: results.length, sub: 'profiles', color: '#8fb329' },
    { icon: TrendingUp, label: 'Avg Score', value: `${avgScore.toFixed(1)}%`, sub: `${minScore.toFixed(0)}–${maxScore.toFixed(0)}%`, color: '#10b981' },
    { icon: MapPin, label: 'Top Location', value: topLocation, sub: `${topLocationCount} profiles`, color: '#3b82f6' },
    { icon: Briefcase, label: 'Top Practice', value: topPracticeArea, sub: `${topPracticeAreaCount} profiles`, color: '#f59e0b' },
    { icon: Star, label: 'Web Enhanced', value: `${webEnhancedCount}/${results.length}`, color: '#10b981' },
    { icon: Award, label: 'Top Level', value: topLevel, sub: `(${topLevelCount})`, color: '#8b5cf6' },
    { icon: Briefcase, label: 'Practice Areas', value: Object.keys(practiceAreaCounts).length, color: '#ec4899' },
  ];

  // Dashboard Rendering
  return (
    <div className="tw:mb-3 tw:space-y-2">
      {/* Stats Strip */}
      <div className="tw:flex tw:flex-wrap tw:gap-2">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2 tw:rounded-lg tw:min-w-0"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                className="tw:flex tw:items-center tw:justify-center tw:shrink-0"
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `${s.color}15`,
                }}
              >
                <Icon style={{ width: 14, height: 14, color: s.color }} />
              </div>
              <div className="tw:min-w-0">
                <div className="tw:flex tw:items-baseline tw:gap-1.5">
                  <span className="tw:text-sm tw:font-bold tw:text-white tw:truncate">{s.value}</span>
                  {s.sub && <span className="tw:text-[10px] tw:text-gray-300 tw:truncate tw:hidden sm:tw:inline">{s.sub}</span>}
                </div>
                <p className="tw:text-[10px] tw:text-gray-300 tw:leading-none tw:mb-0">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribution Charts */}
      <div className="tw:grid tw:grid-cols-3 tw:gap-1">
        <ScoreDistributionChart results={results} />
        <LocationDistributionChart results={results} />
        <PracticeAreaChart results={results} />
      </div>

    </div>
  );
}
