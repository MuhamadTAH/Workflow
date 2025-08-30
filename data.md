 📱 Instagram Comment Manager - Page Plan

  🎯 New Page Structure

  I'll create: frontend/src/pages/InstagramCommentManager.jsx

  Similar to your WhatsApp page but for Instagram comment management.

  🔧 Instagram API Connection Panel Fields

  Required Fields for Instagram Graph API:

  const InstagramConnectionFields = {
    // Meta App Configuration
    appId: "Instagram App ID",                    // From Meta Developer Console
    appSecret: "Instagram App Secret",            // From Meta Developer Console

    // User Account Access
    accessToken: "User Access Token",             // Long-lived user token

    // Instagram Business Account
    instagramBusinessId: "Instagram Business Account ID",  // IG Business Account

    // Webhook Configuration (for real-time comments)
    webhookToken: "Webhook Verification Token"    // Custom token for webhooks
  }

  Webhook URL (Auto-generated):

  webhookUrl: "https://workflow-lg9z.onrender.com/api/webhooks/instagram/comments"

  🏗️ Page Layout Plan

  Similar to WhatsApp Page Structure:

  ┌─────────────────────────────────────────────────────────────────┐
  │                    Instagram Comment Manager                    │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │ [☰ Config] ──── CENTER AREA ──── [☰ Analytics]                │
  │     │               │                    │                     │
  │ LEFT SIDEBAR   COMMENT THREADS     RIGHT SIDEBAR               │
  │                                                                 │
  │ • IG API Setup   • Live Comments    • Comment Stats            │
  │ • Claude AI      • Auto-Replies     • User Info                │
  │ • AI Prompts     • Thread View      • Quick Actions            │
  │ • Knowledge      • Send Replies     • Performance              │
  └─────────────────────────────────────────────────────────────────┘

  📝 Configuration Panel Content

  Section 1: Instagram API Configuration

  const instagramConfig = {
    title: "📷 Instagram API Setup",
    fields: [
      {
        label: "App ID",
        type: "text",
        placeholder: "123456789012345",
        help: "Get from Meta Developer Console > Your App > App ID"
      },
      {
        label: "App Secret",
        type: "password",
        placeholder: "abcd1234efgh5678...",
        help: "From Meta Developer Console > Your App > App Secret"
      },
      {
        label: "Access Token",
        type: "password",
        placeholder: "IGQVJxxxxxxxx...",
        help: "Long-lived user access token from Graph API Explorer"
      },
      {
        label: "Instagram Business ID",
        type: "text",
        placeholder: "17841401441775531",
        help: "Your Instagram Business Account ID"
      },
      {
        label: "Webhook Token",
        type: "text",
        placeholder: "custom_verification_token",
        help: "Custom token for webhook verification"
      }
    ],
    webhookUrl: "https://workflow-lg9z.onrender.com/api/webhooks/instagram/comments"
  }

  Section 2: Claude AI Integration

  const claudeConfig = {
    title: "🤖 Claude AI for Auto-Replies",
    fields: [
      "Claude API Key",
      "System Prompt",
      "Knowledge Base Upload",
      "Response Templates"
    ]
  }

  Section 3: Comment Management Settings

  const commentSettings = {
    title: "💬 Comment Management",
    options: [
      "Auto-reply to new comments",
      "AI response delay (1-30 seconds)",
      "Filter spam comments",
      "Keyword triggers",
      "Response templates"
    ]
  }

  🚀 Activation Flow

  When User Clicks "Start Instagram Integration":

  const activationProcess = {
    step1: "Validate all 5 Instagram API fields",
    step2: "Test connection to Instagram Graph API",
    step3: "Set up webhook for real-time comments",
    step4: "Initialize comment monitoring",
    step5: "Start polling for existing comments",
    step6: "Enable auto-reply system"
  }

  🔄 Comment Flow (Similar to WhatsApp Messages)

  New Comment → Instagram Webhook → Backend → AI Processing → Auto Reply → Posted
       ↓              ↓                ↓           ↓             ↓          ↓
  User comments → Meta notifies → Store DB → Claude AI → Generate → IG API

  📊 Center Area - Comment Threads

  Left Panel: Comment Threads List

  - Recent comments by post
  - User profile pictures
  - Comment previews
  - Unread indicators

  Right Panel: Selected Thread

  - Full comment conversation
  - Reply history
  - Send reply interface
  - AI suggestions

  🎯 Key Features to Include:

  1. ✅ Real-time comment monitoring
  2. ✅ AI-powered auto-replies
  3. ✅ Comment thread management
  4. ✅ Claude AI integration
  5. ✅ Knowledge base for responses
  6. ✅ Manual reply capability
  7. ✅ Performance analytics
  8. 🔮 Future: Switch to DM when verified

  ❓ My Questions:

  1. Should I start building this Instagram Comment Manager page now?
  2. Do you want the exact same sidebar system as WhatsApp?
  3. Any specific Instagram features you want me to focus on first?

  This approach gives you a complete Instagram management system where everything works except messaging - and when you get business verification, we just switch the API endpoints!