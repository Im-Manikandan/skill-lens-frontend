import { getJSON, postJSON, getToken as _getToken, setToken as _setToken, clearToken as _clearToken } from '../fetch-helpers';

const TokenController = {

  // Token Accessors
  getToken: function() {
    return _getToken();
  },

  setToken: function(token) {
    _setToken(token);
  },

  clearToken: function() {
    _clearToken();
  },

  isAuthenticated: function() {
    return !!_getToken();
  },

  // Auth Flow
  login: async function(credentials) {
    const data = await postJSON('/auth/login', credentials);
    _setToken(data.access_token);
    return data;
  },

  logout: async function() {
    try {
      await postJSON('/auth/logout');
    } finally {
      _clearToken();
    }
  },

  // User Info & Token Refresh
  getCurrentUser: async function() {
    return getJSON('/auth/me');
  },

  refreshToken: async function() {
    const data = await postJSON('/auth/refresh');
    _setToken(data.access_token);
    return data;
  },

};

export default TokenController;
