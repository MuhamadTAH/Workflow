==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit 6ee1bd611c673ff1bfd26f23bf9016c7b9778972 in branch mains
==> Installing dependencies with npm...
==> Requesting Node.js version >=18.0.0
==> Using Node.js version 24.7.0 via /opt/render/project/src/frontend/package.json
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
added 335 packages, and audited 336 packages in 7s
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
up to date, audited 336 packages in 589ms
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
==> Running build command 'npm install --legacy-peer-deps && npm run build'...
up to date, audited 336 packages in 621ms
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
> frontend@0.0.0 prebuild
> npm install --legacy-peer-deps
up to date, audited 336 packages in 671ms
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
> frontend@0.0.0 build
> npm install --legacy-peer-deps && vite build
up to date, audited 336 packages in 698ms
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
vite v6.3.5 building for production...
transforming...
✓ 31 modules transformed.
✗ Build failed in 1.14s
error during build:
[vite:esbuild] Transform failed with 1 error:
/opt/render/project/src/frontend/src/components/APIKeysDashboard.jsx:130:19: ERROR: Expected "{" but found "\\"
file: /opt/render/project/src/frontend/src/components/APIKeysDashboard.jsx:130:19
Expected "{" but found "\\"
128|  
129|    return (
130|      <div className=\"min-h-screen bg-gray-50 p-6\">
   |                     ^
131|        <div className=\"max-w-7xl mx-auto\">
132|          {/* Header */}
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