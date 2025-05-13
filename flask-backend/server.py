#server.py

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from pymongo import MongoClient
import bcrypt
import requests
from werkzeug.utils import secure_filename
from scheme_map.mapper import load_schemes, find_eligible_schemes
#from file_storage import app
import os
from chatbot.chatbot import chatbot_bp

app = Flask(__name__)
app.secret_key = 'kaviya'
CORS(app, supports_credentials=True)

# Register the chatbot blueprint
app.register_blueprint(chatbot_bp)

client = MongoClient('mongodb://localhost:27017/')
db = client['user_auth']
users_collection = db['users']
db2 = client['scheme_data']
scheme_collection = db2['schemes']

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

@app.route("/admin", methods=['POST'])
def admin():
    try:
        data = request.get_json()
        scheme = {
            "name": data['name'],
            "description": data['description'],
            "eligibility": data['eligibility']
        }
        result = scheme_collection.insert_one(scheme)
        return jsonify({"message": "Scheme added", "id": str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({'message': 'Logged out successfully'})


@app.route("/user", methods=["GET", "POST"])
def check_eligibility():
    if request.method == "GET":
        # Handle GET request - just return an empty response to render the frontend page
        return jsonify({"message": "User page loaded successfully"})
    else:
        user_data = request.json
        print("Received:", user_data)
        schemes = load_schemes()
        print("Loaded Schemes:", schemes)
        eligible = find_eligible_schemes(user_data, schemes)
        print("Received user data:", user_data)
        print("Eligible schemes:", eligible)
        return jsonify({"eligible_schemes": eligible})

"""# Add a simple endpoint to handle direct /chat requests and forward to the blueprint
@app.route('/chat', methods=['GET', 'POST'])
def chat_endpoint():
    if request.method == 'GET':
        return jsonify({"message": "Chat endpoint ready"})
    # This endpoint just forwards the request to the chatbot blueprint
    from chatbot.chatbot import handle_chat
    return handle_chat(request)

@app.route('/chatbot', methods=['GET'])
def chatbot_page():
    # Handle GET request to render the chatbot page
    return jsonify({"message": "Chatbot page loaded successfully"})

    """
if __name__ == "__main__":
    app.run(debug=True)