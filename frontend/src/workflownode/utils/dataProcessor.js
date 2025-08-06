/*
=================================================================
FILE: workflownode/utils/dataProcessor.js
=================================================================
Data transformation and processing utilities
*/

// Process and clean API response data
export const processApiResponse = (response) => {
  try {
    if (typeof response === 'string') {
      return JSON.parse(response);
    }
    return response;
  } catch (error) {
    console.error('Failed to process API response:', error);
    return response;
  }
};

// Transform data for node execution
export const transformDataForNode = (data, nodeType) => {
  if (!data) return null;
  
  switch (nodeType) {
    case 'if':
      return Array.isArray(data) ? data : [data];
    case 'merge':
      return Array.isArray(data) ? data : [data];
    case 'filter':
      return Array.isArray(data) ? data : [data];
    default:
      return data;
  }
};

// Validate data structure for node type
export const validateDataStructure = (data, expectedType) => {
  if (!data) return { valid: false, error: 'No data provided' };
  
  switch (expectedType) {
    case 'array':
      if (!Array.isArray(data)) {
        return { valid: false, error: 'Expected array data' };
      }
      break;
    case 'object':
      if (typeof data !== 'object' || Array.isArray(data)) {
        return { valid: false, error: 'Expected object data' };
      }
      break;
    case 'string':
      if (typeof data !== 'string') {
        return { valid: false, error: 'Expected string data' };
      }
      break;
    default:
      // No validation needed
      break;
  }
  
  return { valid: true };
};

// Deep clone data to prevent mutation
export const cloneData = (data) => {
  try {
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error('Failed to clone data:', error);
    return data;
  }
};