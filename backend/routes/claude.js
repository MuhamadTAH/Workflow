const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../services/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/pdfs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const userId = req.user?.id || 'default_user';
    const timestamp = Date.now();
    cb(null, `${userId}_${timestamp}_${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Store Claude API configuration (in production, use database)
const claudeConfigs = new Map();

// Store system prompts (in production, use database)
const systemPrompts = new Map();

// Store PDF knowledge base (in production, use database)
const knowledgeBase = new Map();

// ULTIMATE PDF PROCESSING SYSTEM
async function processUltimatePDF(pdfPath, filename) {
  console.log('🚀 ULTIMATE PDF PROCESSOR - Starting comprehensive extraction...');
  
  const methods = [
    { name: 'pdf-parse', func: tryPdfParse },
    { name: 'pdf2pic + OCR', func: tryOCRExtraction },
    { name: 'pdfjs-dist', func: tryPdfJsDist },
    { name: 'manual-fallback', func: createIntelligentFallback }
  ];
  
  for (const method of methods) {
    try {
      console.log(`🔧 Attempting ${method.name}...`);
      const result = await method.func(pdfPath, filename);
      
      if (result && result.text && result.text.length > 50) {
        console.log(`✅ SUCCESS with ${method.name}! Extracted ${result.text.length} characters`);
        return {
          text: result.text,
          pages: result.pages || 1,
          method: method.name,
          success: true
        };
      }
    } catch (error) {
      console.log(`❌ ${method.name} failed:`, error.message);
    }
  }
  
  // If all methods fail, return intelligent fallback
  console.log('🆘 All methods failed, using intelligent fallback');
  return createIntelligentFallback(pdfPath, filename);
}

// Method 1: pdf-parse (best for text PDFs)
async function tryPdfParse(pdfPath, filename) {
  const pdf = require('pdf-parse');
  const dataBuffer = fs.readFileSync(pdfPath);
  const pdfData = await pdf(dataBuffer);
  
  return {
    text: pdfData.text,
    pages: pdfData.numpages
  };
}

// Method 2: OCR for scanned/image PDFs  
async function tryOCRExtraction(pdfPath, filename) {
  try {
    // Convert PDF to images first
    const pdf2pic = require('pdf2pic');
    const tesseract = require('tesseract.js');
    
    console.log('📷 Converting PDF to images for OCR...');
    
    const convert = pdf2pic.fromPath(pdfPath, {
      density: 300,           // High resolution
      saveFilename: "page",
      savePath: path.dirname(pdfPath),
      format: "png",
      width: 2048,
      height: 2048
    });
    
    const results = await convert.bulk(-1); // Convert all pages
    let allText = '';
    
    console.log(`🔍 OCR processing ${results.length} pages...`);
    
    for (const result of results) {
      const { data: { text } } = await tesseract.recognize(result.path, 'eng', {
        logger: m => console.log('📖 OCR:', m)
      });
      allText += text + '\n';
      
      // Clean up image file
      if (fs.existsSync(result.path)) {
        fs.unlinkSync(result.path);
      }
    }
    
    return {
      text: allText.trim(),
      pages: results.length
    };
    
  } catch (ocrError) {
    console.log('❌ OCR method failed:', ocrError.message);
    throw ocrError;
  }
}

// Method 3: pdfjs-dist (alternative parser)
async function tryPdfJsDist(pdfPath, filename) {
  const pdfjsLib = require('pdfjs-dist');
  
  const dataBuffer = fs.readFileSync(pdfPath);
  const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
  const pdfDoc = await loadingTask.promise;
  
  let allText = '';
  const numPages = pdfDoc.numPages;
  
  console.log(`📄 Processing ${numPages} pages with pdfjs-dist...`);
  
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const pageText = textContent.items.map(item => item.str).join(' ');
    allText += pageText + '\n';
  }
  
  return {
    text: allText.trim(),
    pages: numPages
  };
}

// Method 4: Intelligent fallback with user guidance
async function createIntelligentFallback(pdfPath, filename) {
  const fileStat = fs.statSync(pdfPath);
  const fileSizeKB = (fileStat.size / 1024).toFixed(2);
  const uploadDate = new Date().toISOString();
  
  console.log('🧠 Creating intelligent fallback content...');
  
  // Analyze filename for business context
  const filenameAnalysis = analyzeFilename(filename);
  
  const intelligentContent = `BUSINESS KNOWLEDGE BASE - MANUAL INPUT REQUIRED

📄 PDF File Information:
- Filename: ${filename}
- File Size: ${fileSizeKB} KB  
- Upload Date: ${uploadDate}
- Status: Text extraction failed - manual input needed

${filenameAnalysis}

🔧 IMPORTANT INSTRUCTIONS FOR USER:
Your PDF was uploaded successfully but automatic text extraction failed. 
To enable Claude to answer questions about your business accurately, please:

1. OPTION A: Re-upload PDF (different format may work)
2. OPTION B: Use the manual text input option below  
3. OPTION C: Copy/paste your business information directly

📋 BUSINESS INFORMATION TEMPLATE:
Please provide the following information manually:

BUSINESS DETAILS:
- Business Name: [Your business name]
- Business Type: [Restaurant, Store, Service, etc.]
- Address: [Your address]  
- Phone: [Your phone number]
- Email: [Your email]

OPERATING HOURS:
- Monday: [Hours]
- Tuesday: [Hours] 
- Wednesday: [Hours]
- Thursday: [Hours]
- Friday: [Hours]
- Saturday: [Hours]
- Sunday: [Hours]

SERVICES/PRODUCTS:
- [List your main services or products]
- [Include prices if relevant]
- [Special offers or features]

POLICIES:
- [Return/refund policy]
- [Payment methods accepted]
- [Special terms or conditions]

CONTACT & SOCIAL:
- Website: [Your website]
- Social Media: [Your social accounts]
- Additional Contact Methods: [Any other ways to reach you]

Once you provide this information, Claude will be able to answer customer questions accurately about your business!`;

  return {
    text: intelligentContent,
    pages: 1,
    method: 'intelligent-fallback',
    requiresManualInput: true
  };
}

// Analyze filename for business context clues
function analyzeFilename(filename) {
  const nameLower = filename.toLowerCase();
  let analysis = '\n📊 FILENAME ANALYSIS:\n';
  
  // Detect business type
  const businessTypes = {
    'menu': 'Restaurant/Food Service',
    'brochure': 'Marketing/Services',
    'catalog': 'Product Catalog',
    'price': 'Pricing Information',
    'service': 'Service Information',
    'info': 'General Information',
    'about': 'About Us/Company Info',
    'contact': 'Contact Information',
    'hours': 'Operating Hours',
    'policy': 'Policies/Terms'
  };
  
  for (const [keyword, type] of Object.entries(businessTypes)) {
    if (nameLower.includes(keyword)) {
      analysis += `- Detected: ${type}\n`;
    }
  }
  
  // Detect language
  if (nameLower.includes('spanish') || nameLower.includes('es')) {
    analysis += '- Language: Spanish content detected\n';
  }
  if (nameLower.includes('french') || nameLower.includes('fr')) {
    analysis += '- Language: French content detected\n';
  }
  
  // Detect format clues
  if (nameLower.includes('scan')) {
    analysis += '- Format: Likely scanned document (OCR needed)\n';
  }
  if (nameLower.includes('image')) {
    analysis += '- Format: Image-based PDF (OCR needed)\n';
  }
  
  return analysis;
}

// Connect to Claude API
router.post('/connect', asyncHandler(async (req, res) => {
  const { apiKey } = req.body;
  const userId = req.user?.id || 'default_user';

  if (!apiKey || !apiKey.trim()) {
    return res.status(400).json({
      success: false,
      error: 'API key is required'
    });
  }

  const cleanApiKey = apiKey.trim();
  
  // Validate API key format
  if (!cleanApiKey.startsWith('sk-ant-')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Claude API key format. It should start with "sk-ant-"'
    });
  }

  console.log('🔗 Connecting to Claude API for user:', userId);

  try {
    // Test the API key by making a simple request
    const axios = require('axios');
    
    const testResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Hello! Just testing the connection. Please respond with "Connection successful!"'
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cleanApiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    if (testResponse.data && testResponse.data.content) {
      // Store the API key for this user
      claudeConfigs.set(userId, {
        apiKey: cleanApiKey,
        connectedAt: new Date().toISOString(),
        lastUsed: null,
        model: 'claude-3-5-sonnet-20241022'
      });

      console.log('✅ Claude API connection successful for user:', userId);
      
      logger.info(`Claude API connected successfully`, {
        userId,
        apiKeyPrefix: cleanApiKey.substring(0, 15) + '...',
        model: 'claude-3-5-sonnet-20241022'
      });

      res.json({
        success: true,
        message: 'Successfully connected to Claude API',
        model: 'claude-3-5-sonnet-20241022',
        testResponse: testResponse.data.content[0]?.text || 'Connected'
      });
    } else {
      throw new Error('Invalid response from Claude API');
    }
  } catch (error) {
    console.error('❌ Claude API connection error:', error.message);
    
    let errorMessage = 'Failed to connect to Claude API';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'Invalid API key. Please check your Claude API key.';
      } else if (error.response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.response.status === 400) {
        errorMessage = 'Bad request. Please check your API key format.';
      } else {
        errorMessage = `Claude API error: ${error.response.data?.error?.message || error.message}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Connection timeout. Please check your internet connection.';
    }

    logger.logError(error, { 
      context: 'claude-api-connect',
      userId,
      apiKeyPrefix: cleanApiKey.substring(0, 15) + '...'
    });
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}));

