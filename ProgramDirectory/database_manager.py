import sqlite3

# Connect to the database (this will create the file if it doesn't exist)
conn = sqlite3.connect('storybank.db')

# Create a cursor object to execute SQL commands
cursor = conn.cursor()

# Define the SQL command to create the 'stories' table
# We use TEXT for strings, REAL for lat/lon, and INTEGER for the ID.
# NOT NULL means the field is required.
# The `created_at` column will automatically store the timestamp when a row is created.
create_table_sql = """
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

# Execute the command and commit the changes
cursor.execute(create_table_sql)
conn.commit()

# Close the connection
conn.close()

print("Database and 'stories' table created successfully.")