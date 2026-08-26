import { getJSON, postJSON, putJSON, deleteJSON } from '../fetch-helpers';

const ClientsController = {

  // GET Requests
  listClients: async function(industryId, activeOnly = true) {
    const params = new URLSearchParams();
    if (industryId) params.append('industry_id', industryId.toString());
    if (activeOnly) params.append('active_only', 'true');
    return getJSON(`/admin/clients?${params.toString()}`);
  },

  getClient: async function(clientId) {
    return getJSON(`/admin/clients/${clientId}`);
  },

  getClientByCode: async function(clientCode) {
    return getJSON(`/admin/clients/code/${clientCode}`);
  },

  // POST Requests
  createClient: async function(clientData) {
    return postJSON('/admin/clients', clientData);
  },

  // PUT Requests
  updateClient: async function(clientId, updates) {
    return putJSON(`/admin/clients/${clientId}`, updates);
  },

  // DELETE Requests
  deleteClient: async function(clientId) {
    return deleteJSON(`/admin/clients/${clientId}`);
  },

  // Plan Management
  listBillingPlans: async function() {
    return getJSON('/admin/clients/billing-plans');
  },

  getClientBillingPlan: async function(clientId) {
    return getJSON(`/client/${clientId}/billing-plan`);
  },

  updateClientBillingPlan: async function(clientId, planId) {
    return putJSON(`/client/${clientId}/billing-plan`, { plan_id: planId });
  },

  // Logo Management
  getClientLogo: async function(clientId) {
    return getJSON(`/admin/clients/${clientId}/logo`);
  },

  updateClientLogo: async function(clientId, base64Logo) {
    return putJSON(`/admin/clients/${clientId}/logo`, { logo: base64Logo });
  },

  deleteClientLogo: async function(clientId) {
    return deleteJSON(`/admin/clients/${clientId}/logo`);
  },

};

export default ClientsController;