// Disconnect Claude API
router.post('/disconnect', asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'default_user';
  
  console.log('🔌 Disconnecting Claude API for user:', userId);

  if (claudeConfigs.has(userId)) {
    claudeConfigs.delete(userId);
    
    logger.info(`Claude API disconnected`, { userId });
    
    res.json({
      success: true,
      message: 'Successfully disconnected from Claude API'
    });
  } else {
    res.json({
      success: true,
      message: 'No active Claude API connection found'
    });
  }
}));

// Test Claude API connection
router.post('/test', asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'default_user';
  
  const config = claudeConfigs.get(userId);
  if (!config) {
    return res.status(400).json({
      success: false,
      error: 'No Claude API connection found. Please connect first.'
    });
  }

  console.log('🧪 Testing Claude API connection for user:', userId);

  try {
    const axios = require('axios');
    
    const testResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: config.model,
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Please respond with "Test successful!" to confirm the connection is working.'
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000
      }
    );

    // Update last used time
    config.lastUsed = new Date().toISOString();

    console.log('✅ Claude API test successful for user:', userId);
    
    logger.info(`Claude API test successful`, {
      userId,
      model: config.model
    });

    res.json({
      success: true,
      message: 'Claude API test successful',
      testResponse: testResponse.data.content[0]?.text || 'Test completed',
      model: config.model,
      lastUsed: config.lastUsed
    });
  } catch (error) {
    console.error('❌ Claude API test error:', error.message);
    
    let errorMessage = 'Claude API test failed';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'API key is no longer valid. Please reconnect.';
        // Remove invalid connection
        claudeConfigs.delete(userId);
      } else if (error.response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else {
        errorMessage = `Claude API error: ${error.response.data?.error?.message || error.message}`;
      }
    }

    logger.logError(error, { 
      context: 'claude-api-test',
      userId,
      model: config.model
    });
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}));

