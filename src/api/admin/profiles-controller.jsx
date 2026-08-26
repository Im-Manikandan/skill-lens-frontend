import { getJSON, postJSON, postFormData, deleteJSON } from '../fetch-helpers';

const ProfilesController = {

  listProfiles: async function(clientId) {
    return getJSON(`/admin/profiles/${clientId}`);
  },

  getProfile: async function(clientId, profileId) {
    return getJSON(`/admin/profiles/${clientId}/${profileId}`);
  },

  uploadProfiles: async function(clientId, { file, industryId, version = 'v1', replace = false, upsert = false, source = 'talent', batchId = undefined, displayName = undefined }) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('industry_id', industryId.toString());
    formData.append('version', version);
    formData.append('replace', replace.toString());
    formData.append('upsert', upsert.toString());
    formData.append('source', source);
    if (batchId !== undefined && batchId !== null) formData.append('batch_id', batchId);
    if (displayName !== undefined && displayName !== null) formData.append('display_name', displayName);
    return postFormData(`/admin/profiles/${clientId}/upload`, formData);
  },

  // Recruitment-only: hands a raw resume (PDF/DOCX) to the backend, which runs
  // it through the existing OpenAI integration and returns one profile object
  // already shaped to the same Talent profile schema uploadProfiles() expects
  // (name, summary, locations, skills, attributes). No separate AI client or
  // pipeline — this is the one new endpoint the Recruitment flow needs before
  // it can hand off into the shared uploadProfiles() pipeline.
  parseResume: async function(clientId, { file, industryId }) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('industry_id', industryId.toString());
    return postFormData(`/admin/profiles/${clientId}/parse-resume`, formData);
  },

  // source/batch_ids are query params on this endpoint, not a JSON body — and
  // batch_ids is plural/repeatable server-side (?batch_ids=a&batch_ids=b), not
  // a single batch_id. Sending them as a body silently no-ops: the backend
  // just falls back to its defaults (source='talent', no batch scoping)
  // instead of erroring, so this shape has to match exactly.
  precomputeHCMScores: async function(clientId, industryId, { source, batchIds } = {}) {
    const params = new URLSearchParams();
    if (source) params.append('source', source);
    if (batchIds) {
      (Array.isArray(batchIds) ? batchIds : [batchIds]).forEach((id) => params.append('batch_ids', id));
    }
    const qs = params.toString();
    return postJSON(`/admin/hcm-precompute/${clientId}/${industryId}${qs ? `?${qs}` : ''}`, undefined);
  },

  // Persisted upload batches for a client (source='recruitment' → every
  // folder upload, never overwritten). Backend must return one row per
  // batch_id: { batch_id, display_name, profile_count, uploaded_at }.
  // batch_id is used internally only — never rendered raw in the UI.
  listBatches: async function(clientId, { source = 'recruitment', industryId } = {}) {
    const params = new URLSearchParams();
    params.append('source', source);
    if (industryId !== undefined && industryId !== null) params.append('industry_id', String(industryId));
    return getJSON(`/admin/profiles/${clientId}/batches?${params.toString()}`);
  },

  // Deletes one batch and only the profiles tagged with that batch_id.
  deleteBatch: async function(clientId, batchId) {
    return deleteJSON(`/admin/profiles/${clientId}/batches/${encodeURIComponent(batchId)}`);
  },

  getHCMScores: async function(clientId, { source = 'talent', batchIds = undefined } = {}) {
    const params = new URLSearchParams();
    params.append('source', source);
    if (source === 'recruitment' && batchIds) {
      (Array.isArray(batchIds) ? batchIds : [batchIds]).forEach((id) => params.append('batch_ids', id));
    }
    return getJSON(`/admin/hcm-precompute/${clientId}/scores?${params.toString()}`);
  },

  getHCMProgress: async function(clientId, industryId) {
    return getJSON(`/admin/hcm-precompute/${clientId}/progress?industry_id=${industryId}`);
  },

};

export default ProfilesController;
