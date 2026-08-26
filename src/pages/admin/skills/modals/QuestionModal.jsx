import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { Button, Input, Label, FormGroup } from 'reactstrap';
import { Select, MenuItem, FormControl } from '@mui/material';

export default function QuestionModal({ isOpen, onClose, onSave, isLoading, existingQuestion = null, skillFamilies = [] }) {
  const [formData, setFormData] = useState(existingQuestion || {
    skill_family: '',
    question_id: '',
    question_text: '',
    label: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.skill_family || !formData.question_id || !formData.question_text || !formData.label) {
      alert('All fields are required');
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{
          background: 'rgba(30,30,46,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, padding: 30, maxWidth: 600, width: '90%', backdropFilter: 'blur(10px)',
        }}
      >
        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
          <HelpCircle style={{ width: 20, height: 20, color: '#818cf8' }} />
          <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, margin: 0 }}>
            {existingQuestion ? 'Edit Question' : 'Add Self-Assessment Question'}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <FormGroup className="tw:mb-4">
            <Label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Skill Family *
            </Label>
            <FormControl fullWidth size="small">
              <Select
                value={formData.skill_family}
                onChange={(e) => setFormData((prev) => ({ ...prev, skill_family: e.target.value }))}
                displayEmpty
                sx={{
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  color: '#e2e8f0',
                  fontSize: 14,
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.1)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#818cf8',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#818cf8',
                  },
                  '.MuiSvgIcon-root': {
                    color: '#9ca3af',
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: '#1f2937',
                      border: '1px solid rgba(75, 85, 99, 0.6)',
                      borderRadius: '10px',
                      mt: 0.5,
                      '& .MuiMenuItem-root': {
                        color: '#e2e8f0',
                        fontSize: 14,
                        '&:hover': {
                          backgroundColor: 'rgba(129,140,248,0.13)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(129,140,248,0.2)',
                          '&:hover': {
                            backgroundColor: 'rgba(129,140,248,0.27)',
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="" disabled>
                  <span style={{ color: '#6b7280' }}>Select skill family...</span>
                </MenuItem>
                {skillFamilies.map((family) => (
                  <MenuItem key={family} value={family}>{family}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </FormGroup>

          <FormGroup className="tw:mb-4">
            <Label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Question ID *
            </Label>
            <Input
              type="text"
              name="question_id"
              placeholder="e.g., BA_Q1"
              value={formData.question_id}
              onChange={handleChange}
              disabled={!!existingQuestion}
              style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0',
              }}
            />
          </FormGroup>

          <FormGroup className="tw:mb-4">
            <Label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Label *
            </Label>
            <Input
              type="text"
              name="label"
              placeholder="e.g., Q1. Relevant Laws Mastery"
              value={formData.label}
              onChange={handleChange}
              style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0',
              }}
            />
          </FormGroup>

          <FormGroup>
            <Label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Question Text *
            </Label>
            <textarea
              name="question_text"
              placeholder="Enter the question text..."
              value={formData.question_text}
              onChange={handleChange}
              rows={4}
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, background: 'rgba(255,255,255,0.02)', color: '#e2e8f0',
                fontSize: 14, outline: 'none', fontFamily: 'inherit',
              }}
            />
          </FormGroup>

          <div className="tw:flex tw:gap-3 tw:mt-6">
            <Button
              type="submit"
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #818cf8)', border: 'none',
                borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14,
                flex: 1, cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Saving...' : 'Save Question'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#cbd5e1', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 14,
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
