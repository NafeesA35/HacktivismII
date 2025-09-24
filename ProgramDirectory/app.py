from flask import Flask, request, jsonify, render_template
import sqlite3



app = Flask(__name__)
DB_PATH = 'storybank.db'


@app.route('/')
def home():
    return render_template('index.html')

@app.route('/submit')
def submit_page():
    return render_template('submit.html')



@app.route('/api/stories', methods=['POST'])
def create_story():
    data = request.get_json()

    # Validate payload (required keys, types, ranges)
    if not data:
        return jsonify({'error': 'Request body must be JSON.'}), 400


    required_keys = ['author_name', 'story_title', 'story_text', 'latitude', 'longitude']
    missing = [k for k in required_keys if k not in data]
    if missing:
        return jsonify({'error': f"Missing required fields: {', '.join(missing)}"}), 400


    for key in ['author_name', 'story_title', 'story_text']:
        value = data.get(key)
        if not isinstance(value, str) or not value.strip():
            return jsonify({'error': f"'{key}' must be a non-empty string."}), 400
        data[key] = value.strip()


    try:
        lat = float(data['latitude'])
        lng = float(data['longitude'])
    except (TypeError, ValueError):
        return jsonify({'error': "'latitude' and 'longitude' must be numbers."}), 400

    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        return jsonify({'error': 'Coordinates out of range: latitude [-90,90], longitude [-180,180].'}), 400

    # normalise numbers
    data['latitude'] = lat
    data['longitude'] = lng

    # optional text fields
    for key in ['location_tag', 'decade_tag']:
        if key in data and data[key] is not None:
            if not isinstance(data[key], str):
                data[key] = str(data[key])
            data[key] = data[key].strip() or None

    try:
        # insert
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # parameterized insert
        cursor.execute("""
            INSERT INTO stories (author_name, story_title, story_text, location_tag, decade_tag, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            data['author_name'],
            data['story_title'],
            data['story_text'],
            data.get('location_tag'),
            data.get('decade_tag'),
            data['latitude'],
            data['longitude']
        ))
        
        # commit/close
        conn.commit()
        conn.close()

        # created
        return jsonify({'message': 'Story created successfully'}), 201

    except Exception as e:
        # error
        return jsonify({'error': str(e)}), 500






@app.route('/api/stories', methods=['GET'])
def get_stories():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row 
        
        cursor = conn.cursor()

        # optional filters
        q_lat = request.args.get('latitude', type=float)
        q_lng = request.args.get('longitude', type=float)
        q_decade = request.args.get('decade_tag')

        sql = "SELECT * FROM stories WHERE 1=1"
        params = []
        if q_lat is not None:
            sql += " AND latitude = ?"
            params.append(q_lat)
        if q_lng is not None:
            sql += " AND longitude = ?"
            params.append(q_lng)
        if q_decade:
            sql += " AND decade_tag = ?"
            params.append(q_decade)

        sql += " ORDER BY created_at DESC"

        cursor.execute(sql, params)
        rows = cursor.fetchall()
        
        conn.close()
        # serialize
        stories = [dict(row) for row in rows]
        
        return jsonify(stories), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Page: Location list
@app.route('/location')
def location_page():
    return render_template('location.html')

if __name__ == '__main__':
    # dev only
    app.run(debug=True)