// Get Claude API status
router.get('/status', (req, res) => {
  const userId = req.user?.id || 'default_user';
  
  const config = claudeConfigs.get(userId);
  
  res.json({
    success: true,
    connected: !!config,
    model: config?.model || null,
    connectedAt: config?.connectedAt || null,
    lastUsed: config?.lastUsed || null
  });
});

// Chat with Claude API
router.post('/chat', asyncHandler(async (req, res) => {
  const { message, maxTokens = 1000 } = req.body;
  const userId = req.user?.id || req.session?.userId || 'default_user';

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  const config = claudeConfigs.get(userId);
  if (!config) {
    return res.status(400).json({
      success: false,
      error: 'No Claude API connection found. Please connect first.'
    });
  }

  console.log('💬 Sending message to Claude API for user:', userId);

  try {
    const axios = require('axios');
    const billingService = require('../services/billingService');
    
    // Get AI model info for billing
    const db = require('../db');
    const aiModel = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM ai_models WHERE model_id = ? AND is_active = 1', 
        ['claude-3-5-sonnet-20241022'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!aiModel) {
      return res.status(500).json({
        success: false,
        error: 'AI model not found in billing system'
      });
    }

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: config.model,
        max_tokens: Math.min(maxTokens, 4000),
        messages: [
          {
            role: 'user',
            content: message.trim()
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 60000 // 60 second timeout for chat
      }
    );

    // Update last used time
    config.lastUsed = new Date().toISOString();

    // Extract usage information
    const usage = response.data.usage || {};
    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;

    // Track usage for billing (only if we have a valid user ID)
    let billingResult = null;
    if (userId !== 'default_user') {
      try {
        billingResult = await billingService.trackUsage(
          userId, 
          aiModel.id, 
          inputTokens, 
          outputTokens, 
          null, // conversationId
          null, // assistantId
          'chat'
        );
        console.log('💰 Usage tracked for billing:', billingResult);
      } catch (billingError) {
        console.error('❌ Billing tracking error:', billingError.message);
        // Don't fail the request if billing fails
      }
    }

    console.log('✅ Claude API chat successful for user:', userId);
    
    logger.info(`Claude API chat successful`, {
      userId,
      model: config.model,
      messageLength: message.length,
      responseLength: response.data.content[0]?.text?.length || 0,
      inputTokens,
      outputTokens,
      billingTracked: !!billingResult
    });

    res.json({
      success: true,
      response: response.data.content[0]?.text || '',
      model: config.model,
      usage: {
        ...usage,
        billing: billingResult ? {
          totalPrice: billingResult.billablePrice,
          freeTierUsed: billingResult.freeTierUsed
        } : null
      }
    });
  } catch (error) {
    console.error('❌ Claude API chat error:', error.message);
    
    let errorMessage = 'Failed to get response from Claude API';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'API key is no longer valid. Please reconnect.';
        claudeConfigs.delete(userId);
      } else if (error.response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.response.status === 400) {
        errorMessage = `Bad request: ${error.response.data?.error?.message || 'Invalid request'}`;
      } else {
        errorMessage = `Claude API error: ${error.response.data?.error?.message || error.message}`;
      }
    }

    logger.logError(error, { 
      context: 'claude-api-chat',
      userId,
      messagePreview: message.substring(0, 100) + '...'
    });
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}));

