import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import compression from 'compression';
import expressSanitizer from 'express-sanitizer';
import _ from 'lodash';
import * as Sentry from '@sentry/node';
import helmet from 'helmet';
import useragent from 'useragent';
import ESAPI from 'node-esapi';
import cookiesMiddleware from 'universal-cookie-express';
import interceptor from 'express-interceptor';
import * as cheerio from 'cheerio';
import expressStaticGzip from 'express-static-gzip';
import { CryptoEncryption } from '@devopsthink/react-security-util';
import exclude_urls from './exclude_url.json' with { type: 'json' };
import javascript_integration from './javascript_integration.json' with { type: 'json' };

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

let date_ob = new Date();
let date = date_ob.getDate();
let month = date_ob.getMonth() + 1;
let year = date_ob.getFullYear();

const dt_string = year + "-" + month + "-" + date;
// prints date & time in YYYY-MM-DD format

const SENTRY_RELEASE = "nextv3-landing2-user-react-129-" + dt_string;


//sentry start
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: SENTRY_RELEASE,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({tracing: true}),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({app}),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 0.1,
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());


// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});
//sentry end

const port = 5000;
app.use(express.json());
console.log("build",path.join(__dirname, 'build'));

//security start
app.use(compression()); //use compression
app.use(cookiesMiddleware());
//helmet start

app.use(helmet.dnsPrefetchControl());
app.use(
  helmet.expectCt({
    maxAge: 86400,
    enforce: true,
    reportUri: process.env.SENTRY_CSP_REPORT_URI ?? "",
  })
);
app.use(helmet.hidePoweredBy());
app.use(helmet.hsts());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.originAgentCluster());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(function (req, res, next) {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
/*app.use(
    helmet.frameguard({
        action: "sameorigin",
    })
);*/


/*app.use(
    helmet({
    contentSecurityPolicy: false,
  })
);*/
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "default-src": helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc,
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
      "style-src": ["'self'", "https:", "'unsafe-inline'"],
      "img-src": ["'self'", "https:", "data:", "blob:"],
      "worker-src": ["'self'", "https:", "data:", "blob:"],
      "child-src": ["'self'", "https:", "data:", "blob:"],
      "object-src": ["'self'", "https:", "data:", "blob:"],
      "font-src": ["'self'", "https:", "data:"],
      "form-action": ["'self'"],
      "base-uri": ["'self'"],
      "frame-ancestors": ["*"], // <-- Allow all origins
      "upgrade-insecure-requests": [],
      "block-all-mixed-content": [],
      "report-uri": process.env.SENTRY_CSP_REPORT_URI ?? "",
    },
    reportOnly: false
  })
);
//helmet end
app.disable('x-powered-by');
app.use(expressSanitizer());
app.use(ESAPI.middleware());
app.enable('strict routing');
//security end

/*app.use("/skill-lens", express.static(path.join(__dirname, 'build'), {
    maxage: '30min'
}));*/
app.use("/skill-lens", expressStaticGzip(path.join(__dirname, 'build'), {
  enableBrotli: true,
  orderPreference: ['br'],
  serveStatic: {
    maxAge: '60min',
    cacheControl: true
  }
}));
console.log("path",path.join(__dirname, "build", "static"));

app.get('/skill-lens/env.js', (req, res) => {
  let envVariables = 'window.env = {';

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('REACT_APP_')) {
      envVariables += `"${key}": "${value}",`;
    }
  }

  envVariables += '};';

  res.type('text/javascript');
  res.send(envVariables);
});


app.options('/skill-lens/env.json', (req, res) => {
  const origin = req.headers.origin;

  res.set('Access-Control-Allow-Origin', origin || '*');
  res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

// Env endpoint (must come before SPA fallback)
app.get(`/skill-lens/env.json`, (req, res) => {
  let envVariables = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('REACT_APP_')) {
      envVariables[key] = value;
    }

    if (key.startsWith('VITE_')) {
      envVariables[key] = value;
    }
  }

  const configEnv = CryptoEncryption.encrypt(JSON.stringify(envVariables));
  const response  = { envVariables, configEnv };

  const origin = req.headers.origin;

  res.set('Access-Control-Allow-Origin', origin || '*');
  res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.type('application/json');
  res.send(response);
});


