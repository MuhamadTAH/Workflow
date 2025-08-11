-- Sample data for Kurdish Sorani AI Training Database
-- This includes representative examples for each table

-- Sample text corpus
INSERT INTO sorani_texts (content, source, domain, difficulty_level, word_count, dialect_variant, quality_score, is_verified) VALUES
('سڵاو، چۆنی؟ من ناوم ئەحمەدە و لە سلێمانی دەژیم.', 'conversation', 'daily_life', 1, 8, 'Sulaymaniyah', 0.9, TRUE),
('کوردستان وڵاتێکی جوانە کە لە باکووری عێراق و باشووری تورکیا و ڕۆژهەڵاتی سوریا و ڕۆژاوای ئێران بەش دراوە.', 'encyclopedia', 'geography', 3, 18, 'Standard', 0.95, TRUE),
('ئەمڕۆ کەشەکە زۆر جوانە. خۆر دەدرەوشێتەوە و هەوا گەرمە.', 'conversation', 'weather', 2, 10, 'Erbil', 0.85, TRUE),
('کتێبەکان سەرچاوەی زانستن و فێربوونن. دەبێت زیاتر بخوێنینەوە.', 'educational', 'literature', 2, 9, 'Standard', 0.9, TRUE);

-- Sample vocabulary
INSERT INTO sorani_vocabulary (word, root_word, part_of_speech, definition_sorani, definition_english, pronunciation, frequency_rank, usage_examples) VALUES
('سڵاو', 'سڵاو', 'interjection', 'وشەی سڵاوکردن', 'hello, greeting', 'sɫaːw', 50, '["سڵاو، چۆنی؟", "سڵاوی لێکردم"]'),
('ماڵ', 'ماڵ', 'noun', 'جێگای نیشتەجێبوون', 'house, home', 'maːɫ', 100, '["ماڵەکەم گەورەیە", "بۆ ماڵ دەچمەوە"]'),
('خوارن', 'خوارن', 'verb', 'خواردن، برنجدان', 'to eat', 'xwaːɾdn', 80, '["من نان دەخۆم", "ئێوە چی دەخۆن؟"]'),
('جوان', 'جوان', 'adjective', 'بە شێوەیەکی جوان، خۆش', 'beautiful, nice', 'ʤuːaːn', 200, '["کچێکی جوان", "ئەم شتە زۆر جوانە"]'),
('پەنجەرە', 'پەنجەرە', 'noun', 'کونڕێگا لە دیواردا بۆ تیشک و هەوا', 'window', 'pændʒæɾæ', 500, '["پەنجەرەکە بکەرەوە", "لە پەنجەرەوە تەماشا دەکەم"]');

-- Sample grammar patterns
INSERT INTO sorani_grammar (rule_type, pattern, explanation_sorani, explanation_english, examples, difficulty_level) VALUES
('verb_conjugation_present', '{stem} + personal_endings', 'کاری ئێستا: بنەڕەت + کۆتایی کەسی', 'Present tense: stem + personal endings', '["دە + خوا + م = دەخۆم", "دە + چ + یت = دەچیت"]', 2),
('noun_plural', '{singular} + ان/ەکان', 'کۆکردنەوەی ناو', 'Noun pluralization', '["کتێب → کتێبەکان", "مندال → منداڵان"]', 1),
('ezafe_construction', '{noun} + ی + {adjective}', 'پێکهاتەی ئەزافە', 'Ezafe construction for possession/description', '["کتێبی من", "ماڵی گەورە"]', 3);

-- Sample conversations
INSERT INTO sorani_conversations (input_text, response_text, context_category, emotion_tone, quality_rating) VALUES
('سڵاو، چۆنی؟', 'سڵاو، باشم سوپاس، تۆ چۆنی؟', 'greeting', 'casual', 5),
('کات چەندە؟', 'کاتژمێر دوو و نیوە.', 'time_inquiry', 'neutral', 5),
('ئەم کتێبە چەندە؟', 'بیست هەزار دیناە.', 'shopping', 'formal', 4),
('بە کوێ دەڕۆیت؟', 'بۆ بازار دەڕۆم.', 'daily_activity', 'casual', 5),
('ماندوو دەبیت؟', 'بەڵێ، کەمێک ماندوو دەبم.', 'feeling', 'casual', 4);

-- Sample translations
INSERT INTO sorani_translations (sorani_text, target_language, target_text, translation_type, domain, quality_score) VALUES
('سڵاو، چۆنی؟', 'en', 'Hello, how are you?', 'contextual', 'conversation', 0.95),
('من کتێب دەخوێنمەوە', 'en', 'I am reading a book', 'literal', 'daily_life', 0.9),
('ئەمڕۆ کەشەکە جوانە', 'en', 'The weather is nice today', 'contextual', 'weather', 0.95),
('کوردستان وڵاتێکی جوانە', 'en', 'Kurdistan is a beautiful country', 'contextual', 'geography', 0.9);

-- Sample morphological analysis
INSERT INTO sorani_morphology (word, stem, prefixes, suffixes, morphemes, morphological_tags) VALUES
('دەخۆم', 'خوا', 'دە', 'م', '["دە", "خوا", "م"]', 'VERB,PRESENT,1SG'),
('کتێبەکان', 'کتێب', '', 'ەکان', '["کتێب", "ەکان"]', 'NOUN,PLURAL'),
('جوانترین', 'جوان', '', 'ترین', '["جوان", "تر", "ین"]', 'ADJ,SUPERLATIVE');

-- Sample entities
INSERT INTO sorani_entities (entity_text, entity_type, entity_category, frequency) VALUES
('سلێمانی', 'PLACE', 'city', 100),
('هەولێر', 'PLACE', 'city', 95),
('دهۆک', 'PLACE', 'city', 80),
('کوردستان', 'PLACE', 'region', 200),
('نەورۆز', 'EVENT', 'holiday', 50);

-- Sample idioms
INSERT INTO sorani_idioms (idiom_text, literal_meaning, contextual_meaning, equivalent_english, usage_examples) VALUES
('دەست لەسەر دەست', 'hand over hand', 'without doing anything', 'sitting idle', '["دەست لەسەر دەست دانیشتووە"]'),
('چاو لە ڕێ', 'eye on the road', 'waiting eagerly', 'anxiously waiting', '["چاوم لە ڕێتە"]'),
('دڵ ئاگردار', 'heart on fire', 'very worried', 'heart burning with worry', '["دڵم ئاگردارە"]');