/*
=================================================================
BACKEND FILE: backend/services/aiService.js
=================================================================
AI Service for Claude API integration.
Simplified version copied from WorkflowNode and adapted for main backend.
*/

// Mock AI service for now - can be enhanced with real API later
const callClaudeApi = async (request) => {
    console.log('🤖 AI Service Call (Mock Mode)');
    console.log('Request:', {
        model: request.model,
        hasApiKey: !!request.apiKey,
        systemPrompt: request.systemPrompt?.substring(0, 50) + '...',
        userMessage: request.userMessage?.substring(0, 50) + '...'
    });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock response based on user message
    const mockResponse = generateMockResponse(request.userMessage, request.inputData);
    
    console.log('✅ AI Service completed (mock)');
    return mockResponse;
};

const verifyClaudeApiKey = async (apiKey) => {
    console.log('🔑 Verifying API Key (Mock Mode)');
    
    // Mock validation - just check if it looks like an API key
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
        return { valid: false, error: 'Invalid API key format' };
    }
    
    return { valid: true, model: 'claude-3-5-sonnet-20241022' };
};

// Generate mock AI response
function generateMockResponse(userMessage, inputData) {
    const responses = [
        `I received your message: "${userMessage}". This is a mock AI response for testing purposes.`,
        `Thank you for your input. I'm processing: "${userMessage}" with the provided data.`,
        `Hello! I understand you sent: "${userMessage}". This is an automated response from the AI agent.`,
        `Processing your request: "${userMessage}". The workflow is functioning correctly.`
    ];
    
    // Pick a random response
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Add some context from input data if available
    if (inputData && typeof inputData === 'object') {
        const dataKeys = Object.keys(inputData);
        if (dataKeys.length > 0) {
            return `${randomResponse}\n\nI can see data fields: ${dataKeys.slice(0, 3).join(', ')}`;
        }
    }
    
    return randomResponse;
}

module.exports = {
    callClaudeApi,
    verifyClaudeApiKey
};