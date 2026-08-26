'use client';

// Imports
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Briefcase } from 'lucide-react';

export default function PracticeAreaChart({ results }) {
  // Data Processing — count practice areas
  const practiceAreaCounts = results.reduce((acc, p) => {
    p.practice_areas?.forEach(pa => {
      acc[pa] = (acc[pa] || 0) + 1;
    });
    return acc;
  }, {});

  // Chart Data — sort and take top 5 practice areas
  const chartData = Object.entries(practiceAreaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([practiceArea, count], index) => ({
      name: practiceArea.length > 20 ? `${practiceArea.substring(0, 20)}...` : practiceArea,
      fullName: practiceArea,
      value: count,
      color: ['#8fb329', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index] || '#6b7280',
    }));

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="tw:p-2 tw:rounded-lg tw:border tw:border-gray-600 tw:shadow-lg"
          style={{ backgroundColor: '#1f2937' }}
        >
          <p className="tw:text-white tw:font-medium tw:mb-0.5 tw:text-sm">{data.fullName}</p>
          <p className="tw:text-sm" style={{ color: '#8fb329' }}>
            {data.value} profiles
          </p>
          <p className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
            {((data.value / results.length) * 100).toFixed(1)}% of results
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
        <Briefcase className="tw:w-3.5 tw:h-3.5" style={{ color: '#8fb329' }} />
        <h3 className="tw:text-xs tw:font-semibold tw:text-white">Practice Areas</h3>
      </div>
      {/* Pie Chart with Legend, or Empty State */}
      {chartData.length > 0 ? (
        <>
          {/* Pie Chart */}
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={48}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="tw:mt-2 tw:space-y-1">
            {chartData.map((item, index) => (
              <div key={index} className="tw:flex tw:items-center tw:justify-between tw:text-xs">
                <div className="tw:flex tw:items-center tw:space-x-2">
                  <div
                    className="tw:w-2.5 tw:h-2.5 tw:rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="tw:text-gray-300">{item.fullName}</span>
                </div>
                <span className="tw:text-gray-400 tw:font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="tw:flex tw:items-center tw:justify-center tw:text-gray-300" style={{ height: 130 }}>
          <p className="tw:text-xs">No practice area data available</p>
        </div>
      )}
    </div>
  );
}
