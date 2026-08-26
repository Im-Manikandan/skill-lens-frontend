import { classifyError, FetchUtils } from '@devopsthink/react-security-util';

// Environment Config Loader
const FetchConfigController = {

  fetchConfig: async function() {
    try {
      const url = `${window.location.origin}${import.meta.env.BASE_URL}/env.json`;
      // const url = `http://localhost:3006/landing-user/env.json`;
      const response = await fetch(url, {
        method: 'get',
        headers: new Headers({

        }),
      });
      return await FetchUtils.checkStatus(response);
    } catch (error) {
      throw classifyError(error);
    }
  },


};

export default FetchConfigController;