import { getJSON, postJSON, putJSON, deleteJSON } from '../fetch-helpers';

const IndustriesController = {

  // GET Requests
  listIndustries: async function(activeOnly = true) {
    const params = new URLSearchParams();
    if (activeOnly) params.append('active_only', 'true');
    return getJSON(`/admin/industries?${params.toString()}`);
  },

  getIndustry: async function(industryId) {
    return getJSON(`/admin/industries/${industryId}`);
  },

  // POST Requests
  createIndustry: async function(industryData) {
    return postJSON('/admin/industries', industryData);
  },

  // PUT Requests
  updateIndustry: async function(industryId, updates) {
    return putJSON(`/admin/industries/${industryId}`, updates);
  },

  // DELETE Requests
  deleteIndustry: async function(industryId) {
    return deleteJSON(`/admin/industries/${industryId}`);
  },

};

export default IndustriesController;
