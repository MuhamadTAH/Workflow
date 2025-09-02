==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit 6656a9f6c923b142f9ac3bbd8e56b98a4973301c in branch mains
==> Using Node.js version 22.16.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install'...
> backend@1.0.0 postinstall
> npm rebuild sqlite3
rebuilt dependencies successfully
added 121 packages, changed 13 packages, and audited 344 packages in 8s
39 packages are looking for funding
  run `npm fund` for details
5 vulnerabilities (3 low, 2 high)
To address issues that do not require attention, run:
  npm audit fix
To address all issues (including breaking changes), run:
  npm audit fix --force
Run `npm audit` for details.
==> Uploading build...
==> Uploaded in 5.0s. Compression took 2.9s
==> Build successful 🎉
==> Deploying...
==> Running 'npm start'
> backend@1.0.0 start
> node index.js
[dotenv@17.2.1] injecting env (3) from .env -- tip: 📡 observe env with Radar: https://dotenvx.com/radar
✅ Active workflows table initialized
🚀 Job Queue initialized with config: {
  maxConcurrentJobs: 3,
  maxRetries: 3,
  retryDelay: 2000,
  jobTimeout: 300000,
  cleanupInterval: 600000
}
[2025-09-02T11:07:37.558Z] INFO: Workflow engine initialized
✅ WorkflowExecutor singleton loaded successfully
node:internal/modules/cjs/loader:1404
  throw err;
  ^
Error: Cannot find module '../middleware/auth'
Require stack:
- /opt/render/project/src/backend/routes/telegramListener.js
- /opt/render/project/src/backend/index.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1401:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1057:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1062:22)
    at Function._load (node:internal/modules/cjs/loader:1211:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/opt/render/project/src/backend/routes/telegramListener.js:8:30)
    at Module._compile (node:internal/modules/cjs/loader:1730:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/opt/render/project/src/backend/routes/telegramListener.js',
    '/opt/render/project/src/backend/index.js'
  ]
}
Node.js v22.16.0
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Running 'npm start'
> backend@1.0.0 start
> node index.js
[dotenv@17.2.1] injecting env (3) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
node:internal/modules/cjs/loader:1404
  throw err;
  ^
Error: Cannot find module '../middleware/auth'
Require stack:
- /opt/render/project/src/backend/routes/telegramListener.js
- /opt/render/project/src/backend/index.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1401:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1057:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1062:22)
    at Function._load (node:internal/modules/cjs/loader:1211:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/opt/render/project/src/backend/routes/telegramListener.js:8:30)
    at Module._compile (node:internal/modules/cjs/loader:1730:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/opt/render/project/src/backend/routes/telegramListener.js',
    '/opt/render/project/src/backend/index.js'
  ]
}
Node.js v22.16.0