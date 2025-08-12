==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit 15d33fc0d1db325d79c95ca9c291974a77d65a5e in branch main
==> Using Node.js version 22.16.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install'...
added 53 packages, changed 6 packages, and audited 182 packages in 3s
31 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
==> Uploading build...
==> Uploaded in 4.4s. Compression took 1.3s
==> Build successful 🎉
==> Deploying...
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: ⚙️  override existing env vars with { override: true }
node:internal/modules/cjs/loader:1404
  throw err;
  ^
Error: Cannot find module './debug'
Require stack:
- /opt/render/project/src/backend/node_modules/debug/src/node.js
- /opt/render/project/src/backend/node_modules/debug/src/index.js
- /opt/render/project/src/backend/node_modules/finalhandler/index.js
- /opt/render/project/src/backend/node_modules/express/lib/application.js
- /opt/render/project/src/backend/node_modules/express/lib/express.js
- /opt/render/project/src/backend/node_modules/express/index.js
- /opt/render/project/src/backend/index.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1401:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1057:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1062:22)
    at Function._load (node:internal/modules/cjs/loader:1211:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/opt/render/project/src/backend/node_modules/debug/src/node.js:14:28)
    at Module._compile (node:internal/modules/cjs/loader:1730:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/opt/render/project/src/backend/node_modules/debug/src/node.js',
    '/opt/render/project/src/backend/node_modules/debug/src/index.js',
    '/opt/render/project/src/backend/node_modules/finalhandler/index.js',
    '/opt/render/project/src/backend/node_modules/express/lib/application.js',
    '/opt/render/project/src/backend/node_modules/express/lib/express.js',
    '/opt/render/project/src/backend/node_modules/express/index.js',
    '/opt/render/project/src/backend/index.js'
  ]
}
Node.js v22.16.0
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: ⚙️  suppress all logs with { quiet: true }
node:internal/modules/cjs/loader:1404
  throw err;
  ^
Error: Cannot find module './debug'
Require stack:
- /opt/render/project/src/backend/node_modules/debug/src/node.js
- /opt/render/project/src/backend/node_modules/debug/src/index.js
- /opt/render/project/src/backend/node_modules/finalhandler/index.js
- /opt/render/project/src/backend/node_modules/express/lib/application.js
- /opt/render/project/src/backend/node_modules/express/lib/express.js
- /opt/render/project/src/backend/node_modules/express/index.js
- /opt/render/project/src/backend/index.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1401:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1057:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1062:22)
    at Function._load (node:internal/modules/cjs/loader:1211:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/opt/render/project/src/backend/node_modules/debug/src/node.js:14:28)
    at Module._compile (node:internal/modules/cjs/loader:1730:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/opt/render/project/src/backend/node_modules/debug/src/node.js',
    '/opt/render/project/src/backend/node_modules/debug/src/index.js',
    '/opt/render/project/src/backend/node_modules/finalhandler/index.js',
    '/opt/render/project/src/backend/node_modules/express/lib/application.js',
    '/opt/render/project/src/backend/node_modules/express/lib/express.js',
    '/opt/render/project/src/backend/node_modules/express/index.js',
    '/opt/render/project/src/backend/index.js'
  ]
}
Node.js v22.16.0
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: 📡 observe env with Radar: https://dotenvx.com/radar
node:internal/modules/cjs/loader:1404
  throw err;
  ^
Error: Cannot find module './debug'
Require stack:
- /opt/render/project/src/backend/node_modules/debug/src/node.js
- /opt/render/project/src/backend/node_modules/debug/src/index.js
- /opt/render/project/src/backend/node_modules/finalhandler/index.js
- /opt/render/project/src/backend/node_modules/express/lib/application.js
- /opt/render/project/src/backend/node_modules/express/lib/express.js
- /opt/render/project/src/backend/node_modules/express/index.js
- /opt/render/project/src/backend/index.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1401:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1057:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1062:22)
    at Function._load (node:internal/modules/cjs/loader:1211:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/opt/render/project/src/backend/node_modules/debug/src/node.js:14:28)
    at Module._compile (node:internal/modules/cjs/loader:1730:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/opt/render/project/src/backend/node_modules/debug/src/node.js',
    '/opt/render/project/src/backend/node_modules/debug/src/index.js',
    '/opt/render/project/src/backend/node_modules/finalhandler/index.js',
    '/opt/render/project/src/backend/node_modules/express/lib/application.js',
    '/opt/render/project/src/backend/node_modules/express/lib/express.js',
    '/opt/render/project/src/backend/node_modules/express/index.js',
    '/opt/render/project/src/backend/index.js'
  ]
}
Node.js v22.16.0
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: ⚙️  suppress all logs with { quiet: true }
node:internal/modules/cjs/loader:1404
  throw err;
  ^
