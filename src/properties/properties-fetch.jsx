// Imports
import { CryptoEncryption } from '@devopsthink/react-security-util';
import FetchConfigController from '../api/fetch-config-controller.jsx';

// Fetch and Decrypt Server-Side Configuration
export async function getFetchMap() {

  const configEnvMap = new Map();
  try{
    // Fetch Encrypted Config from Server
    const fetchEnv = await FetchConfigController.fetchConfig()

      const encEnv = fetchEnv?.configEnv || "";

      // Decrypt and Parse Configuration
      if(encEnv){
        const decryptedEnvStr = CryptoEncryption.decrypt(encEnv);
        const configEnv = JSON.parse(decryptedEnvStr);
        for (const [key, value] of Object.entries(configEnv)) {
          configEnvMap.set(key.replace(/^VITE_|^REACT_APP_/, ''), value);
        }

        console.debug('Fetched configEnv:', configEnvMap);

        // Populate import.meta.env for Vite Compatibility
        for (const [key, value] of configEnvMap.entries()) {
          import.meta.env[key] = value;
          // process.env[key] = value;
        }
      }

  }catch(e){
    console.error('Error parsing configEnv:', e);
  }

  console.debug('Fetched vite_ENV:', import.meta.env);

  return new Map([...configEnvMap]);
}