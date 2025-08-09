console.log('Testing ChatTriggerNode require...');

try {
    const ChatTriggerNode = require('./nodes/triggers/chatTriggerNode');
    console.log('✅ ChatTriggerNode loaded successfully');
    
    const node = new ChatTriggerNode();
    console.log('✅ Instance created, type:', node.type);
    
    // Test basic functionality
    const testPayload = {
        body: { text: "Hello test", userId: "123" },
        headers: {},
        query: {},
        method: "POST"
    };
    
    node.processWebhookData(testPayload, {}).then(result => {
        console.log('✅ Webhook processing test passed');
        console.log('Processed data:', JSON.stringify(result, null, 2));
    }).catch(err => {
        console.error('❌ Webhook processing failed:', err.message);
    });
    
} catch (error) {
    console.error('❌ Error loading ChatTriggerNode:', error.message);
}