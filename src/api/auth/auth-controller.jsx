import conf_prop from '../../properties/properties';
import { classifyError, FetchUtils } from '@devopsthink/react-security-util';

// Token Refresh
const AuthController = {

  update_token: async function(params) {
    try {
      const response = await fetch(`${conf_prop.get('serviceUrl')}/update-token`, {
        method: 'post',
        body: JSON.stringify(params),
        headers: new Headers({
          'Content-Type': 'application/json',

        }),
      });
      return await FetchUtils.checkStatus(response);
    } catch (error) {
      throw classifyError(error);
    }
  },
  // Login
  loginAdmin: async function(params) {
    try {
      const response = await fetch(`${conf_prop.get('serviceUrl')}/auth/login/admin`, {
        method: 'post',
        body: JSON.stringify(params),
        headers: new Headers({
          'Content-Type': 'application/json',

        }),
      });
      return await FetchUtils.checkStatus(response);
    } catch (error) {
      throw classifyError(error);
    }
  },
  loginClientAdmin: async function(params) {
    try {
      const response = await fetch(`${conf_prop.get('serviceUrl')}/auth/login/client`, {
        method: 'post',
        body: JSON.stringify(params),
        headers: new Headers({
          'Content-Type': 'application/json',

        }),
      });
      return await FetchUtils.checkStatus(response);
    } catch (error) {
      throw classifyError(error);
    }
  },

};


export default AuthController;
