// Local Development Properties
const properties = new Map();

// Service URL Configuration (localhost defaults)
let config = {

    // serviceUrl: "https://app.skilllens.ai/skill-lens-service/routes/v1",
     serviceUrl: "https://skill-lens-backend.onrender.com/routes/v1",
    domainUrl: 'http://localhost:3000',


};
properties.set("serviceUrl", config.serviceUrl);
properties.set("domainUrl", config.domainUrl);

// Sentry Monitoring Configuration (disabled in dev)
properties.set("sentry_dsn", "");
properties.set("sentry_release", "development");
properties.set("ENV", "dev");


export default properties;

