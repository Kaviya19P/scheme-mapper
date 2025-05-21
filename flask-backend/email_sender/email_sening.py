"""import os
import smtplib
from email.message import EmailMessage
from pymongo import MongoClient
from pymongo import errors as mongo_errors
from bson.objectid import ObjectId
import time
import operator
from datetime import datetime

# Configuration
MONGO_URI = "mongodb://localhost:27017/"
DATABASE_NAME = "scheme_data"
SCHEME_COLLECTION = "schemes"
DATABASE_NAME2 = "user_auth"
USER_COLLECTION = "users"
POLL_INTERVAL = 60  # seconds between checks for new schemes

# Email configuration (replace with your SMTP details)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "@gmail.com"
SMTP_PASSWORD = "your_app_specific_password"
EMAIL_FROM="scheme-notifications@yourdomain.com"

def send_mailtrap_email(to_email, subject, body):
    try:
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = os.getenv('EMAIL_FROM')
        msg['To'] = to_email
        msg.set_content(body)

        with smtplib.SMTP(os.getenv('SMTP_SERVER'), os.getenv('SMTP_PORT')) as server:
            server.login(os.getenv('SMTP_USERNAME'), os.getenv('SMTP_PASSWORD'))
            server.send_message(msg)
        
        print(f"Email sent to {to_email} via Mailtrap")
        return True
    except Exception as e:
        print(f"Mailtrap error: {str(e)}")
        return False

# Comparison operators
ops = {
    "==": operator.eq,
    "!=": operator.ne,
    ">=": operator.ge,
    "<=": operator.le,
    ">": operator.gt,
    "<": operator.lt
}

class SchemeNotifier:
    def __init__(self):
        self.client = MongoClient(MONGO_URI)
        self.db = self.client[DATABASE_NAME]
        self.scheme_collection = self.db[SCHEME_COLLECTION]
        self.db2 = self.client[DATABASE_NAME2]
        self.user_collection = self.db2[USER_COLLECTION]
        self.last_checked_id = self._get_latest_scheme_id()
        
    def _get_latest_scheme_id(self):
        #Get the ID of the most recent scheme to establish a baseline
        latest = self.scheme_collection.find_one(
            {}, 
            sort=[('_id', -1)]
        )
        return latest['_id'] if latest else None
    
    def _evaluate_rule(self, user_data, rule):
        #Evaluate a single eligibility rule against user data
        attr = rule["attribute"]
        user_value = user_data.get(attr)
        if user_value is None:
            return None
        
        expected_value = rule["value"]
        operator_func = ops[rule["operator"]]
        
        try:
            if isinstance(expected_value, (int, float)):
                user_value = float(user_value)
            else:
                user_value = str(user_value).strip().lower()
                expected_value = str(expected_value).strip().lower()
                
            return operator_func(user_value, expected_value)
        except Exception:
            return False
    
    def _check_eligibility(self, user_data, scheme):
        #Check if a user is eligible for a scheme
        rules = scheme.get("eligibility", [])
        evaluated_rules = [self._evaluate_rule(user_data, rule) for rule in rules]
        valid_rules = [result for result in evaluated_rules if result is not None]
        
        return all(valid_rules) if valid_rules else False
    
    def _get_new_schemes(self):
        #Get schemes added since last check
        query = {}
        if self.last_checked_id:
            query = {"_id": {"$gt": self.last_checked_id}}
        
        new_schemes = list(self.scheme_collection.find(query))
        
        if new_schemes:
            self.last_checked_id = new_schemes[-1]['_id']
        
        return new_schemes
    
    def _get_all_users(self):
        #Get all users with their profile data
        return self.user_collection.find(
            {"profile_data": {"$exists": True}},
            {"email": 1, "name": 1, "profile_data": 1}
        )
    
    def _send_notification_email(self, to_email, user_name, scheme):
        subject = f"New Scheme Available: {scheme['name']}"
        body = f
        Dear {user_name},
        
        New scheme matching your profile:
        
        Name: {scheme['name']}
        Description: {scheme.get('description', 'No description available')}
        
        Login to your account for details.
        
        
        return send_mailtrap_email(to_email, subject, body.strip())
    
    def run(self):
        #Run the notifier in a continuous loop
        print("Scheme Notifier Service Started")
        print(f"Last checked scheme ID: {self.last_checked_id}")
        
        try:
            while True:
                self.process_new_schemes()
                time.sleep(POLL_INTERVAL)
        except KeyboardInterrupt:
            print("\nStopping Scheme Notifier Service")
        finally:
            self.client.close()

if __name__ == "__main__":


    send_mailtrap_email(
        to_email="test@example.com",
        subject="Scheme Eligibility Notification",
        body="You're eligible for a new government scheme!"
    )

"""
#email_sending.py

import json
import operator
from pymongo import MongoClient
from pymongo import errors
from pymongo.change_stream import ChangeStream
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging
from typing import Dict, List, Any, Optional
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database configuration
DB_NAME = "scheme_data"
SCHEME_COLLECTION = "schemes"
DB_NAME2 = "user_auth"
USER_COLLECTION = "users"

# Mailtrap configuration (sandbox)
MAILTRAP_HOST = "sandbox.smtp.mailtrap.io"
MAILTRAP_PORT = 2525
MAILTRAP_USERNAME = "21de3a9d92d551"  # Replace with your Mailtrap credentials
MAILTRAP_PASSWORD = "dc531e5ac7d631"  # Replace with your Mailtrap credentials
SENDER_EMAIL = "919kaviya@gmail.com"  # Can be any email address for Mailtrap
POLL_INTERVAL = 30

