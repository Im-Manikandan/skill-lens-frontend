import { useQuery } from '@tanstack/react-query';
import { getMyClients } from '../../api/client/client-admin-controller';

const FIVE_MIN = 5 * 60 * 1000;

const useMyClients = () =>
    useQuery({
        queryKey: ['my-clients'],
        queryFn: getMyClients,
        staleTime: FIVE_MIN,
        refetchOnWindowFocus: false,
        retry: false,
    });

export default useMyClients;
