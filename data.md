==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit 00cb850a14c94f3732224545eb6e07bcd3802d4a in branch mains
==> Using Node.js version 22.16.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install'...
> backend@1.0.0 postinstall
> npm rebuild sqlite3
rebuilt dependencies successfully
added 121 packages, changed 13 packages, and audited 344 packages in 7s
39 packages are looking for funding
  run `npm fund` for details
5 vulnerabilities (3 low, 2 high)
To address issues that do not require attention, run:
  npm audit fix
To address all issues (including breaking changes), run:
  npm audit fix --force
Run `npm audit` for details.
==> Uploading build...
==> Uploaded in 5.5s. Compression took 2.0s
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
[2025-09-02T10:18:24.403Z] INFO: Workflow engine initialized
✅ WorkflowExecutor singleton loaded successfully
/opt/render/project/src/backend/routes/instagram-comments.js:220
              await fetchUserInfo(senderId);
              ^^^^^
SyntaxError: await is only valid in async functions and the top level bodies of modules
    at wrapSafe (node:internal/modules/cjs/loader:1662:18)
    at Module._compile (node:internal/modules/cjs/loader:1704:20)
    at Object..js (node:internal/modules/cjs/loader:1895:10)
    at Module.load (node:internal/modules/cjs/loader:1465:32)
    at Function._load (node:internal/modules/cjs/loader:1282:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/opt/render/project/src/backend/index.js:31:32)
Node.js v22.16.0
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Running 'npm start'
> backend@1.0.0 start
> node index.js
[dotenv@17.2.1] injecting env (3) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`
✅ Active workflows table initialized
🚀 Job Queue initialized with config: {
  maxConcurrentJobs: 3,
  maxRetries: 3,
  retryDelay: 2000,
  jobTimeout: 300000,
  cleanupInterval: 600000
}
[2025-09-02T10:18:36.217Z] INFO: Workflow engine initialized
✅ WorkflowExecutor singleton loaded successfully
/opt/render/project/src/backend/routes/instagram-comments.js:220
              await fetchUserInfo(senderId);
              ^^^^^
SyntaxError: await is only valid in async functions and the top level bodies of modules
    at wrapSafe (node:internal/modules/cjs/loader:1662:18)
    at Module._compile (node:internal/modules/cjs/loader:1704:20)
    at Object..js (node:internal/modules/cjs/loader:1895:10)
    at Module.load (node:internal/modules/cjs/loader:1465:32)
    at Function._load (node:internal/modules/cjs/loader:1282:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/opt/render/project/src/backend/index.js:31:32)
Node.js v22.16.0