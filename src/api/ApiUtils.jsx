import { decodeJwt, SignJWT } from 'jose';

import SecureLSModule from 'secure-ls';
import { FetchUtils } from '@devopsthink/react-security-util';
// import * as jwt from  'jsonwebtoken';

const SecureLS = SecureLSModule.default || SecureLSModule;

// Environment Config
const storageSecret = import.meta.env.VITE_STORAGE_SECRET;
const apiJwtSecret = import.meta.env.VITE_JWT_SECRET;

const secureStorage = new SecureLS({ encodingType: 'aes', encryptionSecret: storageSecret });
const alg = 'HS256';

// JWT Encode / Decode
export async function encodeJwtString(jsonObject) {
    const secretJwt = new TextEncoder().encode(storageSecret);
    return await new SignJWT(jsonObject).setProtectedHeader({ alg }).sign(secretJwt);
}


export function decodeJwtString(string) {
    return decodeJwt(string);
}

// Secure Storage Utilities
const ApiUtils = {
    checkStatus: FetchUtils.checkStatus,
    checkResponse: FetchUtils.checkResponse,
    queryString: FetchUtils.queryString,

    getCookie: function (cookieName) {
        try {
            return secureStorage.get(cookieName);
        } catch (err) {
            return null;
        }
    },
    setCookie: function (cookieName, cookieVal) {
        secureStorage.set(cookieName, cookieVal);
    },
    getLocalStorage: function (cookieName) {
        try {
            return secureStorage.get(cookieName);
        } catch (err) {
            return null;
        }
    },
    setLocalStorage: function (cookieName, cookieVal) {
        secureStorage.set(cookieName, cookieVal);
        localStorage.setItem(`${cookieName}_raw`, JSON.stringify(cookieVal));
    },
};

export default ApiUtils;
