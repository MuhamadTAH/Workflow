==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit 3eb2e57f8b87b1fa38ee84c080ab91008608a5c1 in branch mains
==> Downloading cache...
==> Transferred 103MB in 7s. Extraction took 3s.
==> Using Node.js version 22.16.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install'...
> backend@1.0.0 postinstall
> npm rebuild sqlite3
rebuilt dependencies successfully
up to date, audited 314 packages in 2s
38 packages are looking for funding
  run `npm fund` for details
5 vulnerabilities (3 low, 2 high)
To address issues that do not require attention, run:
  npm audit fix
To address all issues (including breaking changes), run:
  npm audit fix --force
Run `npm audit` for details.
==> Uploading build...
==> Uploaded in 4.2s. Compression took 1.9s
==> Build successful 🎉
==> Deploying...
==> Running 'npm start'
> backend@1.0.0 start
> node index.js
[dotenv@17.2.1] injecting env (3) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
✅ Active workflows table initialized
🚀 Job Queue initialized with config: {
  maxConcurrentJobs: 3,
  maxRetries: 3,
  retryDelay: 2000,
  jobTimeout: 300000,
  cleanupInterval: 600000
}
[2025-08-28T12:21:15.641Z] INFO: Workflow engine initialized
✅ WorkflowExecutor singleton loaded successfully
🚀 LOADING NODES ROUTES FILE
✅ WhatsApp Trigger: webhookStateManager loaded successfully
📝 REGISTERING /validate-telegram-token route
📝 REGISTERING /verify-claude route (MOCK VERSION)
📝 REGISTERING /telegram-get-updates route
📝 REGISTERING /validate-whatsapp route
✅ EXPORTING NODES ROUTER WITH ROUTES: [
  '/run-node',
  '/validate-telegram-token',
  '/validate-telegram-token',
  '/verify-claude',
  '/telegram-get-updates',
  '/telegram-get-updates',
  '/find-instagram-account-id',
  '/validate-instagram',
  '/validate-whatsapp',
  '/validate-whatsapp'
]
/opt/render/project/src/backend/index.js:356
realtimeManager.initialize(server);
^
ReferenceError: realtimeManager is not defined
    at Object.<anonymous> (/opt/render/project/src/backend/index.js:356:1)
    at Module._compile (node:internal/modules/cjs/loader:1730:14)
    at Object..js (node:internal/modules/cjs/loader:1895:10)
    at Module.load (node:internal/modules/cjs/loader:1465:32)
    at Function._load (node:internal/modules/cjs/loader:1282:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49
Node.js v22.16.0
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
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
[2025-08-28T12:21:51.612Z] INFO: Workflow engine initialized
✅ WorkflowExecutor singleton loaded successfully
🚀 LOADING NODES ROUTES FILE
✅ WhatsApp Trigger: webhookStateManager loaded successfully
📝 REGISTERING /validate-telegram-token route
📝 REGISTERING /verify-claude route (MOCK VERSION)
📝 REGISTERING /telegram-get-updates route
📝 REGISTERING /validate-whatsapp route
✅ EXPORTING NODES ROUTER WITH ROUTES: [
  '/run-node',
  '/validate-telegram-token',
  '/validate-telegram-token',
  '/verify-claude',
  '/telegram-get-updates',
  '/telegram-get-updates',
  '/find-instagram-account-id',
  '/validate-instagram',
  '/validate-whatsapp',
  '/validate-whatsapp'
]
/opt/render/project/src/backend/index.js:356
realtimeManager.initialize(server);
^
ReferenceError: realtimeManager is not defined
    at Object.<anonymous> (/opt/render/project/src/backend/index.js:356:1)
    at Module._compile (node:internal/modules/cjs/loader:1730:14)
    at Object..js (node:internal/modules/cjs/loader:1895:10)
    at Module.load (node:internal/modules/cjs/loader:1465:32)
    at Function._load (node:internal/modules/cjs/loader:1282:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49
Node.js v22.16.0