import { getJSON, postJSON, postFormData, getToken } from '../fetch-helpers';
import conf_prop from '../../properties/properties';

const DimensionConfigController = {

  /** Fetch active dimension config for a client. */
  getConfig: (clientId) =>
    getJSON(`/admin/clients/${clientId}/dimension-config`),

  /** Download Excel template as a Blob. Uses raw fetch (authFetch would call .json() on binary). */
  downloadTemplate: async (clientId) => {
    const token = getToken();
    const headers = new Headers({
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const url = `${conf_prop.get('serviceUrl')}/admin/clients/${clientId}/dimension-config/template`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Download failed (${res.status})${detail ? ': ' + detail : ''}`);
    }
    return res.blob();
  },

  /** Download annotated JSON schema/template for profile uploads. Uses raw fetch (binary). */
  downloadProfileTemplate: async (clientId) => {
    const token = getToken();
    const headers = new Headers({ Accept: 'application/json' });
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const url = `${conf_prop.get('serviceUrl')}/admin/clients/${clientId}/dimension-config/profile-template`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Download failed (${res.status})${detail ? ': ' + detail : ''}`);
    }
    return res.blob();
  },

  /** Upload Excel file for validation (does NOT activate). */
  uploadAndValidate: (clientId, file) => {
    const form = new FormData();
    form.append('file', file);
    return postFormData(`/admin/clients/${clientId}/dimension-config/upload`, form);
  },

  /** Activate a validated dimension list. Sends industry_id so backend auto-triggers reembed. */
  activateConfig: (clientId, dimensions, industryId) =>
    postJSON(`/admin/clients/${clientId}/dimension-config/activate`, { dimensions, industry_id: industryId }),

  /** Trigger background re-embedding job. */
  triggerReembed: (clientId, industryId) =>
    postJSON(`/admin/clients/${clientId}/dimension-config/reembed`, { industry_id: industryId }),

  /** Poll re-embedding job status. */
  getReembedStatus: (clientId) =>
    getJSON(`/admin/clients/${clientId}/dimension-config/reembed/status`),
};

export default DimensionConfigController;
