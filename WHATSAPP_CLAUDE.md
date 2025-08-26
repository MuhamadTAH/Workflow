# WhatsApp Integration Documentation

## Overview
This document contains comprehensive information about the two WhatsApp nodes implemented in the Workflow Builder system, including setup instructions, configuration details, and troubleshooting guides.

## 📱 WhatsApp Nodes

### 1. WhatsApp Trigger Node (`whatsappTrigger`)
**Purpose**: Receives incoming WhatsApp messages and triggers workflows
**Type**: Trigger Node
**File Location**: `backend/nodes/actions/whatsappTriggerNode.js`

#### How It Works
- Starts webhook waiting mode when executed manually
- Waits for real WhatsApp messages (30-second timeout)
- Uses webhook system to capture incoming messages
- Returns clean message data like n8n

#### Parameters
- **WhatsApp App ID**: `{{$env.WHATSAPP_APP_ID}}`
- **Client Secret**: `{{$env.WHATSAPP_CLIENT_SECRET}}`

#### Sample Input Data (What it returns)
```json
{
  "message": "Hello from WhatsApp!",
  "from": "1234567890",
  "fromName": "John Doe",
  "phoneNumber": "1234567890",
  "messageId": "wamid.abcd1234",
  "timestamp": "2023-08-26T12:00:00.000Z",
  "messageType": "text",
  "whatsappData": { /* Full webhook data */ }
}
```

### 2. WhatsApp Send Message Node (`whatsappSendMessage`) 
**Purpose**: Sends WhatsApp messages via WhatsApp Business API
**Type**: Action Node  
**File Location**: `backend/nodes/actions/whatsappSendMessageNode.js`

#### How It Works
- Uses WhatsApp Business API v21.0
- Sends text messages to specified phone numbers
- Supports template expressions for dynamic content
- Returns message status and delivery info

#### Parameters (n8n-style)
1. **Access Token**: `{{$env.WHATSAPP_ACCESS_TOKEN}}`
   - WhatsApp Business API Access Token from Meta Developer Console
   - Placeholder: `EAAxxxxxxxx...`

2. **Business ID**: `{{$env.WHATSAPP_BUSINESS_ID}}`
   - WhatsApp Business Account ID
   - Placeholder: `1234567890123456`

3. **Phone Number Send ID**: `{{$env.WHATSAPP_PHONE_NUMBER_ID}}`
   - WhatsApp Phone Number ID (the number that sends messages)
   - Placeholder: `628007790405551`

4. **Recipient Phone Number**: `{{$json.from || "9647700716669"}}`
   - Phone number to send message to (without + sign)
   - Supports dynamic values from previous nodes

5. **Message Text**: `Hello {{$json.fromName || "there"}}! Thanks for your message.`
   - Text message content with template support
   - Supports multi-line messages

#### Sample Output Data
```json
{
  "success": true,
  "data": {
    "messageId": "wamid.xyz123",
    "recipientPhoneNumber": "9647700716669",
    "messageText": "Hello John! Thanks for your message.",
    "status": "sent",
    "sentAt": "2023-08-26T12:00:00.000Z",
    "whatsappResponse": { /* Full API response */ }
  },
  "nodeType": "whatsappSendMessage",
  "message": "📱 WhatsApp message sent to 9647700716669"
}
```

## 🔑 Access Token Setup

### Problem: Token Expiration
WhatsApp access tokens from Developer Console expire in 1-24 hours.

### Solution: System User Access Token (Permanent)

#### Step 1: Create System User
1. Go to **Meta Business Manager**: https://business.facebook.com/
2. Select your business account
3. Go to **Business Settings** → **Users** → **System Users**
4. Click **Add** → Choose **Admin** role
5. Name: "Workflow WhatsApp Bot"

#### Step 2: Generate Permanent Token
1. Click on your system user
2. Click **Generate New Token**
3. Select your WhatsApp app
4. Check permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
   - `business_management`
5. Click **Generate Token**
6. **Save this token** - it never expires!

#### Step 3: Get Required IDs
1. **Business ID**: 
   - Go to Business Manager → Business Info
   - Copy Business ID

2. **Phone Number ID**:
   - Go to App Dashboard → WhatsApp → API Setup
   - Find "From" phone number
   - Copy the Phone number ID (not the actual number)

### Environment Variables
Add to your `.env` file or hosting environment:
```bash
# WhatsApp Business API (for Send Message Node)
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_BUSINESS_ID=1234567890123456
WHATSAPP_PHONE_NUMBER_ID=628007790405551

# WhatsApp App Credentials (for Trigger Node)  
WHATSAPP_APP_ID=1234567890123456
WHATSAPP_CLIENT_SECRET=abc123def456ghi789
```

## 🛠️ Technical Implementation

