import { getJSON, postJSON, putJSON, deleteJSON } from '../fetch-helpers';

const UsersController = {

  // CRUD Operations
  listUsers: async function(activeOnly = true) {
    const params = new URLSearchParams();
    if (!activeOnly) params.append('active_only', 'false');
    return getJSON(`/admin/user-info?${params.toString()}`);
  },

  getUser: async function(userId) {
    return getJSON(`/admin/user-info/${userId}`);
  },

  createUser: async function(userData) {
    return postJSON('/admin/user-info', userData);
  },

  updateUser: async function(userId, updates) {
    return putJSON(`/admin/user-info/${userId}`, updates);
  },

  deleteUser: async function(userId) {
    return deleteJSON(`/admin/user-info/${userId}`);
  },

  // Role Management
  assignAdminRole: async function(userId) {
    return postJSON(`/admin/admin-role/${userId}`);
  },

  removeAdminRole: async function(userId) {
    return deleteJSON(`/admin/admin-role/${userId}`);
  },

  assignClientAdminRole: async function(userId, clientId) {
    return postJSON(`/admin/client-admin-role/${userId}/${clientId}`);
  },

  removeClientAdminRole: async function(userId, clientId) {
    return deleteJSON(`/admin/client-admin-role/${userId}/${clientId}`);
  },

};

export default UsersController;
