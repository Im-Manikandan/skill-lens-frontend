import { getJSON, postJSON } from '../fetch-helpers';

const SearchController = {

  // Search Queries
  // `source`/`batch_ids` default to 'talent'/undefined server-side when
  // omitted — every existing Talent call site (no `source` in its request
  // object) keeps searching exactly what it does today.
  semanticSearch: async function(request) {
    return postJSON('/search/semantic', request);
  },

  skillFrameworkSearch: async function(request) {
    return postJSON('/search/skill-framework', request);
  },

  // Skill & Assessment Lookups
  getCompetencies: async function() {
    return getJSON('/search/competencies');
  },

  getSelfAssessmentQuestions: async function(profileName, skillFamily, skillGroup, topN = 5) {
    const params = new URLSearchParams();
    if (skillFamily) params.append('practice', skillFamily);
    if (skillGroup) params.append('group', skillGroup);
    params.append('top_n', topN.toString());
    return getJSON(`/search/self-assessment/${encodeURIComponent(profileName)}?${params.toString()}`);
  },

  getProfileCompetencies: async function(profileName, topN = 5) {
    return getJSON(`/search/profiles/${encodeURIComponent(profileName)}/competencies?top_n=${topN}`);
  },

  getAvailableFilters: async function() {
    return getJSON('/search/filters');
  },

  // Service Warmup & Health
  warmupSearch: async function(clientId, industryId, source = 'talent', batchIds = undefined) {
    const params = new URLSearchParams();
    if (clientId !== undefined && clientId !== null) params.append('client_id', String(clientId));
    if (industryId !== undefined && industryId !== null) params.append('industry_id', String(industryId));
    params.append('source', source);
    if (Array.isArray(batchIds)) batchIds.forEach((id) => params.append('batch_ids', id));
    return postJSON(`/search/warmup?${params.toString()}`);
  },

  getHealthCheck: async function() {
    return getJSON('/search/health');
  },

  restartSearch: async function() {
    return postJSON('/search/restart');
  },

  /** Fetch latest HCM scorecards for a set of profiles after a background recompute. */
  refreshHCMScores: async function(profileNames, clientId, industryId) {
    return postJSON('/search/hcm-refresh', {
      profile_names: profileNames,
      client_id: clientId,
      industry_id: industryId,
    });
  },

};

export default SearchController;
