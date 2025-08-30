[2025-08-30T23:54:24.237Z] INFO: Incoming request {"method":"GET","url":"/api/webhooks/instagram/comments?hub.mode=subscribe&hub.challenge=36796808&hub.verify_token=muhammadtarq24%40gmail.com","ip":"::1","userAgent":"facebookplatform/1.0 (+http://developers.facebook.com)"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/webhooks/instagram/comments?hub.mode=subscribe&hub.challenge=36796808&hub.verify_token=muhammadtarq24%40gmail.com',
  origin: undefined,
  userAgent: 'facebookplatform/1.0 (+http://developers.facebook.',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-30T23:54:24.237Z'
}
[2025-08-30T23:54:24.239Z] INFO: Instagram webhook verification attempt {"mode":"subscribe","token":"muhammadtarq24@gmail.com","challenge":"present"}
[2025-08-30T23:54:24.239Z] WARN: Instagram webhook verification failed {"expectedToken":"custom_verification_token","receivedToken":"muhammadtarq24@gmail.com","mode":"subscribe"}
[2025-08-30T23:54:24.240Z] INFO: Request completed {"method":"GET","url":"/webhooks/instagram/comments?hub.mode=subscribe&hub.challenge=36796808&hub.verify_token=muhammadtarq24%40gmail.com","status":403,"duration":"3ms"}
[2025-08-30T23:54:37.915Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/instagram-comments/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/instagram-comments/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-30T23:54:37.915Z'
}
[2025-08-30T23:54:37.916Z] INFO: Request completed {"method":"OPTIONS","url":"/api/instagram-comments/status","status":200,"duration":"1ms"}