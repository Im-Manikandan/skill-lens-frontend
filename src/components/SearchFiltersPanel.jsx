'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Filter, ChevronUp } from 'lucide-react';

export default function SearchFiltersPanel({
  filters,
  availableFilters,
  onFiltersChange,
  onApplyFilters,
  onCloseFilters,
  hasResults = false,
  filtersModified = false
}) {
  // Event Handlers
  const handleFilterChange = (filterType, value, checked) => {
    const currentValues = filters[filterType] || [];
    let newValues;

    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(v => v !== value);
    }

    onFiltersChange({
      ...filters,
      [filterType]: newValues.length > 0 ? newValues : undefined
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    // When filters are cleared, we should also mark as modified if there were active filters
    if (hasActiveFilters) {
      // This will trigger the onFiltersChange which will set filtersModified to true
    }
  };

  // Derived State
  const hasActiveFilters = Object.values(filters).some(value => value && value.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-4"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Checkboxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Levels Filter */}
        <div className="md:col-span-1">
          <h4 className="font-medium text-gray-900 mb-3">Level</h4>
          <div className="space-y-2">
            {availableFilters.levels.map((level) => (
              <label key={level} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.levels?.includes(level) || false}
                  onChange={(e) => handleFilterChange('levels', level, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Locations Filter */}
        <div className="md:col-span-3">
          <h4 className="font-medium text-gray-900 mb-3">Location</h4>
          <div className="grid grid-cols-5 gap-2">
            {availableFilters.locations.map((location) => (
              <label key={location} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.locations?.includes(location) || false}
                  onChange={(e) => handleFilterChange('locations', location, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{location}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Active Filters</h4>
          <div className="flex flex-wrap gap-2">
            {filters.levels?.map((level) => (
              <span
                key={`level-${level}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                Level: {level}
                <button
                  onClick={() => handleFilterChange('levels', level, false)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.locations?.map((location) => (
              <span
                key={`location-${location}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                Location: {location}
                <button
                  onClick={() => handleFilterChange('locations', location, false)}
                  className="ml-1 hover:text-green-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {hasActiveFilters ? (
              <span>
                {filtersModified
                  ? 'Filters modified - click to update search results'
                  : `Ready to filter ${hasResults ? 'current results' : 'search results'}`
                }
              </span>
            ) : (
              <span>Select filters to refine your search</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {onApplyFilters && (
              <button
                onClick={onApplyFilters}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  filtersModified
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                {filtersModified ? 'Update Search Results' : 'Filter Search Results'}
              </button>
            )}
            {(
              <button
                onClick={clearAllFilters}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </button>
            )}
            {onCloseFilters && (
              <button
                onClick={onCloseFilters}
                className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Close filters"
              >
                <ChevronUp className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}