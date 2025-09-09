==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit 59b1e5dca2dd71110f5f5989cd631da0314afb53 in branch mains
==> Downloading cache...
==> Transferred 163MB in 8s. Extraction took 4s.
==> Installing dependencies with npm...
==> Requesting Node.js version >=18.0.0
==> Using Node.js version 24.7.0 via /opt/render/project/src/frontend/package.json
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
up to date, audited 336 packages in 881ms
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
up to date, audited 336 packages in 682ms
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
==> Running build command 'npm install --legacy-peer-deps && npm run build'...
up to date, audited 336 packages in 615ms
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
> frontend@0.0.0 prebuild
> npm install --legacy-peer-deps
up to date, audited 336 packages in 699ms
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
> frontend@0.0.0 build
> npm install --legacy-peer-deps && vite build
up to date, audited 336 packages in 678ms
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
vite v6.3.5 building for production...
transforming...
✓ 23 modules transformed.
✗ Build failed in 1.39s
error during build:
[vite:esbuild] Transform failed with 1 error:
/opt/render/project/src/frontend/src/pages/SimpleInstagramWebhook.jsx:882:20: ERROR: Expected "}" but found ":"
file: /opt/render/project/src/frontend/src/pages/SimpleInstagramWebhook.jsx:882:20
Expected "}" but found ":"
880|                        )}
881|                      </div>
882|                    ) : currentMessages.length === 0 ? (
   |                      ^
883|                      <div style={{ 
884|                        textAlign: 'center', 
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
==> Using Node.js version 24.7.0 via /opt/render/project/src/frontend/package.json
==> Docs on specifying a Node.js version: https://render.com/docs/node-version