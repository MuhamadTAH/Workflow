==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit f784c13b89265afbceaf0a68dac857c2c246091e in branch main
==> Downloading cache...
==> Transferred 98MB in 8s. Extraction took 2s.
==> Requesting Node.js version 18.x
==> Using Node.js version 18.20.8 via /opt/render/project/src/backend/package.json
==> Node.js version 18.20.8 has reached end-of-life.
==> Upgrade to a maintained version to receive important security updates.
==> Information on maintained Node.js versions: https://nodejs.org/en/about/previous-releases
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install'...
> backend@1.0.0 postinstall
> npm rebuild sqlite3
rebuilt dependencies successfully
up to date, audited 272 packages in 1s
34 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
==> Uploading build...
==> Uploaded in 4.0s. Compression took 1.5s
==> Build successful 🎉
==> Deploying...
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
[2025-08-13T00:56:53.627Z] INFO: Workflow engine initialized
✅ WorkflowExecutor singleton loaded successfully
node:internal/modules/cjs/loader:1143
  throw err;
  ^
Error: Cannot find module '../services/workflowState'
Require stack:
- /opt/render/project/src/backend/routes/debug.js
- /opt/render/project/src/backend/index.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1140:15)
    at Module._load (node:internal/modules/cjs/loader:981:27)
    at Module.require (node:internal/modules/cjs/loader:1231:19)
    at require (node:internal/modules/helpers:177:18)
    at Object.<anonymous> (/opt/render/project/src/backend/routes/debug.js:3:23)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1422:10)
    at Module.load (node:internal/modules/cjs/loader:1203:32)
    at Module._load (node:internal/modules/cjs/loader:1019:12)
    at Module.require (node:internal/modules/cjs/loader:1231:19) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/opt/render/project/src/backend/routes/debug.js',
    '/opt/render/project/src/backend/index.js'
  ]
}
Node.js v18.20.8
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
[2025-08-13T00:57:03.848Z] INFO: Workflow engine initialized
✅ WorkflowExecutor singleton loaded successfully
node:internal/modules/cjs/loader:1143
  throw err;
  ^
Error: Cannot find module '../services/workflowState'
Require stack:
- /opt/render/project/src/backend/routes/debug.js
- /opt/render/project/src/backend/index.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1140:15)
    at Module._load (node:internal/modules/cjs/loader:981:27)
    at Module.require (node:internal/modules/cjs/loader:1231:19)
    at require (node:internal/modules/helpers:177:18)
    at Object.<anonymous> (/opt/render/project/src/backend/routes/debug.js:3:23)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1422:10)
    at Module.load (node:internal/modules/cjs/loader:1203:32)
    at Module._load (node:internal/modules/cjs/loader:1019:12)
    at Module.require (node:internal/modules/cjs/loader:1231:19) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/opt/render/project/src/backend/routes/debug.js',
    '/opt/render/project/src/backend/index.js'
  ]
}
Node.js v18.20.8