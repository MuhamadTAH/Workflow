const { storeMessage } = require('../services/chatSessions');
const { detectLanguage, getLanguageConfidence, isRTL } = require('../services/languageDetection');

class MultiLanguageChatResponseNode {
  constructor() {
    this.type = 'multiLanguageChatResponse';
    this.name = 'Multi-Language Chat Response';
    this.icon = '🌍';
    this.group = ['output'];
    this.description = 'Sends language-appropriate responses to chat sessions';
    this.defaults = {
      name: 'Multi-Language Chat Response',
      color: '#2196F3'
    };
    this.inputs = 1;
    this.outputs = 0;
    this.parameters = {
      sessionId: { type: 'string', label: 'Session ID', required: true },
      // Multi-language message options
      messageEn: { type: 'string', label: 'English Message', required: false },
      messageAr: { type: 'string', label: 'Arabic Message (العربية)', required: false },
      messageEs: { type: 'string', label: 'Spanish Message (Español)', required: false },
      messageFr: { type: 'string', label: 'French Message (Français)', required: false },
      // Auto-detection settings
      autoDetect: { type: 'boolean', label: 'Auto-detect Language', required: false, default: true },
      fallbackLanguage: { type: 'string', label: 'Fallback Language', required: false, default: 'en' }
    };
  }

  async execute(config, inputData, executionContext) {
    console.log('🌍 Multi-Language Chat Response executing with:');
    console.log('  - Config:', JSON.stringify(config, null, 2));
    console.log('  - Input Data:', JSON.stringify(inputData, null, 2));

    const sessionId = config.sessionId;
    const autoDetect = config.autoDetect !== false; // Default to true
    const fallbackLang = config.fallbackLanguage || 'en';

    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    // Get available messages
    const messages = {
      en: config.messageEn,
      ar: config.messageAr,
      es: config.messageEs,
      fr: config.messageFr
    };

    let selectedMessage;
    let detectedLanguage = fallbackLang;
    let responseMetadata = {};

    if (autoDetect && inputData) {
      // Try to detect language from input data
      let inputText = '';
      
      // Extract text from various possible input formats
      if (inputData.text) {
        inputText = inputData.text;
      } else if (inputData.json && inputData.json.text) {
        inputText = inputData.json.text;
      } else if (typeof inputData === 'string') {
        inputText = inputData;
      }

      if (inputText) {
        const detection = getLanguageConfidence(inputText);
        detectedLanguage = detection.language;
        responseMetadata = {
          detectedLanguage: detection.language,
          confidence: detection.confidence,
          inputText: inputText.substring(0, 100) + (inputText.length > 100 ? '...' : '')
        };
        
        console.log(`📍 Language detected: ${detectedLanguage} (confidence: ${detection.confidence}%)`);
      }
    }

    // Select appropriate message based on detected/configured language
    selectedMessage = messages[detectedLanguage];
    
    // Fallback logic if no message for detected language
    if (!selectedMessage) {
      selectedMessage = messages[fallbackLang] || messages.en || Object.values(messages).find(msg => msg);
      console.log(`⚠️ No message for ${detectedLanguage}, using fallback: ${fallbackLang}`);
    }

    if (!selectedMessage) {
      throw new Error('No message provided for any supported language');
    }

    // Add language direction metadata for frontend
    const isRightToLeft = isRTL(detectedLanguage);
    responseMetadata.isRTL = isRightToLeft;
    responseMetadata.language = detectedLanguage;

    // Enhanced message object with language metadata
    const enhancedMessage = {
      text: selectedMessage,
      language: detectedLanguage,
      isRTL: isRightToLeft,
      timestamp: new Date().toISOString(),
      metadata: responseMetadata
    };

    console.log(`💬 Storing message for session ${sessionId}:`, enhancedMessage);
    
    // Store the enhanced message
    storeMessage(sessionId, enhancedMessage);
    
    return { 
      success: true, 
      data: { 
        sessionId, 
        message: selectedMessage,
        language: detectedLanguage,
        isRTL: isRightToLeft,
        metadata: responseMetadata,
        storedAt: new Date().toISOString() 
      },
      nodeType: this.type,
      message: `Multi-language response stored for chat session (${detectedLanguage})`
    };
  }
}

module.exports = MultiLanguageChatResponseNode;