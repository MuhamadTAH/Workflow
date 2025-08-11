#!/usr/bin/env python3
"""
Kurdish Sorani AI Database Setup and Management Tool
This script helps initialize and manage the Kurdish Sorani language database.
"""

import sqlite3
import json
import os
import sys
from typing import List, Dict, Any
import argparse

class KurdishSoraniDB:
    def __init__(self, db_path: str = "kurdish_sorani_ai.db"):
        self.db_path = db_path
        self.conn = None
        
    def connect(self):
        """Connect to the database"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row  # Enable column access by name
        print(f"✓ Connected to database: {self.db_path}")
        
    def disconnect(self):
        """Disconnect from the database"""
        if self.conn:
            self.conn.close()
            print("✓ Database connection closed")
            
    def setup_database(self):
        """Initialize the database with schema"""
        if not self.conn:
            self.connect()
            
        try:
            # Read and execute schema
            with open('kurdish_sorani_ai_database.sql', 'r', encoding='utf-8') as f:
                schema = f.read()
            
            # Execute schema creation
            self.conn.executescript(schema)
            self.conn.commit()
            print("✓ Database schema created successfully")
            
            # Insert sample data
            with open('kurdish_sorani_sample_data.sql', 'r', encoding='utf-8') as f:
                sample_data = f.read()
            
            self.conn.executescript(sample_data)
            self.conn.commit()
            print("✓ Sample data inserted successfully")
            
        except FileNotFoundError as e:
            print(f"❌ Error: Required SQL file not found: {e}")
            return False
        except sqlite3.Error as e:
            print(f"❌ Database error: {e}")
            return False
            
        return True
        
    def add_text(self, content: str, source: str = "manual", domain: str = "general", 
                 difficulty: int = 1, dialect: str = "Standard", quality_score: float = 0.8):
        """Add a new text to the corpus"""
        if not self.conn:
            self.connect()
            
        word_count = len(content.split())
        
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO sorani_texts 
            (content, source, domain, difficulty_level, word_count, dialect_variant, quality_score, is_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (content, source, domain, difficulty, word_count, dialect, quality_score, True))
        
        self.conn.commit()
        text_id = cursor.lastrowid
        print(f"✓ Added text with ID: {text_id}")
        return text_id
        
    def add_vocabulary(self, word: str, pos: str, definition_sorani: str, 
                      definition_english: str = "", pronunciation: str = "", frequency: int = 1000):
        """Add a new vocabulary item"""
        if not self.conn:
            self.connect()
            
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO sorani_vocabulary 
            (word, part_of_speech, definition_sorani, definition_english, pronunciation, frequency_rank)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (word, pos, definition_sorani, definition_english, pronunciation, frequency))
        
        self.conn.commit()
        vocab_id = cursor.lastrowid
        print(f"✓ Added vocabulary item: {word} (ID: {vocab_id})")
        return vocab_id
        
    def add_conversation(self, input_text: str, response_text: str, category: str = "general", 
                        tone: str = "neutral", quality: int = 5):
        """Add a conversation pair"""
        if not self.conn:
            self.connect()
            
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO sorani_conversations 
            (input_text, response_text, context_category, emotion_tone, quality_rating)
            VALUES (?, ?, ?, ?, ?)
        """, (input_text, response_text, category, tone, quality))
        
        self.conn.commit()
        conv_id = cursor.lastrowid
        print(f"✓ Added conversation pair (ID: {conv_id})")
        return conv_id
        
    def get_training_data(self, data_type: str = "conversation", limit: int = 100) -> List[Dict]:
        """Get training data for AI models"""
        if not self.conn:
            self.connect()
            
        cursor = self.conn.cursor()
        
        if data_type == "conversation":
            cursor.execute("""
                SELECT input_text, response_text, context_category, emotion_tone
                FROM sorani_conversations 
                WHERE quality_rating >= 4
                ORDER BY quality_rating DESC
                LIMIT ?
            """, (limit,))
            
            return [{"input": row[0], "output": row[1], "category": row[2], "tone": row[3]} 
                   for row in cursor.fetchall()]
                   
        elif data_type == "text":
            cursor.execute("""
                SELECT content, domain, difficulty_level
                FROM sorani_texts 
                WHERE is_verified = TRUE AND quality_score >= 0.8
                ORDER BY difficulty_level, word_count
                LIMIT ?
            """, (limit,))
            
            return [{"text": row[0], "domain": row[1], "difficulty": row[2]} 
                   for row in cursor.fetchall()]
                   
        elif data_type == "vocabulary":
            cursor.execute("""
                SELECT word, definition_sorani, definition_english, part_of_speech
                FROM sorani_vocabulary 
                WHERE frequency_rank <= 1000
                ORDER BY frequency_rank
                LIMIT ?
            """, (limit,))
            
            return [{"word": row[0], "definition_sorani": row[1], 
                    "definition_english": row[2], "pos": row[3]} 
                   for row in cursor.fetchall()]
        
        return []
        
    def export_training_data(self, output_file: str, data_type: str = "conversation"):
        """Export training data to JSON file"""
        training_data = self.get_training_data(data_type, limit=10000)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(training_data, f, ensure_ascii=False, indent=2)
            
        print(f"✓ Exported {len(training_data)} {data_type} items to {output_file}")
        
    def get_database_stats(self):
        """Get database statistics"""
        if not self.conn:
            self.connect()
            
        cursor = self.conn.cursor()
        
        stats = {}
        
        # Count records in each table
        tables = ['sorani_texts', 'sorani_vocabulary', 'sorani_conversations', 
                 'sorani_translations', 'sorani_grammar', 'sorani_entities']
        
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            stats[table] = cursor.fetchone()[0]
            
        # Quality metrics
        cursor.execute("SELECT AVG(quality_score) FROM sorani_texts WHERE quality_score IS NOT NULL")
        stats['avg_text_quality'] = round(cursor.fetchone()[0] or 0, 2)
        
        cursor.execute("SELECT AVG(quality_rating) FROM sorani_conversations WHERE quality_rating IS NOT NULL")
        stats['avg_conversation_quality'] = round(cursor.fetchone()[0] or 0, 2)
        
        return stats
        
    def print_stats(self):
        """Print database statistics"""
        stats = self.get_database_stats()
        
        print("\n📊 Kurdish Sorani AI Database Statistics:")
        print("="*50)
        
        for table, count in stats.items():
            if table.startswith('sorani_'):
                table_name = table.replace('sorani_', '').replace('_', ' ').title()
                print(f"{table_name:20}: {count:>6}")
            elif not table.startswith('avg_'):
                print(f"{table:20}: {count:>6}")
                
        print("-"*50)
        print(f"{'Avg Text Quality':20}: {stats.get('avg_text_quality', 0):>6}")
        print(f"{'Avg Conversation Quality':20}: {stats.get('avg_conversation_quality', 0):>6}")
        print("="*50)

