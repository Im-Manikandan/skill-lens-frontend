'use client';

// Imports
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapPin } from 'lucide-react';

export default function LocationDistributionChart({ results }) {
  // Data Processing — count profiles by location
  const locationCounts = results.reduce((acc, p) => {
    const location = p.location || 'Unknown';
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {});

  // Chart Data — sort and take top 5 locations
  const chartData = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([location, count], index) => ({
      location: location.length > 15 ? `${location.substring(0, 15)}...` : location,
      count,
      fullLocation: location,
      color: ['#8fb329', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index] || '#6b7280',
    }));

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="tw:p-2 tw:rounded-lg tw:border tw:border-gray-600 tw:shadow-lg"
          style={{ backgroundColor: '#1f2937' }}
        >
          <p className="tw:text-white tw:font-medium tw:mb-0.5 tw:text-sm">{payload[0].payload.fullLocation}</p>
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
        <MapPin className="tw:w-3.5 tw:h-3.5" style={{ color: '#8fb329' }} />
        <h3 className="tw:text-xs tw:font-semibold tw:text-white">Top Locations</h3>
      </div>
      {/* Horizontal Bar Chart or Empty State */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" tick={{ fill: '#d1d5db', fontSize: 10 }} stroke="#4b5563" />
            <YAxis
              type="category"
              dataKey="location"
              tick={{ fill: '#d1d5db', fontSize: 10 }}
              stroke="#4b5563"
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="tw:flex tw:items-center tw:justify-center tw:text-gray-300" style={{ height: 130 }}>
          <p className="tw:text-xs">No location data available</p>
        </div>
      )}
    </div>
  );
}
