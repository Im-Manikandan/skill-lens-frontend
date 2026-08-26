import { getJSON, postJSON, postFormData } from '../fetch-helpers';

const SkillFrameworkController = {

  // Upload & Processing
  processSkillFramework: async function(clientId, request) {
    return postJSON(`/admin/clients/${clientId}/skill-framework/process`, request);
  },

  uploadSkillFramework: async function(clientId, file, generateDescriptions = true, generateEmbeddings = true) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('generate_descriptions', generateDescriptions.toString());
    formData.append('generate_embeddings', generateEmbeddings.toString());
    return postFormData(
      `/admin/clients/${clientId}/skill-framework/upload`,
      formData
    );
  },

  // GET Requests
  getClientSkillFramework: async function(clientId) {
    return getJSON(`/admin/clients/${clientId}/skill-framework`);
  },

  getSkillFrameworkStatus: async function(clientId) {
    return getJSON(`/admin/clients/${clientId}/skill-framework/status`);
  },

  // Regeneration
  regenerateEmbeddings: async function(clientId, modelName) {
    return postJSON(
      `/admin/clients/${clientId}/skill-framework/regenerate-embeddings`,
      modelName ? { model_name: modelName } : {}
    );
  },

  regenerateDescriptions: async function(clientId, openaiModel) {
    return postJSON(
      `/admin/clients/${clientId}/skill-framework/regenerate-descriptions`,
      openaiModel ? { openai_model: openaiModel } : {}
    );
  },

  // Clone
  cloneSkillFramework: async function(targetClientId, sourceClientId, regenerateEmbeddings = true, regenerateDescriptions = false) {
    const params = new URLSearchParams();
    params.append('source_client_id', sourceClientId.toString());
    params.append('regenerate_embeddings', regenerateEmbeddings.toString());
    params.append('regenerate_descriptions', regenerateDescriptions.toString());
    return postJSON(
      `/admin/clients/${targetClientId}/skill-framework/clone?${params.toString()}`,
      {}
    );
  },

};

export default SkillFrameworkController;
