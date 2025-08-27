/*
=================================================================
AI ASSISTANT API ROUTES
=================================================================
Complete backend for the AI Assistant system with detailed frontend integration guide.

FRONTEND INTEGRATION GUIDE:
Each API endpoint below includes documentation for what frontend element should call it.
*/

const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const workflowExecutor = require('../services/workflowExecutor');

// JWT verification middleware (reuse existing)
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Allow mock token for testing/development
    if (token.startsWith('MOCK_TOKEN_FOR_TESTING_')) {
      req.user = { userId: 'test-user-1', email: 'mhamadtah548@gmail.com', mock: true };
      return next();
    }
    
    // Regular JWT validation for production
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Configure multer for file uploads (knowledge base documents)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/knowledge-base');
    // Create directory if it doesn't exist
    require('fs').mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp_assistantId_originalname
    const uniqueName = `${Date.now()}_${req.params.id || 'new'}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, TXT, and MD files are allowed'));
    }
  }
});

// =================================================================
// FRONTEND INTEGRATION MAPPING
// =================================================================

/*
BUTTON/FORM MAPPING FOR YOUR DESIGN:

1. "Create New AI Assistant" button → POST /api/ai-assistant/create
2. "Test Telegram Connection" button → POST /api/ai-assistant/:id/test-telegram  
3. "Test AI API Connection" button → POST /api/ai-assistant/:id/test-ai-api
4. "Upload Documents" drag-drop area → POST /api/ai-assistant/:id/upload-documents
5. "Load Template" dropdown → GET /api/ai-assistant/prompt-templates
6. "Save Configuration" button → PUT /api/ai-assistant/:id/update
7. "Activate Assistant" button → POST /api/ai-assistant/:id/activate
8. "Deactivate Assistant" button → POST /api/ai-assistant/:id/deactivate
9. "View Conversations" button → GET /api/ai-assistant/:id/conversations
10. "Dashboard/Metrics" section → GET /api/ai-assistant/:id/metrics
*/

// =================================================================
// API ENDPOINTS
// =================================================================

// 1. CREATE NEW AI ASSISTANT
// Frontend: "Create New AI Assistant" button or "Get Started" button
router.post('/create', verifyToken, async (req, res) => {
  try {
    console.log('🚀 Creating new AI assistant');
    
    const userId = req.user.userId;
    const {
      name = 'My AI Assistant',
      telegram_token = '',
      ai_provider = 'openai',
      ai_api_key = '',
      ai_model = 'gpt-3.5-turbo',
      system_prompt = ''
    } = req.body;

    // Validate required fields
    if (!ai_api_key) {
      return res.status(400).json({
        success: false,
        error: 'AI API key is required'
      });
    }

    // Use default prompt if none provided
    let finalPrompt = system_prompt;
    if (!finalPrompt) {
      // Get default customer service template
      const defaultTemplate = await new Promise((resolve, reject) => {
        db.get(
          'SELECT prompt_text FROM ai_prompt_templates WHERE name = ? AND is_default = 1',
          ['Customer Service'],
          (err, row) => {
            if (err) reject(err);
            else resolve(row?.prompt_text || 'You are a helpful customer service assistant.');
          }
        );
      });
      finalPrompt = defaultTemplate;
    }

    // Insert new assistant
    const assistantId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO ai_assistants 
        (user_id, name, telegram_token, ai_provider, ai_api_key, ai_model, system_prompt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userId, name, telegram_token, ai_provider, ai_api_key, ai_model, finalPrompt], 
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    console.log('✅ AI assistant created successfully:', assistantId);
    
    res.status(201).json({
      success: true,
      assistant: {
        id: assistantId,
        name,
        telegram_token,
        ai_provider,
        ai_model,
        system_prompt: finalPrompt,
        status: 'inactive',
        created_at: new Date().toISOString()
      },
      message: 'AI assistant created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating AI assistant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 2. GET USER'S AI ASSISTANTS
// Frontend: Dashboard page load, assistants list
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const assistants = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id, name, telegram_token, ai_provider, ai_model, 
          status, total_conversations, successful_responses, failed_responses,
          created_at, updated_at
        FROM ai_assistants 
        WHERE user_id = ? 
        ORDER BY updated_at DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      success: true,
      assistants,
      count: assistants.length
    });

  } catch (error) {
    console.error('❌ Error fetching AI assistants:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 3. GET SPECIFIC AI ASSISTANT
// Frontend: Load assistant details for editing/viewing
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const assistantId = req.params.id;

    const assistant = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM ai_assistants 
        WHERE id = ? AND user_id = ?
      `, [assistantId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: 'AI assistant not found'
      });
    }

    // Get knowledge files
    const knowledgeFiles = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, filename, original_filename, file_size, file_type, 
               processing_status, processed_at, created_at
        FROM knowledge_files 
        WHERE assistant_id = ?
        ORDER BY created_at DESC
      `, [assistantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      success: true,
      assistant,
      knowledge_files: knowledgeFiles
    });

  } catch (error) {
    console.error('❌ Error fetching AI assistant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 4. TEST TELEGRAM CONNECTION
// Frontend: "Test Telegram Connection" button
router.post('/:id/test-telegram', verifyToken, async (req, res) => {
  try {
    const assistantId = req.params.id;
    const userId = req.user.userId;
    const { telegram_token } = req.body;

    console.log('🔍 Testing Telegram connection for assistant:', assistantId);
    console.log('🔍 User ID:', userId);
    console.log('🔍 Token provided:', telegram_token ? 'Yes' : 'No');

    if (!telegram_token) {
      return res.status(400).json({
        success: false,
        error: 'Telegram token is required'
      });
    }

    // Create AI assistant record if it doesn't exist
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR IGNORE INTO ai_assistants (id, user_id, name, ai_api_key, created_at) 
        VALUES (?, ?, 'Default AI Assistant', 'pending', CURRENT_TIMESTAMP)
      `, [assistantId, userId], (err) => {
        if (err) {
          console.error('Error creating assistant:', err);
          reject(err);
        } else {
          console.log('✅ Assistant record ensured');
          resolve();
        }
      });
    });

    // Test connection to Telegram API
    const response = await fetch(`https://api.telegram.org/bot${telegram_token}/getMe`);
    const data = await response.json();

    if (data.ok) {
      // Update assistant with valid token
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE ai_assistants 
          SET telegram_token = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND user_id = ?
        `, [telegram_token, assistantId, userId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({
        success: true,
        bot_info: {
          id: data.result.id,
          username: data.result.username,
          first_name: data.result.first_name,
          can_join_groups: data.result.can_join_groups,
          can_read_all_group_messages: data.result.can_read_all_group_messages
        },
        message: 'Telegram connection successful'
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Telegram API error: ${data.description}`,
        telegram_error: data
      });
    }

  } catch (error) {
    console.error('❌ Error testing Telegram connection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 5. TEST AI API CONNECTION  
// Frontend: "Test AI API Connection" button
router.post('/:id/test-ai-api', verifyToken, async (req, res) => {
  try {
    const assistantId = req.params.id;
    const userId = req.user.userId;
    const { ai_provider, ai_api_key, ai_model } = req.body;

    console.log('🔍 Testing AI API connection:', ai_provider || 'openai', ai_model || 'gpt-3.5-turbo');

    if (!ai_api_key) {
      return res.status(400).json({
        success: false,
        error: 'AI API key is required'
      });
    }

    // Create AI assistant record if it doesn't exist
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR IGNORE INTO ai_assistants (id, user_id, name, ai_api_key, created_at) 
        VALUES (?, ?, 'Default AI Assistant', 'pending', CURRENT_TIMESTAMP)
      `, [assistantId, userId], (err) => {
        if (err) {
          console.error('Error creating assistant:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    let testResult = null;

    // Simple API key validation for now
    // Test different AI providers
    if (!ai_provider || ai_provider === 'openai') {
      try {
        // Test OpenAI API with a simple request
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${ai_api_key}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          testResult = {
            success: true,
            provider: 'openai',
            model_used: ai_model || 'gpt-3.5-turbo',
            available_models: data.data?.length || 0
          };
        } else {
          const errorData = await response.json();
          return res.status(400).json({
            success: false,
            error: `OpenAI API error: ${errorData.error?.message || 'Invalid API key'}`,
            provider: 'openai'
          });
        }

      } catch (openaiError) {
        return res.status(400).json({
          success: false,
          error: `OpenAI API error: ${openaiError.message}`,
          provider: 'openai'
        });
      }
    } 
    else if (ai_provider === 'claude') {
      try {
        // Test Claude API with a simple request
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': ai_api_key,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: ai_model || 'claude-3-5-sonnet-20241022',
            max_tokens: 10,
            messages: [
              {
                role: 'user',
                content: 'Test connection - respond with OK'
              }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          testResult = {
            success: true,
            provider: 'claude',
            model_used: ai_model || 'claude-3-5-sonnet-20241022',
            response: data.content?.[0]?.text || 'Connected successfully'
          };
        } else {
          const errorData = await response.json();
          return res.status(400).json({
            success: false,
            error: `Claude API error: ${errorData.error?.message || 'Invalid API key'}`,
            provider: 'claude'
          });
        }

      } catch (claudeError) {
        return res.status(400).json({
          success: false,
          error: `Claude API error: ${claudeError.message}`,
          provider: 'claude'
        });
      }
    }
    // Add other providers here in the future
    else {
      return res.status(400).json({
        success: false,
        error: `AI provider '${ai_provider}' not supported yet`
      });
    }

    // Update assistant with valid API credentials
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE ai_assistants 
        SET ai_provider = ?, ai_api_key = ?, ai_model = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `, [ai_provider, ai_api_key, ai_model, assistantId, userId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      test_result: testResult,
      message: 'AI API connection successful'
    });

  } catch (error) {
    console.error('❌ Error testing AI API connection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 6. UPLOAD KNOWLEDGE BASE DOCUMENTS
// Frontend: "Upload Documents" drag & drop area
router.post('/:id/upload-documents', verifyToken, upload.array('documents', 5), async (req, res) => {
  try {
    const assistantId = req.params.id;
    const userId = req.user.userId;
    const uploadedFiles = req.files;

    console.log('📁 Uploading knowledge documents for assistant:', assistantId);
    console.log('📁 Files received:', uploadedFiles.length);

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    // Verify assistant belongs to user
    const assistant = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM ai_assistants WHERE id = ? AND user_id = ?', 
        [assistantId, userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: 'AI assistant not found'
      });
    }

    const processedFiles = [];

    // Process each uploaded file
    for (const file of uploadedFiles) {
      try {
        console.log(`📄 Processing file: ${file.originalname}`);

        // Extract text content based on file type
        let contentText = '';
        const fileExt = path.extname(file.originalname).toLowerCase();

        if (fileExt === '.txt' || fileExt === '.md') {
          contentText = await fs.readFile(file.path, 'utf-8');
        } else if (fileExt === '.pdf') {
          // For PDF processing, you'll need a PDF library like pdf-parse
          contentText = `[PDF Content] - File: ${file.originalname} (Processing not implemented yet)`;
        } else if (fileExt === '.doc' || fileExt === '.docx') {
          // For DOC processing, you'll need a library like mammoth
          contentText = `[DOC Content] - File: ${file.originalname} (Processing not implemented yet)`;
        }

        // Save file record to database
        const fileId = await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO knowledge_files 
            (assistant_id, filename, original_filename, file_path, content_text, 
             file_size, file_type, processing_status, processed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            assistantId,
            file.filename,
            file.originalname,
            file.path,
            contentText,
            file.size,
            fileExt.replace('.', ''),
            contentText ? 'completed' : 'pending',
            contentText ? new Date().toISOString() : null
          ], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });

        processedFiles.push({
          id: fileId,
          filename: file.filename,
          original_filename: file.originalname,
          file_size: file.size,
          file_type: fileExt.replace('.', ''),
          processing_status: contentText ? 'completed' : 'pending',
          content_length: contentText.length
        });

      } catch (fileError) {
        console.error(`❌ Error processing file ${file.originalname}:`, fileError);
        processedFiles.push({
          filename: file.originalname,
          error: fileError.message,
          processing_status: 'failed'
        });
      }
    }

    res.json({
      success: true,
      uploaded_files: processedFiles,
      total_files: processedFiles.length,
      message: `${processedFiles.length} files processed`
    });

  } catch (error) {
    console.error('❌ Error uploading knowledge documents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 7. GET PROMPT TEMPLATES
// Frontend: "Load Template" dropdown or template selector
router.get('/prompt-templates', async (req, res) => {
  try {
    const templates = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, name, category, description, prompt_text, is_default
        FROM ai_prompt_templates 
        WHERE is_active = 1
        ORDER BY is_default DESC, usage_count DESC, name ASC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const categorizedTemplates = templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {});

    res.json({
      success: true,
      templates: categorizedTemplates,
      all_templates: templates
    });

  } catch (error) {
    console.error('❌ Error fetching prompt templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 8. UPDATE AI ASSISTANT CONFIGURATION
// Frontend: "Save Configuration" button
router.put('/:id/update', verifyToken, async (req, res) => {
  try {
    const assistantId = req.params.id;
    const userId = req.user.userId;
    const {
      name,
      telegram_token,
      ai_provider,
      ai_api_key,
      ai_model,
      system_prompt
    } = req.body;

    console.log('💾 Updating AI assistant configuration:', assistantId);

    // Verify assistant belongs to user
    const assistant = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM ai_assistants WHERE id = ? AND user_id = ?', 
        [assistantId, userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: 'AI assistant not found'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (telegram_token !== undefined) {
      updates.push('telegram_token = ?');
      values.push(telegram_token);
    }
    if (ai_provider !== undefined) {
      updates.push('ai_provider = ?');
      values.push(ai_provider);
    }
    if (ai_api_key !== undefined) {
      updates.push('ai_api_key = ?');
      values.push(ai_api_key);
    }
    if (ai_model !== undefined) {
      updates.push('ai_model = ?');
      values.push(ai_model);
    }
    if (system_prompt !== undefined) {
      updates.push('system_prompt = ?');
      values.push(system_prompt);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(assistantId, userId);

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE ai_assistants 
        SET ${updates.join(', ')}
        WHERE id = ? AND user_id = ?
      `, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      message: 'AI assistant updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating AI assistant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 9. ACTIVATE AI ASSISTANT
// Frontend: "Activate Assistant" button (the big activation button)
router.post('/:id/activate', verifyToken, async (req, res) => {
  try {
    const assistantId = req.params.id;
    const userId = req.user.userId;

    console.log('🚀 Activating AI assistant:', assistantId);

    // Get assistant configuration
    const assistant = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM ai_assistants 
        WHERE id = ? AND user_id = ?
      `, [assistantId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: 'AI assistant not found'
      });
    }

    // Validate configuration
    if (!assistant.telegram_token) {
      return res.status(400).json({
        success: false,
        error: 'Telegram token is required for activation'
      });
    }

    if (!assistant.ai_api_key) {
      return res.status(400).json({
        success: false,
        error: 'AI API key is required for activation'
      });
    }

    // Generate workflow ID and webhook URL
    const workflowId = `ai_assistant_${assistantId}_${Date.now()}`;
    const webhookUrl = `${process.env.BASE_URL || 'https://workflow-lg9z.onrender.com'}/api/webhooks/ai-assistant/${assistantId}`;

    // Create workflow configuration
    const workflowConfig = {
      nodes: [
        {
          id: 'trigger_1',
          type: 'telegramTrigger',
          data: {
            type: 'telegramTrigger',
            label: 'Telegram Trigger',
            botToken: assistant.telegram_token
          },
          position: { x: 100, y: 100 }
        },
        {
          id: 'ai_agent_1',
          type: 'aiAgent',
          data: {
            type: 'aiAgent',
            label: 'AI Assistant',
            provider: assistant.ai_provider,
            apiKey: assistant.ai_api_key,
            model: assistant.ai_model,
            systemPrompt: assistant.system_prompt
          },
          position: { x: 300, y: 100 }
        },
        {
          id: 'telegram_send_1',
          type: 'telegramSendMessage',
          data: {
            type: 'telegramSendMessage',
            label: 'Send Response',
            botToken: assistant.telegram_token,
            chatId: '{{$json.message.chat.id}}',
            messageText: '{{$json.ai_response}}'
          },
          position: { x: 500, y: 100 }
        }
      ],
      edges: [
        { id: 'e1', source: 'trigger_1', target: 'ai_agent_1' },
        { id: 'e2', source: 'ai_agent_1', target: 'telegram_send_1' }
      ]
    };

    // Register workflow with executor
    try {
      workflowExecutor.registerWorkflow(workflowId, workflowConfig, {});
      console.log('✅ Workflow registered for AI assistant:', assistantId);
    } catch (workflowError) {
      console.error('❌ Failed to register workflow:', workflowError);
      return res.status(500).json({
        success: false,
        error: `Failed to activate workflow: ${workflowError.message}`
      });
    }

    // Update assistant status to active
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE ai_assistants 
        SET status = 'active', 
            workflow_id = ?, 
            webhook_url = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `, [workflowId, webhookUrl, assistantId, userId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Set Telegram webhook
    try {
      const telegramResponse = await fetch(`https://api.telegram.org/bot${assistant.telegram_token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message']
        })
      });

      const telegramData = await telegramResponse.json();
      console.log('📡 Telegram webhook set:', telegramData.ok);
    } catch (webhookError) {
      console.error('⚠️ Warning: Failed to set Telegram webhook:', webhookError);
      // Continue anyway - webhook can be set manually
    }

    res.json({
      success: true,
      message: 'AI assistant activated successfully',
      assistant: {
        id: assistantId,
        status: 'active',
        workflow_id: workflowId,
        webhook_url: webhookUrl
      }
    });

  } catch (error) {
    console.error('❌ Error activating AI assistant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 10. DEACTIVATE AI ASSISTANT
// Frontend: "Deactivate Assistant" button
router.post('/:id/deactivate', verifyToken, async (req, res) => {
  try {
    const assistantId = req.params.id;
    const userId = req.user.userId;

    console.log('🛑 Deactivating AI assistant:', assistantId);

    const assistant = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM ai_assistants 
        WHERE id = ? AND user_id = ?
      `, [assistantId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: 'AI assistant not found'
      });
    }

    // Deactivate workflow if exists
    if (assistant.workflow_id && workflowExecutor) {
      try {
        workflowExecutor.deactivateWorkflow(assistant.workflow_id);
        console.log('✅ Workflow deactivated for AI assistant:', assistantId);
      } catch (workflowError) {
        console.error('⚠️ Warning: Failed to deactivate workflow:', workflowError);
      }
    }

    // Remove Telegram webhook
    if (assistant.telegram_token) {
      try {
          await fetch(`https://api.telegram.org/bot${assistant.telegram_token}/deleteWebhook`);
        console.log('📡 Telegram webhook removed');
      } catch (webhookError) {
        console.error('⚠️ Warning: Failed to remove Telegram webhook:', webhookError);
      }
    }

    // Update assistant status to inactive
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE ai_assistants 
        SET status = 'inactive', 
            workflow_id = NULL,
            webhook_url = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `, [assistantId, userId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      message: 'AI assistant deactivated successfully',
      assistant: {
        id: assistantId,
        status: 'inactive'
      }
    });

  } catch (error) {
    console.error('❌ Error deactivating AI assistant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 11. GET CONVERSATIONS
// Frontend: "View Conversations" section or live chat monitor
router.get('/:id/conversations', verifyToken, async (req, res) => {
  try {
    const assistantId = req.params.id;
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    // Verify assistant belongs to user
    const assistant = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM ai_assistants WHERE id = ? AND user_id = ?', 
        [assistantId, userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: 'AI assistant not found'
      });
    }

    const conversations = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          customer_id, customer_name, customer_username,
          message_text, response_text, response_time_ms,
          success, error_message, ai_model_used, created_at
        FROM ai_conversations 
        WHERE assistant_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [assistantId, limit, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const totalCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM ai_conversations WHERE assistant_id = ?',
        [assistantId], (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
    });

    res.json({
      success: true,
      conversations,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (parseInt(offset) + conversations.length) < totalCount
      }
    });

  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 12. GET METRICS/ANALYTICS
// Frontend: Dashboard metrics section
router.get('/:id/metrics', verifyToken, async (req, res) => {
  try {
    const assistantId = req.params.id;
    const userId = req.user.userId;
    const { days = 7 } = req.query; // Default to last 7 days

    // Verify assistant belongs to user
    const assistant = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM ai_assistants WHERE id = ? AND user_id = ?', 
        [assistantId, userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: 'AI assistant not found'
      });
    }

    // Get overall stats
    const overallStats = {
      status: assistant.status,
      total_conversations: assistant.total_conversations,
      successful_responses: assistant.successful_responses,
      failed_responses: assistant.failed_responses,
      success_rate: assistant.total_conversations > 0 
        ? Math.round((assistant.successful_responses / assistant.total_conversations) * 100)
        : 0
    };

    // Get recent conversations for trends
    const recentConversations = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
          AVG(response_time_ms) as avg_response_time
        FROM ai_conversations 
        WHERE assistant_id = ? 
        AND created_at >= datetime('now', '-${days} days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [assistantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Get most common questions (if available)
    const commonQuestions = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          message_text,
          COUNT(*) as frequency
        FROM ai_conversations 
        WHERE assistant_id = ? 
        AND created_at >= datetime('now', '-${days} days')
        AND LENGTH(message_text) > 10
        GROUP BY LOWER(message_text)
        ORDER BY frequency DESC
        LIMIT 5
      `, [assistantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      success: true,
      metrics: {
        overall: overallStats,
        daily_trends: recentConversations,
        common_questions: commonQuestions,
        period: `Last ${days} days`
      }
    });

  } catch (error) {
    console.error('❌ Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 13. DELETE AI ASSISTANT
// Frontend: "Delete Assistant" button (usually in settings or edit mode)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const assistantId = req.params.id;
    const userId = req.user.userId;

    console.log('🗑️ Deleting AI assistant:', assistantId);

    const assistant = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM ai_assistants 
        WHERE id = ? AND user_id = ?
      `, [assistantId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: 'AI assistant not found'
      });
    }

    // Deactivate first if active
    if (assistant.status === 'active') {
      if (assistant.workflow_id && workflowExecutor) {
        try {
          workflowExecutor.deactivateWorkflow(assistant.workflow_id);
        } catch (workflowError) {
          console.error('⚠️ Warning: Failed to deactivate workflow during deletion');
        }
      }

      if (assistant.telegram_token) {
        try {
              await fetch(`https://api.telegram.org/bot${assistant.telegram_token}/deleteWebhook`);
        } catch (webhookError) {
          console.error('⚠️ Warning: Failed to remove webhook during deletion');
        }
      }
    }

    // Delete knowledge files (database records and actual files)
    const knowledgeFiles = await new Promise((resolve, reject) => {
      db.all('SELECT file_path FROM knowledge_files WHERE assistant_id = ?',
        [assistantId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
    });

    // Delete actual files
    for (const file of knowledgeFiles) {
      try {
        if (file.file_path) {
          await fs.unlink(file.file_path);
        }
      } catch (fileError) {
        console.error('⚠️ Warning: Failed to delete file:', file.file_path);
      }
    }

    // Delete from database (CASCADE will handle related records)
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM ai_assistants WHERE id = ? AND user_id = ?',
        [assistantId, userId], (err) => {
          if (err) reject(err);
          else resolve();
        });
    });

    res.json({
      success: true,
      message: 'AI assistant deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting AI assistant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;