const allowedDomains = (process.env.REACT_APP_allowedDomains ?? "").split(",");
var finalParagraphInterceptor = interceptor(function (req, res) {

  return {
    // Only HTML responses will be intercepted
    isInterceptable: function () {
      return /text\/html/.test(res.get('Content-Type'));
    },
    // Appends a paragraph at the end of the response body


    intercept: function (body, send) {
      const url = req.url;
      // get host header
      const host = req.headers.host;
      const exclude_flag = exclude_urls.some(x => url.includes(x))
      var $document = cheerio.load(body);
      let script = "";
      let allowed_domain_filter = "N";
      if(!exclude_flag){
        javascript_integration.forEach((tup) => {
          allowed_domain_filter = tup.ALLOWED_DOMAIN;
          if (allowed_domain_filter === "Y" && allowedDomains.some(x => x === host)) {
            script = tup.INTEGRATION_TEXT;
            $document('head').append(script);
          }

          if(allowed_domain_filter === "N"){
            script = tup.INTEGRATION_TEXT;
            $document('head').append(script);

          }
        });

      }


      send($document.html());
    }
  };
})

// Add the interceptor middleware
app.use(finalParagraphInterceptor);

app.use(function (req, res, next) {
  const url = req.url;
  console.log(url);
  let IGNORE_URL = process.env.IGNORE_URL ?? "";
  console.log("IGNORE_URL",IGNORE_URL);
  const IGNORE_URL_LIST = _.isEmpty(IGNORE_URL) ? [] : IGNORE_URL.split(",");
  const IGNORE_CHECK = IGNORE_URL_LIST.some(x => url.includes(x));

  let USER_TYPE = req.universalCookies.get("OAUTH_USER_TYPE");
  if (_.isEmpty(USER_TYPE)) {
    USER_TYPE = url.includes("/client/") ? "CLIENT" : "ADMIN"
  }


  // "/print" (InfographicPrintPage) is loaded by a headless-browser PDF
  // render with no session/cookies at all — it must never hit the
  // session_intercept gate below, which would redirect it to /auth/logout
  // instead of the report. Access there is gated by the one-time token in
  // the URL, not by this cookie.
  if (url.includes("auth") || url.includes("/print") || "/" === url || IGNORE_CHECK) {
    console.log("login or ignore url", url);
    if (url.includes("authorized")) {
      console.log("authorized", url);
      req.universalCookies.set("session_intercept", "authorized", {
        path: "/",
        maxAge: 24 * 60 * 60,
        httpOnly: true,
        secure: true,
        sameSite: "lax"
      });
    }
    next()
  } else {
    const interceptor = req.universalCookies.get("session_intercept");

    if (_.isEmpty(interceptor)) {
      console.log("logout")
      res.redirect(`/auth/logout?USER_TYPE=${USER_TYPE}`);
    } else {
      req.universalCookies.set("session_intercept", "authorized", {
        path: "/",
        maxAge: 24 * 60 * 60,
        httpOnly: true,
        secure: true,
        sameSite: "lax"
      });
      next();
    }


  }


});



app.use(function (req, res, next) {

  const ua = useragent.is(req.headers['user-agent'])
  // console.info(ua);
  let uaData = _.map(ua, function (value, key) {
    return value;
  }).filter(x => _.isBoolean(x));

  uaData = _.some(uaData, Boolean);


  if (uaData) {
    next()
  } else {
    res.sendFile(path.join(__dirname, '401.html'))
  }

});


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
});

app.listen(port, "0.0.0.0", function () {
  console.log('Server listening on port ' + port + '...');
});
