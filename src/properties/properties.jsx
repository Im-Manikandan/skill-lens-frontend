// Imports
import properties from '../js/properties'
import { getEnvMap } from './properties-env';
import { getFetchMap } from './properties-fetch';

// Async Configuration Initialization (fetched from server)
let conf = new Map();

async function initConf() {
  const envMap = await getFetchMap();
  console.debug('Fetched envMap:', envMap);
  conf = new Map([...conf, ...envMap]);
}
await initConf();

// Merged Configuration Map (server config + local properties + env variables)
let conf_prop = new Map([...conf, ...properties, ...getEnvMap()]);

// conf_prop.set("oauthServiceUrl", `http://localhost:9982`);

conf_prop.set('route_path', import.meta.env.BASE_URL);

// OAuth Configuration
const oauth_config = {
    endpoint: conf_prop.get("oauthServiceUrl"),
    baseUrl: conf_prop.get("oauthServiceUrl") + "/api",
    clientId: "next_dialogue",
    clientSecret: "next_dialogue",
    redirect_uri: `${conf_prop.get("domainUrl")}${conf_prop.get("route_path")}/login/client-authorized`,

    authorizePath: '/oauth/authorize',
    tokenPath: '/oauth/token',
    revokePath: '/oauth/revoke'
};
conf_prop.set("oauth_config", oauth_config);

// Derived Configuration Values
export const idleTimeStorageName = `idle_time_dialogue`;
conf_prop.set("authorize_endpoint", conf_prop.get("oauthServiceUrl") + oauth_config.authorizePath + "?response_type=code&client_id=" + oauth_config.clientId + "&redirect_uri=" + oauth_config.redirect_uri + "&scope=email&USER_TYPE=CLIENT");

conf_prop.set("cdn_path", "https://cdn.thinktalentws48.click");
export default conf_prop;
