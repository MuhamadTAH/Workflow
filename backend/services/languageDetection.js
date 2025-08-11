// Simple language detection service
// Detects language based on character patterns and common words

class LanguageDetection {
  constructor() {
    // Common words for each supported language
    this.patterns = {
      ar: {
        chars: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/,
        words: ['في', 'من', 'إلى', 'على', 'هذا', 'هذه', 'التي', 'الذي', 'وهو', 'وهي', 'ما', 'لا', 'نعم', 'مرحبا', 'أهلا', 'كيف', 'ماذا', 'متى', 'أين']
      },
      es: {
        chars: /[ñáéíóúüÑÁÉÍÓÚÜ]/,
        words: ['el', 'la', 'de', 'que', 'y', 'es', 'en', 'un', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'hola', 'gracias', 'por favor', 'sí', 'cómo', 'qué', 'cuándo', 'dónde']
      },
      fr: {
        chars: /[àâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]/,
        words: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'bonjour', 'merci', "s'il vous plaît", 'oui', 'comment', 'quoi', 'quand', 'où']
      },
      en: {
        chars: /[a-zA-Z]/,
        words: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'hello', 'thank', 'please', 'yes', 'how', 'what', 'when', 'where']
      }
    };
  }

  detectLanguage(text) {
    if (!text || typeof text !== 'string') {
      return 'en'; // Default to English
    }

    const cleanText = text.toLowerCase().trim();
    const scores = {};

    // Initialize scores
    Object.keys(this.patterns).forEach(lang => {
      scores[lang] = 0;
    });

    // Check for language-specific characters
    Object.entries(this.patterns).forEach(([lang, pattern]) => {
      const charMatches = (text.match(pattern.chars) || []).length;
      scores[lang] += charMatches * 10; // High weight for specific characters
    });

    // Check for common words
    Object.entries(this.patterns).forEach(([lang, pattern]) => {
      pattern.words.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const wordMatches = (cleanText.match(regex) || []).length;
        scores[lang] += wordMatches * 5; // Medium weight for common words
      });
    });

    // Find the language with the highest score
    const detectedLang = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];

    // If no clear winner, default to English
    return scores[detectedLang] > 0 ? detectedLang : 'en';
  }

  // Get language confidence score
  getLanguageConfidence(text) {
    if (!text) return { language: 'en', confidence: 0 };

    const detected = this.detectLanguage(text);
    const scores = {};

    // Calculate scores for all languages
    Object.keys(this.patterns).forEach(lang => {
      scores[lang] = 0;
    });

    const cleanText = text.toLowerCase().trim();

    // Character-based scoring
    Object.entries(this.patterns).forEach(([lang, pattern]) => {
      const charMatches = (text.match(pattern.chars) || []).length;
      scores[lang] += charMatches * 10;
    });

    // Word-based scoring
    Object.entries(this.patterns).forEach(([lang, pattern]) => {
      pattern.words.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const wordMatches = (cleanText.match(regex) || []).length;
        scores[lang] += wordMatches * 5;
      });
    });

    const maxScore = Math.max(...Object.values(scores));
    const confidence = maxScore > 0 ? Math.min((scores[detected] / maxScore) * 100, 100) : 0;

    return {
      language: detected,
      confidence: Math.round(confidence),
      allScores: scores
    };
  }

  // Get language display name
  getLanguageName(code) {
    const names = {
      en: 'English',
      ar: 'العربية',
      es: 'Español',
      fr: 'Français'
    };
    return names[code] || 'Unknown';
  }

  // Check if language is RTL
  isRTL(code) {
    return ['ar'].includes(code);
  }
}

// Create singleton instance
const languageDetection = new LanguageDetection();

module.exports = {
  detectLanguage: (text) => languageDetection.detectLanguage(text),
  getLanguageConfidence: (text) => languageDetection.getLanguageConfidence(text),
  getLanguageName: (code) => languageDetection.getLanguageName(code),
  isRTL: (code) => languageDetection.isRTL(code),
  supportedLanguages: ['en', 'ar', 'es', 'fr']
};