==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit 33f69b51c087da2df9d78661d5c50b32165a5866 in branch mains
==> Downloading cache...
==> Still downloading cache...
==> No cache found, continuing without cache
==> Using Node.js version 22.16.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install'...
> backend@1.0.0 postinstall
> npm rebuild sqlite3
rebuilt dependencies successfully
added 91 packages, changed 13 packages, and audited 314 packages in 5s
38 packages are looking for funding
  run `npm fund` for details
5 vulnerabilities (3 low, 2 high)
To address issues that do not require attention, run:
  npm audit fix
To address all issues (including breaking changes), run:
  npm audit fix --force
Run `npm audit` for details.
==> Uploading build...
==> Uploaded in 4.5s. Compression took 2.0s
==> Build successful 🎉
==> Deploying...
==> Running 'npm start'
> backend@1.0.0 start
> node index.js
/opt/render/project/src/backend/index.js:361
            */
            ^
SyntaxError: Unexpected token '*'
    at wrapSafe (node:internal/modules/cjs/loader:1662:18)
    at Module._compile (node:internal/modules/cjs/loader:1704:20)
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
/opt/render/project/src/backend/index.js:361
            */
            ^
SyntaxError: Unexpected token '*'
    at wrapSafe (node:internal/modules/cjs/loader:1662:18)
    at Module._compile (node:internal/modules/cjs/loader:1704:20)
    at Object..js (node:internal/modules/cjs/loader:1895:10)
    at Module.load (node:internal/modules/cjs/loader:1465:32)
    at Function._load (node:internal/modules/cjs/loader:1282:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49
Node.js v22.16.0