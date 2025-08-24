==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit fa21376eea1c152446b492ececef68883bdec9e4 in branch mains
==> Downloading cache...
==> Transferred 705MB in 10s. Extraction took 24s.
==> Using Node.js version 22.16.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install'...
> backend@1.0.0 postinstall
> npm rebuild sqlite3
rebuilt dependencies successfully
up to date, audited 295 packages in 2s
38 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
==> Uploading build...
==> Uploaded in 10.4s. Compression took 56.8s
==> Build successful 🎉
==> Deploying...
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
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
[2025-08-24T13:18:52.964Z] INFO: Workflow engine initialized
✅ WorkflowExecutor singleton loaded successfully
🚀 LOADING NODES ROUTES FILE
/opt/render/project/src/backend/nodes/actions/instagramReplyCommentNode.js:47
                default: 'Thanks for your comment! {{$json.commenter_name || ""}}'',
                                                                                  ^^
SyntaxError: Invalid or unexpected token
    at wrapSafe (node:internal/modules/cjs/loader:1662:18)
    at Module._compile (node:internal/modules/cjs/loader:1704:20)
    at Object..js (node:internal/modules/cjs/loader:1895:10)
    at Module.load (node:internal/modules/cjs/loader:1465:32)
    at Function._load (node:internal/modules/cjs/loader:1282:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1487:12)
    at require (node:internal/modules/helpers:135:16)
    at Object.<anonymous> (/opt/render/project/src/backend/controllers/nodeController.js:22:35)
Node.js v22.16.0