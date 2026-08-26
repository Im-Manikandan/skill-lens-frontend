'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export default function SkillFrameworkSelector({
  state,
  onSkillFamilyChange,
  onSkillGroupChange,
  onCompetencyChange,
  onSearch
}) {
  const { selectedSkillFamily, selectedSkillGroup, selectedCompetency, skill_families, skill_groups, competencies } = state;

  const filteredGroups = selectedSkillFamily
    ? skill_groups.filter(group => group.skill_family === selectedSkillFamily)
    : [];

  const filteredCompetencies = (selectedSkillFamily && selectedSkillGroup)
    ? competencies.filter(comp =>
        comp.skill_family === selectedSkillFamily &&
        comp.group_item === selectedSkillGroup
      )
    : [];

  const canSearch = selectedSkillFamily && selectedSkillGroup && selectedCompetency;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Skill Framework Search</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Skill Family */}
        <FormControl fullWidth size="small">
          <InputLabel>Skill Family</InputLabel>
          <Select
            value={selectedSkillFamily}
            label="Skill Family"
            onChange={(e) => onSkillFamilyChange(e.target.value)}
          >
            <MenuItem value=""><em>Select Skill Family</em></MenuItem>
            {skill_families.map((family) => (
              <MenuItem key={family.skill_family} value={family.skill_family}>
                {family.skill_family}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Skill Group */}
        <FormControl fullWidth size="small" disabled={!selectedSkillFamily}>
          <InputLabel>Skill Group</InputLabel>
          <Select
            value={selectedSkillGroup}
            label="Skill Group"
            onChange={(e) => onSkillGroupChange(e.target.value)}
          >
            <MenuItem value=""><em>Select Skill Group</em></MenuItem>
            {filteredGroups.map((group) => (
              <MenuItem key={group.group_item} value={group.group_item}>
                {group.group_item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Skill */}
        <FormControl fullWidth size="small" disabled={!selectedSkillGroup}>
          <InputLabel>Skill</InputLabel>
          <Select
            value={selectedCompetency}
            label="Skill"
            onChange={(e) => onCompetencyChange(e.target.value)}
          >
            <MenuItem value=""><em>Select Skill</em></MenuItem>
            {filteredCompetencies.map((comp) => (
              <MenuItem key={comp.competency} value={comp.competency}>
                {comp.competency}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      {/* Search Button */}
      <div className="flex justify-end">
        <button
          onClick={onSearch}
          disabled={!canSearch}
          className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
            canSearch
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>
      </div>

      {/* Selection Summary */}
      {canSearch && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <h4 className="font-medium text-blue-900 mb-2">Search Criteria</h4>
          <div className="text-sm text-blue-800">
            <p><span className="font-medium">Skill Family:</span> {selectedSkillFamily}</p>
            <p><span className="font-medium">Skill Group:</span> {selectedSkillGroup}</p>
            <p><span className="font-medium">Skill:</span> {selectedCompetency}</p>
          </div>
        </motion.div>
      )}

      <div className="text-sm text-gray-600">
        <p>Select a skill family, skill group, and skill to find professionals with matching expertise.</p>
      </div>
    </div>
  );
}
