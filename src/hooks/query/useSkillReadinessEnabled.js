import { useQuery } from '@tanstack/react-query';
import SkillReadinessConfigController from '../../api/admin/skill-readiness-config-controller.jsx';

/**
 * Single source of truth for whether the Skill Readiness feature is active
 * for a client. Missing/undefined `enabled` on the stored config (rows
 * saved before this flag existed) is treated as active — preserves existing
 * behaviour for clients who never touched the toggle.
 *
 * Shares the ['skillReadinessConfig', clientId] query key with
 * ClientSkillReadinessConfig.jsx / ClientConfigHub.jsx, so admin-side edits
 * are reflected here via the same react-query cache.
 */
export default function useSkillReadinessEnabled(clientId) {
  const { data } = useQuery({
    queryKey: ['skillReadinessConfig', clientId],
    queryFn: () => SkillReadinessConfigController.getConfig(Number(clientId)),
    enabled: !!clientId,
    staleTime: 60 * 1000,
  });

  if (!clientId) return true;
  return data?.config?.enabled !== false;
}