# Comparison operators
ops = {
    "==": operator.eq,
    "!=": operator.ne,
    ">=": operator.ge,
    "<=": operator.le,
    ">": operator.gt,
    "<": operator.lt
}

class SchemeNotifier:
    def __init__(self):
        """Initialize MongoDB connection and email settings."""
        try:
            self.client = MongoClient("mongodb://localhost:27017/")
            self.db = self.client[DB_NAME]
            self.db2 = self.client[DB_NAME2]
            self.scheme_collection = self.db[SCHEME_COLLECTION]
            self.user_collection = self.db2[USER_COLLECTION]
            self.last_checked_time = datetime.now()
            
            logger.info("Connected to MongoDB successfully")
        except errors.ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise

    def evaluate_rule(self, user_data: Dict, rule: Dict) -> Optional[bool]:
        """
        Evaluate a single eligibility rule against user data.
        
        Args:
            user_data: Dictionary containing user profile data
            rule: Dictionary containing rule attributes (attribute, operator, value)
            
        Returns:
            bool or None: Result of evaluation or None if evaluation failed
        """
        attr = rule["attribute"]
        user_value = user_data.get(attr)
        
        if user_value is None:
            logger.debug(f"Missing value for attribute: {attr}")
            return None
        
        expected_value = rule["value"]
        operator_func = ops.get(rule["operator"])
        
        if not operator_func:
            logger.warning(f"Unsupported operator: {rule['operator']}")
            return None
        
        try:
            # Handle numeric comparisons
            if isinstance(expected_value, (int, float)):
                user_value = float(user_value)
            # Handle string comparisons
            else:
                user_value = str(user_value).strip().lower()
                expected_value = str(expected_value).strip().lower()
                
            result = operator_func(user_value, expected_value)
            logger.debug(f"Evaluating: {attr} -> {user_value} {rule['operator']} {expected_value} => {result}")
            return result
        except Exception as e:
            logger.error(f"Error evaluating rule {rule}: {e}")
            return False

    def check_eligibility(self, user_data: Dict, eligibility_rules: List[Dict]) -> bool:
        """
        Check if a user is eligible for a scheme based on its eligibility rules.
        
        Args:
            user_data: Dictionary containing user profile data
            eligibility_rules: List of eligibility rules for a scheme
            
        Returns:
            bool: True if user is eligible, False otherwise
        """
        if not eligibility_rules:
            return False
            
        evaluated_rules = [self.evaluate_rule(user_data, rule) for rule in eligibility_rules]
        valid_rules = [result for result in evaluated_rules if result is not None]
        
        return bool(valid_rules) and all(valid_rules)
    
    #new one
    def _get_all_users(self):
        """Get all users with profile data"""
        return self.user_collection.find(
            {"profile_data": {"$exists": True}},
            {"email": 1, "name": 1, "profile_data": 1}
        )

    def _get_new_schemes(self):
        """Poll for schemes added since last check"""
        query = {"last_modified": {"$gt": self.last_checked_time}}
        new_schemes = list(self.scheme_collection.find(query))
        
        if new_schemes:
            self.last_checked_time = datetime.now()
        return new_schemes

    def _send_notification_email(self, recipient: str, user_name: str, scheme: Dict) -> bool:
        """Send notification email (consistent naming with underscore)"""
        try:
            message = MIMEMultipart()
            message["From"] = SENDER_EMAIL
            message["To"] = recipient
            message["Subject"] = f"New Scheme Alert: {scheme['name']}"
            
            body = f"""
            Dear {user_name},
            
            You're eligible for a new scheme:
            
            {scheme['name']}
            {scheme.get('description', 'No description available')}
            
            Login for details.
            """
            
            message.attach(MIMEText(body, "plain"))
            
            with smtplib.SMTP(MAILTRAP_HOST, MAILTRAP_PORT) as server:
                server.login(MAILTRAP_USERNAME, MAILTRAP_PASSWORD)
                server.sendmail(SENDER_EMAIL, recipient, message.as_string())
            
            logger.info(f"Email sent to {recipient}")
            return True
        except Exception as e:
            logger.error(f"Email failed to {recipient}: {e}")
            return False

    def process_new_schemes(self):
        """Process newly added schemes"""
        try:
            new_schemes = self._get_new_schemes()
            if not new_schemes:
                logger.info("No new schemes found")
                return

            logger.info(f"Found {len(new_schemes)} new scheme(s)")
            
            for user in self._get_all_users():
                for scheme in new_schemes:
                    if self.check_eligibility(user['profile_data'], scheme.get('eligibility', [])):
                        self._send_notification_email(
                            user['email'],
                            user.get('name', 'User'),
                            scheme
                        )
        except Exception as e:
            logger.error(f"Processing error: {e}")

    def run_polling(self):
        """Run the polling service"""
        logger.info("Starting polling service")
        try:
            while True:
                self.process_new_schemes()
                time.sleep(POLL_INTERVAL)
        except KeyboardInterrupt:
            logger.info("Stopping polling service")
        finally:
            self.client.close()

if __name__ == "__main__":
    notifier = SchemeNotifier()
    notifier.run_polling()  # Use polling instead of change streams