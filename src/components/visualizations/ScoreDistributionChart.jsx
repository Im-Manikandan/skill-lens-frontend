'use client';

// Imports
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function ScoreDistributionChart({ results }) {
  // Score Bucket Definitions
  const buckets = [
    { range: '0-20%', min: 0, max: 20, count: 0, color: '#ef4444' },
    { range: '21-40%', min: 21, max: 40, count: 0, color: '#f59e0b' },
    { range: '41-60%', min: 41, max: 60, count: 0, color: '#eab308' },
    { range: '61-80%', min: 61, max: 80, count: 0, color: '#84cc16' },
    { range: '81-100%', min: 81, max: 100, count: 0, color: '#10b981' },
  ];

  // Data Processing — count profiles in each bucket
  results.forEach(profile => {
    const score = profile.composite_score || 0;
    const bucket = buckets.find(b => score >= b.min && score <= b.max);
    if (bucket) {
      bucket.count++;
    }
  });

  // Chart Data Formatting
  const chartData = buckets.map(b => ({
    range: b.range,
    count: b.count,
    color: b.color,
  }));

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="tw:p-2 tw:rounded-lg tw:border tw:border-gray-600 tw:shadow-lg"
          style={{ backgroundColor: '#1f2937' }}
        >
          <p className="tw:text-white tw:font-medium tw:mb-0.5 tw:text-sm">{payload[0].payload.range}</p>
          <p className="tw:text-sm" style={{ color: '#8fb329' }}>
            {payload[0].value} profiles
          </p>
        </div>
      );
    }
    return null;
  };

  // Chart Rendering
  return (
    <div
      className="tw:p-2.5 tw:rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Section Header */}
      <div className="tw:flex tw:items-center tw:space-x-2 tw:mb-2">
        <TrendingUp className="tw:w-3.5 tw:h-3.5" style={{ color: '#8fb329' }} />
        <h3 className="tw:text-xs tw:font-semibold tw:text-white">Score Distribution</h3>
      </div>
      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="range"
            tick={{ fill: '#d1d5db', fontSize: 10 }}
            stroke="#4b5563"
          />
          <YAxis
            tick={{ fill: '#d1d5db', fontSize: 10 }}
            stroke="#4b5563"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
