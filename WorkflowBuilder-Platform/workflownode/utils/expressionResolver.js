/*
=================================================================
FILE: workflownode/utils/expressionResolver.js
=================================================================
Expression and template processing utilities
*/

// Helper function to resolve expressions like {{ a.b }}
export const resolveExpression = (expression, data) => {
  if (!expression || typeof expression !== 'string' || !data) return expression;
  
  // This regex finds all instances of {{ path.to.key }}
  return expression.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
    const keys = path.trim().split('.');
    let current = data;
    for (let i = 0; i < keys.length; i++) {
      if (current === null || typeof current !== 'object' || !(keys[i] in current)) {
        return match; // Return original {{...}} if path is invalid
      }
      current = current[keys[i]];
    }
    return current;
  });
};

// Process templates in configuration objects
export const processTemplates = (config, data) => {
  if (!config || !data) return config;
  
  const processed = { ...config };
  
  for (const [key, value] of Object.entries(processed)) {
    if (typeof value === 'string') {
      processed[key] = resolveExpression(value, data);
    } else if (typeof value === 'object' && value !== null) {
      processed[key] = processTemplates(value, data);
    }
  }
  
  return processed;
};

// Validate template syntax
export const validateTemplate = (template) => {
  if (typeof template !== 'string') return { valid: true };
  
  const matches = template.match(/\{\{[^}]*\}\}/g);
  if (!matches) return { valid: true };
  
  for (const match of matches) {
    const content = match.slice(2, -2).trim();
    if (!content) {
      return { valid: false, error: 'Empty template variable' };
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(content)) {
      return { valid: false, error: `Invalid template variable: ${content}` };
    }
  }
  
  return { valid: true };
};