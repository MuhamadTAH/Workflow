==> Cloning from https://github.com/MuhamadTAH/Workflow
==> Checking out commit c3a44a96456538c47f18ee321c3e1f6818d1190c in branch mains
==> Downloading cache...
==> Transferred 163MB in 8s. Extraction took 4s.
==> Installing dependencies with npm...
==> Requesting Node.js version >=18.0.0
==> Using Node.js version 24.7.0 via /opt/render/project/src/frontend/package.json
==> Docs on specifying a Node.js version: https://render.com/docs/node-version
up to date, audited 336 packages in 1s
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
up to date, audited 336 packages in 652ms
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
==> Running build command 'npm install --legacy-peer-deps && npm run build'...
up to date, audited 336 packages in 628ms
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
> frontend@0.0.0 prebuild
> npm install --legacy-peer-deps
up to date, audited 336 packages in 656ms
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
> frontend@0.0.0 build
> npm install --legacy-peer-deps && vite build
up to date, audited 336 packages in 621ms
54 packages are looking for funding
  run `npm fund` for details
found 0 vulnerabilities
vite v6.3.5 building for production...
transforming...
✓ 30 modules transformed.
✗ Build failed in 1.65s
error during build:
[vite:esbuild] Transform failed with 2 errors:
/opt/render/project/src/frontend/src/pages/TelegramListener.jsx:1067:24: ERROR: Unexpected closing "button" tag does not match opening "div" tag
/opt/render/project/src/frontend/src/pages/TelegramListener.jsx:1157:33: ERROR: Expected ")" but found "Collapsible"
file: /opt/render/project/src/frontend/src/pages/TelegramListener.jsx:1067:24
Unexpected closing "button" tag does not match opening "div" tag
1065|                        >
1066|                          🗑️ Clear
1067|                        </button>
   |                          ^
1068|                      </div>
1069|  
Expected ")" but found "Collapsible"
1155|                        </div>
1156|                      </div>
1157|                    </div> {/* End Collapsible Content */}
   |                                   ^
1158|                  </div>
1159|                  
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