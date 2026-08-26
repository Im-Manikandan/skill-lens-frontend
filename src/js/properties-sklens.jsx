// Production Properties (template placeholders replaced at build/deploy time)
const properties = new Map();

// Service URL Configuration
const config = {

    serviceDomain: `${window.location.hostname}`,
    serviceUrl: `${window.location.origin}`,
    domainUrl: `${window.location.origin}`

};
properties.set("serviceDomain", config.serviceDomain);
properties.set("serviceUrl", `${config.serviceUrl}/skill-lens-service/routes/v1`);
properties.set("domainUrl", config.domainUrl);

// Sentry Monitoring Configuration (replaced by CI/CD pipeline)
properties.set("sentry_dsn", "{{SENTRY_DSN}}");
properties.set("sentry_release", "{{SENTRY_RELEASE}}");

export default properties;