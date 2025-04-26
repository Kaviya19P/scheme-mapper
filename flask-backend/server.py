#server.py

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from pymongo import MongoClient
import bcrypt
import requests
from werkzeug.utils import secure_filename
from scheme_map.mapper import load_schemes, find_eligible_schemes
from file_storage import app
import os

app = Flask(__name__)
app.secret_key = 'kaviya'
CORS(app, supports_credentials=True)

client = MongoClient('mongodb://localhost:27017/')
db = client['user_auth']
users_collection = db['users']

BLOCKCHAIN_NODE = 'http://127.0.0.1:8800'

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if users_collection.find_one({'name': name}):
        return jsonify({'message': 'Username already registered'}), 409

    if users_collection.find_one({'email': email}):
        return jsonify({'message': 'Email already exists'}), 409

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    users_collection.insert_one({'name': name, 'email': email, 'password': hashed_pw})
    return jsonify({'message': 'Signup successful'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({'email': email})
    if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
        session['user'] = {
            'name': user['name'],
            'email': user['email']
        }
        return jsonify({'message': 'Login successful', 'user': {'name': user['name'], 'email': user['email']}})
    return jsonify({'message': 'Invalid email or password'}), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({'message': 'Logged out successfully'})

@app.route('/user/files', methods=['GET'])
def get_user_files():
    if 'user' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    
    # Get chain from blockchain node
    response = requests.get(f"{BLOCKCHAIN_NODE}/chain")
    if response.status_code != 200:
        return jsonify({'message': 'Error fetching blockchain data'}), 500
    
    chain = response.json()['chain']
    user_files = []
    
    for block in chain:
        for tx in block['transactions']:
            if tx.get('user') == session['user']['name']:
                user_files.append({
                    'filename': tx['v_file'],
                    'size': tx['file_size'],
                    'timestamp': block.get('timestamp', 'N/A')
                })
    
    return jsonify({'files': user_files})

@app.route('/user/upload', methods=['POST'])
def upload_file():
    if 'user' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    
    # Forward to blockchain node
    try:
        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join('temp_uploads', filename)
        os.makedirs('temp_uploads', exist_ok=True)
        file.save(temp_path)
        
        # Get file size
        file_size = os.path.getsize(temp_path)
        
        # Read file data
        with open(temp_path, 'rb') as f:
            file_data = f.read()

        transaction = {
            "user": session['user']['name'],
            "v_file": filename,
            "file_data": str(file_data),
            "file_size": file_size
        }
        
        # Send to blockchain node
        response = requests.post(
            f"{BLOCKCHAIN_NODE}/new_transaction",
            json=transaction
        )
        
        # Clean up temp file
        os.remove(temp_path)
        
        if response.status_code == 201:
            return jsonify({'message': 'File uploaded successfully'})
        else:
            return jsonify({'message': 'Error adding to blockchain'}), 500
            
    except Exception as e:
        return jsonify({'message': str(e)}), 500
    
    
@app.route("/admin")
def admin():
    return jsonify({"admin": ["user1", "user2790", "user3"]})


"""@app.route("/user")
def user():
    return jsonify({"user": ["s"]})

"""

"""@app.route("/user", methods=["POST"])
def check_eligibility():
    user_data = request.json
    print("Received:", user_data)
    schemes = load_schemes()
    print("Loaded Schemes:", schemes)
    eligible = find_eligible_schemes(user_data, schemes)
    print("Received user data:", user_data)
    print("Eligible schemes:", eligible)
    return jsonify({"eligible_schemes": eligible})

"""


if __name__ == "__main__":
    app.run(debug=True)