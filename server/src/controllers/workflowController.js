/**
 * Controller function to handle saving a workflow.
 * It logs the incoming data and sends a success response.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
const saveWorkflow = (req, res) => {
    try {
      // The workflow data (nodes, edges) sent from the frontend
      // is located in the request body.
      const workflowData = req.body;
  
      // Log the received data to the server's console for debugging.
      console.log('Received workflow data in controller:', workflowData);
  
      // In a real application, you would add logic here to validate the data
      // and save it to a database (e.g., MongoDB or PostgreSQL).
  
      // Send a 200 OK status with a success message and the data that was received.
      res.status(200).json({ message: 'Workflow saved successfully!', data: workflowData });
  
    } catch (error) {
      // If any unexpected error occurs, log it and send a server error response.
      console.error('Error saving workflow:', error);
      res.status(500).json({ message: 'An error occurred while saving the workflow.' });
    }
  };
  
  // Export the function so it can be used in our route definitions.
  module.exports = {
    saveWorkflow,
  };
  