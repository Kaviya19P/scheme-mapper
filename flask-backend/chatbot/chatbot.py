
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
        self.attribute_mapping = {
            'age': 'age',
            'gender': 'gender',
            'state': 'state',
            'residence': 'residence',
            'community': 'community',
            'differently abled': 'differently_abled',
            'occupation': 'occupation',
            'income': 'income'
        }
    
    def preprocess_text(self, text):
        text = text.lower()
        tokens = word_tokenize(text)
        tokens = [word for word in tokens if word.isalnum()]
        tokens = [word for word in tokens if word not in stop_words]
        tokens = [stemmer.stem(word) for word in tokens]
        return tokens
    
    def detect_intent(self, query):
        tokens = self.preprocess_text(query)
        
        if any(word in tokens for word in ['hi', 'hello', 'hey']):
            return 'greeting', None
        if any(word in tokens for word in ['thank', 'thanks', 'appreciate']):
            return 'thanks', None
        
        intent_scores = Counter()
        for intent, keywords in self.scheme_keywords.items():
            for keyword in keywords:
                if stemmer.stem(keyword) in tokens:
                    intent_scores[intent] += 1
        
        if intent_scores:
            return 'scheme_info', intent_scores.most_common(1)[0][0]
        
        profile_attributes = ['age', 'gender', 'state', 'rural', 'urban', 'community', 
                            'disabled', 'differently abled', 'occupation', 'income']
        if any(stemmer.stem(attr) in tokens for attr in profile_attributes):
            return 'scheme_info', 'eligibility'
        
        return 'fallback', None
    
    def get_schemes_by_criteria(self, criteria):
        try:
            schemes = list(self.db.schemes.find())
            if not schemes:
                return []
                
            matching_schemes = []
            
            for scheme in schemes:
                matches = True
                scheme_eligibility = scheme.get('eligibility', [])
                
                user_criteria = []
                for attr, value in criteria.items():
                    if attr in self.attribute_mapping:
                        db_attr = self.attribute_mapping[attr]
                        if db_attr == 'age':
                            user_criteria.extend([
                                {'attribute': 'age', 'operator': '<=', 'value': value},
                                {'attribute': 'age', 'operator': '>=', 'value': value}
                            ])
                        else:
                            user_criteria.append({'attribute': db_attr, 'operator': '==', 'value': value})
                
                for condition in scheme_eligibility:
                    attr = condition['attribute']
                    operator = condition['operator']
                    ref_value = condition['value']
                    
                    user_value = None
                    for user_condition in user_criteria:
                        if user_condition['attribute'] == attr:
                            user_value = user_condition['value']
                            break
                    
                    if user_value is None:
                        matches = False
                        break
                    
                    if not self._check_condition(operator, ref_value, user_value):
                        matches = False
                        break
                
                if matches:
                    matching_schemes.append(scheme)
            
            return matching_schemes
        except Exception as e:
            print(f"Error fetching schemes: {str(e)}")
            return []

    def _check_condition(self, operator, ref_value, user_value):
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
    
    def extract_profile_from_query(self, query):
        tokens = word_tokenize(query.lower())
        profile = {}
        
        age_match = re.search(r'(\d+)\s*years?', query)
        if age_match:
            profile['age'] = int(age_match.group(1))
        
        if 'rural' in tokens:
            profile['residence'] = 'rural'
        elif 'urban' in tokens:
            profile['residence'] = 'urban'
            
        occupations = ['student', 'farmer', 'police', 'engineer', 'doctor', 
                      'teacher', 'business', 'unemployed']
        for occ in occupations:
            if occ in tokens:
                profile['occupation'] = occ
                break
                
        if 'male' in tokens:
            profile['gender'] = 'male'
        elif 'female' in tokens:
            profile['gender'] = 'female'
        elif 'other' in tokens:
            profile['gender'] = 'other'
            
        communities = ['open category', 'backward class', 'denotified community',
                      'most backward class', 'scheduled caste', 'scheduled tribe',
                      'minority']
        for comm in communities:
            if comm in query.lower():
                profile['community'] = comm.title()
                break
                
        if 'disabled' in tokens or 'differently abled' in query.lower():
            profile['differently_abled'] = 'yes'
            
        return profile
    
    def generate_response(self, intent, sub_intent=None, user_data=None, user_query=None):
        if intent in ['greeting', 'thanks', 'fallback']:
            return random.choice(self.general_responses[intent])
        
        if intent == 'scheme_info':
            try:
                if sub_intent == 'eligibility':
                    
                    profile = user_data if user_data else {}
                    if user_query and not profile:
                        profile = self.extract_profile_from_query(user_query)
                    
                    if profile:
                        matching_schemes = self.get_schemes_by_criteria(profile)
                        if matching_schemes:
                            response = "Based on your profile, you may be eligible for these schemes:\n\n"
                            for scheme in matching_schemes[:5]:  # Limit to 5 schemes
                                response += f"• {scheme['name']}\n"
                                response += f"  Description: {scheme.get('description', 'Not specified')}\n"
                                if 'amount' in scheme:
                                    response += f"  Benefits: {scheme['amount']}\n"
                                elif 'benefit' in scheme:
                                    response += f"  Benefits: {scheme['benefit']}\n"
                                response += f"  More info: {scheme.get('link', 'Ask for details')}\n\n"
                            return response
                        else:
                            return "I couldn't find any schemes matching your profile. You might want to check with local authorities for other options."
                    else:
                        return "To check eligibility, please provide information like your age, income, occupation, etc. For example: 'I'm 25 years old, unemployed from rural area'"
                
                elif sub_intent == 'benefits':
                    schemes = list(self.db.schemes.find().limit(5))
                    if schemes:
                        response = "Here are some schemes with their benefits:\n\n"
                        for scheme in schemes:
                            benefit = scheme.get('amount', scheme.get('benefit', 'Not specified'))
                            response += f"• {scheme['name']}: {benefit}\n"
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
        response = chatbot.generate_response(intent, sub_intent, user_profile, user_message)
        
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
    try:
        db = get_db_connection()
        schemes = list(db.schemes.find({}, {'_id': 0, 'name': 1, 'description': 1, 'amount': 1, 'benefit': 1}))
        return jsonify({'schemes': schemes})
    except Exception as e:
        return jsonify({'error': str(e)}), 500