[2025-08-13T11:56:35.061Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows/2/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows/2/activate',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T11:56:35.061Z'
}
[2025-08-13T11:56:35.061Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows/2/activate","status":200,"duration":"0ms"}
[2025-08-13T11:56:35.331Z] INFO: Incoming request {"method":"POST","url":"/api/workflows/2/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/workflows/2/activate',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T11:56:35.331Z'
}
[2025-08-13T11:56:35.334Z] INFO: Request completed {"method":"POST","url":"/2/activate","status":400,"duration":"3ms"}

the console 
browser-polyfill.js:511  Uncaught (in promise) Error: Extension context invalidated.
    at browser-polyfill.js:511:1
    at new Promise (<anonymous>)
    at wrappedSendMessage (browser-polyfill.js:508:1)
    at Object.apply (browser-polyfill.js:206:1)
    at notifyActive (cdp-session.js:26:22)
(anonymous) @ browser-polyfill.js:511
wrappedSendMessage @ browser-polyfill.js:508
apply @ browser-polyfill.js:206
notifyActive @ cdp-session.js:26
setTimeout
scheduleCheckActive @ cdp-session.js:36
notifyActive @ cdp-session.js:32
setTimeout
scheduleCheckActive @ cdp-session.js:36
notifyActive @ cdp-session.js:32
setTimeout
scheduleCheckActive @ cdp-session.js:36
notifyActive @ cdp-session.js:32
setTimeout
scheduleCheckActive @ cdp-session.js:36
notifyActive @ cdp-session.js:32
setTimeout
scheduleCheckActive @ cdp-session.js:36
notifyActive @ cdp-session.js:32
setTimeout
scheduleCheckActive @ cdp-session.js:36
notifyActive @ cdp-session.js:32
setTimeout
scheduleCheckActive @ cdp-session.js:36
notifyActive @ cdp-session.js:32
setTimeout
scheduleCheckActive @ cdp-session.js:36
notifyActive @ cdp-session.js:32
setTimeout
scheduleCheckActive @ cdp-session.js:36
notifyActive @ cdp-session.js:32
setTimeout
scheduleCheckActive @ cdp-session.js:36
notifyActive @ cdp-session.js:32
setTimeout
scheduleCheckActive @ cdp-session.js:36
notifyActive @ cdp-session.js:32
index-CGzdJeTn.js:32   POST https://workflow-lg9z.onrender.com/api/workflows/2/activate 400 (Bad Request)
(anonymous) @ index-CGzdJeTn.js:32
Fu @ index-CGzdJeTn.js:32
(anonymous) @ index-CGzdJeTn.js:32
Ft @ index-CGzdJeTn.js:32
Wu @ index-CGzdJeTn.js:32
lf @ index-CGzdJeTn.js:32
rf @ index-CGzdJeTn.js:32
index-CGzdJeTn.js:32  ❌ Failed to activate workflow: Invalid workflow data format