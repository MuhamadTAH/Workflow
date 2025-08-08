// Simplified AI service without external dependencies for now
async function verifyClaudeApiKey(apiKey) {
  try {
    // Basic format validation
    if (!apiKey || typeof apiKey !== 'string') {
      return { valid: false, error: 'API key is required' };
    }
    
    if (!apiKey.startsWith('sk-ant-')) {
      return { valid: false, error: 'Invalid Claude API key format. Must start with sk-ant-' };
    }

    // Additional length check (Claude API keys are typically longer)
    if (apiKey.length < 50) {
      return { valid: false, error: 'Invalid Claude API key length' };
    }
    
    // For now, just do format validation - can be enhanced with real API call later
    return { valid: true, model: 'claude-3-5-sonnet-20241022' };
  } catch (error) {
    return { valid: false, error: error.message || 'API key validation failed' };
  }
}

module.exports = { verifyClaudeApiKey };