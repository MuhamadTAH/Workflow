==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit 0c72f7b3f75c59265e81974a8c490157c538d755 in branch main
==> Downloading cache...
==> Transferred 88MB in 7s. Extraction took 3s.
==> Requesting Node.js version 18.x
==> Using Node.js version 18.20.8 via /opt/render/project/src/backend/package.json
==> Node.js version 18.20.8 has reached end-of-life.
==> Upgrade to a maintained version to receive important security updates.
==> Information on maintained Node.js versions: https://nodejs.org/en/about/previous-releases
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install'...
up to date, audited 188 packages in 623ms
31 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
==> Uploading build...
==> Uploaded in 4.1s. Compression took 1.4s
==> Build successful 🎉
==> Deploying...
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: ⚙️  enable debug logging with { debug: true }
❌ Error connecting to SQLite database: Error: The module '/opt/render/project/src/backend/node_modules/better-sqlite3/build/Release/better_sqlite3.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 127. This version of Node.js requires
NODE_MODULE_VERSION 108. Please try re-compiling or re-installing
the module (for instance, using `npm rebuild` or `npm install`).
    at Module._extensions..node (node:internal/modules/cjs/loader:1460:18)
    at Module.load (node:internal/modules/cjs/loader:1203:32)
    at Module._load (node:internal/modules/cjs/loader:1019:12)
    at Module.require (node:internal/modules/cjs/loader:1231:19)
    at require (node:internal/modules/helpers:177:18)
    at bindings (/opt/render/project/src/backend/node_modules/bindings/bindings.js:112:48)
    at new Database (/opt/render/project/src/backend/node_modules/better-sqlite3/lib/database.js:48:64)
    at Object.<anonymous> (/opt/render/project/src/backend/db.js:9:8)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1422:10) {
  code: 'ERR_DLOPEN_FAILED'
}
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
❌ Error connecting to SQLite database: Error: The module '/opt/render/project/src/backend/node_modules/better-sqlite3/build/Release/better_sqlite3.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 127. This version of Node.js requires
NODE_MODULE_VERSION 108. Please try re-compiling or re-installing
the module (for instance, using `npm rebuild` or `npm install`).
    at Module._extensions..node (node:internal/modules/cjs/loader:1460:18)
    at Module.load (node:internal/modules/cjs/loader:1203:32)
    at Module._load (node:internal/modules/cjs/loader:1019:12)
    at Module.require (node:internal/modules/cjs/loader:1231:19)
    at require (node:internal/modules/helpers:177:18)
    at bindings (/opt/render/project/src/backend/node_modules/bindings/bindings.js:112:48)
    at new Database (/opt/render/project/src/backend/node_modules/better-sqlite3/lib/database.js:48:64)
    at Object.<anonymous> (/opt/render/project/src/backend/db.js:9:8)
    at Module._compile (node:internal/modules/cjs/loader:1364:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1422:10) {
  code: 'ERR_DLOPEN_FAILED'
}