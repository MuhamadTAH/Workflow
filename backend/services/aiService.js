const Anthropic = require('@anthropic-ai/sdk');

async function verifyClaudeApiKey(apiKey) {
  try {
    // Quick format validation
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      return { valid: false, error: 'Invalid API key format' };
    }

    const anthropic = new Anthropic({ apiKey });
    // This is a lightweight request to verify the key
    await anthropic.messages.create({
      model: "claude-3-haiku-20240307", // Use a faster model for validation
      max_tokens: 1,
      messages: [{ role: "user", content: "test" }],
    });
    
    return { valid: true, model: 'claude-3-haiku-20240307' };
  } catch (error) {
    return { valid: false, error: error.message || 'Invalid Claude API key' };
  }
}

module.exports = { verifyClaudeApiKey };