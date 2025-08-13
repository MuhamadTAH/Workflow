==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit 0760871d6a13ba7aa5788675435e6f88a6f2fa9d in branch main
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
==> Uploaded in 3.8s. Compression took 1.5s
==> Build successful 🎉
==> Deploying...
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: 📡 observe env with Radar: https://dotenvx.com/radar
[2025-08-13T09:46:45.701Z] INFO: Workflow engine initialized
✅ WorkflowExecutor singleton loaded successfully
node:internal/modules/cjs/loader:1143
  throw err;
  ^
Error: Cannot find module './db'
Require stack:
- /opt/render/project/src/backend/services/dbAsync.js
- /opt/render/project/src/backend/routes/workflows.js
- /opt/render/project/src/backend/index.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1140:15)
    at Module._load (node:internal/modules/cjs/loader:981:27)
    at Module.require (node:internal/modules/cjs/loader:1231:19)
    at require (node:internal/modules/helpers:177:18)
    at Object.<anonymous> (/opt/render/project/src/backend/services/dbAsync.js:4:12)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1422:10)
    at Module.load (node:internal/modules/cjs/loader:1203:32)
    at Module._load (node:internal/modules/cjs/loader:1019:12)
    at Module.require (node:internal/modules/cjs/loader:1231:19) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/opt/render/project/src/backend/services/dbAsync.js',
    '/opt/render/project/src/backend/routes/workflows.js',
    '/opt/render/project/src/backend/index.js'
  ]
}
Node.js v18.20.8
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: 📡 auto-backup env with Radar: https://dotenvx.com/radar
[2025-08-13T09:46:53.647Z] INFO: Workflow engine initialized
✅ WorkflowExecutor singleton loaded successfully
node:internal/modules/cjs/loader:1143
  throw err;
  ^
Error: Cannot find module './db'
Require stack:
- /opt/render/project/src/backend/services/dbAsync.js
- /opt/render/project/src/backend/routes/workflows.js
- /opt/render/project/src/backend/index.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1140:15)
    at Module._load (node:internal/modules/cjs/loader:981:27)
    at Module.require (node:internal/modules/cjs/loader:1231:19)
    at require (node:internal/modules/helpers:177:18)
    at Object.<anonymous> (/opt/render/project/src/backend/services/dbAsync.js:4:12)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1422:10)
    at Module.load (node:internal/modules/cjs/loader:1203:32)
    at Module._load (node:internal/modules/cjs/loader:1019:12)
    at Module.require (node:internal/modules/cjs/loader:1231:19) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/opt/render/project/src/backend/services/dbAsync.js',
    '/opt/render/project/src/backend/routes/workflows.js',
    '/opt/render/project/src/backend/index.js'
  ]
}
Node.js v18.20.8