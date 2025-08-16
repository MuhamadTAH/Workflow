// API service for workflow operations
const API_BASE_URL = 'https://workflow-lg9z.onrender.com';

export const saveWorkflow = async (workflowData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/workflows/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflowData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Workflow saved successfully:', result);
    return result;
  } catch (error) {
    console.error('Error saving workflow:', error);
    throw error;
  }
};