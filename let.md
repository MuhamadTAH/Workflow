NOw the backend said this 
==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit 144b951b05756afc39f75293c7244e4d7fd7fe84 in branch main
==> Downloading cache...
==> Transferred 111MB in 7s. Extraction took 2s.
==> Requesting Node.js version >=18.0.0
==> Using Node.js version 24.6.0 via /opt/render/project/src/backend/package.json
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
/opt/render/project/src/backend/db.js:16
  db.serialize(() => {
     ^
Error: ENOENT: no such file or directory, open '/opt/render/project/src/backend/workflow/database/workflowTables.sql'
    at Object.readFileSync (node:fs:440:20)
    at Database.<anonymous> (/opt/render/project/src/backend/db.js:37:31)
    at initDb (/opt/render/project/src/backend/db.js:16:6)
    at Object.<anonymous> (/opt/render/project/src/backend/db.js:48:1)
    at Module._compile (node:internal/modules/cjs/loader:1738:14)
    at Object..js (node:internal/modules/cjs/loader:1871:10)
    at Module.load (node:internal/modules/cjs/loader:1470:32)
    at Module._load (node:internal/modules/cjs/loader:1290:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:238:24) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/opt/render/project/src/backend/workflow/database/workflowTables.sql'
}
Node.js v24.6.0
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Running 'node index.js'
/opt/render/project/src/backend/db.js:16
  db.serialize(() => {
     ^
Error: ENOENT: no such file or directory, open '/opt/render/project/src/backend/workflow/database/workflowTables.sql'
    at Object.readFileSync (node:fs:440:20)
    at Database.<anonymous> (/opt/render/project/src/backend/db.js:37:31)
    at initDb (/opt/render/project/src/backend/db.js:16:6)
    at Object.<anonymous> (/opt/render/project/src/backend/db.js:48:1)
    at Module._compile (node:internal/modules/cjs/loader:1738:14)
    at Object..js (node:internal/modules/cjs/loader:1871:10)
    at Module.load (node:internal/modules/cjs/loader:1470:32)
    at Module._load (node:internal/modules/cjs/loader:1290:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:238:24) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/opt/render/project/src/backend/workflow/database/workflowTables.sql'
}
Node.js v24.6.0