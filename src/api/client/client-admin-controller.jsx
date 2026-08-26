import { getJSON } from '../fetch-helpers';

// GET active client workspaces for the authenticated client admin
export const getMyClients = () => getJSON('/client-admin/me/clients');
