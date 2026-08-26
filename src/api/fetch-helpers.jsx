import conf_prop from '../properties/properties';
import {classifyError, FetchUtils, UnauthorizedError} from '@devopsthink/react-security-util';
import ApiUtils from "src/api/ApiUtils.jsx";

// Token Management
function getToken() {
    if (typeof window !== 'undefined') {
        return ApiUtils.getCookie('accessToken');
    }
    return null;
}

function setToken(token) {
    if (typeof window !== 'undefined') {
        ApiUtils.setCookie('accessToken', token)
    }
}

function clearToken() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
    }
}

// Auth Headers Builder
function authHeaders(contentType = 'application/json') {
    const headers = {};
    if (contentType) {
        headers['Content-Type'] = contentType;
    }
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return new Headers(headers);
}

// Core Fetch Wrapper (with error handling)
// suppressLogout: true → throw UnauthorizedError instead of redirecting to logout.
// Use for non-critical calls (infographic, optional enrichment) where a 401 should
// surface as an error in the component, not evict the user from the session.
async function authFetch(path, options = {}) {
    const { suppressLogout = false, ...fetchOptions } = options;
    const url = `${conf_prop.get('serviceUrl')}${path}`;

    try {
        const response = await fetch(url, fetchOptions);
        return await FetchUtils.checkStatus(response);
    } catch (error) {
        const classified = classifyError(error);
        if (classified instanceof UnauthorizedError && !suppressLogout) {
            clearToken();
            window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/auth/logout`;
        }
        throw classified;
    }
}

// HTTP Method Helpers
async function getJSON(path, options = {}) {
    return authFetch(path, {
        method: 'GET',
        headers: authHeaders(),
        ...options,
    });
}

async function postJSON(path, body, options = {}) {
    return authFetch(path, {
        method: 'POST',
        headers: authHeaders(),
        body: body !== undefined ? JSON.stringify(body) : undefined,
        ...options,
    });
}

async function putJSON(path, body = {}, options = {}) {
    return authFetch(path, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
        ...options,
    });
}

async function deleteJSON(path, options = {}) {
    return authFetch(path, {
        method: 'DELETE',
        headers: authHeaders(),
        ...options,
    });
}

async function postFormData(path, formData, options = {}) {
    const headers = {};
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return authFetch(path, {
        method: 'POST',
        headers: new Headers(headers),
        body: formData,
        ...options,
    });
}

// Returns a Blob — bypasses FetchUtils.checkStatus JSON parsing.
async function postBlob(path, body, options = {}) {
    const { suppressLogout = false } = options;
    const url = `${conf_prop.get('serviceUrl')}${path}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: authHeaders(),
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (response.status === 401) {
        if (!suppressLogout) {
            clearToken();
            window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/auth/logout`;
        }
        throw new Error('Unauthorized');
    }
    if (!response.ok) {
        const msg = await response.text().catch(() => '');
        throw new Error(`Request failed: ${response.status}${msg ? ` — ${msg}` : ''}`);
    }
    return response.blob();
}

// Exports
export {
    getToken,
    setToken,
    clearToken,
    authHeaders,
    authFetch,
    getJSON,
    postJSON,
    putJSON,
    deleteJSON,
    postFormData,
    postBlob,
};
