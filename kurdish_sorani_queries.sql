-- Kurdish Sorani AI Database - Useful Queries for Training and Analysis

-- 1. GET TRAINING DATA FOR CONVERSATIONAL AI
-- Retrieve high-quality conversation pairs
SELECT 
    input_text as prompt,
    response_text as response,
    context_category,
    emotion_tone
FROM sorani_conversations 
WHERE quality_rating >= 4
ORDER BY context_category, quality_rating DESC;

-- 2. GET VOCABULARY BY FREQUENCY
-- Most common words for basic AI training
SELECT 
    word,
    definition_sorani,
    definition_english,
    part_of_speech,
    frequency_rank
FROM sorani_vocabulary 
WHERE frequency_rank <= 1000 
ORDER BY frequency_rank ASC;

-- 3. GET TEXTS BY DIFFICULTY LEVEL
-- Progressive training data
SELECT 
    content,
    difficulty_level,
    word_count,
    domain
FROM sorani_texts 
WHERE is_verified = TRUE 
    AND quality_score >= 0.8
ORDER BY difficulty_level ASC, word_count ASC;

-- 4. TRANSLATION TRAINING PAIRS
-- For multilingual AI models
SELECT 
    sorani_text,
    target_language,
    target_text,
    domain
FROM sorani_translations 
WHERE quality_score >= 0.8
ORDER BY target_language, domain;

-- 5. GRAMMAR PATTERNS FOR RULE-BASED LEARNING
-- Essential grammar rules
SELECT 
    rule_type,
    pattern,
    explanation_english,
    examples,
    difficulty_level
FROM sorani_grammar 
ORDER BY difficulty_level ASC, rule_type;

-- 6. MORPHOLOGICAL ANALYSIS DATA
-- For understanding word structure
SELECT 
    word,
    stem,
    prefixes,
    suffixes,
    morphological_tags
FROM sorani_morphology;

-- 7. NAMED ENTITY RECOGNITION TRAINING
-- Entities for NER models
SELECT 
    entity_text,
    entity_type,
    entity_category,
    frequency
FROM sorani_entities 
WHERE frequency >= 10
ORDER BY entity_type, frequency DESC;

-- 8. CULTURAL EXPRESSIONS AND IDIOMS
-- For context-aware AI
SELECT 
    idiom_text,
    contextual_meaning,
    equivalent_english,
    usage_examples
FROM sorani_idioms;

-- 9. PHONETIC DATA FOR SPEECH RECOGNITION
-- Pronunciation training
SELECT 
    word,
    ipa_transcription,
    phoneme_breakdown,
    stress_pattern
FROM sorani_phonetics 
WHERE ipa_transcription IS NOT NULL;

-- 10. DATA QUALITY OVERVIEW
-- Monitor data quality across tables
SELECT 
    'sorani_texts' as table_name,
    COUNT(*) as total_records,
    AVG(quality_score) as avg_quality,
    COUNT(CASE WHEN is_verified = TRUE THEN 1 END) as verified_records
FROM sorani_texts
UNION ALL
SELECT 
    'sorani_conversations',
    COUNT(*),
    AVG(quality_rating)/5.0,
    COUNT(CASE WHEN quality_rating >= 4 THEN 1 END)
FROM sorani_conversations
UNION ALL
SELECT 
    'sorani_translations',
    COUNT(*),
    AVG(quality_score),
    COUNT(CASE WHEN quality_score >= 0.8 THEN 1 END)
FROM sorani_translations;

-- 11. GENERATE TRAINING DATASET SPLITS
-- Create train/validation/test splits
WITH numbered_conversations AS (
    SELECT *,
           ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn,
           COUNT(*) OVER () as total_count
    FROM sorani_conversations 
    WHERE quality_rating >= 4
)
SELECT 
    input_text,
    response_text,
    context_category,
    CASE 
        WHEN rn <= total_count * 0.8 THEN 'train'
        WHEN rn <= total_count * 0.9 THEN 'validation'
        ELSE 'test'
    END as dataset_split
FROM numbered_conversations;

-- 12. VOCABULARY COVERAGE ANALYSIS
-- Check vocabulary coverage in texts
SELECT 
    st.domain,
    COUNT(DISTINCT sv.word) as unique_vocab_used,
    AVG(sv.frequency_rank) as avg_word_frequency
FROM sorani_texts st
JOIN sorani_vocabulary sv ON st.content LIKE '%' || sv.word || '%'
WHERE st.is_verified = TRUE
GROUP BY st.domain
ORDER BY unique_vocab_used DESC;

-- 13. DIALECTAL VARIATION ANALYSIS
-- Compare different dialects
SELECT 
    dialect_variant,
    COUNT(*) as text_count,
    AVG(difficulty_level) as avg_difficulty,
    AVG(quality_score) as avg_quality
FROM sorani_texts 
GROUP BY dialect_variant
ORDER BY text_count DESC;

-- 14. CONTEXT CATEGORY DISTRIBUTION
-- Balance check for conversation contexts
SELECT 
    context_category,
    COUNT(*) as conversation_count,
    AVG(quality_rating) as avg_quality,
    COUNT(DISTINCT emotion_tone) as tone_variety
FROM sorani_conversations 
GROUP BY context_category
ORDER BY conversation_count DESC;

-- 15. EXPORT TRAINING DATA FOR MACHINE LEARNING
-- Clean format for ML frameworks
SELECT 
    'conversation' as data_type,
    JSON_OBJECT(
        'input', input_text,
        'output', response_text,
        'metadata', JSON_OBJECT(
            'category', context_category,
            'tone', emotion_tone,
            'quality', quality_rating
        )
    ) as training_example
FROM sorani_conversations 
WHERE quality_rating >= 4

UNION ALL

SELECT 
    'translation' as data_type,
    JSON_OBJECT(
        'source', sorani_text,
        'target', target_text,
        'metadata', JSON_OBJECT(
            'target_lang', target_language,
            'domain', domain,
            'quality', quality_score
        )
    ) as training_example
FROM sorani_translations 
WHERE quality_score >= 0.8;

-- 16. TEXT PREPROCESSING PIPELINE
-- Clean and prepare text data
SELECT 
    id,
    content as original_text,
    -- Remove extra whitespace
    TRIM(REPLACE(REPLACE(content, '  ', ' '), CHAR(10), ' ')) as cleaned_text,
    -- Extract unique words
    LENGTH(content) - LENGTH(REPLACE(content, ' ', '')) + 1 as word_count,
    -- Classify by length
    CASE 
        WHEN LENGTH(content) < 50 THEN 'short'
        WHEN LENGTH(content) < 200 THEN 'medium'
        ELSE 'long'
    END as text_length_category
FROM sorani_texts 
WHERE is_verified = TRUE 
    AND quality_score >= 0.8;