def main():
    parser = argparse.ArgumentParser(description="Kurdish Sorani AI Database Manager")
    parser.add_argument('--setup', action='store_true', help='Initialize database with schema and sample data')
    parser.add_argument('--stats', action='store_true', help='Show database statistics')
    parser.add_argument('--export', type=str, help='Export training data (conversation/text/vocabulary)')
    parser.add_argument('--output', type=str, default='training_data.json', help='Output file for export')
    parser.add_argument('--db', type=str, default='kurdish_sorani_ai.db', help='Database file path')
    
    args = parser.parse_args()
    
    if len(sys.argv) == 1:
        parser.print_help()
        return
        
    db = KurdishSoraniDB(args.db)
    
    try:
        if args.setup:
            print("🚀 Setting up Kurdish Sorani AI Database...")
            if db.setup_database():
                print("✅ Database setup completed successfully!")
            else:
                print("❌ Database setup failed!")
                return
                
        if args.stats:
            db.print_stats()
            
        if args.export:
            if args.export not in ['conversation', 'text', 'vocabulary']:
                print("❌ Export type must be: conversation, text, or vocabulary")
                return
                
            print(f"📤 Exporting {args.export} data...")
            db.export_training_data(args.output, args.export)
            
    finally:
        db.disconnect()

if __name__ == "__main__":
    main()