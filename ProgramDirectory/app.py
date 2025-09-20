# ## 1. IMPORTS ##
# Import the necessary classes and functions from the Flask library.
# Flask: The main class used to create our web application instance.
# request: An object that holds all the incoming data from a client request (like JSON data).
# jsonify: A function that converts Python dictionaries into a JSON format for API responses.
from flask import Flask, request, jsonify

# Import the built-in Python library for interacting with SQLite databases.
import sqlite3


# ## 2. APP INITIALIZATION ##
# Create an instance of the Flask web application.
# `__name__` is a special Python variable that 8igets the name of the current module.
# Flask uses this to know where to look for resources like templates and static files.
app = Flask(__name__)


# ## 3. ROUTES ##

# This is a "decorator" that tells Flask which URL should trigger our function.
# In this case, visiting the root URL ('/') will run the home() function.
@app.route('/')
def home():
    # This function simply returns a string to let us know the API is running.
    return "B&D StoryBank API is running!"


# This route handles creating a new story.
# We specify `methods=['POST']` because the client will be SENDING data to the server.
@app.route('/api/stories', methods=['POST'])
def create_story():
    # `request.get_json()` parses the incoming request body as JSON and returns it as a Python dictionary.
    data = request.get_json()

    # --- Basic Validation ---
    # We check if `data` exists and if all the required keys are present in the dictionary.
    if not data or not all(k in data for k in ['author_name', 'story_title', 'story_text', 'latitude', 'longitude']):
        # If data is missing, we return an error message.
        # The `400` is an HTTP status code for "Bad Request", telling the client their request was malformed.
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        # --- Database Interaction ---
        # Connect to our SQLite database file.
        conn = sqlite3.connect('storybank.db')
        # A cursor is an object that lets us execute SQL commands.
        cursor = conn.cursor()

        # The SQL INSERT statement.
        # We use `?` as placeholders for our data. This is a security measure
        # called "parameterized queries" that prevents SQL injection attacks.
        cursor.execute("""
            INSERT INTO stories (author_name, story_title, story_text, location_tag, decade_tag, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            data['author_name'],
            data['story_title'],
            data['story_text'],
            data.get('location_tag'), # .get() is safer for optional fields as it returns None if the key doesn't exist.
            data.get('decade_tag'),
            data['latitude'],
            data['longitude']
        ))
        
        # `conn.commit()` saves the changes to the database.
        conn.commit()
        # It's important to always close the connection when we're done.
        conn.close()

        # --- Success Response ---
        # We return a success message to the client.
        # The `201` HTTP status code means "Created", which is the standard response for a successful POST request.
        return jsonify({'message': 'Story created successfully'}), 201

    except Exception as e:
        # If any error occurs during the `try` block, the code in the `except` block will run.
        # We return a generic server error message.
        # The `500` HTTP status code means "Internal Server Error".
        return jsonify({'error': str(e)}), 500


# This route handles retrieving all stories from the database.
# The default method for `@app.route` is GET, so `methods=['GET']` is optional but good for clarity.
@app.route('/api/stories', methods=['GET'])
def get_stories():
    try:
        conn = sqlite3.connect('storybank.db')
        
        # This is a helpful trick! It makes the database connection return rows
        # that can be accessed like dictionaries (by column name) instead of just tuples (by index).
        conn.row_factory = sqlite3.Row 
        
        cursor = conn.cursor()

        # Execute a simple SELECT query to get all stories, ordered by the newest first.
        cursor.execute("SELECT * FROM stories ORDER BY created_at DESC")
        # `fetchall()` retrieves all the rows from the query result.
        rows = cursor.fetchall()
        
        conn.close()

        # --- Data Formatting ---
        # We need to convert the list of `sqlite3.Row` objects into a standard list of dictionaries
        # because `jsonify` knows how to handle that format. This is a "list comprehension".
        stories = [dict(row) for row in rows]
        
        # --- Success Response ---
        # Return the list of stories as a JSON array.
        # The `200` HTTP status code means "OK", the standard response for a successful GET request.
        return jsonify(stories), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ## 4. RUN THE APP ##
# This is a standard Python convention. The code inside this `if` statement
# will only run when you execute the script directly (e.g., `python app.py`).
# It won't run if this file is imported by another file.
if __name__ == '__main__':
    # `app.run()` starts the Flask development server.
    # `debug=True` is very useful for development. It enables:
    # 1. Automatic reloading: The server will restart automatically when you save changes to the file.
    # 2. Debugger: You'll see detailed error messages in your browser if something goes wrong.
    # **IMPORTANT:** Never run with `debug=True` in a live production environment!
    app.run(debug=True)