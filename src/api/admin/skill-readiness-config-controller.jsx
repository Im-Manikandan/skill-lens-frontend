import { getJSON, postJSON } from '../fetch-helpers';

const SkillReadinessConfigController = {

  /** Fetch active Skill Readiness config for a client (returns system defaults if none set). */
  getConfig: (clientId) =>
    getJSON(`/admin/clients/${clientId}/skill-readiness-config`),

  /** Save (create/update) the Skill Readiness config for a client. */
  saveConfig: (clientId, config, createdBy = 'admin') =>
    postJSON(`/admin/clients/${clientId}/skill-readiness-config/save`, { config, created_by: createdBy }),
};

export default SkillReadinessConfigController;
