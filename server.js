// Import required packages
const express = require('express');
const cors = require('cors');

// Import route files
const workflowRoutes = require('./src/api/workflowRoutes');

// Initialize the Express app
const app = express();

// Define the port the server will run on.
const PORT = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors());
app.use(express.json());


// --- Routes ---

// A simple test route to check if the server is running.
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Use the workflow routes for any requests to /api/workflows
app.use('/api/workflows', workflowRoutes);


// --- Server Activation ---
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
