August 24, 2025 at 12:15 AM
failed
22d277a
Fix: Add Facebook and LinkedIn nodes to workflow builder sidebar Issue: Nodes were added to nodeTypes.js but not visible in UI Cause: Sidebar.js was using hardcoded nodes instead of dynamic NODE_DEFINITIONS Changes: - Import NODE_DEFINITIONS and NODE_CATEGORIES in Sidebar.js - Add Facebook nodes section with dynamic rendering - Add LinkedIn nodes section with dynamic rendering - Use proper Facebook and LinkedIn brand icons - Maintain consistent styling with existing nodes Now Available in Sidebar: Facebook (9 nodes): - Get Page Info, Post to Page, Get Page Posts - Get Messages, Send Message, Reply Message - Get Post Comments, Reply Comment, Get Page Insights LinkedIn (4 nodes): - Get Profile, Create Post, Send Message, Get Company 🤖 Generated with [Claude Code](https://claude.ai/code) Co-Authored-By: Claude <noreply@anthropic.com>

Rollback
Exited with status 1 while running your code.
Read our docs for common ways to troubleshoot your deploy.

All logs
Search
Search

Live tail
GMT+3

Menu

==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit 22d277ac457ea946e43aee634f2335f2fdd6c663 in branch mains
==> Downloading cache...
==> Transferred 705MB in 10s. Extraction took 19s.
==> Using Node.js version 22.16.0 (default)
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
==> Running build command 'npm install'...
> backend@1.0.0 postinstall
> npm rebuild sqlite3
rebuilt dependencies successfully
up to date, audited 295 packages in 1s
38 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
==> Uploading build...
==> Uploaded in 16.6s. Compression took 15.2s
==> Build successful 🎉
==> Deploying...
==> Running 'npm start'
> backend@1.0.0 start
> node index.js
[dotenv@17.2.1] injecting env (3) from .env -- tip: 📡 auto-backup env with Radar: https://dotenvx.com/radar
✅ Active workflows table initialized
🚀 Job Queue initialized with config: {
  maxConcurrentJobs: 3,
  maxRetries: 3,
  retryDelay: 2000,
  jobTimeout: 300000,
  cleanupInterval: 600000
}
[2025-08-23T21:19:14.711Z] INFO: Workflow engine initialized
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
    at Object.<anonymous> (/opt/render/project/src/backend/controllers/nodeController.js:20:35)
Node.js v22.16.0
==> Exited with status 1
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Running 'npm start'
> backend@1.0.0 start
> node index.js
[dotenv@17.2.1] injecting env (3) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
✅ Active workflows table initialized
🚀 Job Queue initialized with config: {
  maxConcurrentJobs: 3,
  maxRetries: 3,
  retryDelay: 2000,
  jobTimeout: 300000,
  cleanupInterval: 600000
}
[2025-08-23T21:19:30.434Z] INFO: Workflow engine initialized
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
    at Object.<anonymous> (/opt/render/project/src/backend/controllers/nodeController.js:20:35)
Node.js v22.16.0