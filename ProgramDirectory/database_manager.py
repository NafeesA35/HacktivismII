import sqlite3
import sys

DB_PATH = 'storybank.db'

def create_database():
    # Connect to the database (this will create the file if it doesn't exist)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    CREATE_TABLE_SQL = """
    CREATE TABLE IF NOT EXISTS stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_name TEXT NOT NULL,
        story_title TEXT NOT NULL,
        story_text TEXT NOT NULL,
        location_tag TEXT,
        decade_tag TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """

    cursor.execute(CREATE_TABLE_SQL)
    conn.commit()
    conn.close()
    print("Database and 'stories' table created successfully.")

def clear_database():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Delete all records from the stories table
        cursor.execute("DELETE FROM stories")
        
        # Reset the auto-increment counter
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='stories'")
        
        conn.commit()
        conn.close()
        print("All stories deleted successfully.")
        
    except Exception as e:
        print(f"Error clearing database: {e}")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'clear':
        confirm = input("Are you sure you want to delete all stories? (yes/no): ")
        if confirm.lower() == 'yes':
            clear_database()
        else:
            print("Operation cancelled.")
    else:
        create_database()