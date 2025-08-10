const express = require('express');
const { detectLanguage, getLanguageConfidence, getLanguageName, isRTL, supportedLanguages } = require('../services/languageDetection');
const router = express.Router();

// Detect language from text
router.post('/api/language/detect', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        error: 'Text is required for language detection' 
      });
    }

    const result = getLanguageConfidence(text);
    
    res.json({
      success: true,
      detected: result.language,
      confidence: result.confidence,
      isRTL: isRTL(result.language),
      languageName: getLanguageName(result.language),
      allScores: result.allScores,
      supportedLanguages: supportedLanguages
    });
    
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({ 
      error: 'Language detection failed', 
      message: error.message 
    });
  }
});

// Get supported languages
router.get('/api/language/supported', (req, res) => {
  try {
    const languages = supportedLanguages.map(code => ({
      code,
      name: getLanguageName(code),
      isRTL: isRTL(code)
    }));

    res.json({
      success: true,
      languages
    });
    
  } catch (error) {
    console.error('Get supported languages error:', error);
    res.status(500).json({ 
      error: 'Failed to get supported languages', 
      message: error.message 
    });
  }
});

// Test language detection with sample texts
router.get('/api/language/test', (req, res) => {
  try {
    const testTexts = {
      en: "Hello, how are you today? This is a test message in English.",
      ar: "مرحبا، كيف حالك اليوم؟ هذه رسالة تجريبية باللغة العربية.",
      es: "Hola, ¿cómo estás hoy? Este es un mensaje de prueba en español.",
      fr: "Bonjour, comment allez-vous aujourd'hui ? Ceci est un message de test en français."
    };

    const results = {};
    
    Object.entries(testTexts).forEach(([actualLang, text]) => {
      const detection = getLanguageConfidence(text);
      results[actualLang] = {
        text,
        detected: detection.language,
        confidence: detection.confidence,
        isCorrect: detection.language === actualLang,
        isRTL: isRTL(detection.language),
        languageName: getLanguageName(detection.language)
      };
    });

    res.json({
      success: true,
      testResults: results,
      summary: {
        totalTests: Object.keys(results).length,
        correctDetections: Object.values(results).filter(r => r.isCorrect).length,
        averageConfidence: Object.values(results).reduce((sum, r) => sum + r.confidence, 0) / Object.keys(results).length
      }
    });
    
  } catch (error) {
    console.error('Language detection test error:', error);
    res.status(500).json({ 
      error: 'Language detection test failed', 
      message: error.message 
    });
  }
});

module.exports = router;