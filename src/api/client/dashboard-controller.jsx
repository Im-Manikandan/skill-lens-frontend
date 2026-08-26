import { getJSON } from '../fetch-helpers';

// GET Client Dashboard Data
export const getClientDashboard = (clientId) =>
    getJSON(`/client/${clientId}/dashboard`);
