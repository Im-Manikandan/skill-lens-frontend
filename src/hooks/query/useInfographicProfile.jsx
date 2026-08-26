import { useQuery } from '@tanstack/react-query';
import InfographicController from '../../api/infographic-controller';

// Only fetches when profileId is provided — the report modal is normally fed
// a full profile object already in memory (search results) and only falls
// back to this hook when it has just an id (refresh / deep link).
const useInfographicProfile = (profileId) =>
    useQuery({
        queryKey: ['infographic-profile', profileId],
        queryFn: () => InfographicController.getProfile(profileId),
        enabled: profileId != null,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: false,
    });

export default useInfographicProfile;
