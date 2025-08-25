August 26, 2025 at 2:21 AM
failed
eeff9ec
Fix frontend build error - revert ConfigPanel syntax issue - Revert ConfigPanel.js changes that caused build failure - Will re-apply WhatsApp Send Message parameter updates more carefully - Priority: get frontend deployment working again

Rollback
Exited with status 1 while building your code.
Read our docs for common ways to troubleshoot your deploy.

All logs
Search
Search

Live tail
GMT+3

Menu

==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit eeff9ecc1c6dcfd45106913b1190d18489cb989f in branch mains
==> Installing dependencies with npm...
==> Requesting Node.js version >=18.0.0
==> Using Node.js version 24.6.0 via /opt/render/project/src/frontend/package.json
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
added 359 packages, and audited 360 packages in 6s
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
up to date, audited 360 packages in 1s
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
==> Running build command 'npm install --legacy-peer-deps && npm run build'...
up to date, audited 360 packages in 611ms
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
> frontend@0.0.0 prebuild
> npm install --legacy-peer-deps
up to date, audited 360 packages in 1s
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
> frontend@0.0.0 build
> npm install --legacy-peer-deps && vite build
up to date, audited 360 packages in 612ms
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
vite v6.3.5 building for production...
transforming...
✓ 126 modules transformed.
✗ Build failed in 1.66s
error during build:
[vite:esbuild] Transform failed with 1 error:
/opt/render/project/src/frontend/src/workflownode/components/panels/ConfigPanel.js:2531:0: ERROR: Unexpected "export"
file: /opt/render/project/src/frontend/src/workflownode/components/panels/ConfigPanel.js:2531:0
Unexpected "export"
2529|  };
2530|  
2531|  export default ConfigPanel;
   |  ^
2532|  
    at failureErrorWithLog (/opt/render/project/src/frontend/node_modules/esbuild/lib/main.js:1467:15)
    at /opt/render/project/src/frontend/node_modules/esbuild/lib/main.js:736:50
    at responseCallbacks.<computed> (/opt/render/project/src/frontend/node_modules/esbuild/lib/main.js:603:9)
    at handleIncomingPacket (/opt/render/project/src/frontend/node_modules/esbuild/lib/main.js:658:12)
    at Socket.readFromStdout (/opt/render/project/src/frontend/node_modules/esbuild/lib/main.js:581:7)
    at Socket.emit (node:events:508:28)
    at addChunk (node:internal/streams/readable:559:12)
    at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
    at Readable.push (node:internal/streams/readable:390:5)
    at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)
==> Build failed 😞
==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
==> Requesting Node.js version >=18.0.0
==> Using Node.js version 24.6.0 via /opt/render/project/src/frontend/package.json
==> Docs on specifying a Node.js version: https://render.com/docs/node-version