### Frontend Integration (`ConfigPanel.js`)
- Field mappings: Line ~1178
- Parameter forms: Lines 2094-2202 (Send Message), Lines 2005-2070 (Trigger)
- Test button validation: `testWhatsAppConnection` function

### Backend Integration
1. **Node Controllers**: `backend/controllers/nodeController.js`
   - WhatsApp trigger: Lines 466-480
   - WhatsApp send: Lines 482-496

2. **Validation API**: `backend/routes/nodes.js`
   - Route: `POST /api/nodes/validate-whatsapp`
   - Handles both trigger and send message validation

3. **Webhook System**: `backend/services/webhookStateManager.js`
   - Manages webhook waiting for trigger nodes
   - 30-second timeout system

### Webhook Setup
1. **Webhook URL**: `https://your-domain.com/api/webhooks/whatsapp`
2. **Verify Token**: Set in Meta Developer Console
3. **Webhook Events**: Messages (for receiving messages)

## 🔄 Workflow Examples

### Example 1: Auto-Reply Workflow
1. **WhatsApp Trigger** → Receives message
2. **WhatsApp Send Message** → Sends reply
   - Recipient: `{{$json.from}}`
   - Message: `Hello {{$json.fromName}}! Thanks for contacting us.`

### Example 2: Customer Service Workflow  
1. **WhatsApp Trigger** → Receives customer message
2. **If Node** → Check if business hours
3. **WhatsApp Send Message** → Send appropriate response

## 🧪 Testing

### Test Button Features
- **Trigger Node**: Validates App ID and Client Secret
- **Send Message Node**: Validates all 5 n8n-style parameters
- **API Testing**: Makes real calls to WhatsApp Business API
- **Error Handling**: Shows specific validation errors

### Manual Testing
1. Configure all parameters with environment variables
2. Click test button to validate credentials
3. Execute nodes to test functionality
4. Check output data for successful responses

## 🚨 Troubleshooting

### Common Issues

#### 1. "Access token has expired"
- **Cause**: Using temporary token from Developer Console
- **Solution**: Create System User Access Token (permanent)

#### 2. "Invalid Phone Number Send ID"
- **Cause**: Using actual phone number instead of Phone Number ID
- **Solution**: Get Phone Number ID from WhatsApp API Setup page

#### 3. "App ID and Client Secret are required"
- **Cause**: Old validation error for Send Message node
- **Solution**: Update frontend - this should show new parameter validation

#### 4. "Webhook timeout"
- **Cause**: No message received within 30 seconds
- **Solution**: Send a test WhatsApp message during waiting period

#### 5. "Message not sent"
- **Cause**: Various API issues
- **Check**: Recipient phone number format (no + sign, only digits)

### Debug Tips
1. **Check Logs**: Backend logs show detailed API responses
2. **Test Credentials**: Use test buttons before running workflows
3. **Verify Webhook**: Ensure webhook URL is accessible
4. **Check Permissions**: Verify WhatsApp app permissions
5. **Rate Limits**: WhatsApp has rate limits (avoid sending too quickly)

## 📁 File Structure
```
backend/
├── nodes/actions/
│   ├── whatsappTriggerNode.js      # Trigger node implementation
│   └── whatsappSendMessageNode.js  # Send message node implementation
├── controllers/
│   └── nodeController.js           # Node execution & validation
├── routes/
│   ├── nodes.js                    # API routes for validation
│   └── webhooks.js                 # Webhook endpoints
└── services/
    └── webhookStateManager.js      # Webhook waiting system

frontend/
└── src/workflownode/components/panels/
    └── ConfigPanel.js              # UI parameter forms
```

## 🔗 Useful Links
- **Meta Developer Console**: https://developers.facebook.com/apps/
- **Meta Business Manager**: https://business.facebook.com/
- **WhatsApp Business API Docs**: https://developers.facebook.com/docs/whatsapp
- **WhatsApp Cloud API**: https://developers.facebook.com/docs/whatsapp/cloud-api

## 📝 Notes for Future Developers

### Adding New WhatsApp Features
1. Study existing node structure in `whatsappSendMessageNode.js`
2. Add new parameters to `getParameters()` method
3. Implement execution logic in `execute()` method
4. Add frontend UI in `ConfigPanel.js`
5. Update field mappings for new parameters
6. Test with validation endpoint

### Best Practices
- Always use environment variables for credentials
- Implement proper error handling and logging
- Follow n8n parameter naming conventions
- Add template expression support for dynamic values
- Include comprehensive validation and testing
- Document all parameters with clear descriptions

### Security Considerations
- Never commit access tokens to code
- Use System User tokens for production
- Implement rate limiting for message sending
- Validate all input parameters
- Use HTTPS for webhook URLs
- Implement webhook signature verification (recommended)

---

**Last Updated**: August 26, 2025
**Version**: 2.0 (n8n-style parameters)
**Author**: Claude Code Assistant

This documentation should be sufficient for any developer to understand, maintain, and extend the WhatsApp integration system.