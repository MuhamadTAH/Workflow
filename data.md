==> Downloading cache...
==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit 85754e1bf6f83a5b4ae279242a295a09e704ce2e in branch mains
==> Transferred 222MB in 8s. Extraction took 4s.
==> Using Node.js version 22.16.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install'...
> backend@1.0.0 postinstall
> npm rebuild sqlite3
rebuilt dependencies successfully
up to date, audited 357 packages in 1s
39 packages are looking for funding
  run `npm fund` for details
5 vulnerabilities (3 low, 2 high)
To address issues that do not require attention, run:
  npm audit fix
To address all issues (including breaking changes), run:
  npm audit fix --force
Run `npm audit` for details.
==> Uploading build...
==> Uploaded in 6.7s. Compression took 2.3s
==> Build successful 🎉
==> Deploying...
==> Running 'npm start'
> backend@1.0.0 start
> node index.js
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
📁 Using persistent database: /opt/render/project/src/data/database.sqlite
✅ Active workflows table initialized
🚀 Job Queue initialized with config: {
  maxConcurrentJobs: 3,
  maxRetries: 3,
  retryDelay: 2000,
  jobTimeout: 300000,
  cleanupInterval: 600000
}
[2025-09-11T20:32:46.503Z] INFO: Workflow engine initialized
⚠️  Stripe API key not provided - payment processing disabled
✅ WorkflowExecutor singleton loaded successfully
📝 Registering /telegram-workflow route
/opt/render/project/src/backend/routes/telegramListener.js:1677
  } catch (error) {
    ^^^^^
SyntaxError: Unexpected token 'catch'
    at wrapSafe (node:internal/modules/cjs/loader:1662:18)
    at Module._compile (node:internal/modules/cjs/loader:1704:20)
    at Object..js (node:internal/modules/cjs/loader:1895:10)
    at Module.load (node:internal/modules/cjs/loader:1465:32)
    at Function._load (node:internal/modules/cjs/loader:1282:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/opt/render/project/src/backend/index.js:28:32)
Node.js v22.16.0
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Running 'npm start'
> backend@1.0.0 start
> node index.js
[dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  override existing env vars with { override: true }
📁 Using persistent database: /opt/render/project/src/data/database.sqlite
✅ Active workflows table initialized
🚀 Job Queue initialized with config: {
  maxConcurrentJobs: 3,
  maxRetries: 3,
  retryDelay: 2000,
  jobTimeout: 300000,
  cleanupInterval: 600000
}
[2025-09-11T20:32:59.449Z] INFO: Workflow engine initialized
⚠️  Stripe API key not provided - payment processing disabled
✅ WorkflowExecutor singleton loaded successfully
📝 Registering /telegram-workflow route
/opt/render/project/src/backend/routes/telegramListener.js:1677
  } catch (error) {
    ^^^^^
SyntaxError: Unexpected token 'catch'
    at wrapSafe (node:internal/modules/cjs/loader:1662:18)
    at Module._compile (node:internal/modules/cjs/loader:1704:20)
    at Object..js (node:internal/modules/cjs/loader:1895:10)
    at Module.load (node:internal/modules/cjs/loader:1465:32)
    at Function._load (node:internal/modules/cjs/loader:1282:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/opt/render/project/src/backend/index.js:28:32)
Node.js v22.16.0