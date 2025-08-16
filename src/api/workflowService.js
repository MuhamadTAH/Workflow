import axios from 'axios';

// The base URL of our backend server.
// It's good practice to keep this in a central config or .env file.
const API_URL = 'http://localhost:5001/api/workflows';

/**
 * Sends the workflow data to the backend to be saved.
 * @param {object} workflowData - An object containing nodes and edges from ReactFlow.
 * @returns {Promise<object>} The response data from the server.
 */
const saveWorkflow = async (workflowData) => {
  try {
    // Make a POST request to the '/save' endpoint with the workflow data.
    const response = await axios.post(`${API_URL}/save`, workflowData);
    
    // Log the successful response from the server.
    console.log('Server Response:', response.data);
    
    // Return the server's response.
    return response.data;

  } catch (error) {
    // Log any errors that occur during the API call.
    console.error('Error saving workflow:', error.response ? error.response.data : error.message);
    
    // Re-throw the error so the UI component can handle it (e.g., show a notification).
    throw error;
  }
};

// Export the function so it can be imported and used in our components.
export {
  saveWorkflow,
};
