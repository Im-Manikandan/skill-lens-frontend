/**
 * Single source of truth for the 8 HCM dimensions.
 * Add, remove, or rename a dimension here — every screen updates automatically.
 */

export const HCM_DIMENSION_KEYS = [
  'knowledge_capital',
  'experience_capital',
  'intellectual_capital',
  'social_capital',
  'performance_capital',
  'innovation_capital',
  'leadership_capital',
  'ethical_capital',
];

export const HCM_DIMENSION_LABELS = {
  knowledge_capital:    'Knowledge Capital',
  experience_capital:   'Experience Capital',
  intellectual_capital: 'Intellectual Capital',
  social_capital:       'Social Capital',
  performance_capital:  'Performance Capital',
  innovation_capital:   'Innovation Capital',
  leadership_capital:   'Leadership Capital',
  ethical_capital:      'Ethical Capital',
};

/** Ordered array of { key, label } — convenient for mapping over in components. */
export const HCM_DIMENSIONS = HCM_DIMENSION_KEYS.map(key => ({
  key,
  label: HCM_DIMENSION_LABELS[key],
}));
