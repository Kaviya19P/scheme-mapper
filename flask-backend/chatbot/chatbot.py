from flask import Blueprint, request, jsonify
from pymongo import MongoClient
import os
import re
import random
from collections import Counter
import nltk
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('punkt_tab')
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer
from datetime import datetime
from functools import lru_cache

# Download NLTK resources (run once)
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('punkt_tab') 
    
chatbot_bp = Blueprint('chatbot', __name__)

# Database connection - centralized
@lru_cache(maxsize=None)
def get_db_connection():
    mongodb_uri = os.environ.get('mongodb://localhost:27017/')
    client = MongoClient(mongodb_uri)
    return client['scheme_data']

# NLP Initialization
stemmer = PorterStemmer()
stop_words = set(stopwords.words('english'))

class ChatbotEngine:
    def __init__(self):
        self.db = get_db_connection()
        self.scheme_keywords = {
            'eligibility': ['eligible', 'qualify', 'criteria', 'requirements', 'who can'],
            'benefits': ['amount', 'money', 'benefit', 'fund', 'financial', 'how much'],
            'documents': ['document', 'paper', 'proof', 'id', 'aadhar', 'required'],
            'application': ['apply', 'application', 'process', 'how to', 'where to'],
            'deadline': ['last date', 'deadline', 'time limit', 'expire', 'when']
        }
        self.general_responses = {
            'greeting': [
                "Hello! I'm your Scheme Assistant. How can I help you today?",
                "Hi there! I can help you find government schemes you might be eligible for."
            ],
            'thanks': [
                "You're welcome! Feel free to ask if you have more questions.",
                "Happy to help! Let me know if you need anything else."
            ],
            'fallback': [
                "I'm not sure I understand. Could you rephrase your question about government schemes?",
                "Could you ask me something specific about government schemes or benefits?"
            ]
        }
    
    def preprocess_text(self, text):
        #Clean and tokenize text for processing
        text = text.lower()
        tokens = word_tokenize(text)
        tokens = [word for word in tokens if word.isalnum()]
        tokens = [word for word in tokens if word not in stop_words]
        tokens = [stemmer.stem(word) for word in tokens]
        return tokens
    
    def detect_intent(self, query):
        #Determine what the user is asking about
        tokens = self.preprocess_text(query)
        
        # Check for basic interactions
        if any(word in tokens for word in ['hi', 'hello', 'hey']):
            return 'greeting', None
        if any(word in tokens for word in ['thank', 'thanks', 'appreciate']):
            return 'thanks', None
        
        # Check for scheme-related intents
        intent_scores = Counter()
        for intent, keywords in self.scheme_keywords.items():
            for keyword in keywords:
                if stemmer.stem(keyword) in tokens:
                    intent_scores[intent] += 1
        
        if intent_scores:
            return 'scheme_info', intent_scores.most_common(1)[0][0]
        
        return 'fallback', None
    
    def get_schemes_by_criteria(self, criteria):
        #Find schemes matching specific criteria
        try:
            schemes = list(self.db.schemes.find())
            if not schemes:
                return []
                
            matching_schemes = []
            
            for scheme in schemes:
                matches = True
                for field, value in criteria.items():
                    # Check if scheme has matching eligibility criteria
                    scheme_criteria = scheme.get('eligibility_criteria', [])
                    field_match = any(
                        c['field'] == field and 
                        self._check_condition(c['operator'], c['value'], value)
                        for c in scheme_criteria
                    )
                    if not field_match:
                        matches = False
                        break
                
                if matches:
                    matching_schemes.append(scheme)
            
            return matching_schemes
        except Exception as e:
            print(f"Error fetching schemes: {str(e)}")
            return []

    def _check_condition(self, operator, ref_value, user_value):
        #Check if a condition is met
        try:
            if operator == '==':
                return str(user_value).lower() == str(ref_value).lower()
            elif operator == '>=':
                return float(user_value) >= float(ref_value)
            elif operator == '<=':
                return float(user_value) <= float(ref_value)
            elif operator == '>':
                return float(user_value) > float(ref_value)
            elif operator == '<':
                return float(user_value) < float(ref_value)
            elif operator == 'in':
                return str(user_value).lower() in [x.lower() for x in ref_value]
            else:
                return False
        except (ValueError, TypeError):
            return False
    
    def generate_response(self, intent, sub_intent=None, user_data=None):
        #Create an appropriate response based on intent
        if intent in ['greeting', 'thanks', 'fallback']:
            return random.choice(self.general_responses[intent])
        
        if intent == 'scheme_info':
            try:
                if sub_intent == 'eligibility':
                    if user_data and isinstance(user_data, dict):
                        matching_schemes = self.get_schemes_by_criteria(user_data)
                        if matching_schemes:
                            response = "Based on your profile, you may be eligible for these schemes:\n\n"
                            for scheme in matching_schemes[:5]:  # Limit to 5 schemes
                                response += f"• {scheme['name']}\n"
                                response += f"  Description: {scheme.get('description', 'Not specified')}\n"
                                response += f"  Benefits: {scheme.get('amount', 'Not specified')}\n"
                                response += f"  More info: {scheme.get('link', 'Ask for details')}\n\n"
                            return response
                        else:
                            return "I couldn't find any schemes matching your profile. You might want to check with local authorities for other options."
                    else:
                        return "To check eligibility, please provide information like your age, income, occupation, etc."
                
                elif sub_intent == 'benefits':
                    schemes = list(self.db.schemes.find().limit(5))
                    if schemes:
                        response = "Here are some schemes with their benefits:\n\n"
                        for scheme in schemes:
                            response += f"• {scheme['name']}: {scheme.get('amount', 'Not specified')}\n"
                        return response
                    else:
                        return "Currently no schemes are available in the database."
                
                elif sub_intent == 'application':
                    return "Most schemes can be applied online through the official portals. Please specify a scheme name for detailed application instructions."
                
                elif sub_intent == 'documents':
                    return "Common documents required include ID proof, address proof, income certificate, and bank details. The exact requirements vary by scheme."
                
                elif sub_intent == 'deadline':
                    schemes = list(self.db.schemes.find({'deadline': {'$exists': True}}).limit(3))
                    if schemes:
                        response = "Here are some upcoming deadlines:\n\n"
                        for scheme in schemes:
                            response += f"• {scheme['name']}: {scheme.get('deadline', 'Not specified')}\n"
                        return response
                    else:
                        return "Deadline information is not currently available for most schemes."
                
                else:
                    return "I can help with scheme eligibility, benefits, documents, application processes, and deadlines. What would you like to know?"
            except Exception as e:
                print(f"Error generating response: {str(e)}")
                return "I'm having trouble accessing scheme information. Please try again later."

