import { getJSON } from '../fetch-helpers';

// GET all billing plans + the client's currently selected plan
export const getClientBillingPlan = (clientId) =>
    getJSON(`/client/${clientId}/billing-plan`);

// GET list of billing plans (no client context)
export const listBillingPlans = (activeOnly = true) =>
    getJSON(`/client/billing-plans?active_only=${activeOnly}`);
