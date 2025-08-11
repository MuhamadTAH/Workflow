-- Kurdish Sorani AI Training Database Schema
-- Designed for comprehensive language learning and AI training

-- Core text corpus table
CREATE TABLE sorani_texts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    source VARCHAR(100), -- book, news, web, social_media, etc.
    domain VARCHAR(50), -- literature, news, religious, scientific, etc.
    difficulty_level INTEGER, -- 1-5 scale
    word_count INTEGER,
    dialect_variant VARCHAR(50), -- Sulaymaniyah, Erbil, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quality_score REAL, -- 0.0-1.0 for data quality
    is_verified BOOLEAN DEFAULT FALSE
);

-- Vocabulary and word forms
CREATE TABLE sorani_vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word VARCHAR(200) NOT NULL,
    root_word VARCHAR(200),
    part_of_speech VARCHAR(50), -- noun, verb, adjective, etc.
    definition_sorani TEXT,
    definition_english TEXT,
    definition_arabic TEXT,
    pronunciation VARCHAR(300), -- phonetic representation
    frequency_rank INTEGER,
    usage_examples TEXT, -- JSON array of examples
    etymology TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grammar patterns and rules
CREATE TABLE sorani_grammar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_type VARCHAR(100), -- verb_conjugation, noun_declension, etc.
    pattern VARCHAR(500),
    explanation_sorani TEXT,
    explanation_english TEXT,
    examples TEXT, -- JSON array
    exceptions TEXT, -- JSON array
    difficulty_level INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversational pairs for chatbot training
CREATE TABLE sorani_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_text TEXT NOT NULL,
    response_text TEXT NOT NULL,
    context_category VARCHAR(100), -- greeting, shopping, family, etc.
    emotion_tone VARCHAR(50), -- formal, casual, happy, sad, etc.
    speaker_age_group VARCHAR(50),
    region VARCHAR(50),
    quality_rating INTEGER, -- 1-5
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Translation pairs (Sorani <-> other languages)
CREATE TABLE sorani_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sorani_text TEXT NOT NULL,
    target_language VARCHAR(10), -- en, ar, fa, tr, etc.
    target_text TEXT NOT NULL,
    translation_type VARCHAR(50), -- literal, contextual, poetic
    domain VARCHAR(50),
    verified_by VARCHAR(100),
    quality_score REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Morphological analysis
CREATE TABLE sorani_morphology (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word VARCHAR(200) NOT NULL,
    stem VARCHAR(200),
    prefixes VARCHAR(100),
    suffixes VARCHAR(100),
    morphemes TEXT, -- JSON array
    morphological_tags VARCHAR(300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phonetics and pronunciation
CREATE TABLE sorani_phonetics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word VARCHAR(200) NOT NULL,
    ipa_transcription VARCHAR(500),
    phoneme_breakdown TEXT, -- JSON array
    stress_pattern VARCHAR(100),
    audio_file_path VARCHAR(300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Named entities (people, places, organizations)
CREATE TABLE sorani_entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_text VARCHAR(300) NOT NULL,
    entity_type VARCHAR(50), -- PERSON, PLACE, ORG, etc.
    entity_category VARCHAR(100),
    context_sentences TEXT, -- JSON array
    frequency INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Idioms and expressions
CREATE TABLE sorani_idioms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idiom_text TEXT NOT NULL,
    literal_meaning TEXT,
    contextual_meaning TEXT,
    usage_examples TEXT, -- JSON array
    cultural_context TEXT,
    equivalent_english TEXT,
    equivalent_arabic TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training datasets metadata
CREATE TABLE training_datasets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_name VARCHAR(200) NOT NULL,
    description TEXT,
    data_type VARCHAR(50), -- text, conversation, translation, etc.
    source_tables TEXT, -- JSON array of table names
    total_records INTEGER,
    train_split REAL DEFAULT 0.8,
    validation_split REAL DEFAULT 0.1,
    test_split REAL DEFAULT 0.1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quality control and validation
CREATE TABLE data_validation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    validation_type VARCHAR(100), -- spelling, grammar, accuracy, etc.
    validator_name VARCHAR(100),
    is_valid BOOLEAN,
    issues_found TEXT, -- JSON array
    corrections TEXT, -- JSON array
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_sorani_texts_source ON sorani_texts(source);
CREATE INDEX idx_sorani_texts_domain ON sorani_texts(domain);
CREATE INDEX idx_sorani_texts_difficulty ON sorani_texts(difficulty_level);
CREATE INDEX idx_vocabulary_word ON sorani_vocabulary(word);
CREATE INDEX idx_vocabulary_pos ON sorani_vocabulary(part_of_speech);
CREATE INDEX idx_vocabulary_frequency ON sorani_vocabulary(frequency_rank);
CREATE INDEX idx_conversations_category ON sorani_conversations(context_category);
CREATE INDEX idx_translations_language ON sorani_translations(target_language);
CREATE INDEX idx_entities_type ON sorani_entities(entity_type);

-- Views for common queries
CREATE VIEW high_quality_texts AS
SELECT * FROM sorani_texts 
WHERE quality_score >= 0.8 AND is_verified = TRUE;

CREATE VIEW common_vocabulary AS
SELECT * FROM sorani_vocabulary 
WHERE frequency_rank <= 10000 
ORDER BY frequency_rank;

CREATE VIEW conversational_training_data AS
SELECT input_text, response_text, context_category 
FROM sorani_conversations 
WHERE quality_rating >= 4;