const Anthropic = require('@anthropic-ai/sdk');

// AI service with real Claude API integration
async function callClaudeApi(request) {
  console.log('🤖 Making Claude API call');
  console.log('Request details:', {
    model: request.model,
    hasApiKey: !!request.apiKey,
    systemPrompt: request.systemPrompt?.substring(0, 50) + '...',
    userMessage: request.userMessage?.substring(0, 50) + '...'
  });

  try {
    const apiKey = request.apiKey || process.env.ANTHROPIC_API_KEY;
    const anthropic = new Anthropic({ apiKey });
    
    const response = await anthropic.messages.create({
      model: request.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      system: request.systemPrompt || 'You are a helpful AI assistant.',
      messages: [
        { role: 'user', content: request.userMessage }
      ]
    });

    const responseText = response.content[0].text;
    console.log('✅ Claude API call completed');
    console.log('Response preview:', responseText.substring(0, 100) + '...');
    
    return responseText;
  } catch (error) {
    console.error('❌ Claude API call failed:', error.message);
    throw new Error(`Claude API error: ${error.message}`);
  }
}

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

module.exports = { callClaudeApi, verifyClaudeApiKey };