Error: Cannot find module './debug'
Require stack:
- /opt/render/project/src/backend/node_modules/debug/src/node.js
- /opt/render/project/src/backend/node_modules/debug/src/index.js
- /opt/render/project/src/backend/node_modules/finalhandler/index.js
- /opt/render/project/src/backend/node_modules/express/lib/application.js
- /opt/render/project/src/backend/node_modules/express/lib/express.js
- /opt/render/project/src/backend/node_modules/express/index.js
- /opt/render/project/src/backend/index.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1401:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1057:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1062:22)
    at Function._load (node:internal/modules/cjs/loader:1211:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/opt/render/project/src/backend/node_modules/debug/src/node.js:14:28)
    at Module._compile (node:internal/modules/cjs/loader:1730:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/opt/render/project/src/backend/node_modules/debug/src/node.js',
    '/opt/render/project/src/backend/node_modules/debug/src/index.js',
    '/opt/render/project/src/backend/node_modules/finalhandler/index.js',
    '/opt/render/project/src/backend/node_modules/express/lib/application.js',
    '/opt/render/project/src/backend/node_modules/express/lib/express.js',
    '/opt/render/project/src/backend/node_modules/express/index.js',
    '/opt/render/project/src/backend/index.js'
  ]
}
Node.js v22.16.0
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: 📡 observe env with Radar: https://dotenvx.com/radar
node:internal/modules/cjs/loader:1404
  throw err;
  ^
Error: Cannot find module './debug'
Require stack:
- /opt/render/project/src/backend/node_modules/debug/src/node.js
- /opt/render/project/src/backend/node_modules/debug/src/index.js
- /opt/render/project/src/backend/node_modules/finalhandler/index.js
- /opt/render/project/src/backend/node_modules/express/lib/application.js
- /opt/render/project/src/backend/node_modules/express/lib/express.js
- /opt/render/project/src/backend/node_modules/express/index.js
- /opt/render/project/src/backend/index.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1401:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1057:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1062:22)
    at Function._load (node:internal/modules/cjs/loader:1211:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/opt/render/project/src/backend/node_modules/debug/src/node.js:14:28)
    at Module._compile (node:internal/modules/cjs/loader:1730:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/opt/render/project/src/backend/node_modules/debug/src/node.js',
    '/opt/render/project/src/backend/node_modules/debug/src/index.js',
    '/opt/render/project/src/backend/node_modules/finalhandler/index.js',
    '/opt/render/project/src/backend/node_modules/express/lib/application.js',
    '/opt/render/project/src/backend/node_modules/express/lib/express.js',
    '/opt/render/project/src/backend/node_modules/express/index.js',
    '/opt/render/project/src/backend/index.js'
  ]
}
Node.js v22.16.0
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: ⚙️  suppress all logs with { quiet: true }
node:internal/modules/cjs/loader:1404
  throw err;
  ^
Error: Cannot find module './debug'
Require stack:
- /opt/render/project/src/backend/node_modules/debug/src/node.js
- /opt/render/project/src/backend/node_modules/debug/src/index.js
- /opt/render/project/src/backend/node_modules/finalhandler/index.js
- /opt/render/project/src/backend/node_modules/express/lib/application.js
- /opt/render/project/src/backend/node_modules/express/lib/express.js
- /opt/render/project/src/backend/node_modules/express/index.js
- /opt/render/project/src/backend/index.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1401:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1057:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1062:22)
    at Function._load (node:internal/modules/cjs/loader:1211:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/opt/render/project/src/backend/node_modules/debug/src/node.js:14:28)
    at Module._compile (node:internal/modules/cjs/loader:1730:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/opt/render/project/src/backend/node_modules/debug/src/node.js',
    '/opt/render/project/src/backend/node_modules/debug/src/index.js',
    '/opt/render/project/src/backend/node_modules/finalhandler/index.js',
    '/opt/render/project/src/backend/node_modules/express/lib/application.js',
    '/opt/render/project/src/backend/node_modules/express/lib/express.js',
    '/opt/render/project/src/backend/node_modules/express/index.js',
    '/opt/render/project/src/backend/index.js'
  ]
}
Node.js v22.16.0
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: 📡 observe env with Radar: https://dotenvx.com/radar
node:internal/modules/cjs/loader:1404
  throw err;
  ^
Error: Cannot find module './debug'
Require stack:
- /opt/render/project/src/backend/node_modules/debug/src/node.js
- /opt/render/project/src/backend/node_modules/debug/src/index.js
- /opt/render/project/src/backend/node_modules/finalhandler/index.js
- /opt/render/project/src/backend/node_modules/express/lib/application.js
- /opt/render/project/src/backend/node_modules/express/lib/express.js
- /opt/render/project/src/backend/node_modules/express/index.js
- /opt/render/project/src/backend/index.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1401:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1057:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1062:22)
    at Function._load (node:internal/modules/cjs/loader:1211:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/opt/render/project/src/backend/node_modules/debug/src/node.js:14:28)
    at Module._compile (node:internal/modules/cjs/loader:1730:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/opt/render/project/src/backend/node_modules/debug/src/node.js',
    '/opt/render/project/src/backend/node_modules/debug/src/index.js',
    '/opt/render/project/src/backend/node_modules/finalhandler/index.js',
    '/opt/render/project/src/backend/node_modules/express/lib/application.js',
    '/opt/render/project/src/backend/node_modules/express/lib/express.js',
    '/opt/render/project/src/backend/node_modules/express/index.js',
    '/opt/render/project/src/backend/index.js'
  ]
}
Node.js v22.16.0