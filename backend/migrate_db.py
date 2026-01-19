import psycopg2
from app.core.config import settings

def migrate_database():
    """Add hashed_password column to profiles table"""
    try:
        # Connect to database
        conn = psycopg2.connect(settings.database_url)
        cur = conn.cursor()
        
        print("🔄 Checking if hashed_password column exists...")
        
        # Check if column exists
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='profiles' AND column_name='hashed_password';
        """)
        
        if cur.fetchone():
            print("✅ Column hashed_password already exists!")
        else:
            print("➕ Adding hashed_password column...")
            
            # Add the column
            cur.execute("""
                ALTER TABLE profiles 
                ADD COLUMN hashed_password VARCHAR(255);
            """)
            
            # Set default value for existing rows
            cur.execute("""
                UPDATE profiles 
                SET hashed_password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5sPpkqYNwmYGy'
                WHERE hashed_password IS NULL;
            """)
            
            # Make it NOT NULL
            cur.execute("""
                ALTER TABLE profiles 
                ALTER COLUMN hashed_password SET NOT NULL;
            """)
            
            conn.commit()
            print("✅ Migration completed successfully!")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    migrate_database()
