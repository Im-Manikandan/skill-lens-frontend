import { getJSON, postJSON, putJSON, deleteJSON, postFormData } from '../fetch-helpers';
import { NotFoundError, UnprocessableEntityError } from '@devopsthink/react-security-util';

const FrameworksController = {

  // CRUD Operations
  createFramework: async function(clientId, frameworkData) {
    return postJSON(`/admin/clients/${clientId}/skill-frameworks`, frameworkData);
  },

  listFrameworks: async function(clientId, includeInactive = false) {
    const params = new URLSearchParams();
    if (includeInactive) params.append('include_inactive', 'true');
    return getJSON(`/admin/clients/${clientId}/skill-frameworks?${params.toString()}`);
  },

  getFramework: async function(clientId, frameworkId) {
    return getJSON(`/admin/clients/${clientId}/skill-frameworks/${frameworkId}`);
  },

  updateFramework: async function(clientId, frameworkId, updates) {
    return putJSON(`/admin/clients/${clientId}/skill-frameworks/${frameworkId}`, updates);
  },

  deleteFramework: async function(clientId, frameworkId) {
    return deleteJSON(`/admin/clients/${clientId}/skill-frameworks/${frameworkId}`);
  },

  // Activation & Status
  activateFramework: async function(clientId, frameworkId) {
    return postJSON(`/admin/clients/${clientId}/skill-frameworks/${frameworkId}/activate`);
  },

  deactivateFramework: async function(clientId, frameworkId) {
    return postJSON(`/admin/clients/${clientId}/skill-frameworks/${frameworkId}/deactivate`);
  },

  getActiveFramework: async function(clientId) {
    try {
      return await getJSON(`/admin/clients/${clientId}/skill-frameworks/active`);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof UnprocessableEntityError) {
        return null;
      }
      throw error;
    }
  },

  getFrameworkData: async function(clientId, frameworkId) {
    return getJSON(`/admin/clients/${clientId}/skill-frameworks/${frameworkId}/data`);
  },

  getFrameworkStatus: async function(clientId, frameworkId) {
    return getJSON(`/admin/clients/${clientId}/skill-frameworks/${frameworkId}/status`);
  },

  // File Upload & Processing
  uploadFramework: async function(clientId, frameworkId, file, generateDescriptions = true, generateEmbeddings = true) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('generate_descriptions', generateDescriptions.toString());
    formData.append('generate_embeddings', generateEmbeddings.toString());
    return postFormData(
      `/admin/clients/${clientId}/skill-frameworks/${frameworkId}/upload`,
      formData,
    );
  },

  regenerateFrameworkEmbeddings: async function(clientId, frameworkId, modelName) {
    return postJSON(
      `/admin/clients/${clientId}/skill-frameworks/${frameworkId}/regenerate-embeddings`,
      modelName ? { model_name: modelName } : {}
    );
  },

  regenerateFrameworkDescriptions: async function(clientId, frameworkId, openaiModel) {
    return postJSON(
      `/admin/clients/${clientId}/skill-frameworks/${frameworkId}/regenerate-descriptions`,
      openaiModel ? { openai_model: openaiModel } : {}
    );
  },

  // Clone
  cloneFramework: async function(clientId, targetFrameworkId, sourceFrameworkId, regenerateEmbeddings = true, regenerateDescriptions = false) {
    const params = new URLSearchParams();
    params.append('source_framework_id', sourceFrameworkId.toString());
    params.append('regenerate_embeddings', regenerateEmbeddings.toString());
    params.append('regenerate_descriptions', regenerateDescriptions.toString());
    return postJSON(
      `/admin/clients/${clientId}/skill-frameworks/${targetFrameworkId}/clone?${params.toString()}`
    );
  },

};

export default FrameworksController;