@chatbot_bp.route('/chat', methods=['GET', 'POST'])
def handle_chat():
    chatbot = ChatbotEngine()
    
    try:
        if request.method == 'GET':
            return jsonify({'status': 'ready', 'message': 'Chat endpoint is active'})
        
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400
        
        user_message = data['message']
        user_profile = data.get('profile', {})
        
        intent, sub_intent = chatbot.detect_intent(user_message)
        response = chatbot.generate_response(intent, sub_intent, user_profile)
        
        # Log the interaction
        try:
            chatbot.db.chat_logs.insert_one({
                'message': user_message,
                'response': response,
                'timestamp': datetime.now(),
                'intent': intent,
                'sub_intent': sub_intent
            })
        except Exception as e:
            print(f"Error logging chat: {str(e)}")
        
        return jsonify({
            'response': response,
            'intent': intent,
            'sub_intent': sub_intent
        })
    
    except Exception as e:
        print(f"Chat error: {str(e)}")
        return jsonify({
            'response': "I'm having trouble processing your request. Please try again later.",
            'error': str(e)
        }), 500

@chatbot_bp.route('/schemes', methods=['GET'])
def list_schemes():
    #Endpoint to list all available schemes
    try:
        db = get_db_connection()
        schemes = list(db.schemes.find({}, {'_id': 0, 'name': 1, 'description': 1, 'amount': 1}))
        return jsonify({'schemes': schemes})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