// Get all active Claude connections (admin only)
router.get('/connections', (req, res) => {
  const connections = Array.from(claudeConfigs.entries()).map(([userId, config]) => ({
    userId,
    model: config.model,
    connectedAt: config.connectedAt,
    lastUsed: config.lastUsed,
    apiKeyPrefix: config.apiKey.substring(0, 15) + '...'
  }));

  res.json({
    success: true,
    totalConnections: connections.length,
    connections: connections
  });
});

// Save system prompt
router.post('/system-prompt', asyncHandler(async (req, res) => {
  const { systemPrompt } = req.body;
  const userId = req.user?.id || 'default_user';

  if (!systemPrompt || !systemPrompt.trim()) {
    return res.status(400).json({
      success: false,
      error: 'System prompt is required'
    });
  }

  const cleanPrompt = systemPrompt.trim();
  
  if (cleanPrompt.length > 2000) {
    return res.status(400).json({
      success: false,
      error: 'System prompt must be less than 2000 characters'
    });
  }

  console.log('💾 Saving system prompt for user:', userId);

  try {
    // Store the system prompt for this user
    systemPrompts.set(userId, {
      prompt: cleanPrompt,
      updatedAt: new Date().toISOString(),
      characterCount: cleanPrompt.length
    });

    console.log('✅ System prompt saved successfully for user:', userId);
    
    logger.info(`System prompt saved successfully`, {
      userId,
      promptLength: cleanPrompt.length,
      promptPreview: cleanPrompt.substring(0, 50) + '...'
    });

    res.json({
      success: true,
      message: 'System prompt saved successfully',
      characterCount: cleanPrompt.length,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error saving system prompt:', error.message);
    logger.logError(error, { 
      context: 'claude-system-prompt-save',
      userId,
      promptLength: cleanPrompt.length
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to save system prompt: ' + error.message
    });
  }
}));

// Get system prompt
router.get('/system-prompt', (req, res) => {
  const userId = req.user?.id || 'default_user';
  
  try {
    const promptData = systemPrompts.get(userId);
    
    if (promptData) {
      res.json({
        success: true,
        systemPrompt: promptData.prompt,
        characterCount: promptData.characterCount,
        updatedAt: promptData.updatedAt
      });
    } else {
      // Return default system prompt if none is set
      const defaultPrompt = 'You are a helpful and friendly AI assistant. Respond to users in a professional yet warm manner.';
      res.json({
        success: true,
        systemPrompt: defaultPrompt,
        characterCount: defaultPrompt.length,
        updatedAt: null,
        isDefault: true
      });
    }
  } catch (error) {
    console.error('❌ Error fetching system prompt:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system prompt',
      message: error.message
    });
  }
});

// Upload and process PDF knowledge base
router.post('/upload-knowledge', upload.single('pdf'), asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'default_user';
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No PDF file uploaded'
    });
  }

  console.log('📄 Processing PDF for user:', userId, 'File:', req.file.filename);

  try {
    // For now, we'll use a simple text extraction approach
    // In production, you'd use a proper PDF parsing library like pdf-parse
    const pdfPath = req.file.path;
    
    // Simulate PDF text extraction (you'll need to install pdf-parse: npm install pdf-parse)
    let extractedText = '';
    let pageCount = 0;
    
    // ULTIMATE PDF PROCESSING SYSTEM - Multiple parsing methods
    const pdfProcessingResult = await processUltimatePDF(pdfPath, req.file.originalname);
    extractedText = pdfProcessingResult.text;
    pageCount = pdfProcessingResult.pages;

    // Clean and validate extracted text
    const cleanText = extractedText.trim();
    if (cleanText.length < 10) {
      throw new Error('PDF appears to be empty or text could not be extracted');
    }

    // Store knowledge base for this user
    knowledgeBase.set(userId, {
      filename: req.file.originalname,
      filepath: pdfPath,
      extractedText: cleanText,
      pageCount: pageCount,
      textLength: cleanText.length,
      uploadedAt: new Date().toISOString(),
      fileSize: req.file.size
    });

    console.log('✅ PDF processed successfully for user:', userId);
    console.log(`📊 Extracted ${cleanText.length} characters from ${pageCount} pages`);
    
    logger.info(`PDF knowledge base uploaded successfully`, {
      userId,
      filename: req.file.originalname,
      textLength: cleanText.length,
      pageCount: pageCount
    });

    res.json({
      success: true,
      message: 'PDF processed successfully',
      filename: req.file.originalname,
      textLength: cleanText.length,
      pageCount: pageCount
    });
  } catch (error) {
    console.error('❌ Error processing PDF:', error.message);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    logger.logError(error, { 
      context: 'pdf-knowledge-upload',
      userId,
      filename: req.file?.originalname
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to process PDF: ' + error.message
    });
  }
}));

