const express = require('express');
const uploadsRoutes = require('./routes/uploads');

const app = express();

// Test mounting the uploads route
app.use('/api/uploads', uploadsRoutes);

// List all routes
function listRoutes(app) {
  const routes = [];
  app._router.stack.forEach(function(middleware) {
    if (middleware.route) {
      // Single route
      routes.push({
        path: middleware.route.path,
        method: Object.keys(middleware.route.methods)[0]
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach(function(handler) {
        if (handler.route) {
          const fullPath = middleware.regexp.source.replace('\\/?', '').replace('^', '').replace('$', '') + handler.route.path;
          routes.push({
            path: fullPath,
            method: Object.keys(handler.route.methods)[0]
          });
        }
      });
    }
  });
  return routes;
}

console.log('Routes registered:');
console.log(listRoutes(app));