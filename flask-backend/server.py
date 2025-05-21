#server.py

from flask import Flask, jsonify, request, session
from flask_cors import CORS
from pymongo import MongoClient
import bcrypt
import requests
from werkzeug.utils import secure_filename
from datetime import datetime
from bson.objectid import ObjectId
from scheme_map.mapper import load_schemes, find_eligible_schemes
import os
from chatbot.chatbot import chatbot_bp
from email_sender.email_sening import SchemeNotifier

app = Flask(__name__)
app.secret_key = 'kaviya'
CORS(app, supports_credentials=True)

app.register_blueprint(chatbot_bp)
notifier = SchemeNotifier()

client = MongoClient('mongodb://localhost:27017/')
db = client['user_auth']
users_collection = db['users']
admin_collection = db['admin']
db2 = client['scheme_data']
scheme_collection = db2['schemes']

admin_code = "123"
plain_password = "123"

hashed_password = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt())

admin_collection.insert_one({
    "code": admin_code,
    "password": hashed_password
})

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

@app.route('/admin-login', methods=['POST'])
def adminLogin():
    data = request.json
    code = data.get('code')
    password = data.get('password')

    admin = admin_collection.find_one({'code': code})
    if admin and bcrypt.checkpw(password.encode('utf-8'), admin['password']):
        session['admin'] = {
            'code': admin['code']
        }
        return jsonify({'message': 'Login successful', 'admin': {'code': admin['code']}})
    return jsonify({'message': 'Invalid email or password'}), 401

@app.route("/admin", methods=['POST'])
def admin():
    try:
        data = request.get_json()
        scheme = {
            "name": data['name'],
            "description": data['description'],
            "created_at": datetime.now(),
            "last_modified": datetime.now(),
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
        if 'user' not in session:
            return jsonify({"message": "User not authenticated"}), 401
        return jsonify({"message": "User page loaded successfully"})
    else:
        if 'user' not in session:
            return jsonify({"message": "User not authenticated"}), 401
        
        user_email = session['user']['email']
        user = users_collection.find_one({'email': user_email})
        
        if not user:
            return jsonify({"message": "User not found"}), 404
        user_data = request.json
        print("Received:", user_data)
        schemes = load_schemes()
        print("Loaded Schemes:", schemes)
        eligible = find_eligible_schemes(user_data, schemes)
        print("Received user data:", user_data)
        print("Eligible schemes:", eligible) 
        update_data = {
            "profile_data": user_data,
            #"eligible_schemes": eligible,
            "last_updated": datetime.now()
        }
        print("Update data:", update_data)
        result = users_collection.update_one(
            {"_id": user['_id']},
            {"$set": update_data}
        )
        print("Update result:", result.raw_result) 
        
        if result.modified_count == 0:
            print("Warning: User data might not have been updated")
        
        return jsonify({"eligible_schemes": eligible})
    
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
#from dotenv import load_dotenv
import os

#load_dotenv()  # Load .env
MAILTRAP_HOST = "sandbox.smtp.mailtrap.io"
MAILTRAP_PORT = 2525
MAILTRAP_USERNAME = "21de3a9d92d551"  # Replace with your Mailtrap credentials
MAILTRAP_PASSWORD = "dc531e5ac7d631"  # Replace with your Mailtrap credentials
SENDER_EMAIL = "919kaviya@gmail.com"  # Can be any email address for Mailtrap
POLL_INTERVAL = 30

def send_email(to_email, subject, body):
    try:
        msg = MIMEMultipart()
        msg['From'] = os.getenv('SENDER_EMAIL')
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP(os.getenv('MAILTRAP_HOST'), os.getenv('MAILTRAP_PORT')) as server:
            server.login(os.getenv('MAILTRAP_USERNAME'), os.getenv('MAILTRAP_PASSWORD'))
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

@app.route('/send-notification', methods=['POST'])
def send_notification():
    """data = request.json
    success = send_email(
        data['recipient'],
        data['subject'],
        data['body']
    )
    return jsonify({"success": success})"""
    try:
        # Ensure request has JSON data
        if not request.is_json:
            return jsonify({"success": False, "error": "Request must be JSON"}), 400

        data = request.get_json()
        
        # Validate required fields
        if not all(key in data for key in ['recipient', 'subject', 'body']):
            return jsonify({"success": False, "error": "Missing required fields"}), 400

        success = send_email(
            data['recipient'],
            data['subject'],
            data['body']
        )
        
        return jsonify({"success": success})
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(debug=True)