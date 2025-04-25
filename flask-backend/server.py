#server.py

from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
import bcrypt
from scheme_map.mapper import load_schemes, find_eligible_schemes
from file_storage import views

app = Flask(__name__)
CORS(app)

client = MongoClient('mongodb://localhost:27017/')
db = client['user_auth']
users_collection = db['users']

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    # Check if email or name already exists
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
        return jsonify({'message': 'Login successful', 'user': {'name': user['name'], 'email': user['email']}})
    return jsonify({'message': 'Invalid email or password'}), 401

@app.route("/admin")
def admin():
    return jsonify({"admin": ["user1", "user2790", "user3"]})


"""@app.route("/user")
def user():
    return jsonify({"user": ["s"]})

"""

@app.route("/user", methods=["POST"])
def check_eligibility():
    user_data = request.json
    print("Received:", user_data)
    schemes = load_schemes()
    print("Loaded Schemes:", schemes)
    eligible = find_eligible_schemes(user_data, schemes)
    print("Received user data:", user_data)
    print("Eligible schemes:", eligible)
    return jsonify({"eligible_schemes": eligible})


if __name__ == "__main__":
    app.run(debug=True)