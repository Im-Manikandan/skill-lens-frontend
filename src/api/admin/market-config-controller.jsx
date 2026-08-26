import { getJSON, postJSON, postFormData, getToken } from '../fetch-helpers';
import conf_prop from '../../properties/properties';

const MarketConfigController = {

  /** Fetch active Market Value config for a client (returns system defaults if none set). */
  getConfig: (clientId) =>
    getJSON(`/admin/clients/${clientId}/market-config`),

  /** Download the Market Value configuration Excel template as a Blob. */
  downloadTemplate: async (clientId) => {
    const token = getToken();
    const headers = new Headers({
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const url = `${conf_prop.get('serviceUrl')}/admin/clients/${clientId}/market-config/template`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Download failed (${res.status})${detail ? ': ' + detail : ''}`);
    }
    return res.blob();
  },

  /** Upload and validate Excel file (does NOT activate). */
  uploadAndValidate: (clientId, file) => {
    const form = new FormData();
    form.append('file', file);
    return postFormData(`/admin/clients/${clientId}/market-config/upload`, form);
  },

  /** Activate a validated Market Value config. */
  activateConfig: (clientId, config, createdBy = 'admin') =>
    postJSON(`/admin/clients/${clientId}/market-config/activate`, { config, created_by: createdBy }),
};

export default MarketConfigController;
