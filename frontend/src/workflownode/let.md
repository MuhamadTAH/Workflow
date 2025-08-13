==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit ef9f48172d5113c90446765392a07f941e6f232d in branch main
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
==> Uploaded in 4.6s. Compression took 1.7s
==> Build successful 🎉
==> Deploying...
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: ⚙️  enable debug logging with { debug: true }
[2025-08-13T10:06:10.147Z] INFO: Workflow engine initialized
✅ WorkflowExecutor singleton loaded successfully
✅ Active workflows table initialized
🚀 LOADING NODES ROUTES FILE
📝 REGISTERING /validate-telegram-token route
📝 REGISTERING /verify-claude route (MOCK VERSION)
📝 REGISTERING /telegram-get-updates route
✅ EXPORTING NODES ROUTER WITH ROUTES: [
  '/run-node',
  '/validate-telegram-token',
  '/validate-telegram-token',
  '/verify-claude',
  '/telegram-get-updates',
  '/telegram-get-updates'
]
/opt/render/project/src/backend/index.js:164
app.listen(PORT, async () => {
           ^
ReferenceError: PORT is not defined
    at Object.<anonymous> (/opt/render/project/src/backend/index.js:164:12)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1422:10)
    at Module.load (node:internal/modules/cjs/loader:1203:32)
    at Module._load (node:internal/modules/cjs/loader:1019:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:128:12)
    at node:internal/main/run_main_module:28:49
Node.js v18.20.8
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
[2025-08-13T10:06:18.622Z] INFO: Workflow engine initialized
✅ WorkflowExecutor singleton loaded successfully
✅ Active workflows table initialized
🚀 LOADING NODES ROUTES FILE
📝 REGISTERING /validate-telegram-token route
📝 REGISTERING /verify-claude route (MOCK VERSION)
📝 REGISTERING /telegram-get-updates route
✅ EXPORTING NODES ROUTER WITH ROUTES: [
  '/run-node',
  '/validate-telegram-token',
  '/validate-telegram-token',
  '/verify-claude',
  '/telegram-get-updates',
  '/telegram-get-updates'
]
/opt/render/project/src/backend/index.js:164
app.listen(PORT, async () => {
           ^
ReferenceError: PORT is not defined
    at Object.<anonymous> (/opt/render/project/src/backend/index.js:164:12)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1422:10)
    at Module.load (node:internal/modules/cjs/loader:1203:32)
    at Module._load (node:internal/modules/cjs/loader:1019:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:128:12)
    at node:internal/main/run_main_module:28:49
Node.js v18.20.8