// Get knowledge base info
router.get('/knowledge-info', (req, res) => {
  const userId = req.user?.id || 'default_user';
  
  try {
    const knowledge = knowledgeBase.get(userId);
    
    if (knowledge) {
      res.json({
        success: true,
        hasKnowledge: true,
        info: {
          filename: knowledge.filename,
          pageCount: knowledge.pageCount,
          textLength: knowledge.textLength,
          uploadedAt: knowledge.uploadedAt,
          fileSize: knowledge.fileSize
        }
      });
    } else {
      res.json({
        success: true,
        hasKnowledge: false,
        info: null
      });
    }
  } catch (error) {
    console.error('❌ Error fetching knowledge info:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch knowledge base info',
      message: error.message
    });
  }
});

// Delete knowledge base
router.delete('/delete-knowledge', asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'default_user';
  
  console.log('🗑️ Deleting knowledge base for user:', userId);

  try {
    const knowledge = knowledgeBase.get(userId);
    
    if (knowledge) {
      // Delete the file from filesystem
      if (fs.existsSync(knowledge.filepath)) {
        fs.unlinkSync(knowledge.filepath);
        console.log('📄 Deleted PDF file:', knowledge.filepath);
      }
      
      // Remove from memory
      knowledgeBase.delete(userId);
      
      logger.info(`Knowledge base deleted successfully`, {
        userId,
        filename: knowledge.filename
      });

      res.json({
        success: true,
        message: 'Knowledge base deleted successfully'
      });
    } else {
      res.json({
        success: true,
        message: 'No knowledge base found to delete'
      });
    }
  } catch (error) {
    console.error('❌ Error deleting knowledge base:', error.message);
    logger.logError(error, { 
      context: 'delete-knowledge-base',
      userId
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete knowledge base: ' + error.message
    });
  }
}));

// Manual knowledge base entry endpoint
router.post('/manual-knowledge', async (req, res) => {
  try {
    console.log('📝 Manual knowledge entry request received');
    
    const { businessInfo } = req.body;
    
    if (!businessInfo || typeof businessInfo !== 'string' || businessInfo.trim() === '') {
      console.log('❌ No business information provided');
      return res.status(400).json({ error: 'Business information is required' });
    }

    // Store in knowledge base (replaces PDF content if any)
    knowledgeBase.set('pdf_content', businessInfo.trim());
    console.log('✅ Manual business information stored successfully');
    console.log(`📊 Knowledge base contains: ${businessInfo.length} characters`);

    res.json({ 
      success: true, 
      message: 'Business information saved successfully',
      textLength: businessInfo.length,
      preview: businessInfo.substring(0, 200) + (businessInfo.length > 200 ? '...' : '')
    });

  } catch (error) {
    console.error('❌ Manual knowledge entry error:', error);
    res.status(500).json({ 
      error: 'Failed to save business information',
      details: error.message
    });
  }
});

module.exports = router;
module.exports.claudeConfigs = claudeConfigs;
module.exports.systemPrompts = systemPrompts;
module.exports.knowledgeBase = knowledgeBase;